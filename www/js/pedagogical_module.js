/**
 * Pedagogical Module class used to solve Topomath  problems
 **/

/* global define */

define([
	"dojo/_base/array", "dojo/_base/declare", "dojo/_base/lang", "./equation", "dojo/dom"
], function(array, declare, lang, check, dom){
	// Summary: 
	//			Processes student selections and returns instructions to the 
	//			program
	// Description:
	//			A pedagogical module that accepts student entries, and returns 
	//			an object with the ID of the node, a message with encouragement 
	//			or a hint, and the status of the attempt (correct, incorrect, 
	//			demo, or premature).
	// Tags:
	//			pedagogical module (PM), student mode, coached mode

	var hints = {
		erasedCorrect: [
			"Your choice did not match the author's answer so it is being given to you. However, your previous work matched the author's answer. It will continue to be marked this way."
		],
		erasedDemo: [
			"Your choice matched the author's answer, however this part was previously completed by the model. It will continue to be marked this way."
		]
	};

	var descriptionTable = {
		// Summary: This table is used for determining the proper response to a student's 'description' answer (see 
		//		'Pedagogical_Module.docx' in the documentation)
		correct: {
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "correct", /*message*/ "correct", /*disable*/ true);
			}
		},
		incorrect:{
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "incorrect", /*message*/ "incorrect", /*disable*/ false);
			}
		},
		firstFailure: {
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "incorrect", /*message*/ "incorrect", /*disable*/ false);
			}
		},
		secondFailure:{
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "demo", /*message*/ "secondFailure", /*disable*/ true);
			}
		}
	};

	var nodeEditorActionTable = {
		// Summary: This table is used for determining the proper response to a student's answers in the 
		//		remaining sections (see 'Pedagogical_Module.docx' in the documentation)

		//		Node Editor action table will be used for any activity that uses existing node editor.
		//		All the actions remain same, only add additional field(s) in _getInterpretation and _enableNext
		correct: {
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "correct", /*message*/ "correct", /*disable*/ true);
			}
		},
		incorrect:{
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "incorrect", /*message*/ "incorrect", /*disable*/ false);
			}
		},
		firstFailure: {
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "incorrect", /*message*/ "incorrect", /*disable*/ false);
			}
		},
		secondFailure:{
			feedback: function(obj, part){
				followUpTasks(obj, part, /*state*/ "demo", /*message*/ "secondFailure", /*disable*/ true);
			}
		}
	};
	
	/*
	 * Add additional tables for activities that does not use node editor.
	 */
	function followUpTasks(obj , part, /*state*/ stateVal, /*message*/ messageVal, /*disable*/ disabledVal){
		if(stateVal !== undefined || stateVal !== ""){
			state(obj, part, stateVal);
		}
		if(messageVal !== undefined || messageVal !== ""){
			message(obj, part, messageVal);
		}
		if(disabledVal !== undefined || disabledVal !== ""){
			disable(obj, part, disabledVal);
		}
	}


	/*****
	 * Summary: The following four functions are used by the above tables to push
	 *		statuses and messages to the return object array.
	 *****/
	function value(/*object*/ obj, /*string*/ nodePart, /*string*/ value){
		obj.push({id: nodePart, attribute: "value", value: value});
	}

	function state(/*object*/ obj, /*string*/ nodePart, /*string*/ status, /*value*/ value){
		obj.push({id: nodePart, attribute: "status", value: status});
		if(status==="premature"){
			obj.push({id: nodePart, attribute: "value", value: ""});
		}
	}

	function message(/*object*/ obj, /*string*/ nodePart, /*string*/ status){
		// TO DO : Add Hint messages
		if(status === "lastFailure" || status === "secondFailure"){
			status = "incorrect. The correct answer has been given";
		}
		obj.push({id: "message", attribute: "append", value: "The value entered for the " + nodePart + " is " + status + "."});
	}

	function disable(/*object*/ obj, /*string*/ nodePart, /*boolean*/ disable){
		obj.push({id: nodePart, attribute: "disabled", value: disable});
	}

	function display(/*object*/ obj, /*string*/ nodeDiv, /*string*/ display){
		obj.push({id: nodeDiv, attribute: "display", value: display});
	}

	/*****
	 *
	 * Builds class that is used by controller to check student answers
	 *
	 *****/	
	return declare(null, {
		constructor: function(/*string*/ mode, /*model.js object*/ model){
			this.model = model;
			this.mode = mode;
			this.showCorrectAnswer = true;
			this.enableNextFromAuthor = true;
			this.userType = "feedback";
		},
		matchingID: null,
		logging: null,
		descriptionCounter: 0,
		_assessment: null,
		nodeOrder: [],
		nodeCounter: 0,

		/*****
		 * Private Functions
		 *****/
		_getInterpretation: function(/*string*/ studentID, /*string*/ nodePart, /*string | object*/ answer){
			// Summary: Returns the interpretation of a given answer (correct, incorrect, etc.)
			//
			// Tags: Private
			var interpretation = null;
			var model = this.model; //needed for anonymous function in the interpret variable.
			var showCorrectAnswer = this.showCorrectAnswer;
			// Retrieves the authoredID for the matching given model node
			var authoredID = this.model.student.getAuthoredID(studentID);

			if(interpretation === "secondFailure"){
				answer = this.model.student.getCorrectAnswer(id, nodePart);
			}

			// Anonymous function assigned to interpret--used by most parts of the switch below
			var interpret = function(correctAnswer){
				console.log("nodePart", nodePart);
				//we create temporary answer and temporary correct answer both parsed as float to compare if the numbers are strings in case of execution
				answer_temp1=parseFloat(answer);
				correctAnswer_temp1=parseFloat(correctAnswer);
				if(answer === correctAnswer || correctAnswer === true || answer_temp1 == correctAnswer_temp1){
					interpretation = "correct";
				}else{
					if(model.authored.getAttemptCount(authoredID, nodePart) > 0 ){
						interpretation = "secondFailure"
					}else{
						interpretation = "firstFailure";
					}
				}
			};

			switch(nodePart){
				case "description":
					this.descriptionCounter++;
					if(this.model.active.getType(studentID) === this.model.authored.getType(authoredID)){
						interpretation = "correct";
					}else{
						if(model.authored.getAttemptCount(authoredID, nodePart) > 0 ){
							interpretation = "secondFailure"
						}else{
							interpretation = "firstFailure";
						}
					}
					break;
				case "variable":
					interpret(this.model.authored.getVariable(authoredID));
					break;
				case "variableType":
					interpret(this.model.authored.getVariableType(authoredID));
					break;
				case "units":
					interpret(this.model.authored.getUnits(authoredID));
					break;
				case "value":
					interpret(this.model.authored.getValue(authoredID));
					break;
				case "equation":
					// Solver
					interpret(check.evaluate(this.model, studentID));
					break;
			}
			return interpretation;
		},

		/*****
		 * Public Functions
		 *****/

		getActionForType: function(id, answer){
			/*
			* This function gives node properties to be shown as per the values
			* entered by the user for the node.
			* This is called when the user reopens a node.
			*/
			var nodePart = "variableType";
			var interpretation = this._getInterpretation(id, nodePart, answer);
			var obj = [];
			var returnObj = [];
			nodeEditorActionTable[interpretation][this.userType](returnObj, nodePart, answer);
			console.log("Return Obj" , returnObj);
			return returnObj;
		},

		processAnswer: function(/*string*/ id, /*string*/ nodePart, /*string | object*/ answer,/*string*/ answerString){
			// Summary: Pocesses a student's answers and returns if correct, 
			//		incorrect, etc. and alerts the controller about what parts 
			//		of the node editor should be active.
			//
			// Tags: Private
			var actual_id = this.model.student.getAuthoredID(id);
			console.log("actual id is",actual_id);
			var interpretation = this._getInterpretation(id, nodePart, answer);
			var returnObj = [], currentStatus;
			var givenID ;  // ID of the correct node, if it exists
			var solutionGiven = false;
			var givenAnswer = answer; //keeping a copy of answer for logging purposes.
			
			if(interpretation === "lastFailure" || interpretation === "secondFailure"){
				answer = this.model.student.getCorrectAnswer(id, nodePart);
				/*TO DO : Add Equation*/
				if(answer == null){
					if(nodePart === "description"){
						returnObj.push({id: "message", attribute: "append", value: "You have already created all the necessary nodes."});
					}else
						console.error("Unexpected null from model.getCorrectAnswer().");
				}else{
					returnObj.push({id: nodePart, attribute: "value", value: answer});
					solutionGiven = true;
				}
			}

			var updateStatus = function(returnObj, model){
				
				returnObj.forEach(function(i){
					if(i.attribute === "status"){
						if(i.value === "correct"){
							if(model.authored.getStatus(givenID, nodePart) !== "demo"){
								model.authored.setStatus(givenID, nodePart, "correct");
							}else{
								i.value = "demo";
								returnObj.forEach(function(j){
									if(j.id === "message"){
										j.value = hints.erasedDemo;
									}
								});
							}
						}else if(i.value === "demo"){
							if(model.authored.getStatus(givenID, nodePart) !== "correct")
								model.authored.setStatus(givenID, nodePart, "demo");
							else{
								i.value = "correct";
								returnObj.forEach(function(j){
									if(j.id === "message"){
										j.value = hints.erasedCorrect;
									}
								});
							}
						}
						else{
							model.authored.setStatus(givenID, nodePart, "incorrect");
						}
					}
				});
			};
			if(answer){
				if(nodePart === "description"){
					givenID = answer;
					descriptionTable[interpretation][this.userType](returnObj, nodePart);
					for(var i = 0; i < returnObj.length; i++){
						if(returnObj[i].value === "correct"){
							currentStatus = this.model.authored.getStatus(givenID, nodePart); //get current status set in given module
							// Set failure attempts based on current status
							if(currentStatus === "")
								this.model.authored.setStatus(givenID, nodePart, returnObj[i].value);
							else
								updateStatus(returnObj, this.model);
							this.descriptionCounter = 0;
							this.model.active.setPosition(id, 0, this.model.authored.getPosition(givenID,0));
						}
					}
				}else{
					givenID = this.model.student.getAuthoredID(id);
					console.assert(nodeEditorActionTable[interpretation], "processAnswer() interpretation '" + interpretation + "' not in table ", nodeEditorActionTable);
					nodeEditorActionTable[interpretation][this.userType](returnObj, nodePart, answer);
					currentStatus = this.model.authored.getStatus(givenID, nodePart); //get current status set in given model
					if (currentStatus !== "correct") {
						this.model.authored.setAttemptCount(givenID, nodePart, this.model.authored.getAttemptCount(givenID, nodePart) + 1);
						for (var i = 0; i < returnObj.length; i++){
							if (returnObj[i].value === "incorrect") {
								this.model.student.incrementAssistanceScore(id);
							}
						}
					}else if(currentStatus == "correct"){
						if(nodePart === "variableType"){
							this.model.active.setPosition(id, 1, this.model.authored.getPosition(givenID, 1));
						}
					}
					updateStatus(returnObj, this.model);
				}
			}
			return returnObj;
		}
	});
});
