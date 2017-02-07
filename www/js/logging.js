define([
	'dojo/_base/unload'
], function(baseUnload){
	var logging = {
		_session: null,
		instance: null,
		setSession: function(session){
			this._session = session;
		},
		//wrapper for session topomath logger
		/**
		* this logs each and every user events, like node opening, closing, solution entering
		* @params:	_log: message which is a json object with all the keys and values to be logged.
		*/
		eventLogger: function(_log){
			this.logger("ui-action", _log);
		},
		/**
		* this is for general logging message with not a fixed type, used for logging runtime
		* error messages and window on focus and on blur events.
		* @params:	type - type of logging message - like "runtime-error"
		*			_log - json object with key values that are to be logged.
		*/
		logger: function(type, _log){
			this._session.log(type, _log);
		},
		/**
		* this is for client messages which are of the format that there are errors that we
		* have in try catch. like there was an error where initial value was not a number.
		* @params:	_log: json object with key and values that are converted to string and logged
		*/
		clientLog: function(type, _log){
			switch(type){
				case "error":
				case "assert":
					console.error(_log.message);
					break;
				case "warning":
					console.warn(_log.message);
					break;
			}
			this.logger("client-message", _log);
		}
	};

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

	//send runtime errors to log
    window.onerror = function(msg, url, lineNumber){
        var tempFile = url.split('/');
        var filename = tempFile[tempFile.length-1];
        logging.logger("runtime-error", {
            message: msg,
            file: filename, 
            line: lineNumber
        });
        return false;
    };

    //send in focus event to logs
    window.onfocus = function(){
        logging.logger('window-focus', {
            type:"in-focus"
        });
    };

    //send window out of focus message to logs
    window.onblur = function(){
        logging.logger('window-focus', {
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
        logging.eventLogger({
            type: "window",
            name: "close-button"
        });
    });

	//return SingletonLogger;
});
