define([
	'dojo/ready',
	'dojo/aspect',
	'dojo/dom-geometry',
	'dijit/registry',
	'./session',
	'./model',
	'./equation',
	'./draw-model'
], function(ready, aspect, geometry, registry, session, model, equation, drawModel){
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
		});
	});
});
