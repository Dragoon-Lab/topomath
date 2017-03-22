define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/dom-style",
	"dijit/Menu",
	"dijit/MenuItem",
	"./graph-objects",
	"jsPlumb/jsPlumb",
], function(declare, array, lang, attr, domConstruct, domClass, dom, domStyle, Menu, MenuItem, graphObjects){
	return declare(null, {
		_instance: null,
		_model: null,
		_colors:[
			"#00ffff", "#f0e68c", "#add8e6", "#e0ffff", "#90ee90", "#ffb6c1",
			"#ffffe0", "#00ff00", "#008000", "#f5f5dc", "#0000ff", "#a52a2a",
			"#ffd700", "#4b0082", "#800000", "#000080", "#808000", "#ffa500",
			"#c0c0c0", "#ffc0cb", "#ff0000", "#800080", "#ffff00", "#00008b",
			"#008b8b", "#f0ffff", "#006400", "#bdb76b", "#8b008b", "#556b2f",
			"#ff8c00", "#9932cc", "#8b0000", "#e9967a", "#9400d3", "#ff00ff"
		],
		_incompleteColor: "#d3d3d3",
		_borderColor: 39,
		_backgroundColor: 0,
		_counter: 0,
		_cache: {},
		domIDs: function(nodeID){
			return {
				'nodeDOM': nodeID+'Content',
				'initialNode': nodeID+'ContentInitial',
				'description': nodeID+'_description',
				'parentDOM': nodeID,
				'parentInitial': nodeID + this.initialNodeIDTag
			}
		},

		constructor: function(model){
			this._model = model;
			this.initialNodeIDTag = this._model.getInitialNodeIDString();
			this._borderColor = this._colors.length - 1;
			this.connectorUI = {
				endpoint: ["Dot", {radius: 2}],
				endpointStyle: {fill: "#5c96bc"}
			};
			var instance = jsPlumb.getInstance({
				Endpoint: ["Dot", {radius: 2}],
				HoverPaintStyle : {strokeStyle:"#1e8151", lineWidth:2 },
				Container:"statemachine-demo"
			});

			this._instance = instance;
			var vertices = [];
			var temp = [];
			vertices = array.map(model.getNodes(), function(node){
				temp = temp.concat(this.addNode(node));
				return temp;
			}, this);
			vertices = vertices[vertices.length - 1]; //hack for keeping it one dimension
			console.log(vertices);
			
			/*var makeVertexSource = this.makeVertexSource;
			instance.doWhileSuspended(function(){
				array.forEach(vertices, function(vertex){
					makeVertexSource(vertex, instance);
				}, this);
			});*/

			array.forEach(vertices, function(vertex){
				var id = attr.get(vertex, "id");
				var links = model.getLinks(id);
				//unlike Dragoon everyone does not have links.
				//only equation nodes have the links.
				if(links)
					this.setConnections(links, vertex);
			}, this);

			return instance;
		},

		addNode: function(/* object */ node){
			type = node.type || "circle";

			if(!node.ID){
				conole.error("addNode called with a node without ID");
				return;
			}

			console.log("Adding vertex to the canvas id = ", node.ID, " type = ", type);
			console.log("Position for the vertex : ",node.ID, " position: x ", node.position[0].x, " y: " + node.position[0].y);
			var properties = this.getNodeUIProperties(node);
			var htmlStrings = graphObjects.getNodeHTML(this._model, node.ID); 

			var vertices = [];
			array.forEach(htmlStrings, function(html, count){
				vertices[count] = this.createNodeDOM(node, html, count == 1);
			}, this);

			var color = this._model.getColor(node.ID);
			if(color){
				this.addNodeDescription(node.ID);
			}

			//add to cache
			this._cache[node.ID] = lang.clone(node);

			return vertices;
		},

		updateNode: function(/* object */ node){
			// all the classes that we need
			var domIDTags = this.domIDs(node.ID);
			// null checks
			if(!node.ID){
				console.error("update node called for an unknown node ID ", node.ID);
				return;
			}
			if(!this._cache[node.ID]){
				this.addNode(this._model.getNode(node.ID));
				return;
			}

			var cachedNode = this._cache[node.ID];
			// update variable name
			if(cachedNode.variable != node.variable){
				if(node.type && node.type == "quantity"){
					dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "variable", node.ID);
					// updating the corresponsing initial node
					if(node.value && node.accumulator && dom.byId(domIDTags['initialNode'])){
						dom.byId(domIDTags['initialNode']).innerHTML = graphObjects.getDomUIStrings(this._model, "value", node.ID);
					}
				}
				// updating the corresponding equations
				var _nodes = this._model.getLinksFromID(node.ID);
				array.forEach(_nodes, function(id){
					var tags = this.domIDs(id);
					dom.byId(tags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "equation", id);
				}, this);
				// updating the corresponsing initial node
			}
			// update description
			var cachedDescription = cachedNode.description || cachedNode.explanation;
			var description = node.description || node.explanation;
			if(cachedDescription != description || (cachedNode.variable != node.variable && description != "")){
				var description = graphObjects.getDomUIStrings(this._model, "description", node.ID);
				var descriptionDOM = dom.byId(domIDTags['description']);
				if(descriptionDOM)
					descriptionDOM.innerHTML = description;
				else if(!node.color){
					var ui = this.getNodeUIProperties(node);
					domStyle.set(domIDTags['parentDOM'], "backgroundColor", ui.backgroundColor);
					domStyle.set(domIDTags['parentDOM'], "borderColor", ui.borderColor);
					this.addNodeDescription(node.ID);
				}
			}
			//update value or update dynamic
			if(node.type && node.type == "quantity" && (cachedNode.value != node.value ||
				cachedNode.accumulator != node.accumulator)){
				if(node.accumulator){
					if(node.value){
						// here we need to update the initial value node as well.
						var initialNode = dom.byId(domIDTags['parentIntial']);
						if(initialNode){
							dom.byId(domIDTags['initialNode']).innerHTML = graphObjects.getDomUIStrings(this._model, "value", node.ID);
						} else {
							//this part of the code creates a new node with initial value when a node is added as dynamic
							//explicitly picking up the second value as that is the one to be added
							var initialNodeString = graphObjects.getNodeHTML(this._model, node.ID)[1];
							// TODO: the handler for accumulator/dynamic will ensure that a new position is created for the initial node.
							// draw-model does not and should not have access to that part of the node, hence it needs to be done by the handler
							this.createNodeDOM(node, initialNodeString, true);
						}
					} else if(!node.value || node.value == "") {
						// the case when the value of the node is removed
						// this should delete the initial node

					}
				} else
					dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "value", node.ID);
			} else if(node.type && node.type == "equation" && cachedNode.equation != node.equation){
				dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "equation", node.ID);
				// TODO : need to check how and where the connections are set
				
			}
			//update border
			var isComplete = this._model.isComplete(node.ID);
			var hasClass = domClass.contains(domIDTags['parentDOM'], "incomplete");
			if(hasClass && isComplete){
				domClass.remove(domIDTags['parentDOM'], "incomplete");
			} else if (!hasClass && !isComplete){
				domClass.add(domIDTags['parentDOM'], "incomplete");
			}

			//add to cache for next time
			this._cache[node.ID] = lang.clone(node);
		},
		/**
		* creates the dom structure for the node
		* @params:	nodeID - node ID to get position for the node
		*			innerHTML - string of the dom structure that is to be put
		*			isInitial - whether the DOM to be created is of initial node or not
		*/
		createNodeDOM: function(node, innerHTML, isInitial){
			//var node = this._model.getNode(nodeID);
			var x = node.position[0].x;
			var y = node.position[0].y;
			var properties = this.getNodeUIProperties(node);
			var idTag = node.ID;
			var classTag = node.type;
			if(isInitial){
				idTag += this._model.getInitialNodeIDString();
				if(node.position.length > 1){
					x = node.position[1].x;
					y = node.position[1].y;
				} else {
					x += 100;
					y += 100;
				}
			}
			if(!this._model.isComplete(node.ID))
				classTag += " incomplete";
			var nodeDOM = domConstruct.create("div", {
				id: idTag,
				"class": classTag,
				style: {
					left: x + 'px',
					top: y + 'px',
					backgroundColor: properties.backgroundColor,
					borderColor: properties.borderColor
				},
				innerHTML: innerHTML
			}, "statemachine-demo");

			this.makeDraggable(nodeDOM);

			// creating menu for each DOM element
			pMenu = new Menu({
				targetNodeIds: [idTag]
			});
			pMenu.addChild(new MenuItem({
				label: "Delete Node",
				onClick: lang.hitch(this, function(){
					this.deleteNode(node.ID)
				})
			}));

			return nodeDOM;
		},

		getNodeUIProperties: function(node){
			// node properties default case when type is circle
			var obj = {
				backgroundColor: "DarkGray",
				borderColor: "black"
			};
			var type = node.type;
			// border color or description color would only make sense if
			// 1) description for quantity node and explanation for equation node
			// 2) variable name for quantity node
			// so the default value is set to lightgrey
			var hasDescription = this._model.getDescription(node.ID) &&
					(type == "equation" || node.variable);
			if(!hasDescription){
				return {
					backgroundColor: this._incompleteColor,
					borderColor: "black"
				};
			}

			// now we need to check if there is color and
			// should the node be shown with color
			var color;
			if(hasDescription)
				if(node.color){
					color = node.color;
					if(type == "quantity")
						this._borderColor = this._colors.indexOf(node.color) - 1;
					else
						this._backgroundColor = this._colors.indexOf(node.color) + 1;
				} else {
					color = this.getNextColor(type && type == "equation");
				}

			if(type && type == "equation"){
				obj.backgroundColor = color;
				obj.borderColor = "black";
				this._model.setColor(node.ID, obj.backgroundColor);
			} else if (type && type == "quantity") {
				obj.backgroundColor = "white";
				obj.borderColor = color;
				this._model.setColor(node.ID, obj.borderColor);
			}

			return obj;
		},

		getNextColor: function(isBackground){
			var index = isBackground ? this._backgroundColor++ : this._borderColor--;
			if(isBackground && index >= this._colors.length-1){
				console.error("need more colors, last color returned");
				// resetting the counter
				this._backgroundColor = 0;
			} else if(!isBackground && index <= 0){
				console.error("need more colors, last color returned");
				// resetting the counter
				this._borderColor = this._colors.length - 1;
			}
			var color = this._colors[index];
			return color;
		},

		setConnection: function(/* string */ source, /* string */ destination){
			this._instance.connect(lang.mixin({source: source, target: destination}, this.connectorUI));
		},

		setConnections: function(/* array */  sources, /* string */ destination){
			var targetID = attr.get(destination, "id");

			array.forEach(sources, function(source){
				console.log(source.ID, " ", targetID);
				this.setConnection(source.ID, targetID);
			}, this);
		},

		makeDraggable: function(vertex){
			this._instance.draggable(vertex, {
				onMoveStart: lang.hitch(this, this.onMoveStart),
				onMove: lang.hitch(this, this.onMove),
				onMoveStop: lang.hitch(this, this.onMoveStop)
			});

			this.makeVertexSource(vertex);
		},

		onMoveStart: function(){
			this._counter = 0;
		},

		onMove: function(mover){
			this._counter++;
		},

		onMoveStop: function(){
			// to distinguish between move and click there is a counter increment.
			if(this._counter <= 5){
				console.log("arguments are ", arguments);
				this.onClickNoMove.apply(null, arguments);
			} else {
				this.onClickMoved.apply(null, arguments);
			}
		},

		onClickMoved: function(){
			// aspect.after handles and this is just a stub
			// attached in main.js
			console.log("on click move stub called");
		},

		onClickNoMove: function(){
			// aspect.after handles the stub
			// created to attach the node editor opening
			// attached in main.js
			console.log("on click stub called");
		},

		/*
		* converts a node to a source and target so that lines can be attached to
		* the boundary
		* pulled it out from the constructor to remove redundancy as this function
		* is also called in makeDraggable
		* @param - vertex - a node object which while drawing is called a vertex
		*/
		makeVertexSource: function(vertex, instance){
			var inst = instance || this._instance;
			inst.makeSource(vertex, {
				filter: ".ep",
				anchor: "Continuous",
				connector: ["StateMachine", {curviness: 0}],
				connectorStyle:{ strokeStyle:"#5c96bc", lineWidth:2, outlineColor:"transparent", outlineWidth:4 },
				maxConnections: 6,
				onMaxConnections: function(info, e){
					alert("Maximum connections (" + info.maxConnections + ") reached");
				},
			});

			inst.makeTarget(vertex, {
				dropOptions: {hoverClass: "dragHover"},
				anchor: "Continuous"
			});
		},

		addNodeDescription: function(ID){
			var type = this._model.getType(ID);
			var descriptionString = graphObjects.getNodeDescriptionHTML(this._model, ID);
			var domID = ID + "_description";
			if(type && descriptionString){
				var descHTML = dom.byId(domID);
				var parentDIV = type+"-description";
				var replaceTag = descHTML ? "replace" : "last";
				domConstruct.place(descriptionString, parentDIV, replaceTag);
				if(type == "equation")
					domStyle.set(domID, "background-color", this._model.getColor(ID));
				else
					domStyle.set(domID, "border-color", this._model.getColor(ID));
			}
		},

		deleteNode: function(/*string*/ nodeID){
			this.detachConnections(nodeID);
			// TODO log this event
			var type = this._model.getType(nodeID);
			if(type && type == "quantity" && this._model.isAccumulator(nodeID)
				&& this._model.getValue(nodeID)){
				var initialNodeID = nodeID + this._model.getInitialNodeIDString();
				this.detachConnections(initialNodeID);
				domConstruct.destroy(initialNodeID);
			}
			domConstruct.destroy(nodeID);
			// delete node from the model
			var updateNodes = this._model.deleteNode(nodeID);
			// updateNodes are the nodes for which the equations and links were updated.
			console.log(updateNodes);
			this.removeDescription(nodeID);
			array.forEach(updateNodes, function(ID){
				console.log(ID);
				this.updateNode(this._model.getNode(ID));
				this.detachConnections(ID);
			}, this);
		},

		detachConnections: function(nodeID){
			array.forEach(this._instance.getConnections(), function(connection){
				if(connection.sourceId == nodeID || connection.targetId == nodeID){
					this._instance.detach(connection);
				}
			}, this);
		},

		removeDescription: function(nodeID){
			var id = this.domIDs(nodeID)['description'];
			if(id) domConstruct.destroy(id);
		},

		updateNodeConnections: function(from, to){
			this.detachConnections(to);
			this.setConnections(from, to);
		}
	});
});
