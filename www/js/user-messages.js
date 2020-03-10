define([], function(){
	var graphError = {
		"empty.model": ["There is nothing to plot. Please create some nodes and then check the graph."],
		"no.equations": ["There are no equations in the model. Please create some equations and then check the graph."],
		"unknown.node": ["There is an unknown node <b>", "</b> used in the <b>", " field</b> of the <b>", "</b> node. Please check the spelling of all the nodes you have entered in the expression"], 
		"incorrect": ["Unfortunately, your model's behavior does not match the author's"],
		"model.incomplete": ["Not all the nodes have been completed. For example, <b>", "</b> has an empty <b>", "</b> field"],
		"correct": ["Congratulations, Your model's behavior matches the author's!"],
		"decomposition": ["There is something wrong with the equations. Solver says that the system of equation is not solvable. Kindly, try rearranging the variables, like if you are dividing some variables, then try to multiply them on the other side of the equation, and try again."],
		"variable.mismatch": ["Number of equations do not match the number of unknown quantities. Please check the system that you have created."],
		"no.parameters.static": ["There are no parameters to graph the unknowns against."],
		"default": ["Something went wrong. Please ask your instructor to help you. Thanks!"],
		"no.variables": ["System of equations has no unknown or dynamic variables to solve."],
		"inconsistent.system": ["The number of equations is greater than the number of variables, and the solver can not decide which equations to remove for calculating the solution"],
		"under.determined.system": ["The number of equations is less than the number of unknown variables, so the system is not solvable."],
		"overdetermined.no.solution": ["The number of equations is greater than the number of variables, and no single solution solves all of them."],
		"static.singular.matrix": ["Unable to calculate solutions for some values of the parameters.  Graphs are shown with interpolated values instead."],
		"model.uninitialized": ["You have an unfinished equation node.  Please complete it or delete it."]
	};

	var pedagogical = {
		hints: {
			erasedCorrect: [
				"Your choice did not match the author's answer so it is being given to you. However, your previous work matched the author's answer. It will continue to be marked this way."
			],
			erasedDemo: [
				"Your choice matched the author's answer, however this part was previously completed by the model. It will continue to be marked this way."
			],
			irrelevant: [
				"The quantity is irrelevant to this problem.  Choose a different one.",
				"This quantity is irrelevant for modeling the system.  Try again.",
				"Irrelevant.  Try again."
			]
		},
		feedback: {
			start: "The value entered for the ",
			connector: " is ",
			lastFailure: "incorrect. The correct answer has been given.",
			bottomUpHint: "incorrect. The correct answer has been given.",
			incorrect: "incorrect.",
			correct: "correct.",
			partial: "true. But the author would like you to use the following variables in it: ",
			irrelevant: "irrelevant."
		}
	};

	var global = {
		"doesnt.exist": "This problem could not be loaded. Please contact the problem's author.",
		"missing.info": "The problem could not be loaded as there is some wrong with the information provided.",
		"new.problem": "A new problem has been created. If you were trying to load a pre-existing problem, please check the name of the problem you have entered.",
		"duplicate.nodes": "Nodes in the problem have duplicate node ID. ",
		"duplicate.nodes.student": "This problem could not be loaded. Please contact the problem's author.",
		"solution.missing": "The solution of the model is incomplete.  Please contact the author.",
		"old.version": "Don't open the node editor. Don't drag nodes. Look but don't touch. This was made in an old version of TopoMath."
	};

	return {
		get: function(type){
			var obj = {
				"graph": graphError,
				"pm": pedagogical,
				"app": global
			}

			return obj.hasOwnProperty(type) ? obj[type]: null;
		}
	};
});
