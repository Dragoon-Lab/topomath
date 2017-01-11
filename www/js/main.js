define([
	"dojo/_base/array",
	'dojo/_base/lang',
	"dojo/dom",
	'dojo/dom-geometry',
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/on",
	'dojo/aspect',
	"dojo/io-query",
	"dojo/query",
	"dojo/ready",
	'dijit/registry',
	"dijit/Tooltip",
	"dijit/TooltipDialog",
	"dijit/popup",
	"./menu",
	"dojo/_base/event",
	"./con-author",
], function(array, lang, dom, geometry, style, domClass, on, aspect, ioQuery, DQuery, ready, registry, toolTip, tooltipDialog, popup,
	menu,event, controlAuthor){

	//read query parameters first
	//for now using a dummy object
	var query = {
		'u': 'temp',
		'p': 'rabbits',
		'm': 'AUTHOR',
		's': 'temp-section',
		'f': 'temp-folder'
	};
	
	//The following code follows sachin code after the model has been rendered according to query parameters
	ready(function(){
	//remove the loading division, now that the problem is being loaded
	var loading = document.getElementById('loadingOverlay');
	loading.style.display = "none";

	//Set Tab title (remove the comments for below code after the model is here)
	//var taskString = givenModel.getTaskName();
	//document.title ="TopoMath" + ((taskString) ? " - " + taskString : "");

	//This array is used later to called the setSelected function for all the buttons in the menu bar
	//moved this at the start so that the buttons flicker at the start rather than at the end.
	var menuButtons=[];
	menuButtons.push("createNodeButton");

	array.forEach(menuButtons, function(button){
		//setting display for each menu button
		console.log(button);
		console.log(registry);
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
	var createNodeButton = registry.byId("createNodeButton");
	createNodeButton.setDisabled(false);

	//create a controller object

	//create new model object
	var givenModel = "";
	
	//create new ui configuration object based on current mode ( and activity)
	var ui_config = "";

	//For now using empty givenModel and ui_config 

	var controllerObject = new controlAuthor(query.m, givenModel, ui_config);

	//next step is to add action
	menu.add("createNodeButton", function(e){
		event.stop(e);
		//give a fake id for now
		var id = "id1";
		//var id = givenModel.active.addNode();
		//controllerObject.logging.log('ui-action', {type: "menu-choice", name: "create-node"});
		//drawModel.addNode(givenModel.active.getNode(id));
		controllerObject.showPreNodeEditor(id);	
	});


});

});
