define([
	"dojo/_base/array",
	"parser/parser"
], function(array, Parser){
	return {
		parse: function(equation){
			return Parser.parse(equation);
		},
		equalto: "=",
		_logger: null,
		/*
		* Converts an equation with ids to corresponding variable names
		* It splits the equation at = and then replaces the variables in
		* the left hand side and the right hand side of the assignment operator
		*
		* @params:	object subModel: model used to get the node name for each variable
		* 			string equation: equation which is to be converted
		* @return:	string expression: with each variable ID replaced with variable name
		*/
		convert: function(subModel, equation){
			var eqs = equation.split(this.equalto);
			var expressions = [];

			try{
				array.forEach(eqs, function(eq, count){
					expressions[count] = Parser.parse(eq);
				}, this);
			}catch(e){
				this._logger.logClientEvent("error", {
					message:'error in parser, error message : ' + e,
					functionTag:'convert'
				});
				return equation;
			}
			this.mapVariableNodeNames = {};
			// console.log("            parse: ", expr);
			array.forEach(expressions, function(expr){
				array.forEach(expr.variables(), function(variable){
					/* A student equation variable can be a student node id
					 or given (or extra) model node name (if the node has not been
					 defined by the student). */
					if(subModel.isNode(variable)){
						var nodeName = subModel.getName(variable);
						// console.log("=========== substituting ", variable, " -> ", nodeName);
						expr.substitute(variable, nodeName);
						// console.log("            result: ", expr);
					}
				}, this);
			}, this);
			return expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString();
		},

		setLogging: function(logger){
			this._logger = logger;
		}
	};
});
