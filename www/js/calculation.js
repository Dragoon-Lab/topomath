define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"./equation"
], function(declare, lang, array, equation){
	return declare(null, {
		/**
		* this is the common calculations file which is the interface for calling and
		* using equation.js. equation.js will be the connection to math parser and
		* and solver. calculations will be responsible for all the calculations
		* related stuff. This will be inherited by graph.js and table.js to create
		* html related dom elements for rendering.
		**/
		_model: null,
		constructor: function(model){
			this._model = model;
			this.activeSolution = this.initializeSystem(this._model.active);
			this.isStudentMode = this._model.active === this._model.student;
			if(this.isStudentMode)
				this.authorSolution = this.initializeSystem(this._model.authored);
		},
		/**
		* function which finds the solution for the system of equations.
		**/
		findSolution: function(isActive, id, isUpdate){
			var system = isActive ? this.activeSolution : this.authorSolution;
			var subModel = isActive ? this._model.active : this._model.authored;

			if(!system.status.error){
				// this will make sure than when id is given then new static models are created
				// if its a model update from sliders then we should not set the new values.
				if(isUpdate){
					system.time = equation.initXAxis(subModel, id);
				} else if(id){
					system = this.initializeSystem(subModel, id);
				}
				var solution = equation.graph(subModel, system, id);
				system.plotValues = solution.plotValues;
				//system equations might have different set of quantities than the ones defined by the user
				//happens when user creates a quantity as unknown but does not use it in an equation
				system.plotVariables = solution.plotVariables;
				system.status = solution.status;
			}

			return system
		},
		/**
		* it takes the equations in the model, validates them and creates an object
		* that will be used for finding soltuion.
		**/
		initializeSystem: function(subModel, id){
			var initSolution = null;
			initSolution = equation.initTimeStep(subModel);
			initSolution.time = equation.initXAxis(subModel, id);

			return initSolution;
		},
		//checks if the solution is static
		checkForStatic: function(subModel, solution) {
			var values = solution.plotValues;
			var temp = 0;
			var isStatic = true;
			if(values.length == 0){
				isStatic = false;
			}
			if(subModel.isVariableTypePresent("dynamic")){
				return false;
			}

			array.forEach(solution.plotVariables, function(id){
				var value = values[id];
				var temp = value[0];
				for(var index in value){
					var v = value[index];
					if(Math.abs(v - temp) > 10e-4){
						isStatic = false;
						break;
					}
					temp = v;
				}
			});
			return isStatic;
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

		//checks if the difference between min and max values for plot is not less than 10^-15
		checkEpsilon: function(solution, id){
			var obj = this.getMinMaxFromArray(solution.plotValues[id]);
			return (obj.max - obj.min < Math.pow(10, -15)) && (obj.max != obj.min) && obj.max;
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
		/**
		* this function saves the active solution to the model. so that when the model is
		* saved the solution is saved with it. Important point is this function is mapping
		* of active solution variables to solution object saved with the model.
		* It has no inputs and outputs, as I don't intend to use this function anywhere.
		* whenever it is called it will save *active* solution to model object.
		* Currently it is called from initSolution function during solution construction process.
		**/
		saveSolution: function(){
			solution = {};
			solution.isStatic = this.isStatic;
			solution.variables = this.activeSolution.plotVariables;
			solution.values = this.activeSolution.plotValues;
			this._model.saveSolution(solution);
		}
	});
});
