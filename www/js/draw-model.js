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
	"dojo/on",
	"./graph-objects",
	"jsPlumb/jsPlumb"
], function(declare, array, lang, attr, domConstruct, domClass, dom, domStyle, Menu, MenuItem, on, graphObjects){
	return declare(null, {
		_instance: null,
		_model: null,
		_colors:[
			"#00ffff", "#f0e68c", "#add8e6", "#e0ffff", "#90ee90", "#ffb6c1",
			"#ffffe0", "#00ff00", "#f5f5dc", "#0000ff", "#8b0000", "#ff8c00",
			"#ffd700", "#9400d3", "#808000", "#c0c0c0", "#ffc0cb", "#ff0000",
			"#ffff00", "#008b8b", "#008000", "#f0ffff", "#bdb76b", "#ffa500",
			"#e9967a", "#556b2f", "#ff00ff"
		],
		_incompleteColor: "#d3d3d3",
		_borderColor: 27,
		_backgroundColor: 0,
		_counter: 0,
		_cache: {},
		_dragNodes: true,
		domIDs: function(nodeID){
			return {
				'nodeDOM': nodeID+'Content',
				'initialNode': nodeID+'ContentInitial',
				'description': nodeID+'_description',
				'parentDOM': nodeID,
				'parentInitial': nodeID + this.initialNodeIDTag,
				'topomathFeedback' : 'feedback'+nodeID,
				'topomathFeedbackInitial' : 'feedback'+nodeID+'LabelInitial'
			};
		},
		_statusClassMap: {
			"demo" : " fa-minus",
			"incorrect" : " fa-times",
			"correct" : " fa-check",
			"perfect" : " fa-star",
			"": ""
		},

		constructor: function(model, dragNodes, feedback){
			this._model = model;
			this._dragNodes = dragNodes;
			this._feedbackMode = feedback;
			this._quantityNodeCount = 0;
			this._equationNodeCount = 0;
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
				var links = id.indexOf(this.initialNodeIDTag) < 0 ? model.getLinks(id) : null;
				//unlike Dragoon everyone does not have links.
				//only equation nodes have the links.
				if(links)
					this.setConnections(links, vertex);
			}, this);
			this.addNodeCount();

			return instance;
		},

		addNodeCount: function(){
			dojo.byId('quantity-node-count').innerHTML = this._quantityNodeCount;
			dojo.byId('equation-node-count').innerHTML = this._equationNodeCount;
		},

		addNode: function(/* object */ node){
			type = node.type || "circle";

			if(!node.ID){
				conole.error("addNode called with a node without ID");
				return;
			}
			if(dom.byId(this.domIDs(node.ID).parentDOM)){
				console.error("addNode called for already existing node DOM");
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
				if(node.type == "equation")
					this._backgroundColor = this._colors.indexOf(color) + 1;
				else
					this._borderColor = this._colors.indexOf(color) - 1;
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
			var initialNode = dom.byId(domIDTags['parentInitial']);

			// update variable name
			if(cachedNode.variable != node.variable){
				if(node.type && node.type == "quantity"){
					dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "variable", node.ID);
					// updating the corresponsing initial node
					if(node.value && node.variableType == "dynamic" && dom.byId(domIDTags['initialNode'])){
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
				description = graphObjects.getDomUIStrings(this._model, "description", node.ID);
				var descriptionDOM = dom.byId(domIDTags['description']);
				if(descriptionDOM)
					descriptionDOM.innerHTML = description;
				else if(!node.color){
					var ui = this.getNodeUIProperties(node);
					domStyle.set(domIDTags['parentDOM'], "backgroundColor", ui.backgroundColor);
					domStyle.set(domIDTags['parentDOM'], "borderColor", ui.borderColor);
					if(initialNode){
						domStyle.set(domIDTags['parentInitial'], "backgroundColor", ui.backgroundColor);
						domStyle.set(domIDTags['parentInitial'], "borderColor", ui.borderColor);
					}
					this.addNodeDescription(node.ID);
				}
			}

			//update value or update dynamic
			if(node.type && node.type == "quantity" && (cachedNode.value != node.value ||
				(cachedNode.variableType != node.variableType ))){
				if(node.variableType == "dynamic"){
					//if(node.value){
						// here we need to update the initial value node as well.
					if(initialNode){
						dom.byId(domIDTags['initialNode']).innerHTML = graphObjects.getDomUIStrings(this._model, "value", node.ID);
					} else {
						//this part of the code creates a new node with initial value when a node is added as dynamic
						//explicitly picking up the second value as that is the one to be added
						var initialNodeString = graphObjects.getNodeHTML(this._model, node.ID)[1];
						// draw-model does not and should not have access to that part of the node, hence it needs to be done by the handler
						initialNode = this.createNodeDOM(node, initialNodeString, true);
					}
					dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "variable", node.ID);
					// this is the code with node.value logic
					// where if node.value is not necessary for the initial node to show up
					// leaving this code here until sure that it wont be needed anymore.
					//} else if(initialNode && (!node.value || node.value == "")) {
						// the case when the value of the node is removed
						// this should delete the initial node
					//	this.deleteNode(domIDTags['parentInitial'], true);
					//}
				} else {
					dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "value", node.ID);
					if(initialNode){
						this.deleteNode(domIDTags['parentInitial'], true);
						initialNode = null;
					}
				}
			} else if(node.type && node.type == "equation" && cachedNode.equation != node.equation){
				dom.byId(domIDTags['nodeDOM']).innerHTML = graphObjects.getDomUIStrings(this._model, "equation", node.ID);
			}

			//update border
			var isComplete = this._model.isComplete(node.ID);
			var hasClass = domClass.contains(domIDTags['parentDOM'], "incomplete");
			var nodeStatus = this._model.getNodeStatus(node.ID);
			var nodeStatusClass = nodeStatus ? this._statusClassMap[nodeStatus] : "";
			if(this._model.isStudentMode() && this._feedbackMode != "nofeedback"){
				var _feedbackTags = ['fa-check','fa-star','fa-times','fa-minus'];
				/*Updating tags each time model gets updated*/
				array.forEach(_feedbackTags, function(t){
					domClass.remove(domIDTags['topomathFeedback'], t);
					if(initialNode){
						domClass.remove(domIDTags['topomathFeedbackInitial'], t);
					}
				})
				domClass.add(domIDTags['topomathFeedback'], nodeStatusClass);
				if(initialNode){
					domClass.add(domIDTags['topomathFeedbackInitial'], nodeStatusClass);
				}
			}
			var initialHasClass = initialNode && domClass.contains(domIDTags['parentInitial'], "incomplete");
			if(hasClass && isComplete){
				domClass.remove(domIDTags['parentDOM'], "incomplete");
				if(initialHasClass) domClass.remove(domIDTags['parentInitial'], "incomplete");
			} else if (!hasClass && !isComplete){
				domClass.add(domIDTags['parentDOM'], "incomplete");
				if(initialNode) domClass.add(domIDTags['parentInitial'], "incomplete");
			}

			if(initialNode && node.position.length == 2){
				dojo.byId(domIDTags['parentInitial']).style.top = node.position[1].y+'px';
				dojo.byId(domIDTags['parentInitial']).style.left = node.position[1].x+'px';
			}else{
				dojo.byId(domIDTags['parentDOM']).style.top = node.position[0].y+'px';
				dojo.byId(domIDTags['parentDOM']).style.left = node.position[0].x+'px';
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
				if(node.position.length > 1 && node.position[1] !== null && node.position[1] !== undefined){
					x = node.position[1].x;
					y = node.position[1].y;
				} else {
					x += 100;
					y += 100;
				}
			}

			if(!this._model.isComplete(node.ID)){
				classTag += " incomplete";
			}
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

			if(this._model.isStudentMode() && this._feedbackMode != "nofeedback"){
				var nodeStatusClass = this._model.getNodeStatus(node.ID);
				nodeDOM.querySelector(".topomath-feedback").className += this._statusClassMap[nodeStatusClass];
			}
			if(this._dragNodes){
				this.makeDraggable(nodeDOM);
			}else{
				var thisNodeID = dom.byId(node.ID);
                console.log(thisNodeID + "created");
                on(thisNodeID, "click", lang.hitch(this, function () {
                    console.log(thisNodeID + "clicked");
                    this.checkNodeClick(node);
                }));
                this.makeVertexSource(nodeDOM);
			}
			
			// creating menu for each DOM element
			pMenu = new Menu({
				targetNodeIds: [idTag]
			});
			pMenu.addChild(new MenuItem({
				label: "Delete Node",
				onClick: lang.hitch(this, function(){
					this.deleteNode(node.ID);
				})
			}));
			return nodeDOM;
		},

		checkNodeClick: function(node){
			console.log("Stub for opening editor");
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
				color = node.color ? node.color :
					this.getNextColor(type && type == "equation");
				/*if(node.color){
					color = node.color;
					/*if(type == "quantity")
						this._borderColor = this._colors.indexOf(node.color) - 1;
					else
						this._backgroundColor = this._colors.indexOf(node.color) + 1;
					this._backgroundColor = color;
				}*/
			/**
			* logic for border and background color removed
			* check issue - https://github.com/Dragoon-Lab/topomath/issues/121
			*/
			//if(type && type == "equation"){
			obj.backgroundColor = color;
			//obj.borderColor = "black";
			this._model.setColor(node.ID, obj.backgroundColor);
			/*} else if (type && type == "quantity") {
				obj.backgroundColor = "white";
				obj.borderColor = color;
				this._model.setColor(node.ID, obj.borderColor);
			}*/

			return obj;
		},

		getNextColor: function(isBackground){
			var index = isBackground ? this._backgroundColor++ : this._borderColor--;
			console.log("get next color where color is for background ", index);
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
				}
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
				//if(type == "equation")
				domStyle.set(domID, "background-color", this._model.getColor(ID));
				/*else
					domStyle.set(domID, "border-color", this._model.getColor(ID));
				*/
				if(type === 'quantity'){
					this._quantityNodeCount++;
				}else if(type === 'equation'){
					this._equationNodeCount++;
				}
				this.addNodeCount();
			}
		},

		/**
		* deletes the dom of a node
		* @params - nodeID - ID to be deleted
		*			isDeleteInitialNode - whether we have to delete only the initial node or not
		*				this is used to handle the case where user calls delete node from UI as
		*				as that will delete the complete node, when called from functions internally
		*				we might just need to delete just the initial node.
		*/
		deleteNode: function(/*string*/ nodeID, isDeleteInitialNode){
			isDeleteInitialNode = isDeleteInitialNode || false; //ensure that it has a value
			this.detachConnections(nodeID);
			var initialNodeIDString = this._model.getInitialNodeIDString();
			// TODO log this event
			//useful when we are deleting the initial Node
			var ID = nodeID;
			if(isDeleteInitialNode && nodeID.indexOf(initialNodeIDString) > 0){
				ID = this._model.getID(nodeID);
			}
			var type = this._model.getType(ID);
			if(!isDeleteInitialNode && dom.byId(ID+initialNodeIDString)){
				ID += initialNodeIDString;
				this.detachConnections(ID);
				domConstruct.destroy(ID);
			}
			domConstruct.destroy(nodeID);
			if(this._model.getColor(ID) !== undefined){
				if(type === 'quantity'){
					this._quantityNodeCount--;
				}else if( type === 'equation'){
					this._equationNodeCount--;
				}
				this.addNodeCount();
			}
			// delete node from the model
			var updateNodes = this._model.deleteNode(nodeID);
			// updateNodes are the nodes for which the equations and links were updated.
			console.log(updateNodes);
			this.removeDescription(nodeID);
			this.deleteEquationLinks(updateNodes);
		},

		deleteEquationLinks: function(nodes){
			array.forEach(nodes, function(x){
				console.log(x);
				this.updateNode(this._model.getNode(x));
				this.detachConnections(x);
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
