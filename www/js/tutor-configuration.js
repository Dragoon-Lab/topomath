define(["dojo/_base/lang"], function(lang){
	var properties = {
		STUDENT: {
			feedbackMode: "feedback",
			userType: "student",
			feedbacks: [
				"correct",
				"firstFailure",
				"lastFailure"
			]
		},

		NOFEEDBACK: {
			feedbackMode: "nofeedback",
			userType: "student"
		},

		DEFAULT: {
			feedbackMode: "author",
			userType: "student",
			buttons: [
				"createQuantityNodeButton",
				"createEquationNodeButton",
				"graphButton",
				"tableButton",
				"doneButton"
			],
			feedbacks: [
				"correct",
				"incorrect"
			]
		}
	};

	var setParameters = function(mode){
		parameters = mode !== "AUTHOR" ? lang.mixin(properties.DEFAULT, properties[mode]) : properties.DEFAULT;
	};

	var parameters = {};

	var functions = function(mode){
		setParameters(mode);
		return {
			get: function(key){
				return parameters.hasOwnProperty(key) ? parameters[key] : undefined;
			}
		};
	};

	return functions;
});
