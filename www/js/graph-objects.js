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
					nodeString.value = this.defaultString;
					if(eq){
						var params = {
							subModel: model,
							equation: eq
						};
						nodeString.value = expression.convert(params).equation || this.defaultString;
					}
					break;
				case "quantity":
					var nodeName = model.getVariable(nodeID);
					nodeString.value = nodeName || this.defaultString;
					var initial = model.getValue(nodeID);
					initial = typeof(initial) == "number" ? initial : "";
					//create initial value node only if the accumulator property is set to true
					//and initial value is a number
					if(model.isAccumulator(nodeID) && initial){
						nodeString.initial = "initial " + nodeName + " : " + initial;
						createInitial = true;
					} else if(initial) {
						nodeString.value += " = " + initial;
					}
					break;
			}
			html[0] = '<div id="'+nodeID+'Label" class = "bubble"><div class="'+ type +'Wrapper"><strong class = "nodeContent">' + nodeString.value + '</strong></div></div>';

			if(createInitial){
				html[1] = '<div id="'+nodeID+'LabelInitial" class = "bubble"><div class="'+ type +'Wrapper"><strong class = "nodeContent">' + nodeString.initial + '</strong></div></div>';
			}

			return html;
		},

		getNodeDescriptionHTML: function(model, nodeID){
			var type = model.getType(nodeID);
			var description = model.getDescription(nodeID);
			var html = "";
			if(type && description){
				if(type == "quantity")
					description = "<b>"+model.getVariable(nodeID)+"</b>: " + description;
				html = '<div id = "'+nodeID+'_description" class="'+type+'Description">'+description+'</div>';
			}

			return html;
		}
	};
});
