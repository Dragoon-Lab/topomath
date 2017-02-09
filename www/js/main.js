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
	'./menu',
	'./session',
	'./model',
	'./equation',
	'./draw-model',
	'./con-author',
], function(array, geometry, dom, style, aspect, ready, registry, event, ioQuery, on,
			menu, session, model, equation, drawModel, controlAuthor){

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
			throw Error("something went wrong");
		}
	
		//The following code follows sachin code after the model has been rendered according to query parameters
		ready(function(){
			//remove the loading division, now that the problem is being loaded
			var loading = document.getElementById('loadingOverlay');
			loading.style.display = "none";

			var dm = new drawModel(_model.active);
			
			
			/*********  below this part are the event handling *********/
			aspect.after(dm, "onClickNoMove", function(mover){
				if(mover.mouseButton != 2){
					// show node editor only when it is not a right click
					// TODO: attach node editor click
					console.log("node open action for ", mover.node.id);
				} else {
					// TODO: attach menu display click event
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
				var initialString = "_" + _model.active.getInitialNodeString();
				if(id.indexOf("_") > -1){
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

			//create a controller object
	
			//create new ui configuration object based on current mode ( and activity)
			var ui_config = "";

			//For now using empty givenModel and ui_config 

			var controllerObject = new controlAuthor(query.m, _model, ui_config);

			//next step is to add action to add quantity
			menu.add("createQuantityNodeButton", function(e){
				event.stop(e);
				var options = {
					type: "quantity"
				};
				var id = _model.active.addNode(options);
				console.log("New quantity node created id - ", id);
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
				//controllerObject.logging.log('ui-action', {type: "menu-choice", name: "create-node"});
				console.log("New equation node created id - ", id);
				controllerObject.showNodeEditor(id);
				dm.addNode(_model.active.getNode(id));
			});
		});
	});
});
