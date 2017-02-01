define([
	"dojo/_base/array",
	"parser/parser"
], function(array, Parser){
	return {
		parse: function(equation){
			return Parser.parse(equation);
		},
		isVariable: Parser.isVariable,
		equalto: "=",
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
				/*this.logging.clientLog("error", {
					message:'error in parser, error message : ' + e,
					functionTag:'convert'
				});*/
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

		/*
		 Adding quantity to student model:	Update 
		 equations and inputs of existing nodes.
		 */
		addQuantity: function(id, subModel){

			var name = subModel.getName(id);
			array.forEach(subModel.getNodes(), function(node){
				if(node.equation){
					try {
						var expr = Parser.parse(node.equation);
					}catch(e){
						/* If an equation fails to parse, then the input
						 string is stored as the equation for that node.
						 Thus, if the parse fails, just move on to the 
						 next node. */
						return;
					}
					var changed = false;
					array.forEach(expr.variables(), function(variable){
						if(name == variable){
							changed = true;
							expr.substitute(name, id);
						}
					});
					if(changed){
						node.equation = expr.toString(true);
						node.inputs = [];
						var inputs = this.createInputs(expr);
						array.forEach(inputs, function(input){
							if(subModel.isNode(input.ID))
								node.inputs.push(input);
						});
					}
				}
			},this);
		},

		// Test if this is a pure sum or product
		// If so, determine connection labels
		createInputs: function(parse){
			var grad;
			var chooseSign = function(x, a, b, c){
				return x>0.5?a:(x<-0.5?b:c);
			};
			if(this.isSum(parse)){
				grad = this.gradient(parse, false);
				return array.map(parse.variables(), function(x){
					return {ID: x, label: chooseSign(grad[x],"","-","0")};
				});
			}else if(this.isProduct(parse)){
				grad = this.gradient(parse, true);
				return array.map(parse.variables(), function(x){
					return {ID: x, label: chooseSign(grad[x],"","/","none")};
				});
			}else{
				// General expression
				return array.map(parse.variables(), function(x){
					return {ID: x};
				});
			}
		},

		isSum: function(parse){
			// Return true if expression is a sum of variables, allowing for minus signs.
			// Note that a bare variable will also return true.
			var ops = parse.operators();
			var allowed = {"+": true, "-": true, "variable": true};
			for(var op in ops){
				if(ops[op] > 0 && !allowed[op])
					return false;
			}
			return true;
		},

		isProduct: function(parse){
			// Return true if the expression is a product of variables, allowing for division
			// Note that explicit powers (a^2) are not allowed, which is mathematically incorrect
			// but we have no mechanism for adding powers on our user interface.  For problems
			// that are that complicated, the student should be using the full text entry anyway.
			// Note that a bare variable will also return true.
			var ops = parse.operators();
			var allowed = {"*": true, "/": true, "variable": true};
			for(var op in ops){
				if(ops[op] > 0 && !allowed[op])
					return false;
			}
			return true;
		},
		
        gradient: function(parse, /*boolean*/ monomial, point){
			// Find the numerical partial derivatives of the expression at
			// the given point or at a random point, if the point is not supplied.
			// Both the given point and the return vector are expressed as objects.
			// If monomial is true, take the gradient of the logarithm and multiply by the variable.
			// That is, find	 x d/dx log(f)
			// For a monomial, this will give the degree of each factor 
			/*
			 In principle, one could calculate the gradient algebraically and 
			 use that to determine coefficients.  However, the current parser library
			 is not really set up to do algebraic manipulations.
			 */
			if(!point){
				point = {};
				array.forEach(parse.variables(), function(x){
					// For products, we want to stay away from zero.
					point[x]= Math.random()+0.5;
				});
			}
			var partial = {};
			var y = parse.evaluate(point);
			array.forEach(parse.variables(), function(x){
				var z = lang.clone(point);
				var dx = 1.0e-6*Math.abs(point[x]==0?1:point[x]);
				z[x] -= 0.5*dx;
				var y1 = parse.evaluate(z);
				z[x] += dx;
				var y2 = parse.evaluate(z);
				partial[x] = (y2-y1)/dx;
				if(monomial){
					partial[x] *= point[x]/y;
				}
			});
			return partial;
		},

	};
});
