define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./equation"
], function(declare, lang, equation){
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
			this.activeEquations = this.initializeSystem(this._model.active);
			this.isStudentMode = this._model.active === this._model.student;
			if(this.isStudentMode)
				this.authorEquations = this.initialize(this._model.authored);
		},
		/**
		* function which finds the solution for the system of equations.
		**/
		findSolution: function(isActive, id){
			var system = isActive ? this.activeEquations : this.authorEquations;
			var subModel = isActive ? this._model.active : this._model.authored;
			var solution;
			try{
				system.plotValues = equation.graph(subModel, system, id);
			} catch(e) {
				console.error(e);
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
		checkForStatic: function(model, solution) {
			var values = solution.plotValues;
			var temp = 0;
			var isStatic = true;
			if(values.length == 0){
				isStatic = false;
			}
			if(model.active.isVariableTypePresent("dynamic")){
				return false;
			}

			array.forEach(solution.plotVariables, function(id){
				var value = values[id];
				var temp = value[0];
				array.forEach(value, function(v){
					if(v !== temp){
						isStatic = false;
					}
					temp = num;
				});
			});
			return isStatic;
		}
	});
});
