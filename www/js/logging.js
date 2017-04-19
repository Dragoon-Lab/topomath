define([
	'dojo/_base/unload',
	'dojo/on',
	'dojo/aspect',
	'./controller'
], function(baseUnload, on, aspect, controller){
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
