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
	'./tutor-configuration',
	'./session',
	'./model',
	'./equation',
	'./draw-model',
	'./con-author',
	'./con-student',
	'./logging',
	'./popup-dialog',
	'./event-logs',
	'./render-solution',
	'./user-messages',
	'./message-box'
], function(array, geometry, dom, style, aspect, ready, registry, event, ioQuery, on, Button, domConstruct, lang,
			menu, tutorConfiguration, session, model, equation, drawModel, controlAuthor, controlStudent, logging, popupDialog, eventLogs, Solution, messages, messageBox){

	console.log("load main.js");
	// Get session parameters
	var query = {};
	var _messages = messages.get("app");
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
			var errorMessage = new messageBox("errorMessageBox", "error", _messages["missing"]);
			errorMessage.show();
			throw Error("please retry, insufficient information");
		}
	}

	var _session = session(query);
	var _model = new model(_session, query.m, query.p);
	var _config = tutorConfiguration.getInstance(query.m);
	var _feedback = _config.get("feedbackMode");
	console.log(_model);

	_session.getModel(query).then(function(solutionGraph){
		if(solutionGraph){
			try{
				_model.loadModel(solutionGraph);
			} catch(err){
				if (!_session.isStudentMode) {
					var errorMessage = new messageBox("errorMessageBox", "error", _messages["duplicate.nodes"] + error.message, true);
					errorMessage.show();
					throw Error(err);
				} else {
					var errorMessage = new messageBox("errorMessageBox", "error", _messages["duplicate.nodes.student"], true);
					errorMessage.show();
					throw Error("The model has duplicate nodes.");
				}
			}
			// This version of code addresses loading errors in cases where problem is empty, incomplete or has no root node in coached mode
			if (!_session.isStudentMode) {
				//check if the probleis empty
				try {
					console.log("checking for emptiness");
					var count = 0;
					array.forEach(_model.authored.getNodes(), function (node) {
						//for each node increment the counter
						count++;
					});
					console.log("count of nodes is", count);
					if (count == 0) {
						//if count is zero we throw a error
						throw new Error("Problem is Empty");
					}
					//check for completeness of all nodes
					console.log("inside completeness verifying function");
					array.forEach(_model.authored.getNodes(), function (node) {
						console.log("node is", node, _model.authored.isComplete(node.ID));
						if (!_model.authored.isComplete(node.ID)) {
							throw new Error("Problem is Incomplete");
						}
					});
					
				}catch (error) {
					console.log("Incomplete!");
					//var errorMessage = new messageBox("errorMessageBox", "error", error.message);
					//errorMessage.show();
				}
			}
			if(_model.isStudentMode() && !_model.student.isSolutionAvailable()){
				/*console.log("Solution model is not available")
				var box = new messageBox("errorMessageBox", "warn", _messages["solution.missing"], true);
				box.show();*/
				// making the software believe that it is
				// starting in author mode, as the solution has to
				// calculated from the author model
				_model.setStudentMode(false);
				_config.set("showActiveGraphOnly", true);
				var g = new Solution(_model);
				_model.setStudentMode(true);
				_config.set("showActiveGraphOnly", false);
			}

		} else {
			console.log("Its a new problem");
			var m = _session.isStudentMode ? "doesnt.exist" : "new.problem";
			var box = new messageBox("errorMessageBox", "warn", _messages[m], true);
			box.show();
			// Add message box in student mode
		}
		


		//The following code follows sachin code after the model has been rendered according to query parameters
		ready(function(){
			/**
			* this has to be the first to be instantiated
			* so that session object is not to be passed again and again. ~ Sachin
			*/
			var _fixPosition = query.fp == "on"? true : false;
			var _logger = logging.getInstance(_session);
			_logger.log('open-problem', {problem: _logger._session.params.p});
			/**
			* equation does not have a constructor because
			* we dont want to run it on it's own. So there is an explicit call
			* to set the logger for equation.
			*/
			equation.setLogging(_logger);
			eventLogs.setLogging();
			//remove the loading division, now that the problem is being loaded
			var loading = document.getElementById('loadingOverlay');
			loading.style.display = "none";

			var dm = new drawModel(_model.active, _fixPosition, _feedback);
			var errDialog = new popupDialog();
			//create a controller object
			//For now using empty  ui_config
			var controllerObject = (!_model.isStudentMode()) ?
				new controlAuthor(query.m, _model, _config) :
				new controlStudent(query.m, _model, _config, _fixPosition);

			aspect.after(dm, "addNode", function(){
				controllerObject.computeNodeCount();
				controllerObject.sortDescriptions();
			}, true);

			aspect.after(dm, "updateNode", function(){
				controllerObject.computeNodeCount();
				controllerObject.sortDescriptions();
			}, true);

			aspect.after(controllerObject, "sortDescriptions",
				lang.hitch(dm, dm.updateDescriptionView, true));

			dm.init();

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

			aspect.after(dm, "checkNodeClick", function(node){
				controllerObject.showNodeEditor(node.ID);
			}, true);

			aspect.after(dm, "onClickMoved", function(mover){
				console.log("aspect after called ", mover);
				var g = geometry.position(mover.node, true);
				// fix for node movement as the geometry y position never matched the actual vertical offset.
				// setting it explicitly and marking it in case there are some repercussions in the future ~ Sachin
				if(g.y != mover.node.offsetTop)
					g.y = mover.node.offsetTop;
				console.log("Update model coordinates for ", mover);
				var scrollTop = document.getElementById("drawingPane").scrollTop;
				var id = mover.node.id;
				var index = 0;
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
				if(!_model.isStudentMode()){				
					controllerObject.updateAssignedNode(id, false);
				}
				_session.saveModel(_model.model);
			}, true);
	
			//create a menuButtons array and push the list of button Ids which go to the main menu bar
			var menuButtons= _config.get("buttons");

			array.forEach(menuButtons, function(button){
				//setting display for each menu button
				var button = registry.byId(button);
				style.set(button.domNode, "visibility", "visible");
				button.set('disabled', false);

				/*
				* This is a work-around for getting a button to work inside a MenuBar.
				* Otherwise, there is a superfluous error message.
				*/	
				registry.byId(button)._setSelected = function(arg){
					console.log(button+" _setSelected called with ", arg);
				};
			}, this);

			if(_model.isStudentMode()){
				//controllerObject.setAssessment(session); //set up assessment for student.
			}
			
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
				dm.addNode(_model.active.getNode(id));
			});

			menu.add("graphButton", function(e){
				event.stop(e);
				console.log("Graph button clicked");
				initSolution("graph");
			});

			menu.add("tableButton", function(e){
				event.stop(e);
				console.log("Table button clicked");
				initSolution("table");
			});

			aspect.after(controllerObject, "addNode",
				lang.hitch(dm, dm.addNode), true);
			
			aspect.after(controllerObject, "setConnections",
				lang.hitch(dm, dm.updateNodeConnections), true);

			aspect.after(controllerObject, "updateNodeView",
				lang.hitch(dm, dm.updateNode), true);

			aspect.before(dm, "deleteNode", function(nodeID){
				if(!_model.isStudentMode()){
					controllerObject.updateAssignedNode(nodeID, true);
				}
				controllerObject.computeNodeCount();
			}, true);

			aspect.after(dm, "deleteNode", function(nodeID){
				_session.saveModel(_model.model);
			}, true);

			aspect.after(controllerObject, "computeNodeCount", function(id){
				dm.updateNodeCount();
            });

			aspect.after(dm, "deleteEquationLinks", function(nodeIDs){
				console.log(nodeIDs);
				if(_model.isStudentMode()){
					controllerObject.enableEquation(nodeIDs);
				}
			}, true);

			on(registry.byId("closeButton"), "click", function(){
				registry.byId("nodeEditor").hide();
				console.log("uncomment code to close");
			});

			on(registry.byId("deleteButton"), "click", function(){
				controllerObject.activateDeleteNode();
				registry.byId("nodeEditor").hide();
				dm.deleteNode(controllerObject.currentID);
			});

			menu.add("doneButton", function (e) {
				event.stop(e);
				// This should return an object kind of structure and
				var problemComplete = controllerObject.checkDone();
				_session.saveModel(_model.model)
				if( problemComplete.errorNotes === "" ){
					// if in preview mode , Logging is not required:
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
				var solved = _model.matchesGivenSolution();
				_logger.logUserEvent({
					type: "menu-choice",
					name: "done-node",
					problemComplete: solved
				});
			});
			//all the things we need to do once node is closed
			aspect.after(registry.byId('nodeEditor'), "hide", function(){
				if(!_model.isStudentMode()){
					controllerObject.updateAssignedNode(controllerObject.currentID, false);
				}
				_session.saveModel(_model.model);
				dm.updateNode(_model.active.getNode(controllerObject.currentID), true);
			});

			aspect.after(registry.byId('solution'), "hide", function(){
				sol.hide();
				_session.saveModel(_model.model);
			});

			//loading schema table into local storage
			//send an asyn req to local json file
			var schemaReqParams = {
				url: "schema-table.json",
				handleAs: "json",
				load: function(data){
					//console.log("data received in main", data, typeof data);						
						if(!sessionStorage.getItem("schema_tab_topo")){
							sessionStorage.setItem("schema_tab_topo", JSON.stringify(data));
						}
						//console.log(sessionStorage);
					},
					error: function(error){
						//console.log("error occurred", error);
					}
				}

			var retSchemaObj = dojo.xhrGet(schemaReqParams);

			//refresh the schema_options_loaded param in the session storage which controls loading options into the editor
			sessionStorage.removeItem("schema_options_loaded");

		});
	});
	
	var exitTopomath = function(){
		console.log("Force Exit Topomath");
		// TODO: Add Logging
		console.log("Close Called!! ");
		if(window.history.length === 1)
			window.close();
		else
			window.history.back();
	};
	var sol;
	var initSolution = function(_type){
		sol = new Solution(_model);
		sol.render(_type);
	};
});
