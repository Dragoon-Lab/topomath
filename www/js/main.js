define([
	'dojo/_base/array',
	'dojo/dom-geometry',
	'dojo/dom',
	'dojo/dom-style',
	'dojo/aspect',
	'dojo/ready',
	'dijit/registry',
	'dojo/_base/event',
	'dojo/io-query',
	'dojo/on',
	'dijit/form/Button',
	'dojo/dom-construct',
	'dojo/_base/lang',
	'./menu',
	'./session',
	'./model',
	'./equation',
	'./draw-model',
	'./con-author',
	'./logging',
	'./popup-dialog'
], function(array, geometry, dom, style, aspect, ready, registry, event, ioQuery, on, Button, domConstruct, lang,
			menu, session, model, equation, drawModel, controlAuthor, logging, popupDialog){
	
	console.log("load main.js");
	// Get session parameters
	var query = {};
	//this change will keep it backward compatible
	//as $_REQUEST is used at the place instead of $_POST.
	if(dom.byId("query").value){
		query = ioQuery.queryToObject(dom.byId("query").value);
		//new problem is being opened with fresh params
		//update the local session storage
		for(var prop in query){
			sessionStorage.setItem("drag"+prop,query[prop]);
		}
	}else{
		//trying to open an old problem using a refresh or it is a bad request
		//check sessionStorage for a reload
		//else leave console warnings
		if(sessionStorage.getItem("dragp")){
			//check for dragp item which implies all other params are stored
			for(var key in sessionStorage){
				var temp = (key.substring(0,4) == "drag") && key.substring(4);
				if(temp)
					query[temp] = sessionStorage.getItem(key);
			}
		}
		else {
			console.warn("Should have method for logging this to Apache log files.");
			console.warn("Dragoon log files won't work since we can't set up a session.");
			console.error("Function called without arguments");
			// show error message and exit
			var errorMessage = new messageBox("errorMessageBox", "error", "Missing information, please recheck the query");
			errorMessage.show();
			throw Error("please retry, insufficient information");
		}
	}

	var _session = session(query);
	var _model = new model(query.m, query.p);
	console.log(_model);


	_session.getModel(query).then(function(solutionGraph){
		if(solutionGraph){
			try{
				_model.loadModel(solutionGraph);
			} catch(err){
				throw Error(err);
			}
		} else {
			console.log("Its a new problem");
			// TODO: show the message box at the top to say that its a new problem.
		}
	
		//The following code follows sachin code after the model has been rendered according to query parameters
		ready(function(){
			/**
			* this has to be the first to be instantiated
			* so that session object is not to be passed again and again. ~ Sachin
			*/
			var _logger = logging.getInstance(_session);
			/**
			* equation does not have a constructor because
			* we dont want to run it on it's own. So there is an explicit call
			* to set the logger for equation.
			*/
			equation.setLogging(_logger);
			//remove the loading division, now that the problem is being loaded
			var loading = document.getElementById('loadingOverlay');
			loading.style.display = "none";

			var dm = new drawModel(_model.active);
			var errDialog = new popupDialog();

			/*********  below this part are the event handling *********/
			aspect.after(dm, "onClickNoMove", function(mover){
				if(mover.mouseButton != 2){
					// show node editor only when it is not a right click
					console.log("node open action for ", mover.node.id);
					var id = _model.active.getNodeID(mover.node.id);
					controllerObject.showNodeEditor(id);
				} else {
					console.log("menu open action for ", mover.node.id);
				}
			}, true);

			aspect.after(dm, "onClickMoved", function(mover){
				console.log("aspect after called ", mover);
				var g = geometry.position(mover.node, true);
				console.log("Update model coordinates for ", mover);
				var scrollTop = document.getElementById("drawingPane").scrollTop;
				var id = mover.node.id;
				var index = 0
				var initialString = _model.active.getInitialNodeIDString();
				if(id.indexOf(initialString) > -1){
					id = id.replace(initialString, "");
					index = 1;
				}
				var node = registry.byId(mover.node);
				var widthLimit = document.documentElement.clientWidth - 110; 
				var topLimit = 20;

				if(g.x > widthLimit) {
					g.x = widthLimit;
					node.style.left = widthLimit+"px";
				}    

				if(g.x < 0) { 
					g.x = 0; 
					node.style.left = "0px";
				}    

				if((g.y + scrollTop) < topLimit){
					//check if bounds inside
					if(g.y < topLimit) { // BUG: this g.y should be absolute coordinates instead
						g.y = topLimit;
						node.style.top = topLimit+"px";  // BUG: This needs to correct for scroll
					}
				}
				_model.active.setPosition(id, index, {"x": g.x, "y": g.y+scrollTop});
				_session.saveModel(_model.model);
			}, true);
	

			//create a menuButtons array and push the list of button Ids which go to the main menu bar
			var menuButtons=[];
			menuButtons.push("createQuantityNodeButton");
			menuButtons.push("createEquationNodeButton");
			menuButtons.push("DoneButton");

			array.forEach(menuButtons, function(button){
				//setting display for each menu button
				style.set(registry.byId(button).domNode, "visibility", "visible");

				/*
				* This is a work-around for getting a button to work inside a MenuBar.
				* Otherwise, there is a superfluous error message.
				*/	
				registry.byId(button)._setSelected = function(arg){
					console.log(button+" _setSelected called with ", arg);
				};
			}, this);

			//check if the current UI situation permits loading of the createNodeButton
			//for now since we are not into UI parameters like in dragoon yet
			//I enable the button without any check
			var createQNodeButton = registry.byId("createQuantityNodeButton");
			createQNodeButton.setDisabled(false);

			var createEqNodeButton = registry.byId("createEquationNodeButton");
			createEqNodeButton.setDisabled(false);

			var DoneButton = registry.byId("DoneButton");
			DoneButton.setDisabled(false);
			//create a controller object
	
			//create new ui configuration object based on current mode ( and activity)
			var ui_config = "";

			//For now using empty  ui_config 

			var controllerObject = new controlAuthor(query.m, _model, ui_config);
			//next step is to add action to add quantity
			menu.add("createQuantityNodeButton", function(e){
				event.stop(e);
				var options = {
					type: "quantity"
				};
				var id = _model.active.addNode(options);
				console.log("New quantity node created id - ", id);
				_logger.logUserEvent({
					type: "menu-choice",
					name: "create-node",
					nodeType: "quantity"
				});
				controllerObject.showNodeEditor(id);	
				dm.addNode(_model.active.getNode(id));
			});

			//next step is to add action to add equation
			menu.add("createEquationNodeButton", function(e){
				event.stop(e);
				var options = {
					type: "equation"
				};
				var id = _model.active.addNode(options);
				//var id = givenModel.active.addNode();
				_logger.logUserEvent({
					type: "menu-choice",
					name: "create-node",
					nodeType: "equation"
				});
				console.log("New equation node created id - ", id);
				controllerObject.showNodeEditor(id);
				controllerObject.addNode(_model.active.getNode(id));
			});

			aspect.after(controllerObject, "addNode",
				lang.hitch(dm, dm.addNode), true);

			aspect.after(controllerObject, "setConnections",
				lang.hitch(dm, dm.updateNodeConnections), true);

			on(registry.byId("closeButton"), "click", function(){
				registry.byId("nodeEditor").hide();
				console.log("uncomment code to close");
			});

			//TODO: uncomment this after node_editor2 is merged
			//all the things we need to do once node is closed
			aspect.after(registry.byId('nodeEditor'), "hide", function(){
				_session.saveModel(_model.model);
				dm.updateNode(_model.active.getNode(controllerObject.currentID));
			});

			menu.add("DoneButton", function (e) {
				event.stop(e);
				// This should return an object kind of structure and
				var problemComplete = controllerObject.checkDone();
				if( problemComplete.errorNotes === "" ){
					// if in preview mode , Logging is not required:
					// TODO : Add Logging
					if(window.history.length === 1)
						window.close();
					else
						window.history.back();
				}
				else{
					var buttons = [];
					var title = 'Exit Topomath';
					var exitButton = {"Exit Topomath":exitTopomath};
					buttons.push(exitButton);
					errDialog.showDialog(title, problemComplete.errorNotes, buttons, /*optional argument*/"Don't Exit");
				}
			});
		});
	});
	
	var exitTopomath = function(){
		console.log("Force Exit Topomath");	
		if(/*controllerObject.logging.doLogging*/ false){
			/*
				controllerObject.logging.log('close-problem', {
					type: "",
					name: "",
				}).then(function(){
					
				});
				console.log("Close Called!! ");
				if(window.history.length === 1)
					window.close();
				else
					window.history.back();
			*/
		}else{
			console.log("Close Called!! ");
			if(window.history.length === 1)
				window.close();
			else
				window.history.back();
		}
	}
	
});
