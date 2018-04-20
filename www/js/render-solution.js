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
	/*	_colors: {
			majorHLine: "#CACACA",
			majorVLine: "#CACACA",
			incorrectGraph: "red",
			correctGraph: "#5cd65c",
			authorGraph: "black"
		},*/
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

			// cleaning the div
			dom.byId("graphErrorMessage").innerHTML = "";
			dom.byId("SliderPane").innerHTML = "<div id= 'solutionMessage'></div>";
			dom.byId("solutionMessage").innerHTML = "";

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

				var solutions = {};
				// setup graph solution
				solutions["active"] = this.activeSolution;
				solutions["author"] = this.isStudentMode ? this.authorSolution : null;
				solutions["authorStatic"] = null;
				this.graph = new Graph(this._model, solutions);
				this.graph.init();

				// setup sliders
				var slider = new Sliders(this._model, this.activeSolution);
				slider.init();
				this.sliderVars = slider.vars;
				array.forEach(slider.vars, function(ID){
					this.applyTextValueToGraph(slider.textBoxIDs[ID], ID);
				}, this);

				// setup table solution
				this.table = new Table(this._model, this.activeSolution);
				this.table.init();

				//checks if the given solution is a static solution
				this.isStatic = !this.isStudentMode ? this.checkForStatic(this._model.active, this.activeSolution) :
					this.checkForStatic(this._model.authored, this.authorSolution);

				// save author solution for color by numbers
				if(this.isAuthorMode){
					try {
						this.saveSolution();
					} catch (e){
						console.error("solution was not saved, error message ", e);
					}
				}

				// setup static solution
				this.staticTab = registry.byId("StaticTab");
				if(this.isStatic) {
					//add static tab if solution is static
					if(this.activeSolution.params.length > 0){
						dom.byId("StaticTab").innerHTML = "<div id='staticSelectContainer'></div>";
						this.createComboBox(this.activeSolution.params);
						this.staticVar = this.checkStaticVar(true);
						this.activeSolution = this.findSolution(true, this.staticVar);
						if(this.isStudentMode){
							var authorStaticVar =  this._model.student.getAuthoredID(this.staticVar);
							this.authorStaticSolution = this.initializeSystem(this._model.authored, authorStaticVar);
							this.authorStaticSolution = this.authorStaticSolution.plotVariables ? this.findSolution(false, authorStaticVar) : "";
							this.graph.setSolution("authorStatic", this.authorStaticSolution);
						}
						this.graph.setSolution("active", this.activeSolution);
						this.graph.init(this.staticVar);
					} else {
						if(!this.activeSolution.status)
							this.activeSolution.status = {};
						this.activeSolution.status.message = "no.parameters.static";
						this.showMessage(this.activeSolution, "StaticTab", "warn", false);
					}
				}else{
					//Hide static Tab
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
				var activeSolution = this.findSolution(true, null, true);
				this.graph.renderDialog(activeSolution);
				this.fireLogEvent(["slider-change", paramID, textBox.value]);
				if(this.isStatic && paramID != this.staticVar){
					activeSolution = this.findSolution(true, this.staticVar, true);
					this.graph.renderStaticDialog(activeSolution, this.authorStaticSolution, false);
				}
				this.table.init(activeSolution);
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

		showHideGraphsHandler: function(){
			//// The following loop makes sure legends of function node graphs are not visible initially
			//// until the user requests, we use the display : none property
			//// The legend div is replaced in the dom, so we must hide it dynamically.
			array.forEach(this.activeSolution.plotVariables, function(id){
				var domIDs = this.graph.domIDs(id);
				var staticDomIDs = this.graph.staticDomIDs(id);
				if(this._model.active.getVariableType(id) == "unknown"){
					var leg_style = { display: "none" };
					domAttr.set(domIDs["legend"], "style", leg_style);
					if(this.isStatic) {
						domAttr.set(staticDomIDs["legend"], "style", leg_style);
					}
				}
				var check = registry.byId(domIDs["select"]);
				check.on("Change", function(checked){
					if(checked) {
						domAttr.remove(domIDs["chart"], "style");
						domAttr.remove(domIDs["legend"], "style");
					}else{
						var obj = { display: "none" };
						domAttr.set(domIDs["chart"], "style", obj);
						domAttr.set(domIDs["legend"], "style", obj);
					}
				});
				if(this.isStatic) {
					var staticCheck = registry.byId("selStatic" + id);
					staticCheck.on("Change", function (checked) {
						if (checked) {
							if (dom.byId(staticDomIDs["message"]).innerHTML == "") {
								domAttr.remove(staticDomIDs["chart"], "style");
								domAttr.remove(staticDomIDs["legend"], "style");
							} else {
								var obj = {display: "none"};
								domAttr.set(staticDomIDs["chart"], "style", obj);
								domAttr.set(staticDomIDs["legend"], "style", obj);
								domAttr.remove(staticDomIDs["message"], "style");
							}
						} else {
							var obj = {display: "none"};
							domAttr.set(staticDomIDs["chart"], "style", obj);
							domAttr.set(staticDomIDs["legend"], "style", obj);
							domAttr.set(staticDomIDs["message"], "style", obj);
						}
					});
				}
			}, this);
			if(this.activeSolution.xvars.length == 0){
				id = this.activeSolution.func[0];
				domIDs = this.graph.domIDs(id);
				registry.byId(domIDs["select"]).set('checked', true);
				if(this.isStatic){
					staticDomIDs = this.graph.staticDomIDs(id);
					registry.byId(staticDomIDs["select"]).set('checked', true);
				}
			}
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
			var name = this._model.getTaskName() ? this._model.getTaskName() + "--" : "";
			this.dialogWindow.set("title", name + type);

			this.dialogWindow.show();
		},

		hide: function(){
			//stub for logging graph closing event
		},

		fireLogEvent: function(args){
			// stub to log slider event. event defined in event-logs.js using aspect.after
		}
	});
});
