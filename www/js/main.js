define([
	"dojo/_base/array",
	'dojo/dom-geometry',
	"dojo/dom-style",
	'dojo/aspect',
	"dojo/ready",
	'dijit/registry',
	"./menu",
	"dojo/_base/event",
	"./session",
	"./model",
	"./equation",
	"./draw-model",
	"./con-author",
], function(array, geometry, style, aspect, ready, registry, menu, event, sess, model, equation, drawModel, controlAuthor){

	//read query parameters first
	//for now using a dummy object
	var query = {
		'u': 'temp',
		'p': 'rabbits',
		'm': 'AUTHOR',
		's': 'temp-section'
	};
	var session = sess(query);
	var _model = new model(query.m, query.p);
	console.log(_model);

	session.getModel(query).then(function(solutionGraph){
		if(solutionGraph){
			try{
				_model.loadModel(solutionGraph);
			} catch(err){
				throw Error(err);
			}
		} else {
			throw Error("something went wrong");
		}
	
	//The following code follows sachin code after the model has been rendered according to query parameters
	ready(function(){
		//remove the loading division, now that the problem is being loaded
		var loading = document.getElementById('loadingOverlay');
		loading.style.display = "none";

		var dm = new drawModel(_model.active);

		var menuButtons=[];
		menuButtons.push("createQuantityNodeButton");
		menuButtons.push("createEquationNodeButton");

		array.forEach(menuButtons, function(button){
			//setting display for each menu button
			style.set(registry.byId(button).domNode, "display", "inline");

			/*
		 	* This is a work-around for getting a button to work inside a MenuBar.
		 	* Otherwise, there is a superfluous error message.
		 	*/	
		 	registry.byId(button)._setSelected = function(arg){
				console.log(button+" _setSelected called with ", arg);
			}
			}, this);

		//check if the current UI situation permits loading of the createNodeButton
		//for now since we are not into UI parameters like in dragoon yet
		//I enable the button without any check
		var createQNodeButton = registry.byId("createQuantityNodeButton");
		createQNodeButton.setDisabled(false);

		var createEqNodeButton = registry.byId("createEquationNodeButton");
		createEqNodeButton.setDisabled(false);

		//create a controller object

		//create new model object
		var givenModel = "";
	
		//create new ui configuration object based on current mode ( and activity)
		var ui_config = "";

		//For now using empty givenModel and ui_config 

		var controllerObject = new controlAuthor(query.m, givenModel, ui_config);

		//next step is to add action to add quantity
		menu.add("createQuantityNodeButton", function(e){
			event.stop(e);
			//give a fake id for now
			var id = "id1";
			//var id = givenModel.active.addNode();
			//controllerObject.logging.log('ui-action', {type: "menu-choice", name: "create-node"});
			//drawModel.addNode(givenModel.active.getNode(id));
			controllerObject.showQuantityNodeEditor(id);	
		});

		//next step is to add action to add equation
		menu.add("createEquationNodeButton", function(e){
			event.stop(e);
			//give a fake id for now
			var id = "id1";
			//var id = givenModel.active.addNode();
			//controllerObject.logging.log('ui-action', {type: "menu-choice", name: "create-node"});
			//drawModel.addNode(givenModel.active.getNode(id));
			controllerObject.showEquationNodeEditor(id);	
		});

	});

});
});
