define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojox/charting/widget/Legend",
	"dijit/registry",
	"dojo/dom",
	"./tutor-configuration",
	"./chart"
], function(declare, array, Legend, registry, dom, configurations, chart){
	return declare(chart, {
		domIDs: function(nodeID){
			return {
				chart: "chart" + nodeID,
				legend: "legend" + nodeID,
				message: "graphMessage" + nodeID,
				select: "sel" + nodeID
			};
		},

		staticDomIDs: function(nodeID){
			return {
				chart: "chartStatic" + nodeID,
				legend: "legendStatic" + nodeID,
				message: "graphMessageStatic" + nodeID,
				select: "selStatic" + nodeID
			};
		},

		constructor: function(model, solutions){
			this._model = model;
			this.activeSolution = solutions["active"];
			this.authorSolution = solutions["author"];
			this.authorStaticSolution = solutions["authorStatic"];
			this.graphTab = registry.byId("GraphTab");
			this._config = configurations.getInstance();
			this.isStudentMode = !this._config.get("showActiveGraphOnly");
			this.isAuthorMode = !this._model.isStudentMode();
			this.isCorrect = this._model.matchesGivenSolutionAndCorrect() ? true : false; 
		},

		init: function(staticVar){
			var message = {};
			if(staticVar)
				message = this.initializeStaticTab(staticVar);
			else
				message = this.initializeGraphTab();

			return message;
		},

		setSolution: function(type, solution){
			switch(type){
				case "active":
					this.activeSolution = solution;
					break;
				case "author":
					this.authorSolution = solution;
					break;
				case "authorStatic":
					this.authorStaticSolution = solution;
			}
		},

		initializeGraphTab: function(){
			//Graph Tab
			var graphContent = "";
			var variables = this.activeSolution.plotVariables;
			for(var index in variables){
				var id = variables[index];
				//Create graph divs along with their error message
				graphContent += this.html(id);
			}
			console.log(graphContent);

			this.graphTab.set("content", graphContent);

			array.forEach(this.activeSolution.plotVariables, function (id) {
				var domIDs = this.domIDs(id);
				var val = this.checkEpsilon(this.activeSolution, id);
				if(val){
					var len = this.activeSolution.plotValues[id].length;
					for(var i = 0; i < len; i++)
						this.activeSolution.plotValues[id][i] = val;
				}
				var xAxis = this.labelString();
				var yAxis = this.labelString(id);
				this.charts[id] = this.createChart(domIDs["chart"], id, xAxis, yAxis, this.activeSolution, this.authorSolution);
				this.legends[id] = new Legend({chart: this.charts[id]}, domIDs["legend"]);
			}, this);
		},

		initializeStaticTab: function(staticVar){
			this.staticVar = staticVar;
			this.isStatic = true;
			var staticContent = dom.byId("StaticTab").innerHTML;
			this.staticTab = registry.byId("StaticTab");
			/**
			* this function is called only when this.isStatic is true. Updating the condition to include parameters
			* as well because after this there is a lot of logic which is used for showing static tab things.
			* So basically the legends and all the she band will be shown only if parameters are there are as well.
			**/

			//TODO: Duplicate code in forEach
			array.forEach(this.activeSolution.plotVariables, function(id){
				staticContent += this.html(id, "Static");
			}, this);
			this.staticTab.set("content", staticContent);

			// cant merge this array foreach because different variables are being 
			// used in initializeTab and initializeStaticTab.
			array.forEach(this.activeSolution.plotVariables, function(id){
				var domIDs = this.staticDomIDs(id);
				var xAxis = dom.byId("staticSelect").value;
				var yAxis = this.labelString(id);
				this.chartsStatic[id] = this.createChart(domIDs["chart"], id, xAxis, yAxis, this.activeSolution, this.authorStaticSolution);
				var l = registry.byId(domIDs["legend"]);
				if(registry.byId(domIDs["legend"]))
					l.destroyRecursive();
				this.legendStatic[id] = new Legend({chart: this.chartsStatic[id]}, domIDs["legend"]);
			}, this);
		},

		html: function(id, isStatic){
			var domIDs = isStatic ? this.staticDomIDs(id) : this.domIDs(id);
			var show = this._model.active.getVariableType(id) == "dynamic";
			var checked = show ? " checked='checked'" : "";
			var content = "<div><input id='" + domIDs["select"] + "' data-dojo-type='dijit/form/CheckBox' class='show_graphs' thisid='" +
								id + "'" + checked + "/>" + " Show " + this._model.active.getName(id) + "</div>";
			var style = show ? "" : " style='display: none;'";
			content += "<div id='" + domIDs["chart"] + "'" + style + "></div>";

			//graph error message
			content += "<font color='red' id='" + domIDs["message"] + "'></font>";
			// Since the legend div is replaced, we cannot hide the legend here.
			content += "<div class='legend' id='" + domIDs["legend"] + "'></div>";
			return content;
		},

		//changes the static graph when sliders or dropdown change
		renderStaticDialog: function(activeSolution, authorSolution, updateAuthorGraph){
			console.log("rendering static");
			
			//this.staticVar = this.checkStaticVar(true);
			//var activeSolution = this.findSolution(true, staticVar, isUpdate);
			//if(this.isStudentMode && updateAuthorGraph)
			//	this.authorSolution = this.findSolution(false, this._model.student.getAuthoredID(staticVar));

			//update and render the charts
			array.forEach(this.activeSolution.plotVariables, function(id, k){
				var inf = this.checkForInfinity(activeSolution.plotValues[id]);
				var domIDs = this.staticDomIDs(id);
				if(inf) {
					dom.byId(domIDs["message"]).innerHTML = "The values you have chosen caused the graph to go infinite.";
					domStyle.set(domIDs["chart"], "display", "none");
					domStyle.set(domIDs["legend"], "display", "none");
					domAttr.remove(domIDs["message"], "style");
				}
				else {
					dom.byId(domIDs["message"]).innerHTML = "";
					this.updateChart(id, activeSolution, authorSolution, k, true, updateAuthorGraph);
				}
			}, this);

		},

		/*
		 * @brief: this function re-renders dialog  when slider event is fired and
		 * new values for student nodes are calculated
		 */
		renderDialog: function(activeSolution){
			console.log("rendering graph and table");
			//var activeSolution = this.findSolution(true, null, true);
			//update and render the charts
			array.forEach(this.activeSolution.plotVariables, function(id, k){

				// Calculate Min and Max values to plot on y axis based on given solution and your solution
				var inf = this.checkForInfinity(activeSolution.plotValues[k]);
				if(inf) {
					var domIDs = this.domIDs(id);
					dom.byId(domIDs["message"]).innerHTML = "The values you have chosen caused the graph to go infinite. (See table.)";
				}
				else {
					this.updateChart(id, activeSolution, this.authorSolution, k, false);
				}
			}, this);

			//this.createTable(this.activeSolution.plotVariables);
		}
	});
});
