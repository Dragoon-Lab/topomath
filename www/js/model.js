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
						nodeHeight: this.nodeHeight,
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
						this.y > y - this.nodeHeight && this.y < y + this.nodeHeight)
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

		};

		var both = {
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
			isAccumulator: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.accumulator;
			},
			deleteNode: function(/*string*/ id){
				var nodes = this.getNodes();
				var l = nodes.length;
				var index = -1;
				var updateNodes = [];
				for(var i = 0; i < l; i++){
					var found = false;
					if(nodes[i].ID === id){
						index = i;
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
			setPosition: function(/*string*/ id, /*integer*/ index, /*object*/ positionObject){
				// Summary: sets the "X" and "Y" values of a node's position
				this.getNode(id).position[index] = positionObject;
			},
			getInitialNodeIDString: function(){
				return obj.initialNodeIDString;
			},
			getInitialNodeDisplayString: function(){
				return obj.initialNodeDisplayString;
			}
		};

		obj.authored = lang.mixin({
			addNode: function(options){
				obj._updateNextXYPosition();
				var newNode = lang.mixin({
					ID: "id" + obj._ID++,
					genus: "required",
					accumulator: false,
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
					}],
				}, options || {});
				obj.model.authorModelNodes.push(newNode);
				console.log("node added", newNode.ID, newNode.type);
				return newNode.ID;
			},
			getNodes: function(){
				return obj.model.authorModelNodes;
			},
			getName: function(/*string*/ id){
				// Summary: returns the name of a node matching the student model.
				//      If no match is found, then return null.
				var node = this.getNode(id);
				return node && node.variable;
			},
			getNodeIDByName: function(/*string*/ name){
				// Summary: returns the id of a node matching the authored name from the
				//          authored or extra nodes.  If none is found, return null.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.name === name;
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
					return {label: node.description, value: node.ID};
				});
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
			getAuthorID: function(/*string*/ id){
				return id;
			},
			getParent: function(/*string*/ id){
				return this.getNode(id).parentNode;
			},
			getDynamic: function(/*string*/ id){
				return this.getNode(id).dynamic;
			},
			isRoot: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.root;
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
			setParent: function(/*string*/ id, /*bool*/ parent){
				this.getNode(id).parentNode = parent;
			},
			setGenus: function(/*string*/ id, /*string*/ genus){
				this.getNode(id).genus = genus;
			},
			setUnits: function(/*string*/ id, /*string*/ units){
				this.getNode(id).units = units;
			},
			setValue: function(/*string*/ id, /*float*/ value){
				this.getNode(id).value = value;
			},
			setEquation: function(/*string*/ id, /*string | object*/ equation){
				this.getNode(id).equation = equation;
			},
			setRoot: function(/*string*/ id, /*bool*/ isRoot){
				this.getNode(id).root = isRoot;
			},
			setAccumulator: function(/*string*/ id, /*bool*/ isAccumulator){
				this.getNode(id).accumulator = isAccumulator;
			},
			setColor: function(/*string*/ id, /*string*/ color){
				this.getNode(id).color = color;
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
				// TODO : logic for value is still incomplete
				// needs to incorporate values of function, accumulator and parameters
				// as seen in Dragoon.
				var valueEntered = node.type && node.type == "equation" || node.accumulator || node.value;
				var equationEntered = node.type && node.type == "quantity" || node.equation;
				if(node.genus == "required" || node.genus == "allowed"){
					returnFlag = nameEntered && (node.description || node.explanation) &&
						node.type && (valueEntered || typeof valueEntered === "number") &&
						(unitsOptional || nodes.units) && equationEntered;
				} else {
					// if genus is irrelevant
					returnFlag = nameEntered && (node.description || node.explanation);
				}
				if(returnFlag)
					return true;
				else
					return false;
			}
		}, both);

		obj.student = lang.mixin({
			addNode: function(options){
				obj.updateNextXYPosition();
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
				// Summary: returns the id of a student node having a matching descriptionID;
				//			return null if no match is found.
				var id;
				var gotIt = array.some(this.getNodes(), function(node){
					id = node.ID;
					return node.descriptionID == givenID;
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
		}, both);

		obj.constructor.apply(obj, arguments);
		return obj;
	};
});
