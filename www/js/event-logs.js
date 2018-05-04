define([
	'dojo/_base/unload', 
	'dojo/aspect',
	'dojo/ready',
	'./controller',
	'./pedagogical-module',
	'./render-solution',
	'./logging',
], function(baseUnload, aspect, ready, controller, pm, solution, logging){
	var _logger = null;
	/**
	* non intrusive way for logging use aspect.after and log the events.
	* this way any object that would be created using controller
	* when ever showNodeEditor would end, this logging message will be called
	* we can use this idea to log a lot of user messages and just
	* create internal function and remove logging from the objects directly ~ Sachin
	*/
	aspect.after(controller.prototype, "showNodeEditor", function(id){
		_logger.logUserEvent({
			type: 'open-dialog-box',
			name: 'node-editor', 
			nodeID: id,
			nodeType: this._model.active.getType(id),
			node: this._model.active.getVariable(id) || this._model.active.getDescription(id)
		});
	}, true);

	aspect.after(controller.prototype, "logSolutionStep", function(obj){
		_logger.log("solution-step", obj);
	}, true);

	aspect.after(controller.prototype, "closeEditor", function(id){
		_logger.logUserEvent({
			type: 'close-dialog-box',
			nodeID: id,
			node: this._model.active.getVariable(id) || this._model.active.getDescription(id),
			nodeComplete: this._model.active.isComplete(id)
		});
	}, true);

	aspect.after(pm.prototype, "logSolutionStep", function(obj){
		_logger.log("solution-step", obj);
	}, true);

	aspect.after(solution.prototype, "render", function(tab){
		_logger.logUserEvent({
			name: tab+"-button",
			type: "menu-choice",
			problemComplete: this._model.matchesGivenSolution()
		});
	}, true);

	aspect.after(solution.prototype, "fireLogEvent", function(args){
		_logger.logUserEvent({
			type: "solution-manipulation",
			name: args[0],
			nodeID: args[1],
			node: this._model.active.getVariable(args[1]) || this._model.active.getDescription(args[1]),
			value: args.length > 1 ? args[2] : null
		});
	}, true);

	aspect.after(solution.prototype, "hide", function(){
		_logger.logUserEvent({
			type: "menu-choice",
			name: "graph-closed"
		});
	});

	//send runtime errors to log
	window.onerror = function(msg, url, lineNumber){
		var tempFile = url.split('/');
		var filename = tempFile[tempFile.length-1];
		_logger.log("runtime-error", {
			message: msg,
			file: filename, 
			line: lineNumber
		});
		return false;
	};

	//send in focus event to logs
	window.onfocus = function(){
		_logger.log('window-focus', {
			type:"in-focus"
		});
	};  

	//send window out of focus message to logs
	window.onblur = function(){
		_logger.log('window-focus', {
			type:"out-of-focus"
		});
	};  

	//ask the user to save the model message
	//TODO: remove this commented code once we need to ensure user saves the data
	/*  
	window.onbeforeunload = function(event){
		if(window.isModelChanged && window.getComputedStyle(document.getElementById("doneButton")).display !== "none"){
			event.returnValue = "To ensure that your work is saved, please hit Done button before closing the window.";
		}
	};  
	*/

	//log the window closing message
	baseUnload.addOnUnload(function(){
		_logger.logUserEvent({
			type: "window",
			name: "close-button"
		});
	});

	return (function(){
		return { 
			setLogging: function(){
				_logger = logging.getInstance();
			}
		};
	})();
});
