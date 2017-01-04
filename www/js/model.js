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
			nodeWidth: 200,
			nodeHeight: 100,
			initialNodeString: "initial",
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

					/*if(!node.position){
						obj._updateNextXYPosition();
						node.position = {
							x: obj.x,
							y: obj.y
						};
					}*/
				}, this);
			},
			getModelAsString: function(){
				// Summary: Returns a JSON object in string format
				//          Should only be used for debugging.
				return JSON.stringify(this.model, null, 4);
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
			getPosition: function(/*string*/ id){
				// Summary: return current position of the node.
				return this.getNode(id).position;
			},
			getValue: function(/* string */ id){
				var node = this.getNode(id);
				return node && node.value;
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
			setLinks: function(/*array*/ link, /*string*/ target){
				// Silently filter out any inputs that are not defined.
				// inputs is an array of objects.
				var targetID = target;
				if(target.indexOf("_initial") > 0)
					targetID = target.replace("_initial", "");
				var node = this.getNode(targetID);
				if(node){
					node.links = array.filter(links, function(link){
						var id = link.ID.indexOf("_initial") ? link.ID.replace("_initial", "") : link.ID;
						return this.isNode(id);
					}, this);
				}
			},
			setType: function(/*string*/ id, /*string*/ type){
				var ret = this.getNode(id);
				if(ret)
					ret.type = type;
			},
			setPosition: function(/*string*/ id, /*object*/ positionObject){
				// Summary: sets the "X" and "Y" values of a node's position
				this.getNode(id).position = positionObject;
			},
			getInitialNodeString: function(){
				return obj.initialNodeString;
			}
		};

		obj.authored = lang.mixin({
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
			getDescriptions: function(){
				// Summary: returns an array of all descriptions with
				// name (label) and any associated node id (value).
				// Note that the description may be empty.
				// TO DO:  The list should be sorted.
				return array.map(this.getNodes(), function(node){
					return {label: node.description, value: node.ID};
				});
			},
			getDescription: function(/*string*/ id){
				return this.getNode(id).description;
			},
			getAuthorID: function(/*string*/ id){
				return id;
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
				this.getNode(id).description = description.trim();
			},
			setExplanation: function(/*string*/ id, /*string*/ content){
				this.getNode(id).explanation = content;
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
			setInitial: function(/*string*/ id, /*float*/ initial){
				this.getNode(id).initial = initial;
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
			}
		}, both);

		obj.student = lang.mixin({
			getNodes: function(){
				return obj.model.studentModelNodes;
			}
		}, both);

		obj.constructor.apply(obj, arguments);
		return obj;
	};
});
