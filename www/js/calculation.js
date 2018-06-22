define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"./tutor-configuration",
	"./equation"
], function(declare, lang, array, configurations, equation){
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
			this._config = configurations.getInstance();
			// previously student mode was for every mode other than authors that is coached and so on
			// and it was used for three purposes
			// show student feedback, and render author graph
			// and save author solution
			this.isStudentMode = !this._config.get("showActiveGraphOnly");
			// since now it can not be used for saving author solution
			// a new variable is used for that purpose
			this.isAuthorMode = !this._model.isStudentMode();
			if(this.isStudentMode)
				this.authorSolution = this.initializeSystem(this._model.authored);
		},
		/**
		* function which finds the solution for the system of equations.
		**/
		findSolution: function(isActive, id, isUpdate){
			var system = null;

			if(isActive)
				system = this.activeSolution;
			else if(id)
				system = this.authorStaticSolution;
			else
				system = this.authorSolution;

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
					if(Math.abs(v - temp) > 10e-7){
						isStatic = false;
						break;
					}
					temp = v;
				}
			});
			return isStatic;
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
