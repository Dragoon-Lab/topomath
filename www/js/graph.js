define([
	"dojo/_base/declare",
	"dojox/charting/widget/Legend",
	"./chart"
], function(declare, Legend, chart){
	return declare(chart, {
		constructor: function(model, solutions, isStatic){
			this._model = model;
			this.activeSolution = solutions["active"];
			this.authorSolution = solutions["author"];
			this.authorStaticSolution = solutions["authorStatic"];
			this.isStatic = isStatic;
		},

		init: funciton(createStatic){
			var message = {};
			if(createStatic)
				message = this.initializeStaticTab()
			else
				message = this.initializeGraphTab()

			return message;
		},

		initializeGraphTab: function(){
			//Graph Tab
			var graphContent = "";
			var variables = this.activeSolution.plotVariables;
			for(var index in variables){
				var id = variables[index];
				//Create graph divs along with their error message
				
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

		html: function(id, staticString){
			var show = this._model.active.getType(id) == "dynamic";
			var checked = show ? " checked='checked'" : "";
			content += "<div><input id='sel" + staticString + id + "' data-dojo-type='dijit/form/CheckBox' class='show_graphs' thisid='" +
								id + "'" + checked + "/>" + " Show " + this._model.active.getName(id) + "</div>";
			var style = show ? "" : " style='display: none;'";
			content += "<div	 id='chart" + staticString + id + "'" + style + "></div>";

			//graph error message
			content += "<font color='red' id='"+ staticString.toLowerCase() +"GraphMessage" + id + "'></font>";
			// Since the legend div is replaced, we cannot hide the legend here.
			content += "<div class='legend' id='legend" + staticString + id + "'></div>";

			return content;
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
		}
	});
});
