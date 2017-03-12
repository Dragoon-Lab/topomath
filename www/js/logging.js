define([
	'dojo/_base/unload',
	'dojo/aspect',
	'./controller'
], function(baseUnload, aspect, controller){
	var logging = {
		_session: null,
		instance: null,
		setSession: function(session){
			this._session = session;
		},
		/**
		* this is for general logging message with not a fixed type, used for logging runtime
		* error messages and window on focus and on blur events.
		* @params:	type - type of logging message - like "runtime-error"
		*			_log - json object with key values that are to be logged.
		*/
		log: function(type, _log){
			this._session.log(type, _log);
		},
		//wrappers for session topomath logger
		/**
		* this logs each and every user events, like node opening, closing, solution entering
		* @params:	_log: message which is a json object with all the keys and values to be logged.
		*/
		logUserEvent: function(_log){
			this.log("ui-action", _log);
		},
		/**
		* this is for client messages which are of the format that there are errors that we
		* have in try catch. like there was an error where initial value was not a number.
		* @params:	_log: json object with key and values that are converted to string and logged
		*/
		logClientMessages: function(type, _log){
			switch(type){
				case "error":
				case "assert":
					console.error(_log.message);
					break;
				case "warning":
					console.warn(_log.message);
					break;
			}
			this.log("client-message", _log);
		}
	};

	/**
	* non intrusive way for logging use aspect.after and log the events.
	* this way any object that would be created using controller
	* when ever showNodeEditor would end, this logging message will be called
	* we can use this idea to log a lot of user messages and just
	* create internal function and remove logging from the objects directly ~ Sachin
	* 
	aspect.after(controller.prototype, "showNodeEditor", function(id){
		console.log("logging node opening event for showNodeEditor for node ID ", id);
		logging.logUserEvent({
			type: 'open-dialog-box',
			name: 'node-editor',
			nodeID: id,
			nodeType: this._model.active.getType(id),
			node: this._model.active.getVariable || this._model.active.getDescription(id)
		});
	}, true);
	*/

	//send runtime errors to logi
	window.onerror = function(msg, url, lineNumber){
		var tempFile = url.split('/');
		var filename = tempFile[tempFile.length-1];
		logging.log("runtime-error", {
			message: msg,
			file: filename,
			line: lineNumber
		});
		return false;
	};

	//send in focus event to logs
	window.onfocus = function(){
		logging.log('window-focus', {
			type:"in-focus"
		});
	};

	//send window out of focus message to logs
	window.onblur = function(){
		logging.log('window-focus', {
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
		logging.logUserEvent({
			type: "window",
			name: "close-button"
		});
	});
	/*
	* created this to ensure that we dont need to explicitly create and send logger to each file
	* now we just need to include it and the same object will be used everywhere.
	*/
	return (function(){
		var instance = null;
		var setInstance = function(session){
			instance = logging;
			instance.setSession(session);
			return instance;
		};
		/**
		* we need session only once after that we can get the instance without it.
		* this is the idea that will be used.
		* we just need to include the file and the call <object name>.getInstance()
		* look for how singleton works online. I have included that in controller.js
		* ~ Sachin
		*/
		return {
			getInstance: function(session){
				if(!instance){
					instance = setInstance(session);
				}
				return instance;
			}
		};
	})();
});
