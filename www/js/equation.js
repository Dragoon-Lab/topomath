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
		convert: function(params){
			var equation = params.equation;
			var subModel = params.subModel;

			var eqs = params.equation.split(this.equalto);
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
			// is there any significance for the following object? else delete
			this.mapVariableNodeNames = {};
			// console.log("            parse: ", expr);

			
			var nameToId = params.nameToId ? true : false;

			if(nameToId){
				var nodeList = []; //this holds new node ids and variable objects
				var variableList = []; // this holds the variable list
				var inputList = []; // this holds the input list
				array.forEach(expressions, function(expr){
					variableList = variableList.concat(expr.variables());
					inputList = inputList.concat(this.createInputs(expr));
					array.forEach(expr.variables(), function(variable){
						//This is the case where node names have to be converted to ids
						//This situation arises from equationDoneHandler
						//In such situation convert name to id
						var nodeId = subModel.getNodeIDByName(variable);
						if(nodeId){
							expr.substitute(variable,nodeId);
						}
						else{ //this is the case where node does not exist and has to be created
							//verify if autocreatenodes is enabled
							if(params.autoCreateNodes){
								//add node id to model
								var newId = subModel.active.addNode();
								nodeList.push({ "id": newId, "variable":variable});
							}
						}
					}, this);
				}, this);
				return {
						variableList: variableList, 
						newNodeList: nodeList, 
						inputList: inputList,
						parseSuccess: true, 
						equation: expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString()
					};
			}
			else{
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
				//this would be the case where equation with ids is converted to names and returned
				return expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString();
			}	
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
			// General expression
			return array.map(parse.variables(), function(x){
				return {ID: x};
			});
			
		},
		
	};
});
