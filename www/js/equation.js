define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"parser/parser",
	"solver/solver-wrapper"
], function(array, lang, Parser, Solver){
	return {
		parse: function(equation){
			return Parser.parse(equation);
		},
		isVariable: Parser.isVariable,
		equalto: "=",
		_logger: null,
		epsilon: 10e-9,
		cache: {},
		_status: {
			correct: "correct",
			incorrect: "incorrect",
			partial: "partial"
		},
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
				var isError = false; //this is a special variable which indicates to the controller whether there is an error
										// with using prior function on a variable which is non dynamic
				var unknownNodesList = []; // List that holds nodes created by student not in the model
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
											isError = true;
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
								// check whether a correct node has been added by the student
								var doReplace = true;
								if(subModel.isStudentMode()){
									doReplace = subModel.getAuthoredIDForName(variable) ? true : false;
								}
								if(doReplace){
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
								}else{
									unknownNodesList.push(variable);
								}
							} else {
								// when auto created nodes were not allowed but equation had non-existent nodes.
								isError = true;
							}
						}
					}, this);
					var _c = this.createConnections(expr, subModel);
					for(var i = 0; i < _c.length; i++){
						if(!_c[i].ID){
							_c.splice(i, 1);
							i--;
						}
					}
					connections = connections.concat(_c);
					connections = Array.from(new Set(connections.map(JSON.stringify))).map(JSON.parse);
				}, this);
				if(subModel.isStudentMode() && unknownNodesList && unknownNodesList.length > 0){
					var _returnObj = {"newNodeList": nodeList, "unknownNodesList" : unknownNodesList};
					throw new Error("unknown variables" + JSON.stringify(_returnObj));
				}
				return {
					variableList: variableList,
					newNodeList: nodeList,
					connections: connections,
					dynamicList: dynamicList,
					equation: expressions[0].toString() + " " + this.equalto + " " + expressions[1].toString(),
					success: !isError,
					priorError: isError,
					unknownNodesList : unknownNodesList
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
				if(x.indexOf("id") != 0){
					return {ID: subModel.getNodeIDByName(x)};
				} else {
					return {ID: x};
				}
			}, this);
		},

		/**
		* function that will solve the system of equations. parameters have to be
		* thought of.
		* For now the system of equations will be passed here with the timestep and
		* variable details, to be sent to math-solver.
		**/
		solveTimeStep: function(equations){
			var equationArray = [];
			array.forEach(equations.expressions, function(eq){
				expression = this.parseEquation(eq);
				expression = this.replace(expression, equations.values);
				equationArray.push(expression);
			}, this);

			var solution = {};
			try{
				var solver = new Solver(equationArray);
				solution.point = solver.solve();
				solution.vars = solver.xvars;
			} catch(e) {
				// Error handling has to be done for each error in Solver
				throw e;
			}

			return solution;
		},

		graph: function(subModel, equations, staticID){
			var solution = {};
			solution.plotValues = this.initSolution(subModel, equations);
			solution.status = {};
			solution.status.error = false;
			var values = {};
			var equationCopy = equations.expressions.slice(0);

			var timeSteps = equations.time.length;
			/*array.forEach(equations.params, function(id){
				values[id] = subModel.getValue(id);
			});*/
			values = lang.clone(equations.initValues);
			var timeStepSolution;
			for(var i = 1; i <= timeSteps; i++){
				if(staticID)
					values[staticID] = equations.time[i-1];
				array.forEach(equations.xvars, function(id){
					values[id+subModel.getInitialNodeIDString()] = solution.plotValues[id][i-1];
				});
				equations.values = values;
				equations.expressions = equationCopy;
				try{
					timeStepSolution = this.solveTimeStep(equations);
				} catch(e){
					solution.status.error = true;
					solution.status.message = e.type;
					break;
				}
				array.forEach(timeStepSolution.vars, function(id, counter){
					solution.plotValues[id].push(timeStepSolution.point.get(counter, 0));
				});
			}
			if(!solution.status.error){
				if(timeStepSolution && timeStepSolution.hasOwnProperty('vars'))
					solution.plotVariables = timeStepSolution.vars;
				else
					solution.plotVariables = solution.xvars.concat(solution.func);
				console.log("solution for the system of equations ", solution);
			}

			return solution;
		},

		initSolution: function(subModel, equations){
			var solution = {};
			// initialize the solution object
			array.forEach(equations.xvars, function(id){
				solution[id] = [];
				solution[id].push(equations.initValues[id + subModel.getInitialNodeIDString()]);
			});
			array.forEach(equations.func, function(id){
				solution[id] = [];
			});

			return solution;
		},
		/**
		* to evaluate one equation from the student model and compare it with
		* equation from the author model.
		* TODO:
		* The actual algorithm is not supposed to have authorValue check at all.
		* This has been kept for backward compatibility and once all the models
		* have been updated to have the solution numbers then this code needs to
		* be updated to remove the author equation handling completely. ~ Sachin
		**/
		evaluate: function(model, id){
			var sEquation = model.student.getEquation(id);
			var aEquation = model.authored.getEquation(model.student.getAuthoredID(id));
			var str = model.active.getInitialNodeIDString();

			if(!aEquation || !sEquation)
				return false;

			var aParse; var sParse;
			try{
				aParse = this.parseEquation(aEquation);
				sParse = this.parseEquation(sEquation);
			} catch(e){
				console.log(e);
			}

			var numberOfEvaluations = model.student.isSolutionStatic() ? 1 : 10;
			var variables = {};
			var authorValue = [];
			var studentValue = [];
			var flag;
			for(var i = 0; i < numberOfEvaluations; i++){
				variables = this.createEvaluationPoint(model);
				for(var j = 0; j < 2; j++){
					flag = array.every(sParse[j].variables(), function(id){
						return (id in variables);
					});
					if(!flag)
						return this._status["incorrect"];
					authorValue[j] = aParse[j].evaluate(variables);
					studentValue[j] = sParse[j].evaluate(variables);
				}
				var aValue = authorValue[0] - authorValue[1];
				var sValue = studentValue[0] - studentValue[1];
				// this check will only have sValue check
				if(Math.abs(sValue) > this.epsilon &&
					Math.abs(Math.abs(aValue) - Math.abs(sValue)) > this.epsilon)
					return this._status["incorrect"];
			}
			if(this.validateVariables(model, aParse, sParse)){
				return this._status["correct"];
			}

			return this._status["partial"];
		},

		validateVariables: function(model, aParse, sParse){
			var sVariables = [];
			var aVariables = [];
			var idString = model.authored.getInitialNodeIDString();
			for(var i = 0; i < 2; i++){
				aVariables = aVariables.concat(aParse[i].variables());
				sVariables = sVariables.concat(sParse[i].variables());
			}
			if(aVariables.length != sVariables.length)
				return false;

			for(i = 0; i < 2; i++){
				var flag = array.every(sParse[i].variables(), function(id){
					var authoredID = model.student.getAuthoredID(id);
					if(authoredID){
						if(id.indexOf(idString) > -1){
							authoredID += idString;
						}
						return (aVariables.indexOf(authoredID) > -1);
					} else
						return false;
				});
				if(!flag)
					return false;
			}

			return true;
		},

		check: function(evaluation){
			return evaluation == this._status["correct"];
		},

		getEquationVariables: function(model, id){
			var aEquation = model.authored.getEquation(model.student.getAuthoredID(id));
			var aParse = this.parseEquation(aEquation);
			var variables = [];
			var flag; var variable;
			array.forEach(aParse, function(p){
				array.forEach(p.variables(), function(id){
					flag = false;
					if(id.indexOf(model.authored.getInitialNodeIDString()) > 0){
						flag = true;
						id = model.authored.getID(id);
					}
					variable = model.authored.getVariable(id);
					variable = (flag ? "Prior value of " : "") + variable;
					variables.push(variable);
				});
			});

			return variables;
		},

		replace: function(expression, values){
			array.forEach(expression, function(e){
				array.forEach(e.variables(), function(variable, index){
					if(values.hasOwnProperty(variable)){
						e.substitute(variable, values[variable]);
					}
				});
			});
			return expression;
		},

		createEvaluationPoint: function(model){
			var isStatic = model.student.isSolutionStatic();
			var point = {};
			func = model.student.isSolutionAvailable() ? model.student.getSolutionPoint : model.student.getRandomPoint;
			point = func.apply(model.student);

			return point;
		},

		parseEquation: function(expression){
			if(!expression)
				return null;

			var eqArray = expression.split(this.equalto);
			if(eqArray && eqArray.length != 2)
				throw Error("equation has more than one equal to symbol");
			var parse = [];
			for(var i = 0; i < 2; i++){
				parse[i] = Parser.parse(eqArray[i]);
			}

			return parse;
		},

		initTimeStep: function(subModel){
			var nodes = subModel.getNodes();
			var equations = {
				params: [],
				func: [],
				xvars: [],
				plotVariables: [],
				expressions: [],
				values: {}
			};

			// calling isNodeRequired because in student mode node does not have the genus property
			// it has to be retrieved from the corresponding authored node.
			var incompleteModel = "false";
			var status = {
				error: false
			};
			array.forEach(nodes, function(node){
				if(subModel.isNodeRequired(node.ID) || subModel.isNodeAllowed(node.ID)){
					switch(node.type){
						case "quantity":
							switch(node.variableType){
								case "parameter":
									equations.params.push(node.ID);
									equations.values[node.ID] = node.value;
									break;
								case "dynamic":
									equations.xvars.push(node.ID);
									equations.values[node.ID + subModel.getInitialNodeIDString()] = node.value;
									break;
								case "unknown":
									equations.func.push(node.ID);
									break;
								default:
									status.error = true;
									status.node = subModel.getVariable(node.ID);
									status.field = "variable type";
									status.message = "model.incomplete";
							}
							break;
						case "equation":
							equations.expressions.push(node.equation);
							break;
						default:
							status.error = true;
							status.node = subModel.getVariable(node.ID);
							status.field = "node type";
							status.message = "model.incomplete";
					}
				}
				if(!subModel.isComplete(node.ID)){
					status.error = true;
					status.node = subModel.getVariable(node.ID);
					status.field = "";
					status.message = "model.incomplete";
				}
			}, this);
			equations.plotVariables = equations.xvars.concat(equations.func);
			equations.initValues = lang.clone(equations.values);

			if(equations.plotVariables.length == 0){
				status.error = true;
				if(nodes.length == 0)
					status.message = "empty.model";
				else if(equations.expressions.length == 0)
					status.message = "no.equations";
			}
			if(equations.expressions.length == 0){
				status.error = true;
				status.message = "no.equations";
			}
			equations.status = status;

			return equations;
		},

		initXAxis: function(subModel, id){
			var time = subModel.getTime();
			var axis = [];
			var start = time.start;
			var end = time.end;
			var step = time.step;
			var points = 20;
			if(id){
				var value = subModel.getValue(id);
				var flag = value > 0;
				start = flag ? value / 10 : value * 10;
				end = flag ? value * 10 : value / 10;
				step = flag ? (end - start) : (start - end);
				step = step/points;
			}
			var counter = 0;
			for(var i = start; i < end; i += step){
				axis[counter++] = i;
			}

			return axis;
		},

		setLogging: function(logger){
			this._logger = logger;
		}
	};
});
