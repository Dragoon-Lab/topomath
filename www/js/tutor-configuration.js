define([], function(){
	var properties = {
		STUDENT: {
			feedbackMode: "feedback",
			userType: "student",
			showActiveGraphOnly: false,
			dottedNodesUI: false,
			feedbacks: [
				"correct",
				"firstFailure",
				"lastFailure"
			]
		},

		NOFEEDBACK: {
			feedbackMode: "nofeedback",
			userType: "student",
			feedbacks: []
		},

		DEFAULT: {
			feedbackMode: "author",
			userType: "author",
			showActiveGraphOnly: true,
			dottedNodesUI: true,
			buttons: [
				"createQuantityNodeButton",
				"createEquationNodeButton",
				"graphButton",
				"tableButton",
				"doneButton"
			],
			feedbacks: [
				"correct"
			]
		}
	};

	// tutorial configuration for author mode is the default one
	var p = properties.DEFAULT;
	var Parameters = function(mode){
		if(mode in properties)
			p = Object.assign(properties.DEFAULT, properties[mode]);
	};

	Parameters.prototype = {
		get: function(key){
			return key in p ? p[key] : undefined;
		},
		set: function(key, value){
			p[key] = value;
		}
	};

	return (function(){
		var instance = null;
		var setInstance = function(mode){
			instance = new Parameters(mode);
		};

		return {
			getInstance: function(mode){
				if(instance == null)
					setInstance(mode);
				return instance;
			}
		};
	})();
});
