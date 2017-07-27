define([], function(){
	return declare(calculations, {
		constructor: function(){
			
		},

		initialize: function(){
			this.dialogWindow = registry.byId("solution");

			this.tabContainer = registry.byId("GraphTabContainer");
			this.graphTab = registry.byId("GraphTab");
			this.tableTab = registry.byId("TableTab");

			domStyle.set(this.tabContainer.domNode, "display", "none");
			if(this.tab == "graph")
				this.tabContainer.selectChild(this.graphTab);
			if(this.tab == "table")
				this.tabContainer.selectChild(this.tableTab);

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

		createChart: function(domNode, id, xAxis, yAxis, solution, index){
			//Chart Node
			var chart = new Chart(domNode);

			chart.addPlot("grid", {
				type: Grid,
				hMajorLines: true,
				hMinorLines: false,
				vMajorLines: true,
				vMinorLines: false,
				majorHLine: { color: "#CACACA", width: 1 },
				majorVLine: { color: "#CACACA", width: 1 }
				//markers: activeSolution.times.length < 25
			});

			chart.addAxis("x", {
				title: xAxis,
				titleOrientation: "away", titleGap: 5
			});

			var obj = this.getMinMaxFromArray(solution.plotValues[index]);
			/*if(obj.max - obj.min < Math.pow(10, -15)){
				var len = solution.plotValues[index].length;
				for(var i = 0; i < len; i++){
					solution.plotValues[index][i] = obj.max;
				}
				obj.min = obj.max;
			}*/

			chart.addAxis("y", {
				vertical: true, // min: obj.min, max: obj.max,
				title: yAxis,
				titleGap: 20,
				min: obj.min,
				max:obj.max,
				labelFunc: this.formatAxes
			});


			if(this.isCorrect || this.mode == "AUTHOR" || this.mode == "ROAUTHOR") {
				//plot chart for student node
				chart.addSeries(
					"Your solution",
					this.formatSeriesForChart(solution, index),
					{stroke: "#5cd65c"}
				);
			}
			else {
				chart.addSeries(
					"Your solution",
					this.formatSeriesForChart(solution, index),
					{stroke: "red"}
				);
			}

			if(this.mode != "AUTHOR" && this.mode != "ROAUTHOR" && this.mode != "EDITOR" && solution.plotValues[index]){

				chart.addSeries(
					"Author's solution",
					this.formatSeriesForChart(this.givenSolution, index), {stroke: "black"}
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

		formatSeriesForChart: function(result, index){
			return array.map(result.times, function(time, k){
				return {x: time, y: result.plotValues[index][k]};
			});
		},

		initializeGraphTab: function(){
			//Graph Tab
			var graphContent = "";
			if(this.activeSolution.plotVariables.length > 0) {
				array.forEach(this.activeSolution.plotVariables, function (id) {
					//Create graph divs along with their error message
					var show = this.model.active.getVariableType(id) == "dynamic" || this.model.authored.getParent(this.model.active.getGivenID(id));
					var checked = show ? " checked='checked'" : "";
					graphContent += "<div><input id='sel" + id + "' data-dojo-type='dijit/form/CheckBox' class='show_graphs' thisid='" + id + "'" + checked + "/>" + " Show " + this.model.active.getName(id) + "</div>";
					var style = show ? "" : " style='display: none;'";
					//graph error message
					graphContent += "<font color='red' id='graphMessage" + id + "'></font>";
					graphContent += "<div	 id='chart" + id + "'" + style + ">";

					graphContent += "</div>";
					// Since the legend div is replaced, we cannot hide the legend here.
					graphContent += "<div class='legend' id='legend" + id + "'></div>";
				}, this);

				this.graphTab.set("content", graphContent);


				array.forEach(this.active.plotVariables, function (id, index) {
					var domNode = "chart" + id;
					var val = this.checkEpsilon(this.activeSolution, index);
					if(val){
						var len = this.activeSolution.plotValues[index].length;
						for(var i = 0; i < len; i++)
							this.activeSolution.plotValues[index][i] = val;
					}
					var xAxis = this.labelString();
					var yAxis = this.labelString(id);
					this.charts[id] = this.createChart(domNode, id, xAxis, yAxis, this.activeSolution, index);
					this.legends[id] = new Legend({chart: this.charts[id]}, "legend" + id);
				}, this);
			} else{
				var thisModel = this;
				var modStatus = true;
				array.forEach(this.model.active.getNodes(), function (thisnode) {
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
				}
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
			if(solution.status=="error" && solution.type=="missing"){
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
			}
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

		}
	});
});
