define([
	"dojo/_base/declare",
	"./equation"
], function(declare, equation){
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
			this._model = model
			// TODO: basically decide to call initialization or may be not
			// - we can call initialize because that would change all the
			// model equations to something that can be used by solver and equation.js
			// - To not call initialize is only because there is a case where
			// we can put equation validation here as well. that is checking whether
			// a student mode equation is correct or not.
			// - There would be a graph show function which will create the graph and
			// table show function. That can call initialize
		},
		/**
		* function which finds the solution for the system of equations.
		**/
		findSolution: function(){

		},
		/**
		* it takes the equations in the model, validates them and creates an object
		* that will be used for finding soltuion.
		* TODO: timestep idea has to be formalized and there will be some code here
		* for that.
		* TODO: I am also thinking in case of parameters we can just replace them with
		* the constant values and find the solutions for dynamic nodes only as that way
		* we will decrease the pressure on the solver for creating the Jacobian matrix.
		* This can be done here as well.
		**/
		initialize: function(){

		}
	});
});
