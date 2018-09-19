define([
	"dojo/_base/declare", 
	"dojo/request/xhr",
	"dojo/_base/json",
	"dojo/_base/lang"
], function(declare, xhr, json, lang){
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
			this.sessionId = FNV1aHash(params.u+"_"+params.s) +
				'_' + new Date().getTime();

			this._startTime = new Date().getTime();
			this.params = params;
			// Dragoon database requires that clientID be 50 characters.
			this.params.id = FNV1aHash(params.u+"_"+params.s) +
				'_' + new Date().getTime();
			this.path = path || "";
			this.doLogging = !params.l || params.l != "false";
			this.counter = 0;

			this.log("start-session", params);
			this.isStudentMode = (params.m != "AUTHOR" && params.m != "SEDITOR");
		},

		getModel: function(params){
			console.log("get model called with params " , params);
			return xhr.get(this.path + "task_fetcher.php", {
				query: params,
				handleAs: "json"
			}).then(lang.hitch(this, function(model_object){
				console.log("model object received", model_object);
				return model_object;
			}), lang.hitch(this, function(err){
				console.log("no model found", err);
			}));
		},

		saveModel: function(params){
			console.log("save model called with params", params);
			var object = {
					model: json.toJson(params),
					session_id: this.sessionId
				};
			xhr.post(this.path + "save_model.php", {
					data: object
			}).then(lang.hitch(this, function(reply){  // this makes saveProblem blocking?
				console.log("saveProblem worked: ", reply);
			}), lang.hitch(this, function(err){
				// Error in saving
				// Log this?
			}));
		},

		log: function(method, params, rsessionId){ //rsessionId for saving new problem
			// Add time to log message (allowing override).
			console.log("Logging method" ,method);
			if(this.doLogging){
				var p = lang.mixin({time: this.getTime()}, params);
				return xhr.post(this.path + "logger.php", {
					data: {
						method: method,
						message: json.toJson(p),
						x: rsessionId?rsessionId:this.sessionId,
						id: this.counter++
					}
				}).then(lang.hitch(this, function(reply){
					console.log("---------- logging " + method + ': ', p, " OK, reply: ", reply);
				}), lang.hitch(this, function(err){
					console.error("---------- logging " + method + ': ', p, " error: ", err);
					console.error("This should be sent to apache logs");
				}));
			}
		},
		getTime: function(){
			// Returns time in seconds since start of session.
			return	((new Date()).getTime() - this._startTime)/1000.0;
		}
	});
});
