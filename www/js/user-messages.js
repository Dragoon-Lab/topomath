define([], function(){
	var graphError = {
		"incorrect.01": ["There are no equation nodes in the model. Please create some equation nodes and then check the graph."],
		"incorrect.02": ["There are no nodes in the model. Please create some nodes and then check the graph."],
		"incorrect.03": ["There is an unknown node <b>", "</b> used in the <b>", " field</b> of the <b>", "</b> node. Please check the spelling of all the nodes you have entered in the expression"], 
		"incorrect.04": ["Unfortunately, your model's behavior does not match the author's"],
		"incorrect.05": ["Not all the nodes  have been completed. For example, <b>", "</b> has an empty <b>", "</b> field"],
		"correct.01": ["Congratulations, Your model's behavior matches the author's!"],
	};
debugger;
	var pedagogical = {
		hints: {
			erasedCorrect: [
				"Your choice did not match the author's answer so it is being given to you. However, your previous work matched the author's answer. It will continue to be marked this way."
			],
			erasedDemo: [
				"Your choice matched the author's answer, however this part was previously completed by the model. It will continue to be marked this way."
			]
		},
		feedback: {
			start: "The value entered for the ",
			connector: " is ",
			lastFailure: "incorrect. The correct answer has been given.",
			secondFailure: "incorrect. The correct answer has been given.",
			incorrect: "incorrect.",
			correct: "correct."
		}
	};

	var global = {
		"doesntExist": "The problem that you are trying to reach does not exist. Please check the problem, section and folder names and try again."
	};

	return {
		get: function(type){
			var obj = {
				"graph": graphError,
				"pm": pedagogical,
				"app": global
			}

		 	return obj.hasOwnProperty(type) ? obj[type]: null;
		},
	};
});
