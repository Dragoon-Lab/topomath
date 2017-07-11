define([
	"dojo/_base/array", "dojo/_base/lang"
], function(array, lang){
	return function(){
		var obj = {
			constructor: function(/* string */ mode, /* string */ name){
				this.x = this.beginX;
				this.y = this.beginY;
				this.model = {
					taskName: name,
					authorModelNodes: [],
					studentModelNodes: []
				};
				obj.active = (mode == "AUTHOR") ? obj.authored : obj.student;
			},
			_ID: 1,
			beginX: 450,
			beginY: 100,
			nodeWidth: 250,
			nodeHeight: 100,
			initialNodeIDString: "_initial",
			initialNodeDisplayString: "prior",
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
					var x = position.x;
					var y = position.y;
					return (this.x > x - this.nodeWidth && this.x < x + this.nodeWidth &&
						this.y > y - this.nodeHeight && this.y < y + this.nodeHeight);
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
			
		};

		var both = {
			/**
			* wrapper to get ID given all types of node ID with or without the initial String
			* @params - id - node ID may or may not have initial in its ID string
			*			id - returns the id with removed string
			*/
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
				console.log("node with id",node);
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
			updateLinks: function(/*string*/ id){
				// Summary : Update links when variableType is set to some other value
				// 			 after initially assigning to dynamic.
				var nodes = this.getNodes();
				var removeId = id + this.getInitialNodeIDString();
				array.forEach(nodes, function(node){
					var links = node.links;	
					if(links && links.length > 0){
						var index = links.findIndex(function(link){
							console.log(link.ID);
							return link.ID === removeId;
						}, this);
						links.splice(index,1);
					}
				}, this);
				
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
			getDescription: function(/*string*/ id){
				var node = this.getNode(id);
				return node.explanation || node.description;
			},
			setName: function(/*string*/ id, /*string*/ name){
				this.getNode(id).variable = name.trim();
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
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.variable === name;
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
			/*
			* incorporating the new change to description.
			* strict assumption is that a node either has an explanation
			* or a description.
			* Explanation - describes an equation.
			* Description - describes a quantity.
			*/
			getAuthorID: function(/*string*/ id){
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
					var node = this.getNode(id);
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
			getAttemptCount: function(/*string*/ id, /*string*/ part, /*boolean*/ ignoreExecution){
					var node = this.getNode(id);
					return node.attemptCount[part]? node.attemptCount[part]:0;
			},
			setAttemptCount: function(/*string*/ id, /*string*/ part, /*string*/ count){
				this.getNode(id).attemptCount[part] = count;
			}
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
					status: {}
				}, options || {});
				obj.model.studentModelNodes.push(newNode);

				return newNode.ID;
			},
			getNodes: function(){
				return obj.model.studentModelNodes;
			},
			getNodeIDFor: function(givenID){
				// Summary: returns the id of a student node having a matching authoredID;
				//			return null if no match is found.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.authoredID == givenID;
				});
				return gotIt ? id : null;
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
				var node = this.getNode(id);
				return node && node.authoredID;
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
				this.getNode(id).authoredID = authoredID;
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
			setStatus: function(/*string*/ id, /*string*/ control, /*object*/ options){
				//Summary: Update status for a particular control.
				//		   options may have attributes "status" and "disabled".
				var attributes = this.getNode(id).status[control];
				// When undefined, status[control] needs to be set explicitly.
				this.getNode(id).status[control] = lang.mixin(attributes, options);
				return attributes;
			},
			isComplete: function(/*String*/ id){
				var node = this.getNode(id);
				var returnFlag = '';
				var unitsOptional = true;
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
				if(this.isNodeRequired(id) || this.isNodeAllowed(id)){
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
			isNodeRequired: function(id){
				var authoredID = this.getAuthoredID(id);
				return authoredID || obj.authored.isNodeRequired(authoredID);
			},
			isNodeAllowed: function(id){
				var authoredID = this.getAuthoredID(id);
				return authoredID || obj.authored.isNodeAllowed(authoredID);
			},
			getCorrectAnswer : function(/*string*/ studentID, /*string*/ part){
				var id = this.getAuthoredID(studentID);
				var node = obj.authored.getNode(id);
				return node[part];
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
				return obj.authored.getAttemptCount(authoredID, "assistanceScore");
			},
			getCorrectness: function(/*string*/ studentID){
				var node = this.getNode(studentID);
				var rank = {
					"incorrect": 3,
					"demo": 2,
					"correct": 1,
					"": 0
				};
				var bestStatus = "";
				var update = function(attr, sattr){
					// node.status always exists
					var nsa = node.status[attr];
					if(node[sattr || attr] !== null && nsa && nsa.status &&
						rank[nsa.status] > rank[bestStatus]){
						bestStatus = nsa.status;
					}
				};
				var type = this.getType(studentID);
				if(type === "quantity"){
					update("description", "authoredID");
					update("variable");
					update("variableType");
					update("value");
					update("units");
				}else if(type === "equation"){
					update("description", "authoredID");
					update("equation");
				}
				return bestStatus;
			}

		}, both);

		obj.constructor.apply(obj, arguments);
		return obj;
	};
});
