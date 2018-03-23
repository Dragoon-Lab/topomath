define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dijit/registry",
	"dojox/charting/Chart",
	"dojox/charting/axis2d/Default",
	"dojox/charting/plot2d/Lines",
	"dojox/charting/plot2d/Grid",
	"dojox/charting/widget/Legend",
	"dijit/TooltipDialog",
	"dijit/popup",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dijit/form/ComboBox",
	"dojo/store/Memory",
	"dojo/dom-class",
	"dijit/Dialog",
	"./calculation",
	"./user-messages",
	"./message-box",
	"./state",
	"./typechecker",
	"./sliders"
], function(declare, array, lang, registry, Chart, Default, Lines, Grid, Legend, tooltipDialog, popup, on, dom, domStyle, domAttr, ComboBox, Memory, domClass, Dialog, calculations, errorMessages, messageBox, state, typechecker, sliders){
	return declare(calculations, {
		_colors: {
			majorHLine: "#CACACA",
			majorVLine: "#CACACA",
			incorrectGraph: "red",
			correctGraph: "#5cd65c",
			authorGraph: "black"
		},
		charts: {},
		legends: {},
		chart: {},
		state: null,
		chartsStatic: {},
		legendStatic: {},
		_rendering: false,

		constructor: function(model, state){
			this._messages = errorMessages.get("graph");
			this._helpText = errorMessages.get("help");
			this.isCorrect = false;
			if(this.activeSolution){
				this.initialize(state);
			}
		},

		initialize: function(state){
			this.dialogWindow = registry.byId("solution");
			if(!this.state) {
				this.state = state;
			}
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

				this.initializeGraphTab();

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
			var helpButton = dom.byId("graphHelpButton");
			on(helpButton, "click", lang.hitch(this, function () {
				if(!this.helpDialog) {
					var content = "<ul>";
					for(var msg in this._helpText){
						content += "<li>" + this._helpText[msg] + "</li>";
					}
					content += "</ul>";
					this.helpDialog = new Dialog({
						"class": 'graphHintUnderLay',
						"title": "Graph Help",
						content: content
					});
				}
				this.helpDialog.show();
				domClass.remove("graphHelpButton", "glowNode");
			}));
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

		createChart: function(domNode, id, xAxis, yAxis, solution){
			//Chart Node
			var chart = new Chart(domNode);

			chart.addPlot("grid", {
				type: Grid,
				hMajorLines: true,
				hMinorLines: false,
				vMajorLines: true,
				vMinorLines: false,
				majorHLine: { color: this._colors.majorHLine, width: 1 },
				majorVLine: { color: this._colors.majorVLine, width: 1 }
				//markers: activeSolution.times.length < 25
			});

			chart.addAxis("x", {
				title: xAxis,
				titleOrientation: "away", titleGap: 5
			});

			var obj = this.getMinMaxFromArray(solution.plotValues[id]);

			chart.addAxis("y", {
				vertical: true, // min: obj.min, max: obj.max,
				title: yAxis,
				titleGap: 20,
				min: obj.min,
				max:obj.max,
				labelFunc: this.formatAxes
			});

			var series = this.formatChartSeries(solution, id);
			array.forEach(series, function(s){
				chart.addSeries(
					s.title, s.data, s.stroke
				);
			});
			//this check is handled in initializeGraphTab function.
			//if(obj.max - obj.min > (Math.pow(10,-15)) || (obj.max - obj.min === 0)) {
			chart.render();
			//}
			//else {
			//    dom.byId("solutionMessage").innerHTML = "Unable to graph, please increase the number of timesteps";
			//}
			return chart;
		},

		updateChart: function(id, solution, index, isStatic){

			var charts = isStatic? this.chartsStatic : this.charts;

			dom.byId("graphMessage" + id).innerHTML = "";
			var obj = this.getMinMaxFromArray(solution.plotValues[id]);


			if(this.isStudentMode) {
				var authorID = this._model.active.getAuthoredID(id);
				var authorObj = this.getMinMaxFromArray(this.authorSolution.plotValues[authorID]);

				if (authorObj.min < obj.min) {
					obj.min = authorObj.min;
				}
				if (authorObj.max > obj.max) {
					obj.max = authorObj.max;
				}
			}

			//Redraw y axis based on new min and max values
			charts[id].addAxis("y", {
				vertical: true,
				fixed: false,
				min: obj.min,
				max: obj.max,
				labelFunc: this.formatAxes,
				title: this.labelString(id)
			});

			if(isStatic){
				charts[id].addAxis("x", {
					title: dom.byId("staticSelect").value,
					titleOrientation: "away", titleGap: 5
				});
			}

			var series = this.formatChartSeries(solution, id);

			array.forEach(series, function(s){
				charts[id].updateSeries(
					s.title, s.data, s.stroke
				);
			});

			charts[id].render();
		},

		formatChartSeries: function(solution, id){
			var series = [];
			var temp = {};
			temp.title = "Your Solution";
			temp.data = this.formatSeriesForChart(solution, id);
			if(this.isCorrect || !this.isStudentMode){
				temp.stroke = {stroke: this._colors.correctGraph, width: 2};
			} else {
				temp.stroke = {stroke: this._colors.incorrectGraph, width: 2};
			}

			series.push(temp);
			if(this.isStudentMode){
				series.push({
					title: "Author's solution",
					data: this.formatSeriesForChart(this.authorSolution, this._model.student.getAuthoredID(id)),
					stroke: {stroke: this._colors.authorGraph, width: 2}
				});
			}

			return series;
		},

		formatSeriesForChart: function(result, id){
			var series = array.map(result.time, function(time, k){
				return {x: time, y: result.plotValues[id][k]};
			});
			console.log(series);
			return series;
		},

		initializeGraphTab: function(){
			//Graph Tab
			var graphContent = "";
			var variables = this.activeSolution.plotVariables;
			for(var index in variables){
				var id = variables[index];
				//Create graph divs along with their error message
				var show = this._model.active.getVariableType(id) == "dynamic";
				var checked = show ? " checked='checked'" : "";
				graphContent += "<div><input id='sel" + id + "' data-dojo-type='dijit/form/CheckBox' class='show_graphs' thisid='" + id + "'" + checked + "/>" + " Show " + this._model.active.getName(id) + "</div>";
				var style = show ? "" : " style='display: none;'";
				//graph error message
				graphContent += "<font color='red' id='graphMessage" + id + "'></font>";
				graphContent += "<div	 id='chart" + id + "'" + style + ">";

				graphContent += "</div>";
				// Since the legend div is replaced, we cannot hide the legend here.
				graphContent += "<div class='legend' id='legend" + id + "'></div>";
			}

			this.graphTab.set("content", graphContent);

			array.forEach(this.activeSolution.plotVariables, function (id) {
				var domNode = "chart" + id;
				var val = this.checkEpsilon(this.activeSolution, id);
				if(val){
					var len = this.activeSolution.plotValues[id].length;
					for(var i = 0; i < len; i++)
						this.activeSolution.plotValues[id][i] = val;
				}
				var xAxis = this.labelString();
				var yAxis = this.labelString(id);
				this.charts[id] = this.createChart(domNode, id, xAxis, yAxis, this.activeSolution);
				this.legends[id] = new Legend({chart: this.charts[id]}, "legend" + id);
			}, this);
		},

		initializeStaticTab: function(){
			var staticContent = "";
			this.staticVar = 0;
			var staticNodes = this.activeSolution.params;
			this.staticTab = registry.byId("StaticTab");
			dom.byId("StaticTab").innerHTML = "";
			/**
			* this function is called only when this.isStatic is true. Updating the condition to include parameters
			* as well because after this there is a lot of logic which is used for showing static tab things.
			* So basically the legends and all the she band will be shown only if parameters are there are as well.
			**/
			this.isStatic = this.isStatic && staticNodes.length > 0;

			//TODO: Duplicate code in forEach
			if(this.isStatic){
				array.forEach(this.activeSolution.plotVariables, function(id){
					var show = this._model.active.getType(id) == "dynamic";
					var checked = show ? " checked='checked'" : "";
					staticContent += "<div><input id='selStatic" + id + "' data-dojo-type='dijit/form/CheckBox' class='show_graphs' thisid='" +
										id + "'" + checked + "/>" + " Show " + this._model.active.getName(id) + "</div>";
					var style = show ? "" : " style='display: none;'";
					staticContent += "<div	 id='chartStatic" + id + "'" + style + "></div>";

					//graph error message
					staticContent += "<font color='red' id='staticGraphMessage" + id + "'></font>";
					// Since the legend div is replaced, we cannot hide the legend here.
					staticContent += "<div class='legend' id='legendStatic" + id + "'></div>";
				}, this);
				this.staticTab.set("content", "<div id='staticSelectContainer'></div>" + staticContent);
				this.createComboBox(staticNodes);
				this.staticVar = this.checkStaticVar(true);
				this.activeSolution = this.findSolution(true, this.staticVar);
				if(this.isStudentMode)
					this.authorSolution = this.authorSolution.plotVariables ? this.findSolution(false, this._model.student.getAuthoredID(this.staticVar)) : "";

				array.forEach(this.activeSolution.plotVariables, function(id, index){
					var domNode = "chartStatic" + id ;
					var xAxis = dom.byId("staticSelect").value;
					var yAxis = this.labelString(id);
					this.chartsStatic[id] = this.createChart(domNode, id, xAxis, yAxis, this.activeSolution, index);
					var l = registry.byId("legendStatic"+id);
					if(registry.byId("legendStatic"+id))
						l.destroyRecursive();
					this.legendStatic[id] = new Legend({chart: this.chartsStatic[id]}, "legendStatic" + id);
				}, this);
			} else {
				if(!this.activeSolution.status)
					this.activeSolution.status = {};
				this.activeSolution.status.message = "no.parameters.static";

				this.showMessage(this.activeSolution, "StaticTab", "warn", false);
			}
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

		createTable: function(plotVariables){
			var paneText = "";
			if(plotVariables.length>0) {
				paneText += this.beginTable();
				paneText += this.setTableHeader();
				paneText += this.setTableContent();
				paneText += this.endTable();
			}else{
				//Error telling there are no nodes and Table cant be rendered
				paneText = "There is nothing to show in the table.	Please define some quantitites.";
			}
			this.tableTab.set("content", paneText);
		},

		/*
		 * @brief: function to begin table dom
		 */
		beginTable: function(){
			return "<div style='overflow:visible' align='center'>" + "<table class='solution' style='overflow:visible'>";
		},

		/*
		 * @brief: function to close table dom
		 */
		endTable: function(){
			return "</table>"+"</div>";
		},

		/*
		 * @brief: function to set headers of table
		 */
		setTableHeader: function(){
			var i, tableString = "";
			tableString += "<tr style='overflow:visible'>";
			//setup xunit (unit of timesteps)
			tableString += "<th style='overflow:visible'>" + this.labelString() + "</th>";
			array.forEach(this.activeSolution.plotVariables, function(id){
				tableString += "<th>" + this.labelString(id) + "</th>";
			}, this);
			tableString += "</tr>";
			return tableString;
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

		//changes the static graph when sliders or dropdown change
		renderStaticDialog: function(updateAuthorGraph, isUpdate){
			console.log("rendering static");
			if(this.isStatic) {
				this.staticVar = this.checkStaticVar(true);
				var activeSolution = this.findSolution(true, this.staticVar, isUpdate);
				if(this.isStudentMode && updateAuthorGraph)
					this.authorSolution = this.findSolution(false, this._model.student.getAuthoredID(this.staticVar));

				//update and render the charts
				array.forEach(this.activeSolution.plotVariables, function(id, k){
					var inf = this.checkForInfinity(activeSolution.plotValues[id]);
					if(inf) {
						dom.byId("staticGraphMessage" + id).innerHTML = "The values you have chosen caused the graph to go infinite.";
						domStyle.set("chartStatic"+id, "display", "none");
						domStyle.set("legendStatic" + id, "display", "none");
						domAttr.remove("staticGraphMessage"+id, "style");
					}
					else {
						dom.byId("staticGraphMessage" + id).innerHTML = "";
						this.updateChart(id, activeSolution, k, true, updateAuthorGraph);
					}
				}, this);
			}
		},

				/*
		 * @brief: this function re-renders dialog  when slider event is fired and
		 * new values for student nodes are calculated
		 */
		renderDialog: function(){
			console.log("rendering graph and table");
			var activeSolution = this.findSolution(true, null, true);
			//update and render the charts
			array.forEach(this.activeSolution.plotVariables, function(id, k){

				// Calculate Min and Max values to plot on y axis based on given solution and your solution
				var inf = this.checkForInfinity(activeSolution.plotValues[k]);
				if(inf) {
					dom.byId("graphMessage" + id).innerHTML = "The values you have chosen caused the graph to go infinite. (See table.)";
				}
				else {
					this.updateChart(id, activeSolution, k, false);
				}
			}, this);

			this.createTable(this.activeSolution.plotVariables);
		},

		labelString: function(id){
			// Summary:  Return a string containing the quantity name and any units.
			// id:  Node id for active model; null returns time label
			var label = id?this._model.active.getName(id):"time";
			var units = id?this._model.active.getUnits(id):this._model.getTimeUnits();
			if(units){
				label += " (" + units + ")";
			}
			return label;
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
			var graphHelpButton = dom.byId('graphHelpButton');
			this.state.get("isGraphHelpShown").then(lang.hitch(this,function(reply){
				console.log("reply for graph",reply);
				if(!reply && graphHelpButton ) {
					domClass.add(graphHelpButton, "glowNode");
					this.state.put("isGraphHelpShown",true);
				}
			}));
			
		},

		hide: function(){
			//stub for logging graph closing event
			dom.byId("graphErrorMessage").innerHTML = "";
			dom.byId("SliderPane").innerHTML = "<div id= 'solutionMessage'></div>";
			dom.byId("solutionMessage").innerHTML = "";
			var problemComplete = this._model.matchesGivenSolutionAndCorrect();
			var problemDoneHint;
			if(problemComplete){
				if(!this._model._isDoneMessageShown) {
					problemDoneHint = new tooltipDialog({
						style: "width: 300px;",
						content: '<p>'+this._messages['problemComplete']+'</p>' +
							' <button type="button" data-dojo-type="dijit/form/Button" id="closeHint">Ok</button>',
						onShow: function () {
							on(registry.byId('closeHint'), 'click', function () {
								popup.close(problemDoneHint);
							});
						},
						onBlur: function(){
							popup.close(problemDoneHint);
						}
					});
					popup.open({
						popup: problemDoneHint,
						around: dom.byId('doneButton')
					});
					this._model._isDoneMessageShown = true;
					this.state.put("isDoneMessageShown",true);
				}
			}
		},

		fireLogEvent: function(args){
			// stub to log slider event. event defined in event-logs.js using aspect.after
		}
	});
});
