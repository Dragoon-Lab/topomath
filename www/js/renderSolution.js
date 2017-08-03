define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dijit/registry",
	"dojox/charting/Chart",
	"dojox/charting/axis2d/Default",
	"dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Grid",
    "dojox/charting/widget/Legend",
	"dojo/dom",
	"dojo/dom-style",
    "./calculation"
], function(declare, array, registry, Chart, Default, Lines, Grid, Legend, dom, domStyle, calculations){
	return declare(calculations, {
		_colors: {
			majorHLine: "#CACACA",
			majorVLine: "#CACACA",
			incorrectGraph: "red",
			correctGraph: "#5cd65c",
			authorGraph: "black"
		},

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

			this.initializeGraphTab();
			//checks if the given solution is a static solution
			this.isStatic = isStudentMode ? this.checkForStatic(this.activeSolution) :
				this.checkForStatic(this.authorSolution);

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
				majorHLine: { color: this._color.majorHLine, width: 1 },
				majorVLine: { color: this._color.majorVLine, width: 1 }
				//markers: activeSolution.times.length < 25
			});

			chart.addAxis("x", {
				title: xAxis,
				titleOrientation: "away", titleGap: 5
			});

			var obj = this.getMinMaxFromArray(solution.plotValues[index]);

			chart.addAxis("y", {
				vertical: true, // min: obj.min, max: obj.max,
				title: yAxis,
				titleGap: 20,
				min: obj.min,
				max:obj.max,
				labelFunc: this.formatAxes
			});

			if(this.isCorrect || !this.isStudentMode) {
				//plot chart for correct student solution or author mode
				chart.addSeries(
					"Your solution",
					this.formatSeriesForChart(solution, id),
					{stroke: this._color.correctGraph}
				);
			}
			else {
				chart.addSeries(
					"Your solution",
					this.formatSeriesForChart(solution, id),
					{stroke: this.color.incorrectGraph}
				);
			}

			if(this.isStudentMode && this.authorSolution.plotValues[id]){
				chart.addSeries(
					"Author's solution",
					this.formatSeriesForChart(this.authorSolution, index),
					{stroke: this._color.authorGraph}
				);
			}

			//this check is handled in initializeGraphTab function.
			//if(obj.max - obj.min > (Math.pow(10,-15)) || (obj.max - obj.min === 0)) {
			chart.render();
			//}
			//else {
			//    dom.byId("solutionMessage").innerHTML = "Unable to graph, please increase the number of timesteps";
			//}
			return chart;
		},

		formatSeriesForChart: function(result, id){
			return array.map(result.times, function(time, k){
				return {x: time, y: result.plotValues[id][k]};
			});
		},

		initializeGraphTab: function(){
			//Graph Tab
			var graphContent = "";
			var variables = this.activeSolution.plotVariables;
			if(variables.length > 0) {
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
			} else{
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
			array.forEach(this.plotVariables, function(id){
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
			var solution = this.findSolution(true, this.plotVariables); // Return value from findSlution in calculation, returns an array and we check for status and any missing nodes
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
			for(var i=0; i<solution.times.length; i++){
				tableString += "<tr style='overflow:visible'>";
				tableString += "<td align='center' style='overflow:visible' id ='row" + i + "col0'>" + solution.times[i].toPrecision(4) + "</td>";
				//set values in table according to their table-headers
				j = 1;
				array.forEach(solution.plotValues, function(value){
					tableString += "<td align='center' style='overflow:visible' id='row" + i + "col" + j + "'>" + value[i].toPrecision(3) + "</td>";
					j++;
				});
				tableString += "</tr>";
			}
			return tableString;
		},

		getMinMaxFromArray: function(array){
			var i;
			var min = array[0];
			var max = array[0];
			for(i = 1; i < array.length; i++){
				if(array[i] < min){
					min = array[i];
				}
				if(array[i] > max){
					max = array[i];
				}
			}
			// Check if the maximum and minimum are same and change the min and max values
			if(min == max){
				if (min < 0){
					min = min * 2;
					max = 0;
				} else if (min > 0) {
					min = 0;
					max = max * 2;
				} else {
					min = -1;
					max = +1;
				}
			}
			return {min: min, max: max};
		},

		checkForNan: function(){
			var solution = this.findSolution(true, this.plotVariables);
			var nan = false;
			for(var i = 0; i < solution.times.length; i++){
				if(isNaN(solution.times[i].toPrecision(4)))
					nan = true;
				array.forEach(solution.plotValues, function(value){
					if(isNaN(value[i]))
						nan = true;
				});
			}
			return nan;
		},

		checkForInfinity: function(values) {
			var result = false;
			array.forEach(values, function(value){
				if(!isFinite(value))
				{
					result = true;
				}
			}, this);
			return result;
		},

		formatAxes: function(text, value, precision){
			if(value > 10000){
				return value.toPrecision(3);
			}else if(value % 1 != 0){
				return value.toPrecision(3);
			}
			else{
				return text;
			}
		},

		labelString: function(id){
            // Summary:  Return a string containing the quantity name and any units.
            // id:  Node id for active model; null returns time label
            var label = id?this._model.active.getName(id):"time";
            var units = id?this._model.active.getUnits(id):this._model.getUnits();
            if(units){
                label += " (" + units + ")";
            }
            return label;
        },

		resizeWindow: function(){
			console.log("resizing window");
			var dialogWindow = document.getElementById("solution");
			dialogWindow.style.height = "770px";
			dialogWindow.style.width = "70%";
			dialogWindow.style.left = "0px";
			dialogWindow.style.top = "0px";

			var tabContainer = document.getElementById("GraphTabContainer");
			tabContainer.style.height = "700px";
			//tabContainer.style.height = "";

		},

		render: function(_tab){
			var selectedTab = _tab == "graph" ? this.graphTab : this.tableTab;
			this.tabContainer.selectChild(selectTab);
			this.dialogWindow.show();
		}
	});
});
