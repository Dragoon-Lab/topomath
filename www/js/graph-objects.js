define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"./equation",
	"jsPlumb/jsPlumb"
], function(array, lang, expression){
	return {
		defaultString: "Click here!",
		/*
		* This is the function which based on the type of the node 
		* will return the corresponding HTML string. Since type and ID
		* and whether the node is accumulator or not defines how the
		* node looks, we need to ensure these things have some values.
		* In future new types of rendering methods should include an if case
		* for checking different ways to show the node based on the scenario.
		* Refer to graph-objects from Dragoon codebase.
		* I am writing the basic method for now. ~ Sachin
		* 
		* @params : model - the object which is to be rendered.
		* 			nodeID - particular node that is to be rendered
		*
		* @return : html - html structure with div and classes 
		*				   which will be rendered on the canvas
		*/
		getNodeHTML: function(model, nodeID){
			var type = model.getType(nodeID) || 'circle';
			var nodeName = model.getVariable(nodeID) || '';
			var html = [];
			var nodeString = {};
			var createInitial = false;
			switch(type){
				case "circle":
					nodeString.value = this.defaultString;
					break;
				case "equation":
					var eq = model.getEquation(nodeID);
					nodeString.value = this.getDomUIStrings(model, "equation", nodeID);
					break;
				case "quantity":
					nodeString.value = this.getDomUIStrings(model, "variable", nodeID);
					if(model.getVariable(nodeID))
						if(model.isAccumulator(nodeID)){
							nodeString.initial = this.getDomUIStrings(model, "value", nodeID);
							createInitial = true;
						} else {
							nodeString.value = this.getDomUIStrings(model, "value", nodeID);
						}
					break;
			}
			html[0] = '<div id="'+nodeID+'Label" class = "bubble"><div class="'+ type +'Wrapper"><strong id = "'+nodeID+'Content" class = "nodeContent">' + nodeString.value + '</strong></div></div>';

			if(createInitial){
				html[1] = '<div id="'+nodeID+'LabelInitial" class = "bubble"><div class="'+ type +'Wrapper"><strong id = "'+ nodeID +'ContentInitial" class = "nodeContent">' + nodeString.initial + '</strong></div></div>';
			}

			return html;
		},

		getNodeDescriptionHTML: function(model, nodeID){
			var type = model.getType(nodeID);
			var description = this.getDomUIStrings(model, "description", nodeID);
			var html = "";
			if(type && description){
				html = '<div id = "'+nodeID+'_description" class="'+type+'Description">'+description+'</div>';
			}

			return html;
		},

		/**
		* returns the string to show in the Node DOM structure.
		* Like in quantity node for description we need to show
		* the name with the description for quantity
		* @params : field - for which the view is needed - description
		*           node - node object with all the values
		*/
		getDomUIStrings: function(/* object */ model, /* string */ field, /* string */ nodeID){
			var value = "";
			switch(field){
				case "description":
					var description = model.getDescription(nodeID);
					var type = model.getType(nodeID);
					if(description){
						value = description;
						if(type == "quantity")
							value = "<b>" + model.getVariable(nodeID) + "</b>: " + model.getDescription(nodeID);
					}
					break;
				case "variable":
					var variable = model.getVariable(nodeID);
					if(variable){
						value = variable;
					} else {
						value = this.defaultString;
					}
					break;
				case "value":
					var initial = model.getValue(nodeID);
					initial = typeof(initial) === "number" ? initial : "";
					value = model.getVariable(nodeID);
					if(model.isAccumulator(nodeID)){
						if(!initial) initial = "??";
						value = model.getInitialNodeDisplayString() + " " + value + " : " + initial;
					} else if(initial) {
						value += " = " + initial;
					}
					break;
				case "equation":
					var eq = model.getEquation(nodeID);
					if(eq){
						var params = {
							subModel: model,
							equation: eq
						};
						value = expression.convert(params).equation || this.defaultString;
					} else
						value = this.defaultString;
					break;
			}
			console.log(value);

			return value;
		}
	};
});
