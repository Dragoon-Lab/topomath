define([
	"dojo/_base/declare", 
	"dojo/request/xhr"
], function(declare, xhr){
	// Summary:
	//          Loads and saves sessions and sets up logging
	// Description:
	//          Manage sessions and communicate with the server, including
	//          logging
	// Tags:
	//          save session, logging

		// FNV-1a for string, 32 bit version, returning hex.
	var FNV1aHash = function(x){
		var hash = 0x811c9dc5; // 2166136261
		for(var i = 0; i < x.length; i++){
		hash ^= x.charCodeAt(i);
			hash *= 0x01000193; // 16777619
		}
		hash &= hash; // restrict to lower 32 bits.
		// javascript doesn't handle negatives correctly
		// when converting to hex.
		if(hash<0){
			hash = 0xffffffff + hash + 1;
		}
		return Number(hash).toString(16);
	};

	return declare(null, {
		constructor: function(params, path){
			this._startTime = new Date().getTime();
			this.params = params;
			// Dragoon database requires that clientID be 50 characters.
			this.params.id = FNV1aHash(params.u+"_"+params.s) +
				'_' + new Date().getTime();
			this.path = path || "";
		},

		getModel: function(params){
			return xhr.get(this.path + "task_fetcher.php", {
				query: params,
				handlerAs: "json"
			}).then(lang.hitch(this, function(model_object){
				console.log("model object received", model_object);
				return model_object;
			}), lang.hitch(this, function(err){
				console.log("no model found", err);
			}));
		}
	});
});
