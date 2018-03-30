define([
	"dojo/_base/declare",
	"dojox/charting/Chart",
	"dojox/charting/axis2d/Default",
	"dojox/charting/plot2d/Lines",
	"dojox/charting/plot2d/Grid"
], function(declare, Chart, Default, Lines, Grid){
	return declare(null, {
		chart: {},
		legends: {},
		chart: {},
		chartStatic: {},
		legendStatic: {},
		constructor: function(){
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
		}
	});
});
