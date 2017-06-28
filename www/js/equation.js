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
		_logger: null,
		/*
		* Converts an equation with ids to corresponding variable names
		* It splits the equation at = and then replaces the variables in
		* the left hand side and the right hand side of the assignment operator
		*
		* @params:	object subModel: model used to get the node name for each variable
		* 			string equation: equation which is to be converted
		* @return:	object variables
		*			string equation: converted equation string
		*			array variableList: array of all variables in the equation
		*			array newnodeList: array of objects which contain ids and corresponding variable names of new nodes (nodes which are not already present in the model and have been added after equation parse)
		*			array/map connections: array of objects containing inputs of the equation
		*/
		convert: function(params){
			var equation = params.equation;
			var subModel = params.subModel;

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

			if(params.nameToId){
				var nodeList = []; //this holds new node ids and variable objects
				var variableList = []; // this holds the variable list
				var connections = []; // this holds the input list
				var dynamicList = []; //this list holds the prior nodes which are to be created further in controller
				var priorError = false; //this is a special variable which indicates to the controller whether there is an error
										// with using prior function on a variable which is non dynamic
				
				array.forEach(expressions, function(expr){
					variableList = variableList.concat(expr.variables());
					var currentPriorList = expr.priors();
					array.forEach(expr.variables(), function(variable){
						//This is the case where node names have to be converted to ids
						//This situation arises from equationDoneHandler
						//In such situation convert name to id
						var nodeId = subModel.getNodeIDByName(variable);
						if(nodeId){
							expr.substitute(variable,nodeId);
							if(currentPriorList.length>0){
								currentPriorList.some(function(eachPrior){
									if(eachPrior === variable){
										//If the current variable is a part of prior function,
										// check if the corresponding node has accumulator set (is dynamic)
										// If not, set priorError which will be handled later in controller without disturbing the flow
										if(subModel.getVariableType(nodeId) !== "dynamic"){
											priorError = true;
										}
										//if the current occurence of the node is part of prior function
										//it has to be replaced with node_initial in the model
										//getInitialNodeIDString gives the string notation we use for initial nodes
										expr.substitutePrior(nodeId+subModel.getInitialNodeIDString());		
									}
								});
							}
						}
						else{ //this is the case where node does not exist and has to be created
							//verify if autocreatenodes is enabled
							if(params.autoCreateNodes){
								//add node id to model
								//name and type parameters attached
								var newNodeOptions = {
									variable: variable,
									type: "quantity"
								};
								var newId = subModel.addNode(newNodeOptions);
								nodeList.push({ "id": newId, "variable":variable});
								expr.substitute(variable, newId);
								if(currentPriorList.length>0){
									currentPriorList.some(function(eachPrior){
										if(eachPrior === variable){
											// In this case along with new node a corresponding prior node has to be created
											// We store the node data into dynamicList and send to controller where it further makes UI changes for prior node
											dynamicList.push({ "id": newId, "variable":variable});
											expr.substitutePrior(newId+subModel.getInitialNodeIDString());		
										}
									});
								}
							}
						}
					}, this);
					connections = connections.concat(this.createConnections(expr, subModel));
				}, this);
				return {
					variableList: variableList,
					newNodeList: nodeList,
					connections: connections,
					parseSuccess: true,
					dynamicList: dynamicList,
					equation: expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString(),
					priorError: priorError
				};
			}
			else{
				array.forEach(expressions, function(expr){
					array.forEach(expr.variables(), function(variable){
						/* A student equation variable can be a student node id
						or given (or extra) model node name (if the node has not been
						defined by the student). */
						var initialNodeID = variable.indexOf(subModel.getInitialNodeIDString()) > -1 ? 
											subModel.getNodeID(variable) : "";
						if(!initialNodeID && (subModel.isNode(variable))){
							var nodeName = " " + subModel.getName(variable) + " ";
							// console.log("=========== substituting ", variable, " -> ", nodeName);
							expr.substitute(variable, nodeName);
							// console.log("            result: ", expr);
						} else if(initialNodeID && subModel.isNode(initialNodeID)) {
							// this is the case when there is an _initial in the node name
							var nodeName = " " + subModel.getInitialNodeDisplayString() + "(" +
												subModel.getVariable(initialNodeID)+ ") ";
							expr.substitute(variable, nodeName);
						}
					}, this);
				}, this);
				//this would be the case where equation with ids is converted to names and returned
				return {
					equation: expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString()
				};
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
						var connections = this.createConnections(expr);
						array.forEach(connections, function(connection){
							if(subModel.isNode(connection.ID))
								node.inputs.push(connection);
						});
					}
				}
			},this);
		},

		// Test if this is a pure sum or product
		// If so, determine connection labels
		createConnections: function(parse, subModel){
			// General expression
			// TODO: ensure that initial node has a different ID
			return array.map(parse.variables(), function(x){
				if(x.indexOf("id") != 0)
					return {ID: subModel.getNodeIDByName(x)};
				else
					return {ID: x};
			}, this);
		},

		/**
		* function that will solve the system of equations. parameters have to be
		* thought of.
		* For now the system of equations will be passed here with the timestep and
		* variable details, to be sent to math-solver.
		**/
		solve: function(){

		},

		/**
		* to evaluate one equation from the student model and compare it with
		* equation from the author model.
		* TODO contemplating - whether to give equations to be compared here OR
		* the model and he node ID.
		**/
		evaluate: function(){

		},
		setLogging: function(logger){
			this._logger = logger;
		}
	};
});
