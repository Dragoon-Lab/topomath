define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom",
	"dojo/dom-style",
	"./graph-objects",
	"jsPlumb/jsPlumb"
], function(declare, array, lang, attr, domConstruct, dom, domStyle, graphObjects){
	return declare(null, {
		_instance: null,
		_model: null,
		_colors:[
			"#00ffff", "#f0e68c", "#add8e6", "#e0ffff", "#90ee90", "#d3d3d3", "#ffb6c1",
			"#ffffe0", "#00ff00", "#008000", "#f5f5dc", "#0000ff", "#a52a2a", "#00ffff",
			"#ffd700", "#4b0082", "#ff00ff", "#800000", "#000080", "#808000", "#ffa500",
			"#c0c0c0", "#ffc0cb", "#ff0000", "#800080", "#ffff00", "#00008b", "#008b8b",
			"#f0ffff", "#a9a9a9", "#006400", "#bdb76b", "#8b008b", "#556b2f", "#ff8c00",
			"#9932cc", "#8b0000", "#e9967a", "#9400d3", "#ff00ff"
		],
		_borderColor: 39,
		_backgroundColor: 0,
		_counter: 0,

		constructor: function(model){
			this._model = model;
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
			
			var makeVertexSource = this.makeVertexSource;
			instance.doWhileSuspended(function(){
				array.forEach(vertices, function(vertex){
					makeVertexSource(vertex, instance);
				}, this);
			});

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
			console.log("Adding vertex to the canvas id = ", node.ID, " type = ", type);

			console.log("Position for the vertex : ",node.ID, " position: x ", node.position[0].x, " y: " + node.position[0].y);
			var properties = this.getNodeUIProperties(node);
			var htmlStrings = graphObjects.getNodeHTML(this._model, node.ID); 

			var vertices = [];
			array.forEach(htmlStrings, function(html, count){
				var idTag = node.ID;
				if(count == 1)
					idTag += "_" + this._model.getInitialNodeString();

				vertices[count] = domConstruct.create("div", {
					id: idTag,
					"class": type,
					style: {
						left: node.position[count].x + 'px',
						top: node.position[count].y + 'px',
						backgroundColor: properties.backgroundColor,
						borderColor: properties.borderColor
					},
					innerHTML: htmlStrings[count]
				}, "statemachine-demo");
			}, this);

			var color = this._model.getColor(node.ID);
			if(color){
				this.addNodeDescription(node.ID);
			}

			array.forEach(vertices, function(vertex){
				this.makeDraggable(vertex);
			}, this);

			return vertices;
		},

		getNodeUIProperties: function(node){
			// node properties default case when type is circle
			var obj = {
				backgroundColor: "DarkGray",
				borderColor: "black"
			};
			var type = node.type;
			if(type && type == "equation"){
				obj.backgroundColor = this.getNextColor(true);
				obj.borderColor = "black";
				this._model.setColor(node.ID, obj.backgroundColor);
			} else if (type && type == "quantity") {
				obj.backgroundColor = "white";
				obj.borderColor = this.getNextColor(false);
				this._model.setColor(node.ID, obj.borderColor);
			}

			return obj;
		},

		getNextColor: function(isBackground){
			var index = isBackground ? this._backgroundColor++ : this._borderColor--;
			if(isBackground && index >= this._colors.length){
				console.error("need more colors, last color returned");
				index--;
				this._backgroundColor = 0;
			} else if(!isBackground && index < 0){
				console.error("need more colors, last color returned");
				index++;
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
			if(type){
				var descHTML = dom.byId(domID);
				var parentDIV = type+"-description";
				var replaceTag = descHTML ? "replace" : "last";
				domConstruct.place(descriptionString, parentDIV, replaceTag);
				debugger;
				if(type == "equation")
					domStyle.set(domID, "background-color", this._model.getColor(ID));
				else
					domStyle.set(domID, "border-color", this._model.getColor(ID));
			}
		}
	});
});
