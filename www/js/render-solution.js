define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dijit/registry",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dijit/form/ComboBox",
	"dojo/store/Memory",
	"./calculation",
	"./user-messages",
	"./message-box",
	"./typechecker",
	"./graph",
	"./table",
	"./sliders"
], function(declare, array, lang, registry, on, dom, domStyle, domAttr, ComboBox, Memory, calculations, errorMessages, messageBox, typechecker, Graph, Table, Sliders){
	return declare(calculations, {
		_colors: {
			majorHLine: "#CACACA",
			majorVLine: "#CACACA",
			incorrectGraph: "red",
			correctGraph: "#5cd65c",
			authorGraph: "black"
		},
		_rendering: false,

		constructor: function(model){
			this._messages = errorMessages.get("graph");
			this.isCorrect = false;
			if(this.activeSolution){
				this.initialize();
			}
		},

		initialize: function(){
			this.dialogWindow = registry.byId("solution");

			this.tabContainer = registry.byId("GraphTabContainer");
			this.graphTab = registry.byId("GraphTab");
			this.tableTab = registry.byId("TableTab");
			domStyle.set(this.tabContainer.domNode, "display", "none");

			this.activeSolution = this.findSolution(true);
			if(this.isStudentMode && !this.activeSolution.status.error){
				this.authorSolution = this.findSolution(false);
			}

			if(!this.activeSolution.status.error && (!this.authorSolution || !this.authorSolution.status.error)){
				if(this.isStudentMode){
					this.activeSolution.status.message = "incorrect";
					var type = "error";
					if(this._model.matchesGivenSolutionAndCorrect()){
						this.activeSolution.status.message = "correct";
						type = "success";
						this.isCorrect = true;
					}
					this.showMessage(this.activeSolution, "solutionMessage", type, true);
				}

				var g = new Graph()

				var slider = new sliders(this._model, this.activeSolution);
				slider.init();
				this.sliderVars = slider.vars;
				array.forEach(slider.vars, function(ID){
					this.applyTextValueToGraph(slider.textBoxIDs[ID], ID);
				}, this);

				this.createTable(this.activeSolution.plotVariables);

				//checks if the given solution is a static solution
				this.isStatic = !this.isStudentMode ? this.checkForStatic(this._model.active, this.activeSolution) :
					this.checkForStatic(this._model.authored, this.authorSolution);

				// save author solution for color by numbers
				if(!this.isStudentMode){
					try {
						this.saveSolution();
					} catch (e){
						console.error("solution was not saved, error message ", e);
					}
				}

				if(this.isStatic) {
					//add static tab if solution is static
					this.initializeStaticTab();
				}else{
					//Hide static Tab
					this.staticTab = registry.byId("StaticTab");
					if(this.staticTab) {
						this.tabContainer.removeChild(this.staticTab);
						registry.byId("StaticTab").destroyRecursive();
					}
				}

				this.showHideGraphsHandler();

				domStyle.set(this.tabContainer.domNode, "display", "block");
				this.tabContainer.watch("selectedChildWidget", lang.hitch(this, function(name, oval, nval){
					this.toggleSliders(nval.id, this.sliderVars);
				}));
			} else {
				var sol = this.activeSolution.status.error ? this.activeSolution : this.authorSolution;
				this.showMessage(sol, "graphErrorMessage", "error", false);
			}
			this.resizeWindow();
		},

		applyTextValueToGraph: function(textBoxID, paramID){
			var textBox = dom.byId(textBoxID);
			var textValue = {value: textBox.value};
			on(textBox, "change",  lang.hitch(this, function(){
				console.log("value of the input has been changed ", textBox.value);
				var valueStatus = typechecker.checkLastInputValue(textBoxID, textValue);
				if(valueStatus.errorType) return;
				if(this._rendering){
					console.log("previous rendering going on");
					return;
				}
				if(this.activeSolution.params.indexOf(paramID) >= 0){
					this.activeSolution.initValues[paramID] = parseFloat(textBox.value);
				} else if (this.activeSolution.xvars.indexOf(paramID) >= 0){
					this.activeSolution.initValues[paramID + this._model.active.getInitialNodeIDString()] = parseFloat(textBox.value);
				} else {
					throw new Error("Invalid ID", paramID);
				}
				//this.findSolution(true);
				this.renderDialog();
				this.fireLogEvent(["slider-change", paramID, textBox.value]);
				if(paramID != this.staticVar)
					this.renderStaticDialog(false, true);
				this._rendering = false;
				console.log("new plot completed");
			}));
		},

		showMessage: function(solution, id, type, close){
			type = type || "error";
			var str = "<div>";
			var m = this._messages.hasOwnProperty(solution.status.message) ? solution.status.message : "default";
			array.forEach(this._messages[m], function(s, counter){
				str += s;
				if(m == "model.incomplete"){
					switch(counter){
						case 0:
							str += solution.status.node || "uninitialized";
							break;
						case 1:
							str += solution.status.field || "";
							break;
						default:
							break;
					}
				}
			}, this);
			str += "</div>";

			var box = messageBox(id, type, str, close);
			box.show();
		},

		/*
		 * @brief: function to set contents of table according to node values
		 */
		setTableContent: function(){
			var tableString="";
			var errorMessage = null;
			var solution = this.activeSolution;
			var j = 0;
			for(var i=0; i<solution.time.length; i++){
				tableString += "<tr style='overflow:visible'>";
				tableString += "<td align='center' style='overflow:visible' id ='row" + i + "col0'>" + solution.time[i].toPrecision(4) + "</td>";
				//set values in table according to their table-headers
				j = 1;
				array.forEach(solution.plotVariables, function(id){
					tableString += "<td align='center' style='overflow:visible' id='row" + i + "col" + j + "'>" + Number(solution.plotValues[id][i].toFixed(4)) + "</td>";
					j++;
				});
				tableString += "</tr>";
			}
			return tableString;
		},

		showHideGraphsHandler: function(){
			//// The following loop makes sure legends of function node graphs are not visible initially
			//// until the user requests, we use the display : none property
			//// The legend div is replaced in the dom, so we must hide it dynamically.
			array.forEach(this.activeSolution.plotVariables, function(id){
				if(this._model.active.getVariableType(id) == "unknown"){
					var leg_style = { display: "none" };
					domAttr.set("legend" + id, "style", leg_style);
					if(this.isStatic) {
						domAttr.set("legendStatic" + id, "style", leg_style);
					}
				}
				var check = registry.byId("sel" + id);
				check.on("Change", function(checked){
					if(checked) {
						domAttr.remove("chart" + id, "style");
						domAttr.remove("legend" + id, "style");
					}else{
						var obj = { display: "none" };
						domAttr.set("chart" + id, "style", obj);
						domAttr.set("legend" + id, "style", obj);
					}
				});
				if(this.isStatic) {
					var staticCheck = registry.byId("selStatic" + id);
					staticCheck.on("Change", function (checked) {
						if (checked) {
							if (dom.byId("staticGraphMessage" + id).innerHTML == "") {
								domAttr.remove("chartStatic" + id, "style");
								domAttr.remove("legendStatic" + id, "style");
							} else {
								var obj = {display: "none"};
								domAttr.set("chartStatic" + id, "style", obj);
								domAttr.set("legendStatic" + id, "style", obj);
								domAttr.remove("staticGraphMessage" + id, "style");
							}
						} else {
							var obj = {display: "none"};
							domAttr.set("chartStatic" + id, "style", obj);
							domAttr.set("legendStatic" + id, "style", obj);
							domAttr.set("staticGraphMessage" + id, "style", obj);
						}
					});
				}
			}, this);
		},

		//creates the dropdown menu for the static window
		createComboBox: function(staticIDs){
			var stateStore = new Memory();
			var combo = registry.byId("staticSelect");
			if(combo){
				combo.destroyRecursive();
			}
			var names = [];
			array.forEach(staticIDs, function(id, counter){
				names[counter] = this._model.active.getVariable(id);
				stateStore.put({id: names[counter], name: names[counter]});
			}, this);
			var comboBox = new ComboBox({
				id: "staticSelect",
				name: "state",
				value: names[0],
				store: stateStore,
				searchAttr: "name"
			}, "staticSelectContainer");
			//console.log(comboBox);
			//this.disableStaticSlider();
			on(comboBox, "change", lang.hitch(this, function(){
				this.toggleSliders(this.tabContainer.selectedChildWidget.id, this.sliderVars);
				this.renderStaticDialog(true);// Call the function for updating both the author graph and the student graph
				//this.disableStaticSlider();
			}));
		},

		//checks for which variables are static
		checkStaticVar: function(choice){	//true is active, false is given
			var parameters = choice ? this.activeSolution.params : this.authorSolution.params;
			var result = parameters[0];
			var staticSelect = dom.byId("staticSelect");

			for(var index in parameters){
				var parameter = parameters[index];
				var variable = choice ? this._model.active.getVariable(parameter)
										: this._model.authored.getVariable(parameter);
				if(staticSelect && variable == staticSelect.value){
					result = parameter;
					break;
				}
			}

			return result;
		},

		//hides the slider for the variable that is selected
		toggleSliders: function(widgetID, variables){
			this.staticVar = this.checkStaticVar(true);
			var id = this.staticVar;
			if(!id) return;
			array.forEach(variables, function(v){
				domAttr.set("textGraph_" + v, 'disabled', false);
				domAttr.set("textGraph_" + id, 'title', "");
				domStyle.set("sliderGraph_" + v, 'visibility', "visible");
			});
			if(widgetID == "StaticTab"){
				domAttr.set("textGraph_" + id, 'disabled', true);
				domAttr.set("textGraph_" + id, 'title', "Value can not be changed for Graph vs. Parameters");
				domStyle.set("sliderGraph_" + id, 'visibility', "hidden");
			}
		},

		resizeWindow: function(){
			console.log("resizing window");
			//var dialogWindow = document.getElementById("solution");
			//dialogWindow.style.height = "700px";
			//dialogWindow.style.width = "95%";
			//dialogWindow.style.left = "0px";
			//dialogWindow.style.top = "0px";

			var tabContainer = document.getElementById("GraphTabContainer");
			tabContainer.style.height = "700px";

			var graphTableTab = document.getElementById("GraphTab");
			graphTableTab.style.height = "695px";
			//tabContainer.style.height = "";
		},

		render: function(_tab){
			var selectedTab = this.tableTab;
			var type = "Table";
			if(_tab == "graph"){
				if(this.isStatic)
					selectedTab = this.staticTab
				else
					selectedTab = this.graphTab;
				type = "Graph";
			}
			if(!this.activeSolution.status.error &&
				(!this.authorSolution || !this.authorSolution.status.error))
				this.tabContainer.selectChild(selectedTab);
			this.dialogWindow.set("title", this._model.getTaskName() + " -- " + type);
			this.dialogWindow.show();
		},

		hide: function(){
			//stub for logging graph closing event
			dom.byId("graphErrorMessage").innerHTML = "";
			dom.byId("SliderPane").innerHTML = "<div id= 'solutionMessage'></div>";
			dom.byId("solutionMessage").innerHTML = "";
		},

		fireLogEvent: function(args){
			// stub to log slider event. event defined in event-logs.js using aspect.after
		}
	});
});
