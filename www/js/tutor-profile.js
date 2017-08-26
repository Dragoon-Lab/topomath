define(["dojo/_base/lang"], function(lang){
	var properties = {
		STUDENT: {
			userType: "feedback",
			feedbacks: [
				"correct",
				"firstFailure",
				"lastFailure"
			]
		},

		TEST: {
			userType: "nofeedback",
		},

		DEFAULT: {
			userType: "author"
			buttons: [
				""
			],
			feedbacks: [
				"correct",
				"incorrect"
			],
		}
	};

	var parameters = function(mode){
		return lang.mixin(properties[mode], properties.DEFAULT);
	}

	var functions = {
		get: function(){
			
		}
		
	};

	return functions;
});
