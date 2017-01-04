define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"./graph-objects",
	"jsPlumb/jsPlumb",
], function(declare, array, lang, attr, domConstruct, graphObjects){
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

		constructor: function(model){
			this._model = model;
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
			this._model = model;
			var vertices = [];
			var temp = []
			vertices = array.map(model.getNodes(), function(node){
				temp = temp.concat(this.addNode(node));
				return temp;
			}, this);
			vertices = vertices[vertices.length - 1]; //hack for keeping it one dimension
			console.log(vertices);

			instance.doWhileSuspended(function(){

				array.forEach(vertices, function(vertex){
					instance.makeSource(vertex, {
						filter: ".ep",
						anchor: "Continuous",
						connector: ["StateMachine", {curviness: 0}],
						connectorStyle:{ strokeStyle:"#5c96bc", lineWidth:2, outlineColor:"transparent", outlineWidth:4 },
						maxConnections: 6,
						onMaxConnections: function(info, e){
							alert("Maximum connections (" + info.maxConnections + ") reached");
						},
					});
				});

				array.forEach(vertices, function(vertex){
					instance.makeTarget(vertex, {
						dropOptions: {hoverClass: "dragHover"},
						anchor: "Continuous"
					});
				});
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
					idTag += "_initial"
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

			return vertices;
		},

		getNodeUIProperties: function(node){
			// node properties default case
			var obj = {
				backgroundColor: "DarkGray",
				borderColor: "black"
			};
			var type = node.type;
			if(type && type == "equation"){
				obj.backgroundColor = this.getNextColor(true);
				obj.borderColor = "black";
			} else {
				obj.backgroundColor = "white";
				obj.borderColor = this.getNextColor(false);
			}

			return obj;
		},

		getNextColor: function(isBackground){
			var index = isBackground ? this._backgroundColor++ : this._borderColor--;
			if(isBackground && index >= this._colors.length){
				console.error("need more colors, last color returned");
				index--;
			} else if(!isBackground && index < 0){
				console.error("need more colors, last color returned");
				index++;
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
		}
	});
});
