define([
	'dojo/_base/unload'
], function(baseUnload){
	var logging = {
		_session: null,
		setSession: function(session){
			this._session = session;
		},
		//wrapper for session topomath logger
		eventLogger: function(_log){
			this._session.clientLog("ui-action", _log);
		},
		logger: function(type, _log){
			this._session.log(type, _log);
		},
		clientLog: function(_log){
			this._session.log(""
		}
	};

	//send runtime errors to log
    window.onerror = function(msg, url, lineNumber){
        var tempFile = url.split('/');
        var filename = tempFile[tempFile.length-1];
        logging.eventLogger("runtime-error", {
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

	return logging;
});
