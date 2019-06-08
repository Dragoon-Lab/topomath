define([
	"dojo/_base/array", "dojo/_base/lang"
], function(array, lang){
	return function(){
		var obj = {
			constructor: function(/* object */ session, /* string */ mode, /* string */ name){
				this.x = this.beginX;
				this.y = this.beginY;
				this.model = {
					taskName: name,
					time: {start: 0, end: 1, step: 1.0, units: "seconds"},
					solution: {isStatic: false, variables: [], plotValues: {}},
					authorModelNodes: [],
					studentModelNodes: []
				};
				obj.active = (mode === "AUTHOR" || mode === "SEDITOR") ? obj.authored : obj.student;
				obj._session = session;
				this._unknownQuantityNodeCount = 0;
				this._equationNodeCount = 0;
			},
			_ID: 1,
			beginX: 450,
			beginY: 100,
			nodeWidth: 250,
			nodeHeight: 100,
			initialNodeIDString: "_initial",
			initialNodeDisplayString: "prior",
			 _unknownQuantityNodeCount : 0,
			 _equationNodeCount: 0,
			_updateNextXYPosition: function(){
				var pos = {
					x: this.x,
					y: this.y,
					nodeWidth: this.nodeWidth,
					nodeHeight: this.nodeHeight
				};
				var nodes = obj.active.getNodes();
				while(nodes.some(this.collides, pos)){
					this.updatePosition();
					//updating pos so that new values are used in case of collision
					pos = {
						x: this.x,
						y: this.y,
						nodeWidth: this.nodeWidth,
						nodeHeight: this.nodeHeight
					};
				}
			},
			updatePosition: function(){
				if((this.x + this.nodeWidth) < (document.documentElement.clientWidth - this.nodeWidth))
					this.x += this.nodeWidth;
				else {
					this.x = this.beginX;
					this.y += this.nodeHeight;
				}
			},
			collides: function(element){
				if(!element.position){
					return false;
				}
				return array.some(element.position, function(position){
					if(position){
						var x = position.x;
						var y = position.y;
						return (this.x > x - this.nodeWidth && this.x < x + this.nodeWidth &&
							this.y > y - this.nodeHeight && this.y < y + this.nodeHeight);
					}
				}, this);
			},
			loadModel: function(_model){
				// Summary: loads a model object;
				//      allows TopoMath to load a pre-defined program or to load a users saved work
				//      Sets id for next node.
				this.model = _model;

				/*
				 We use ids of the form "id"+integer.  This loops through
				 all the nodes in the model and finds the lowest integer such
				 that there is no name conflict.  We simply ignore any ids that
				 are not of the form "id"+integer.
				 */
				var largest = 0;
				var intID = function(/*object*/ node){
					if(node.ID.length >= 2 && node.ID.slice(0, 2) == "id"){
						var n = parseInt(node.ID.slice(2));
						if(n && n > largest)
							largest = n;
					}
				};
				array.forEach(this.authored.getNodes(), intID);
				array.forEach(this.student.getNodes(), intID);
				this._ID = largest + 1;

				/*
				 Sanity test that all authored model IDs, node names,
				 and descriptions are distinct, if they are defined.
				 */
				var ids = {}, names = {}, descriptions = {};
				var duplicateDescription = [];
				var duplicateName = [];
				array.forEach(this.authored.getNodes(), function(node){
					if(node.ID in ids){
						throw new Error("Duplicate node id " + node.id);
					}
					if(node.name in names){
						duplicateName[node.name] = node.ID;
					}
					if(node.description in descriptions){
						var duplicateNodeId = descriptions[node.description];
						duplicateDescription[node.ID] = node.name;
						duplicateDescription[duplicateNodeId] = this.authored.getName(duplicateNodeId);
					}

					ids[node.ID] = true;
					if(node.name){
						names[node.name] = node.ID;
					}
					if(node.description){
						descriptions[node.description] = node.ID;
					}

					if(!node.position){
						obj._updateNextXYPosition();
						node.position = [];
						node.position.push({
							x: obj.x,
							y: obj.y
						});
					}
				}, this);

				// Initially the time module was never added to the models, whereas it
				// it should have. I have written the code to fix this issue, where time
				// object has been added to the model. So new models after the merging of
				// fix will have it. But to keep the things working and also backward
				// compatible as there are a lot of models that have been created without
				// time object, I am explicitly adding a check for it to ensure the graphs
				// can work without any issue. ~ Sachin Grover
				if(!this.model.time){
					this.model.time = {
						start: 0,
						end: 10,
						step: 1.0,
						units: "seconds"
					}
				}

				// to handle color by numbers idea for evaluation of equations a solution object
				// was added to the model. Adding this code for backward compatibility.
				if(!this.model.solution){
					this.model.solution = {
						isStatic: false,
						variables: [],
						plotValues: {}
					};
				}
			},
			getModelAsString: function(){
				// Summary: Returns a JSON object in string format
				//          Should only be used for debugging.
				return JSON.stringify(this.model, null, 4);
			},
			/* TODO : after we imbibe task into model
			getUnits: function(){
				return this.model.task.time.units;
			},
			*/
			getTaskName: function(){
				return obj.model.taskName;
			},
			getAllUnits: function(){
				// Summary:	 returns a list of all distinct units
				// (string format) defined in a problem.
				// Need to order list alphabetically.
				var unitList = new Array();
				//TODO: after we imbide task.time.units into model
				/*
				var timeUnits = this.getUnits();
				if(timeUnits){
					unitList.push(timeUnits);
				}
				*/
				array.forEach(this.authored.getNodes(), function(node){
					if(node.units && array.indexOf(unitList, node.units) == -1){
						unitList.push(node.units);
					}
				}, this);
				return unitList;
			},
			getAllEntities: function(){
				// Summary: returns a list of all distinct entities author has entered for the model
				var entityList = new Array();
				array.forEach(this.authored.getNodes(), function(node){
					//out of the list of entities, add all the entities not added previously to the list
					var entityAr = node.entity ? node.entity.split(";") : null;
					if(entityAr){
						for(var i=0; i<entityAr.length; i++){
							var currentEntity = entityAr[i].trim();
							if(array.indexOf(entityList, currentEntity) == -1)
								entityList.push(currentEntity);
						}
					}
				}, this);
				return entityList;
			},
			isParentNode: function(/*string*/ id){
				// Summary: returns true if a node is the parent node in a tree structure;
				return this.authored.getNode(id).root;
			},
			isNodesParentVisible: function(/*string*/ studentID, /*string*/ givenID){
				// Summary: returns true if the given node's parent is visible (if the
				//		node is an input into another node that is in the student model)
				var nodes = this.authored.getNodes();

				return array.some(nodes, function(node){
					return array.some(node.inputs, function(input){
						return givenID === input.ID && this.isNodeVisible(studentID, node.ID); // node.ID is the parent of input.ID;
					}, this);
				}, this);
			},
			isNodeVisible: function(/*string*/ studentID, /*string*/ givenID){
				// Summary: returns true if the node is in the student model,
				//			excluding the current student node.
				return array.some(this.student.getNodes(), function(node){
					return node.ID !== studentID && node.authoredID === givenID;
				});
			},
			getTimeUnits: function(){
				return obj.model.time.units || "seconds";
			},
			isStudentMode: function(){
				return obj._session.isStudentMode;
			},
			setStudentMode: function(value){
				obj._session.isStudentMode = value;
			},
			matchesGivenSolution: function(){
				var flag = this.areRequiredNodesVisible() &&
						array.every(this.student.getNodes(), function(sNode){
							return this.student.isComplete(sNode.ID);
						}, this);
				return flag ? true : false;
			},
			areRequiredNodesVisible: function(){
				var solutionNodes = this.authored.getRequiredNodes();
				var studentNodes = this.student.getNodes();
				var l = solutionNodes.length;
				var flag = array.every(solutionNodes, function(solutionNode){
					return this.doesStudentNodeExist(solutionNode.ID);
				}, this);

				return flag ? true : false;
			},
			doesStudentNodeExist: function(authorID){
				var studentNodes = this.student.getNodes();
				var flag = array.some(studentNodes, function(node){
					return authorID === node.authoredID;
				});

				return flag ? true : false;
			},
			matchesGivenSolutionAndCorrect: function(){
				return this.matchesGivenSolution() && 
						this.checkStudentNodeCorrectness();
			},
			checkStudentNodeCorrectness: function(){
				var studentRequiredNodes = this.student.getRequiredNodes();
				return array.every(studentRequiredNodes, function(node){
					var correctness = this.student.getCorrectness(node.ID);
					return correctness != "incorrect";
				}, this);
			},
			getTimeUnits: function(){
				return obj.model.time.units || "seconds";
			},
			saveSolution: function(solution){
				obj.model.solution = solution;
			},
			arrDifference: function(arr1, arr2){
				for (var i = 0; i < arr2.length; i++){
					var ind = arr1.indexOf(arr2[i]);
					if(ind >=0)
						arr1.splice(ind, 1);
				}
				return arr1;
			}
		};

		var both = {
			/**
			* wrapper to get ID given all types of node ID with or without the initial String
			* @params - id - node ID may or may not have initial in its ID string
			*			id - returns the id with removed string
			*/
			getEquationCount: function(){
				obj._equationNodeCount = 0;
				array.forEach(this.getNodes(), function(node){
					if(node && node.type === "equation"){
						obj._equationNodeCount++;
					}
				}, this);
				return obj._equationNodeCount;
			},
			
			getUnknownQuantityCount: function(){
				obj._unknownQuantityNodeCount = 0;
				array.forEach(this.getNodes(), function(node){
					if(node && node.type === "quantity" && node.variableType && node.variableType === "unknown"){
						obj._unknownQuantityNodeCount++;
					}
				}, this);
				return obj._unknownQuantityNodeCount;
			},
			getID: function(/* string */ id){
				var initialNodeString = this.getInitialNodeIDString();
				return id.indexOf(initialNodeString) > 0 ?
							id.replace(initialNodeString, "") : id;
			},
			getNode: function(/* string */ id){
				var nodes = this.getNodes();
				var l = nodes.length;
				for(var i = 0; i < l; i++){
					if(nodes[i].ID == id)
						return nodes[i];
				}
				console.warn("No matching node for '" + id + "'");
				// console.trace();
				return null;
			},
			/**
			* takes a node ID and removes the initial node ID string from it if present
			*/
			getNodeID: function(/*string*/ id){
				return id.indexOf(this.getInitialNodeIDString()) > -1 ?
							id.replace(this.getInitialNodeIDString(), "") : id;
			},
			getVariable: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.variable;
			},
			getType: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.type;
			},
			getEquation: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.equation;
			},
			getLinks: function(/*string*/ id){
				// Summary: return an array containing the link ids for a node.
				var ret = this.getNode(id);
				return ret && ret.links;
			},
			getPosition: function(/*string*/ id, /*integer*/ index){
				// Summary: return current position of the node.
				if(index != undefined)
					return this.getNode(id).position[index];
				else
					return this.getNode(id).position;
			},
			getValue: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.value;
			},
			getUnits: function(/*string*/ id){
				return this.getNode(id).units;
			},
			getExpression: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.expression;
			},
			getVariableType: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.variableType;
			},
			isNode: function(/* string */ id){
				return array.some(this.getNodes(), function(node){
					return node.ID === id;
				});
			},
			getGenus: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.genus;
			},
			getColor: function(/*string*/ id){
				var node = this.getNode(id);
				return node && node.color;
			},
			getAllEquations: function(){
				var eqList = new Array();
				array.forEach(this.getNodes(), function(node){
					if(node && node.type == "equation")
						eqList.push({id: node.ID, equation: node.equation});
				});
				return eqList;
			},
			/**
			* gets the nodes where node corresponding to the id is part of the links to any other node
			* - used for updating the corresponding equations if the node variables are updated
			* @params -	id - quantity node ID whose variable name has been changed
			*			nodes - nodes for which the equation has to be updated
			*/
			getLinksFromID: function(/* string */ id){
				var nodes = [];
				var temp = array.map(this.getNodes(), function(node){
					var found = false;
					found = array.some(node.links, function(link){
						return (link.ID === id);
					});
					if(found) return node.ID;
				});
				array.forEach(temp, function(t){
					if(t) nodes.push(t);
				});

				return nodes;
			},
			getAuthorNameByNodeID: function(/*string*/ id){
				// Summary: returns the id of a node matching the authored name from the
				//          authored or extra nodes.  If none is found, return null.
				var name;
				var gotIt = array.some(obj.authored.getNodes(), function(node){
					name = node.variable;
					return node.ID === id;
				});
				return gotIt ? name : null;
			},
			setOriginalAuthorID: function(/*string*/ studId, authId){
				this.getNode(studId).originalID = authId;
				//console.log(this.getNode(studId));
			},
			getOriginalAuthoredID: function(id){
				return this.getNode(id).originalID;
			},
			/**
			* this function will also be removed after changing accumulator to
			* variable type. Due to testing overhead this has been kept and will
			* be removed in due course of time.
			*/
			isAccumulator: function(/* string */ id){
				console.warn("DEPRECATED - Please use getVariableType instead");
				var node = this.getNode(id);
				return node && node.variableType == "dynamic";
			},
			deleteNode: function(/*string*/ id){
				var nodes = this.getNodes();
				var isDeleteInitialNode = id.indexOf(this.getInitialNodeIDString()) > 0;
				var l = nodes.length;
				var index = -1;
				var updateNodes = [];
				for(var i = 0; i < l; i++){
					var found = false;
					if(!isDeleteInitialNode){
						if(nodes[i].ID === id){
							index = i;
						}
					}
					array.forEach(nodes[i].links, function(link){
						if(link.ID.indexOf(id) > -1){
							found = true;
							return;
						}
					});
					if(found){
						updateNodes.push(nodes[i].ID);
						nodes[i].links = [];
						nodes[i].equation = "";
						/*nodes[i].status.equation = {
							"disabled": false
						};*/
					}
				}
				if(!isDeleteInitialNode && index != -1)
					nodes.splice(index, 1);

				return updateNodes;
			},
			setLinks: function(/*array*/ links, /*string*/ target){
				// Silently filter out any inputs that are not defined.
				// inputs is an array of objects.
				var targetID = target;
				var initialString = this.getInitialNodeIDString();
				if(target.indexOf(initialString) > 0)
					targetID = target.replace((initialString), "");
				var node = this.getNode(targetID);
				if(node){
					node.links = array.filter(links, function(link){
						var id = link.ID.indexOf((initialString)) ? link.ID.replace((initialString), "") : link.ID;
						return this.isNode(id);
					}, this);
				}
			},
			setType: function(/*string*/ id, /*string*/ type){
				var ret = this.getNode(id);
				if(ret)
					ret.type = type;
			},
			setVariableType: function(/*string*/ id, /*string*/ variableType ){
				var node = this.getNode(id);
				if(node){
					node.variableType = variableType;	
				} 
			},
			setPosition: function(/*string*/ id, /*integer*/ index, /*object*/ positionObject){
				// Summary: sets the "X" and "Y" values of a node's position
				this.getNode(id).position[index] = positionObject;
			},
			getInitialNodeIDString: function(){
				return obj.initialNodeIDString;
			},
			getInitialNodeDisplayString: function(){
				return obj.initialNodeDisplayString;
			},
			getName: function(/*string*/ id){
				// Summary: returns the name of a node matching the student model.
				//      If no match is found, then return null.
				var node = this.getNode(id);
				return node && node.variable;
			},
			getParentSchema: function(/*string*/ id){
				// Summary: returns the name of a node matching the student model.
				//      If no match is found, then return null.
				var node = this.getNode(id);
				return node && node.parentSchema;
			},
			getParentEquation: function(/*string*/ id){
				// Summary: returns the name of a node matching the student model.
				//      If no match is found, then return null.
				var node = this.getNode(id);
				return node && node.parentEquation;
			},

			getSelfEquation: function(/*string*/ id){
				// Summary: returns the name of a node matching the student model.
				//      If no match is found, then return null.
				var node = this.getNode(id);
				return node && node.selfEquation;
			},

			getDescription: function(/*string*/ id){
				var node = this.getNode(id);
				return node.explanation || node.description;
			},
			setName: function(/*string*/ id, /*string*/ name){
				this.getNode(id).variable = name.trim();
			},
			getSchema: function(/*string*/ id){
				return this.getNode(id).schema;
			},
			setSchema: function(/*string*/ id, /*string*/ schema){
				this.getNode(id).schema = schema;
			},
			setEntities: function(/*string*/ id, /*string*/ entity){
				this.getNode(id).entity = entity;
			},
			setVariable: function(/*string*/ id, /*string*/ name){
				this.getNode(id).variable = name.trim();
			},
			setDescription: function(/*string*/ id, /*string*/ description){
				// keeping the idea that description is what we will call this in our code.
				description = description.trim();
				var node = this.getNode(id);
				if(node.type == "quantity")
					node.description = description;
				else
					node.explanation = description;
			},
			setExplanation: function(/*string*/ id, /*string*/ content){
				this.getNode(id).explanation = content;
			},
			setValue: function(/*string*/ id, /*number*/ value){
				this.getNode(id).value = value;
			},
			setColor: function(/*string*/ id, /*string*/ color){
				this.getNode(id).color = color;
			},
			getNodeIDByName: function(/*string*/ name){
				// Summary: returns the id of a node matching the authored name from the
				//          authored or extra nodes.  If none is found, return null.
				var id;
				var regEx = new RegExp('^'+name+'$', 'i');
				var gotIt = array.some(this.getNodes(), function(node){
					console.log("node is", node);
					id = node.ID;
					return regEx.test(node.variable);
				});
				return gotIt ? id : null;
			},
			updatePositionXY: function(/*string */ id){
				// Summary : - Updates the position explicitly for the next node on UI.
				// 			 - Used to position the initial/prior node of dynamic node so that
				// 			   it does not overlap with the other existing nodes
				console.log(obj);
				obj._updateNextXYPosition();
				var _position = {
					x: obj.x,
					y: obj.y
				};
				this.setPosition(id, 1, _position);
			},
			getTime: function(){
				return obj.model.time;
			},
			isVariableTypePresent: function(type){
				var nodes = this.getNodes();
				var length = nodes.length;
				for(var node in nodes){
					if(node.variableType && node.variableType == type)
						return true;
				}

				return false;
			},
			isStudentMode: function(){
				return obj.isStudentMode();
			},
			getDescriptions: function(){
				// Summary: returns an array of all descriptions with
				// name (label) and any associated node id (value).
				// Note that the description may be empty.
				// TODO:  The list should be sorted.
				return array.map(this.getNodes(), function(node){

					var desc = node.description !== undefined ? node.description : node.explanation;
					return {label: desc, value: node.ID} ;
				});
			},
			getDescriptionsSortedByName: function(){
				var descriptions = obj.active.getDescriptions();
				var descNameMap = array.map(descriptions, function (desc) {
					var _name;
					if(this.isStudentMode()){
						var authoredID = obj.student.getAuthoredID(desc.value);
						_name = obj.authored.getName(authoredID);
					}
					else{
						_name = obj.authored.getName(desc.value);
					}
					if(_name){
						return {name: _name, description: desc.label, id: desc.value};
					}
				}, this);
				// To remove undefined values
				descNameMap= descNameMap.filter(function(e){
					return e;
				})
				descNameMap.sort(function (obj1, obj2) {
					if(obj1.name && obj2.name)
						return obj1.name.toLowerCase().localeCompare(obj2.name.toLowerCase());
				}, this);
				return descNameMap;
			},
			getTotalSchemaCount: function(){
				var schemaCount = 0;
				array.forEach(this.getNodes(), function(node){
					if(node && node.type === "equation" && node.schema){
						schemaCount++;
					}
				}, this);
				return schemaCount;
			},
			getGivenSchemaCount: function(schema){
				var schemaCount = 0;
				array.forEach(this.getNodes(), function(node){
					if(node && node.type === "equation" && node.schema && node.schema === schema){
						schemaCount++;
					}
				}, this);
				return schemaCount;
			},
			getAllVariables: function(){
				// returns a list of all variables in the model
				var varList = new Array();
				array.forEach(this.getNodes(), function(node){
					if(node && node.type == "quantity")
						varList.push({id: node.ID, name: node.variable});
				});
				return varList;
			},
			setAttemptCount: function(/*string*/ id, /*string*/ part, /*string*/ count){
				this.getNode(id).attemptCount[part] = count;
			},
			getAttemptCount: function(/*string*/ id, /*string*/ part, /*boolean*/ ignoreExecution){
					var node = this.getNode(id);
					return node && node.attemptCount[part]? node.attemptCount[part]:0;
			},
			getAllSchemas: function(){
				var schemaList = [];
				array.forEach(this.getNodes(), function(node){
					if(node && node.type == "equation")
						schemaList.push(node.schema);
				});
				return schemaList;
			},
			getAllDescriptions: function(){
				var descList = [];
				array.forEach(this.getNodes(), function(node){
					if(node && node.type == "quantity")
						descList.push(node.description);
				});
				return descList;
			},

		};

		obj.authored = lang.mixin({
			addNode: function(options){
				obj._updateNextXYPosition();
				var newNode = lang.mixin({
					ID: "id" + obj._ID++,
					genus: "required",
					variableType: "unknown",
					root: false,
					links: [],
					attemptCount: {
						description: 0,
						value: 0,
						equation: 0,
						units: 0,
						assistanceScore: 0
					},
					status: {},
					position: [{
						x: obj.x,
						y: obj.y
					}]
				}, options || {});
				obj.model.authorModelNodes.push(newNode);
				console.log("node added", newNode.ID, newNode.type);
				return newNode.ID;
			},
			
			getNodes: function(){
				return obj.model.authorModelNodes;
			},
			getNodeIDByName: function(/*string*/ name){
				// Summary: returns the id of a node matching the authored name from the
				//          authored or extra nodes.  If none is found, return null.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.variable === name;
				});
				return gotIt ? id : null;
			},
			getEquationBySchemaEntity: function(schema, entity){
				//Summary: returns the equation author has given to the node based on schema and entity which is unique combination
				var eqnDet = [];
				var gotIt = array.some(this.getNodes(), function(node){
					if(node.type === "equation" && node.schema === schema){
						eqnDet["equation"] = node.equation;
						eqnDet["id"] = node.ID;
						//there could be multiple entities
						var entityList = node.entity.split(';');
						for(var i=0; i<entityList.length; i++){
							if(entityList[i] == entity)
								return true;
						}
					}
					
				});
				return gotIt ? eqnDet : null;
			},
			getNodeIDByDescription: function(/*string*/ description){
				// Summary: returns the id of a node matching the authored description from the
				//          authored or extra nodes.  If none is found, return null.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.description === description;
				});
				return gotIt ? id : null;
			},
			getNodeIDByExplanation: function(/*string*/ explanation){
				// Summary: returns the id of a node matching the authored description from the
				//          authored or extra nodes.  If none is found, return null.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.explanation === explanation;
				});
				return gotIt ? id : null;
			},
			/**
			* stub for the status function in student mode
			* check for null in the calling code as this is being called in author mode where
			* node status is just completeness and that is shown from border and icons are
			* to be show ~ Sachin Grover
			**/
			getNodeStatus: function(){
				return null;
			},
			/*
			* incorporating the new change to description.
			* strict assumption is that a node either has an explanation
			* or a description.
			* Explanation - describes an equation.
			* Description - describes a quantity.
			*/
			getDescription: function(/*string*/ id){
				var node = this.getNode(id);
				return node.explanation || node.description;
			},
			getAuthoredID: function(/*string*/ id){
				return id;
			},
			getParent: function(/*string*/ id){
				return this.getNode(id).parentNode;
			},
			getDynamic: function(/*string*/ id){
				return this.getNode(id).dynamic;
			},
			getAuthorStatus: function(/*string*/ id, /*string*/ part){
				return this.getNode(id).authorStatus? this.getNode(id).authorStatus[part] : undefined ;
			},
			isRoot: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.root;
			},
			getEntities: function(/*string*/ id){
				return this.getNode(id).entity;
			},
			setParent: function(/*string*/ id, /*bool*/ parent){
				this.getNode(id).parentNode = parent;
			},
			setGenus: function(/*string*/ id, /*string*/ genus){
				this.getNode(id).genus = genus;
			},
			setUnits: function(/*string*/ id, /*string*/ units){
				this.getNode(id).units = units;
			},
			setEquation: function(/*string*/ id, /*string | object*/ equation){
				this.getNode(id).equation = equation;
			},
			setRoot: function(/*string*/ id, /*bool*/ isRoot){
				this.getNode(id).root = isRoot;
			},
			/**
			* for now this function has been updated to handle new functionality
			* this will set a node to be an accumulator that is the variableType to dynamic
			* with time we want to remove this function completely
			*/
			setAccumulator: function(/*string*/ id, /*bool*/ isAccumulator){
				console.warn("DEPRECATED - This function is not used anymore. Use setVariableType instead!");
				this.setVariableType(id, "dynamic");

			},
			setExpression: function(/*string*/ id, /*string*/ expression){
				this.getNode(id).expression = expression;
			},
			isComplete: function(/*string*/ id){
				var node = this.getNode(id);
				// if units were not entered even then it would show node complete
				var unitsOptional = true;
				var returnFlag = '';
				var nameEntered = node.type && node.type == "equation" || node.variable;
				// as seen in Dragoon.
				// variableType and value combined defines node completion
				// node is complete in following cases
				// 1. variableType Unknown and no value 
				// 2. variableType dynamic and value is valid 
				// 3. variableType parameter and value is valid
				var valueEntered = node.type && node.type == "equation" || (node.variableType == "dynamic" && node.value) 
				|| (node.value && node.variableType == "unknown") ||
				(node.value && node.variableType == "parameter") ;
				
				var equationEntered = node.type && node.type == "quantity" || node.equation;
				if(node.genus == "required" || node.genus == "allowed"){
					returnFlag = nameEntered && (node.description || node.explanation) &&
						node.type && ( node.variableType == "unknown" || valueEntered || typeof valueEntered === "number" ) &&
						(unitsOptional || nodes.units) && equationEntered;
				} else {
					// if genus is irrelevant
					returnFlag = nameEntered && (node.description || node.explanation);
				}
				if(returnFlag)
					return true;
				else
					return false;
			},
			setAuthorStatus: function(/*string*/ id, /*string*/ part, /*string*/ status){
				// Summary: function to set the status of node editor in author mode.
				if(!this.getNode(id).authorStatus){
					//backward compatibility
					this.getNode(id).authorStatus = {};
				}
				this.getNode(id).authorStatus[part] = status;
			},
			getStatus: function(/*string*/ id, /*string*/ part, /* boolean */ ignoreExecution){
				if(ignoreExecution || part != "executionValue")
					return this.getNode(id).status[part];
				else{
					return this.getNode(id).status[part]?
					this.getNode(id).status[part][obj.student.getIteration()]:undefined;
				}
			},
			setStatus: function(/*string*/ id, /*string*/ part, /*string*/ status){
				// Summary: tracks student progress (correct, incorrect) on a given node;
				if(part != "executionValue")
					this.getNode(id).status[part] = status;
				else{
					var node = this.getNode(id)
					authoredNodes = obj.authoredNodes;;
					if(!node.status.hasOwnProperty(part) || node.status[part] == undefined){
						node.status[part] = [];
					}
					node.status[part][obj.student.getIteration()] = status;
				}
			},
			isNodeRequired: function(id){
				var givenNode = this.getNode(id);
				if(givenNode && (!givenNode.genus || givenNode.genus == "" || givenNode.genus == "required")){
					return true;
				}
				return false;
			},
			isNodeAllowed: function(id){
				var givenNode = this.getNode(id);
				return (givenNode && givenNode.genus == "allowed");
			},
			isNodeIrrelevant: function(id){
				var givenNode = this.getNode(id);
				return (givenNode && givenNode.genus == "irrelevant");
			},
			getRequiredNodeCount: function(){
				var nodes = this.getNodes();
				var count = 0;
				array.forEach(nodes, function(node){
					if(node.genus == "required")
						count++;
				});
				return count;
			},
			getRequiredNodes: function(){
				var nodes = this.getNodes();
				var arr = [];
				array.forEach(nodes, function(node){
					if(node.genus == "required" || node.genus == "allowed")
						arr.push(node);
				});
				return arr;
			},
			hasSchema: function(schema){
				var found = array.some(this.getNodes(), function(node){
					if(node && node.type === "equation" && node.schema){
						return node.schema === schema;
					}
				});
				return found;
			},
			isStudentEntityValid: function(schema, entity){
				var valid = array.some(this.getNodes(), function(node){
					if(node && node.type === "equation" && node.schema && node.entity){
						if(node.schema === schema){
							var entityAr = node.entity.split(";");
							for(var i=0; i<entityAr.length; i++){
								if(entity === entityAr[i])
									return true;
							}
						}
					}
				});
				return valid;
			},
			getMultipleEntityNames: function(schema, entity){
				var multipleEntityList = [];
				var valid = array.some(this.getNodes(), function(node){
				if(node && node.type === "equation" && node.schema && node.entity){
					if(node.schema === schema){
						var entityAr = node.entity.split(";");
						for(var i=0; i<entityAr.length; i++){
							if(entity === entityAr[i]){
								multipleEntityList = entityAr;
								return true;
							}
						}
					}
				}
				});
				return multipleEntityList;
			},
			getAllEntitiesFor: function(schema){
				var entityList = new Array();
				array.forEach(this.getNodes(), function(node){
					if(node.schema === schema){
						var entityAr = node.entity ? node.entity.split(";") : null;
						if(entityAr){
							for(var i=0; i<entityAr.length; i++){
								var currentEntity = entityAr[i].trim();
								if(array.indexOf(entityList, currentEntity) == -1)
									entityList.push(currentEntity);
								}
						}						
					}

				}, this);
				return entityList;
			},
		}, both);

		obj.student = lang.mixin({
			addNode: function(options){
				obj._updateNextXYPosition();
				var newNode = lang.mixin({
					ID: "id" + obj._ID++,
					links: [],
					position: [{
						x: obj.x,
						y: obj.y
					}],
					attemptCount: {
						schema: 0,
						entity: 0,
						variables: 0,
					},
					status: {}
				}, options || {});
				obj.model.studentModelNodes.push(newNode);

				return newNode.ID;
			},
			getNodes: function(){
				return obj.model.studentModelNodes;
			},
			getNodeIDFor: function(authoredID){
				// Summary: returns the id of a student node having a matching authoredID;
				//			return null if no match is found.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.authoredID == authoredID;
				});
				return gotIt ? id : null;
			},
			/**
			* this gives the status to be used for showing icons feedback in student mode.
			* @param -	id - node id for which status is to be checked
			* @result -	nodeStatus - status of the node
			*			possible values - perfect - completed correctly in first attempt
			*			                  correct - completed correctly but not perfect
			*			                  incorrect - complete or incomplete node with atleast one incorrect answer
			*			                  demo - complete or incomplete node with atleast one demo answer
			*			                  null - node status value in the author mode
			**/
			getNodeStatus: function(id){
				var nodeStatus = this.getCorrectness(id);
				var score = this.getAssistanceScore(id);
				var completeness = this.isComplete(id);
				console.log("score complete status ", id, score, completeness, nodeStatus)
				if(nodeStatus === "correct" && score === 0 && completeness)
					nodeStatus = "perfect";
				return nodeStatus;
			},
			setStatus: function(/*string*/ id, /*string*/ control, /*object*/ options){
				//Summary: Update status for a particular control.
				//		   options may have attributes "status" and "disabled".
				var attributes = this.getNode(id).status[control];
				// When undefined, status[control] needs to be set explicitly.
				this.getNode(id).status[control] = lang.mixin(attributes, options);
				return attributes;
			},

			getAuthoredID: function(id){
				// Summary: Return any matched given model id for student node.
				console.log("input id", id);
				id = this.getID(id);
				var node = this.getNode(id);
				console.log("node", node, id)
				return node && node.authoredID;
			},
			getAuthoredIDForName: function(variable){
				return obj.authored.getNodeIDByName(variable);
			},
			getInputs: function(/*string*/ id){
				// Summary: return an array containing the input ids for a node.
				var ret = this.getNode(id);
				return ret && ret.inputs;
			},
			deleteNode: function(/*string*/ id){
				var index;
				var nodes = this.getNodes();
				for(var i = 0; i < nodes.length; i++){
					var found = false;
					if(nodes[i].ID === id)
						index = i;
					array.forEach(nodes[i].inputs, function(input){
						if(input.ID === id){
							found = true;
							return;
						}
					});
					if(found){
						nodes[i].inputs = [];
						nodes[i].equation = "";
						nodes[i].status.equation = {
							"disabled": false
						};
					}
				}
				nodes.splice(index, 1);
			},
			setAuthoredID: function(/*string*/ id, /*string*/ authoredID){
				id = this.getID(id);
				//The below piece of code handles when authoredID is not present which I don't find relevance in current usage, apart from that if authoredID does not exist or is already corresponding to another node, for the current node it has to be null/empty 
				//Because, alien nodes can be generated in current topomath version because of student errors which is an important part of slot feedback
				//Will remove the code below after review  
				/* 
				if(!authoredID){
					var node = this.getNode(id);
					var aNodes = obj.authored.getNodes();
					var l = aNodes.length;
					for(var i = 0; i < l; i++){
						var aNode = aNodes[i];
						if((aNode.variable && aNode.variable === node.variable) ||
							(aNode.description && aNode.description === node.description) ||
							(aNode.explanation && aNode.explanation === node.explanation)){
							authoredID = aNode.ID;
							break;
						}
					}
				} */
				this.getNode(id).authoredID = authoredID;
			},
			setSlotStatus: function(id, slotId, status){
				this.getNode(id).status["slot"+slotId] = status;
			},
			getSlotStatus: function(id, slotId){
				return this.getNode(id).status["slot"+slotId];
			},
			isAuthoredIDNotAssigned: function(authoredID){
				//remove authoredID if it is already set for anything else
				var sNodes = obj.student.getNodes();
				var sl = sNodes.length;
				var isAssigned = false;
				for(var i = 0; i < sl ; i++){
					var sNode = sNodes[i];
					if(sNode.authoredID == authoredID){
						isAssigned = true;
						break;
					}
				}
				return !isAssigned;
			},
			setUnits: function(/*string*/ id, /*string*/ units){
				this.getNode(id).units = units;
			},
			setInputs: function(/*array*/ inputs, /*string*/ inputInto){
				// Silently filter out any inputs that are not defined.
				// inputs is an array of objects.
				var node = this.getNode(inputInto);
				if(node){
					node.inputs = array.filter(inputs, function(input){
						return this.isNode(input.ID);
					}, this);
				}
			},
			setEquation: function(/*string*/ id, /*string | object*/ equation){
				this.getNode(id).equation = equation;
			},
			setValue: function(/*string*/ id, /*float*/ value){
				this.getNode(id).value = value;
			},
			getStatusDirectives: function(/*string*/ id){
				//Summary:	Return a list of directives (like PM does).
				//			to set up node editor.
				var status = this.getNode(id).status;
				var directives = [];
				for(var control in status){
					for(var attribute in status[control]){
						directives.push({
							id: control,
							attribute: attribute,
							value: status[control][attribute]
						});
					}
				}
				return directives;
			},
			setCanDelete: function(id, canDel){
				this.getNode(id).canDel = canDel;
			},
			setStatus: function(/*string*/ id, /*string*/ control, /*object*/ options){
				//Summary: Update status for a particular control.
				//		   options may have attributes "status" and "disabled".
				var attributes = this.getNode(id).status[control];
				// When undefined, status[control] needs to be set explicitly.
				this.getNode(id).status[control] = lang.mixin(attributes, options);
				return attributes;
			},
			getStatus: function(/*string*/ id, /*string*/ part, /* boolean */ ignoreExecution){
				if(ignoreExecution || part != "executionValue")
					return this.getNode(id).status[part];
				else{
					return this.getNode(id).status[part]?
					this.getNode(id).status[part][obj.student.getIteration()]:undefined;
				}
			},
			isComplete: function(/*String*/ id){
				if(!id) return false;
				var node = this.getNode(id);
				var returnFlag = '';
				var hasUnits = node.authoredID && obj.authored.getUnits(node.authoredID);
				var nameEntered = node.type && node.type == "equation" || node.variable;
				// as seen in Dragoon.
				// variableType and value combined defines node completion
				// node is complete in following cases
				// 1. variableType Unknown and no value 
				// 2. variableType dynamic and value is valid 
				// 3. variableType parameter and value is valid
				
				var valueEntered = node.type && node.type == "equation" || (node.variableType == "dynamic" && node.value) 
				|| (node.value && node.variableType == "unknown") ||
				(node.value && node.variableType == "parameter") ;
				
				var equationEntered = node.type && node.type == "quantity" || node.equation;

				var schemaEntered = node.type && node.type == "quantity" || node.schema;
				var entityEntered = node.type && node.type == "quantity" || node.entity;

				if(this.isNodeRequired(id) || this.isNodeAllowed(id)){
					returnFlag = nameEntered && (node.description || node.explanation) &&
						node.type && ( node.variableType == "unknown" || valueEntered || typeof valueEntered === "number" ) &&
						(!hasUnits || node.units) && equationEntered && schemaEntered && entityEntered;
				} else {
					// if genus is irrelevant
					returnFlag = nameEntered && (node.description || node.explanation);
				}
				if(returnFlag)
					return true;
				else
					return false;
			},
			getSolutionPoint: function(){
				point = {};
				values = obj.model.solution.values;
				variables = obj.model.solution.variables;
				numberOfVariables = variables.length;
				if(numberOfVariables > 0){
					timeSteps = values[variables[0]];
					var index = Math.floor(Math.random() * (timeSteps.length - 2)) + 1;
					array.forEach(variables, function(id){
						if(obj.authored.getType(id) == "quantity"){
							point[id] = values[id][index];
							var nodeType = obj.authored.getVariableType(id);
							var studentNodeID = this.getNodeIDFor(id);
							if(studentNodeID) point[studentNodeID] = values[id][index];
							if(nodeType && nodeType == "dynamic"){
								point[id + this.getInitialNodeIDString()] = values[id][index - 1];
								if(studentNodeID) point[studentNodeID + this.getInitialNodeIDString()] = values[id][index - 1];
							}
						}
					}, this);
				}

				var nodes = obj.authored.getNodes();
				array.forEach(nodes, function(node){
					if(node.variableType == "parameter"){
						point[node.ID] = node.value;
						studentNodeID = this.getNodeIDFor(node.ID);
						if(studentNodeID) point[studentNodeID] = node.value;
					}
				}, this);

				return point;
			},
			getRandomPoint: function(){
				point = {};
				var value;
				var nodes = obj.authored.getNodes();
				array.forEach(nodes, function(node){
					if(node.type == "quantity"){
						value = Math.random();
						point[node.ID] = value;
						var studentNodeID = this.getNodeIDFor(node.ID);
						if(studentNodeID) point[studentNodeID] = value;
						if(node.variableType == "dynamic"){
							value = Math.random();
							point[node.ID + this.getInitialNodeIDString()] = value;
							if(studentNodeID) point[studentNodeID + this.getInitialNodeIDString()] = value;
						}
					}
				}, this);

				return point;
			},
			isSolutionStatic: function(){
				return obj.model.solution.isStatic;
			},
			isSolutionAvailable: function(){
				return obj.model.solution.variables.length > 0;
			},

			isNodeRequired: function(id){
				var authoredID = this.getAuthoredID(id);
				return !authoredID || obj.authored.isNodeRequired(authoredID);
			},
			isNodeAllowed: function(id){
				var authoredID = this.getAuthoredID(id);
				return !authoredID || obj.authored.isNodeAllowed(authoredID);
			},
			isNodeIrrelevant: function(id){
				var authoredID = this.getAuthoredID(id);
				// changing the logic of authoredID because a just created node is returned
				// irrelevant
				return authoredID && obj.authored.isNodeIrrelevant(authoredID);
			},
			getCorrectAnswer : function(/*string*/ studentID, /*string*/ part){
				var id = this.getAuthoredID(studentID);
				var node = obj.authored.getNode(id);
				return node[part];
			},
			getLegitSchema: function(){
				//In case part is schema, the authoredID might not have been set for the current student ID
				var studSchemas = obj.student.getAllSchemas();
				var authSchemas = obj.authored.getAllSchemas();
				var remSchemas = obj.arrDifference(authSchemas,studSchemas);
				console.log("schemas in play", studSchemas, authSchemas, remSchemas);
				return remSchemas[0];
			},
			getLegitEntity: function(/*String*/ schema){
				var authEntities = obj.authored.getAllEntitiesFor(schema);
				var studEntities = obj.student.getAllEntitiesFor(schema);
				var remEntities = obj.arrDifference(authEntities, studEntities);
				console.log("entities in play", authEntities, studEntities, remEntities);
				return remEntities[0];
			},
			incrementAssistanceScore: function(/*string*/ id){
				// Summary: Incremements a score of the amount of errors/hints that
				//		a student receives, based on suggestions by Robert Hausmann;
				//
				// Note: This is used by the PM for all node parts except the description
				var authoredID = this.getAuthoredID(id);
				var node = obj.authored.getNode(authoredID);
				node.attemptCount.assistanceScore = (node.attemptCount.assistanceScore || 0) + 1;
			},
			getAssistanceScore: function(/*string*/ id){
				// Summary: Returns a score based on the amount of errors/hints that
				//		a student receives, based on suggestions by Robert Hausmann;
				//		a score of 0 means that a student did not have any errors;
				var authoredID = this.getAuthoredID(id);
				return !authoredID || obj.authored.getAttemptCount(authoredID, "assistanceScore");
			},
			getCorrectness: function(/*string*/ studentID){
				var node = this.getNode(studentID);
				console.log("student id is", studentID, node);				
				var rank = {
					"incorrect": 3,
					"partial": 2.5,
					"demo": 2,
					"correct": 1,
					"": 0
				};
				var bestStatus = "";
				var update = function(attr, sattr){
					// node.status always exists
					var nsa = node.status[attr];
					console.log("nsa is", nsa)
					if(node[sattr || attr] !== null && nsa && nsa.status &&
						rank[nsa.status] > rank[bestStatus]){
						bestStatus = nsa.status;
					}
				};
				var type = this.getType(studentID);
				update("description", "authoredID");
				if(type === "quantity"){
					//update("variable");
					update("variableType");
					update("value");
					update("units");
				}else if(type === "equation"){
					update("schemas");
					update("entity");
					update("equation");
				}
				if(bestStatus == "partial"){
					bestStatus = "incorrect";
				}
				return bestStatus;
			},
			getRequiredNodeCount: function(){
				var nodes = this.getNodes();
				var count = 0;
				array.forEach(nodes, function(node){
					if(obj.authored.getGenus(node.authoredID) == "required")
						count++;
				});
			},
			getRequiredNodes: function(){
				var nodes = this.getNodes();
				var arr = [];
				array.forEach(nodes, function(node){
					var genus = obj.authored.getGenus(node.authoredID);
					if(genus == "required" || genus == "allowed")
						arr.push(node);
				});
				return arr;
			},
			getAllEntitiesFor: function(schema){
				var entityList = new Array();
				array.forEach(this.getNodes(), function(node){
					if(node.schema === schema){
						var mulEntities = obj.authored.getMultipleEntityNames(schema,node.entity);
						entityList = entityList.concat(mulEntities);					
					}

				}, this);
				return entityList;
			},
			isDuplicateSchemaInstance: function(schema, entity){
				//checking for duplicate schema instance also involves checking multiple entity values
				var checkList = obj.authored.getMultipleEntityNames(schema, entity);
				console.log("check list", checkList);
				var nodes = this.getNodes();
				var isDup = array.some(nodes, function(node){
					if(node && node.type === "equation" && node.schema && node.entity && node.schema === schema){
						return checkList.includes(node.entity);
					}
				});
				return isDup;
			},
			getEntity: function(/*string*/ id){
				return this.getNode(id).entity;
			},

		}, both);

		obj.constructor.apply(obj, arguments);
		return obj;
	};
});
