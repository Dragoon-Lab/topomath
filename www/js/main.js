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
], function(array, geometry, style, aspect, ready, registry, menu, event, session, model, equation, drawModel, controlAuthor){

	var query = {
		'u': 'temp',
		'p': 'rabbits',
		'm': 'AUTHOR',
		's': 'temp-section'
	};
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
			}, true);
	

			//create a menuButtons array and push the list of button Ids which go to the main menu bar
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
				controllerObject.showQuantityNodeEditor(id);	
			});

			//next step is to add action to add equation
			menu.add("createEquationNodeButton", function(e){
				event.stop(e);
				//give a fake id for now
				var id = "id1";
				controllerObject.showEquationNodeEditor(id);	
			});
		});
	});	
});	
