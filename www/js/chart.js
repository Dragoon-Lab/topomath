define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojox/charting/Chart",
	"dojox/charting/axis2d/Default",
	"dojox/charting/plot2d/Lines",
	"dojox/charting/plot2d/Grid",
	"dojo/dom"
], function(declare, array, Chart, Default, Lines, Grid, dom){
	return declare(null, {
		charts: {},
		legends: {},
		chartsStatic: {},
		legendStatic: {},
		_colors: {
			majorHLine: "#CACACA",
			majorVLine: "#CACACA",
			incorrectGraph: "red",
			correctGraph: "#228B22",
			authorGraph: "black"
		},
		constructor: function(){
			this.isLineDashed = {
				"author": false,
				"active": false
			};
		},

		createChart: function(domNode, id, xAxis, yAxis, solution, authorSolution){
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
			var authorID = this._model.active.getAuthoredID(id);
			if(this.isStudentMode && this.authorSolution && this.authorSolution.plotValues[authorID]){
				var authorObj = this.getMinMaxFromArray(this.authorSolution.plotValues[authorID]);
				if (authorObj.min < obj.min) {
					obj.min = authorObj.min;
				}
				if (authorObj.max > obj.max) {
					obj.max = authorObj.max;
				}
				var step = (obj.max - obj.min)/10;
				if(obj.min >= obj.min - step){
					obj.min = obj.min - step;
				}
				if(obj.max <= obj.max + step){
					obj.max = obj.max + step;
				}
			}

			chart.addAxis("y", {
				vertical: true, // min: obj.min, max: obj.max,
				title: yAxis,
				titleGap: 20,
				min: obj.min,
				max:obj.max,
				labelFunc: this.formatAxes
			});

			var series = this.formatChartSeries(solution, authorSolution, id);
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
			//	dom.byId("solutionMessage").innerHTML = "Unable to graph, please increase the number of timesteps";
			//}
			return chart;
		},

		updateChart: function(id, solution, authorSolution, index, isStatic){

			var charts = isStatic? this.chartsStatic : this.charts;

			dom.byId("graphMessage" + id).innerHTML = "";
			var obj = this.getMinMaxFromArray(solution.plotValues[id]);
			var authorID = this._model.active.getAuthoredID(id);
			if(this.isStudentMode && this.authorSolution && this.authorSolution.plotValues[authorID]){
				var authorObj = this.getMinMaxFromArray(this.authorSolution.plotValues[authorID]);
				if (authorObj.min < obj.min) {
					obj.min = authorObj.min;
				}
				if (authorObj.max > obj.max) {
					obj.max = authorObj.max;
				}
				var step = (obj.max - obj.min)/10;
				if(obj.min >= obj.min - step){
					obj.min = obj.min - step;
				}
				if(obj.max <= obj.max + step){
					obj.max = obj.max + step;
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
					title: this.labelString(this.staticVar),
					titleOrientation: "away", titleGap: 5
				});
			}

			var series = this.formatChartSeries(solution, authorSolution, id, isStatic);

			array.forEach(series, function(s){
				charts[id].updateSeries(
					s.title, s.data, s.stroke
				);
			});

			charts[id].render();
		},

		formatChartSeries: function(solution, authorSolution, id, isStatic){
			var series = [];
			var activeSeries = {};
			activeSeries.title = "Your Solution";
			activeSeries.data = this.formatSeriesForChart(solution, id);
			if(this.isCorrect || !this.isStudentMode){
				activeSeries.stroke = {stroke:{color: this._colors.correctGraph}, width: 2};
				//temp.stroke = {stroke:{color: this._colors.correctGraph, style: "ShortDash"}, width: 2};
			} else {
				//temp.stroke = {stroke: {color: this._colors.incorrectGraph, style: "ShortDash"}, width: 2};
				activeSeries.stroke = {stroke: {color: this._colors.incorrectGraph}, width: 2};
			}

			if(this.isLineDashed["active"]){
				activeSeries["stroke"] = this.showDashedSeries(activeSeries["stroke"]);
			}
			series.push(activeSeries);
			if(this.isStudentMode){
				var authorSeries = {
					title: "Author's solution",
					data: this.formatSeriesForChart(authorSolution, this._model.student.getAuthoredID(id)),
					stroke: {stroke: {color: this._colors.authorGraph}, width: 2}
				};
				if(this.isLineDashed["author"]){
					authorSeries["stroke"] = this.showDashedSeries(authorSeries["stroke"]);
				}
				series.push(authorSeries);
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

		showDashedSeries: function(stroke){
			stroke["stroke"]["style"] = "ShortDash";

			return stroke;
		},

		//checks if the difference between min and max values for plot is not less than 10^-15
		checkEpsilon: function(solution, id){
			var obj = this.getMinMaxFromArray(solution.plotValues[id]);
			return (obj.max - obj.min < Math.pow(10, -15)) && (obj.max != obj.min) && obj.max;
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
				if(!isFinite(value)){
					result = true;
				}
			});
			return result;
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
			if(Math.abs(max - min) < 10e-10){
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
			var units = id?this._model.active.getUnits(id):this._model.getTimeUnits();
			if(units){
				label += " (" + units + ")";
			}
			return label;
		}
	});
});
