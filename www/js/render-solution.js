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
	"dojo/on",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dijit/form/ComboBox",
	"dojo/store/Memory",
	"./calculation"
], function(declare, array, lang, registry, Chart, Default, Lines, Grid, Legend, on, dom, domStyle, domAttr, ComboBox, Memory, calculations){
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
		chartsStatic: {},
		legendStatic: {},

		constructor: function(model){
			if(this.activeEquations){
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
			if(this.isStudentMode){
				this.authorSolution = this.findSolution(false);
			}

			if(this.isStudentMode && this._model.matchesGivenSolutionAndCorrect()){
				this.isCorrect = true;
				// TODO: show correctness message
			}

			this.initializeGraphTab();

			if(!this.activeSolution.error){

				this.createTable(this.activeSolution.plotVariables);

				//checks if the given solution is a static solution
				this.isStatic = !this.isStudentMode ? this.checkForStatic(this._model.active, this.activeSolution) :
					this.checkForStatic(this._model.authored, this.authorSolution);

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
			}
			this.resizeWindow();
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
			if(variables.length > 0 || !this.activeSolution.error) {
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
			} else {
				/*var thisModel = this;
				var modStatus = true;
				array.forEach(this._model.active.getNodes(), function (thisnode) {
					if(thisModel.model.active.getType(thisnode.ID)=="function" || thisModel.model.active.getType(thisnode.ID)=="accumulator"){
						var errorMessage = this.generateMissingErrorMessage(thisModel.model.active.getName(thisnode.ID)); //We show the error message like "A Node is Missing"
						var errMessageBox = new messageBox("graphErrorMessage", "error", errorMessage, false);
						errMessageBox.show();
						modStatus = false;
					}
				});
				if(modStatus){
					var errorMessage = "<div>There isn't anything to plot. Try adding some accumulator or function nodes.</div>"; //We show the error message like "A Node is Missing"
					var errMessageBox = new messageBox("graphErrorMessage", "error", errorMessage, false);
					errMessageBox.show();
				}*/
			}
		},

		initializeStaticTab: function(){
			var staticContent = "";
			this.staticVar = 0;
			var staticNodes = this.activeSolution.params;

			//TODO: Duplicate code in forEach
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

			this.staticTab = registry.byId("StaticTab");

			this.staticTab.set("content", "<div id='staticSelectContainer'></div>" + staticContent);

			this.createComboBox(staticNodes);
			var staticVar = this.checkStaticVar(true);
			this.activeSolution = this.findSolution(true, staticVar);
			if(this.isStudentMode)
				this.authorSolution = this.authorSolution.plotVariables ? this.findSolution(false, this._model.student.getAuthoredID(staticVar)) : "";

			array.forEach(this.activeSolution.plotVariables, function(id, index){
				var domNode = "chartStatic" + id ;
				var xAxis = dom.byId("staticSelect").value;
				var yAxis = this.labelString(id);
				this.chartsStatic[id] = this.createChart(domNode, id, xAxis, yAxis, this.activeSolution, index);
				this.legendStatic[id] = new Legend({chart: this.chartsStatic[id]}, "legendStatic" + id);
			}, this);
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
			//var solution = this.findSolution(true, this.plotVariables); // Return value from findSlution in calculation, returns an array and we check for status and any missing nodes
			/*if(solution.status=="error" && solution.type=="missing"){
				errorMessage = this.generateMissingErrorMessage(solution); //We show the error message like "A Node is Missing"
				var errMessageBox = new messageBox("graphErrorMessage", "error", errorMessage, false);
				errMessageBox.show();
				return "";
			}else if(solution.status == "error" && solution.type == "unknwon"){
				errorMessage = this.generateUnknownErrorMessage(solution); //We show the error message like "A Node is Missing"
				var errMessageBox = new messageBox("graphErrorMessage", "error", errorMessage, false);
				errMessageBox.show();
				return "";
			} else if(solution.status == "error" && solution.type == "unknwon"){
				this.dialogWidget.set("content", this.generateUnknownErrorMessage(solution));
				return "";
			}*/
			var j = 0;
			for(var i=0; i<solution.time.length; i++){
				tableString += "<tr style='overflow:visible'>";
				tableString += "<td align='center' style='overflow:visible' id ='row" + i + "col0'>" + solution.time[i].toPrecision(4) + "</td>";
				//set values in table according to their table-headers
				j = 1;
				array.forEach(solution.plotVariables, function(id){
					tableString += "<td align='center' style='overflow:visible' id='row" + i + "col" + j + "'>" + solution.plotValues[id][i].toPrecision(3) + "</td>";
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
				if(variable == staticSelect.value){
					result = parameter;
					break;
				}
			}

			return result;
		},

		//changes the static graph when sliders or dropdown change
		renderStaticDialog: function(updateAuthorGraph){
			console.log("rendering static");
			if(this.isStatic) {
				var staticVar = this.checkStaticVar(true);
				var activeSolution = this.findSolution(true, staticVar);
				this.authorSolution = this.findSolution(false, this._model.student.getAuthoredID(staticVar));

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
			var activeSolution = this.findSolution(true);
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

			this.createTable(this.active.plotVariables);
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
		disableStaticSlider: function() {
			var staticVar = this.checkStaticVar(true);
			var id = staticVar.ID;
			var parameters = this.checkForParameters(true);
			array.forEach(parameters, function(parameter){
				dom.byId("labelGraph_" + parameter.ID).style.display = "initial";
				dom.byId("textGraph_" + parameter.ID).style.display = "initial";
				dom.byId("sliderGraph_" + parameter.ID).style.display = "initial";
				if(dom.byId("sliderUnits_" + parameter.ID)){ // Some nodes have no units.
					dom.byId("sliderUnits_" + parameter.ID).style.display = "initial";
				}
			});
			dom.byId("labelGraph_" +id).style.display = "none";
			dom.byId("textGraph_" + id).style.display = "none";
			dom.byId("sliderGraph_" + id).style.display = "none";
			if(dom.byId("sliderUnits_" + id)){  // Some nodes have no units
				dom.byId("sliderUnits_" + id).style.display = "none";
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
			if(_tab == "graph")
				if(this.isStatic)
					selectedTab = this.staticTab
				else
					selectedTab = this.graphTab;
			this.tabContainer.selectChild(selectedTab);
			this.dialogWindow.show();
		},

		hide: function(){
			//stub for logging graph closing event
		}
	});
});
