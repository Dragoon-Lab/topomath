define([
	"dojo/_base/array", "dojo/_base/declare", "dojo/_base/lang",'dijit/registry',
], function(array, declare, lang, registry){
	return declare(null, {
		constructor: function(model){
			this.studentPMEnabled = true;
			this.model = model;
		},
		process: function(nodeID, nodePart, value, validInput, message, attemptCount, correctAnswer, logVal){
			var returnObj=[];
			var attemptCountCutoff = 2; //This number indicates number of attempts student gets without system providing the answer
			var solutionGiven = false;
			var interpretation;
			var logObj = {};
			switch(nodePart){
				case "schema":
					if(validInput && attemptCount <= attemptCountCutoff){
						returnObj.push({id:"schemas", attribute:"status", value:"correct"});
						registry.byId("entitySelectorStudent").set("disabled", false);
						registry.byId("schemaSelector").set("disabled", true);
						logObj = {
							checkResult: 'CORRECT'
						};
					}else{
						if(value == ""){
							returnObj.push({id:"schemas", attribute:"status", value:""});
							registry.byId("entitySelectorStudent").set("disabled", true);
						}
						else{
							console.log("attempt count at logging", attemptCount, attemptCountCutoff);
							if(attemptCount > attemptCountCutoff && correctAnswer){
								returnObj.push({id:"schemas", attribute:"status", value:"demo"});
								registry.byId("schemaSelector").set("value", correctAnswer);
								registry.byId("entitySelectorStudent").set("disabled", false);
								registry.byId("schemaSelector").set("disabled", true);
								solutionGiven = true;
								logObj = {
									checkResult: 'INCORRECT',
									correctValue: correctAnswer,
									pmInterpretation: "bottomUpHint"
								};	
							}else if(attemptCount <= attemptCountCutoff){
								returnObj.push({id:"schemas", attribute:"status", value:"incorrect"});
								registry.byId("entitySelectorStudent").set("disabled", true);
								logObj = {
									checkResult: 'INCORRECT',
									correctValue: correctAnswer,
									pmInterpretation: "keepTryingHint"
								};
							}
						}
					}
					returnObj.push({id:"message", attribute:"append", value:message});
					break;
				case "entity":
						if(validInput && attemptCount <= attemptCountCutoff){
							returnObj.push({id:"entity", attribute:"status", value:"correct"});
							logObj = {
								checkResult: 'CORRECT'
							};
							registry.byId("entitySelectorStudent").set("disabled", true);
						}else{
							if(value == ""){
								returnObj.push({id:"entity", attribute:"status", value:""});
								//registry.byId("entitySelectorStudent").set("disabled", true);
							}
							else{
								if(attemptCount <= attemptCountCutoff){
									returnObj.push({id:"entity", attribute:"status", value:"incorrect"});
									logObj = {
										checkResult: 'INCORRECT',
										correctValue: correctAnswer,
										pmInterpretation: "keepTryingHint"
									};	
								}
								else if(attemptCount > attemptCountCutoff && correctAnswer){
									returnObj.push({id:"entity", attribute:"status", value:"demo"});
									registry.byId("entitySelectorStudent").set("value", correctAnswer);
									registry.byId("entitySelectorStudent").set("disabled", true);
									solutionGiven = true;
									logObj = {
										checkResult: 'INCORRECT',
										correctValue: correctAnswer,
										pmInterpretation: "bottomUpHint"
									};
								}
							}
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
				case "description":
						if(validInput && (attemptCount == "green")){
							returnObj.push({id:"description", attribute:"status", value:"correct"});
							logObj = {
								checkResult: 'CORRECT'
							};
						}else{
							if(value == "")
								returnObj.push({id:"description", attribute:"status", value:""});
							else if(attemptCount == "yellow"){
								returnObj.push({id:"description", attribute:"status", value:"demo"});
								solutionGiven = true;
								logObj = {
									checkResult: 'INCORRECT',
									correctValue: correctAnswer,
									pmInterpretation: "bottomUpHint"
								};
							}
							else if(attemptCount == "red"){
								returnObj.push({id:"description", attribute:"status", value:"incorrect"})
								logObj = {
									checkResult: 'INCORRECT',
									correctValue: correctAnswer,
									pmInterpretation: "keepTryingHint"
								};
							}
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
				case "qtyDescription":
						console.log("in quantity description", value, validInput);
						if(validInput){
							if(value != "" && value != "defaultSelect"){
								returnObj.push({id:"qtyDescription", attribute:"status", value:"correct"});
								registry.byId("qtyDescriptionInputboxStudent").set("disabled", true);
								logObj = {
									checkResult: 'CORRECT'
								};
							}
						}
						else{
							if(!value){
								returnObj.push({id:"qtyDescription", attribute:"status", value:""});
								registry.byId("qtyDescriptionInputboxStudent").set("disabled", false);
							}
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
				case "variable":
						var nameID = this.model.student.getNodeIDByName(value);
						if(!nameID && validInput){
							returnObj.push({id:"message", attribute:"append", value:"node name is available for use"});
							returnObj.push({id:"variable", attribute:"status", value:"correct"});
							logObj = {
									checkResult: 'CORRECT'
							};

						}else if(!validInput){
							returnObj.push({id:"message", attribute:"append", value:"Please enter a valid name without using numbers"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
							logObj = {
									checkResult: 'INCORRECT',
									correctValue: correctAnswer,
									pmInterpretation: "keepTryingHint"
							};
						}else{
							returnObj.push({id:"message", attribute:"append", value:"Node name is already in use"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
							logObj = {
								checkResult: 'INCORRECT',
								correctValue: correctAnswer,
								pmInterpretation: "keepTryingHint"
							};
						}
						//console.log("return obj is",returnObj);
						break;
				default:
						throw new Error("Unknown type: "+ nodePart + ".");
			}
			var logNodePart = nodePart;
			if(nodePart == "qtyDescription") //it should still be logged as description
				logNodePart = "description";
			var logObj = lang.mixin({
					type: "solution-check",
					nodeID: nodeID,
					node: this.model.student.getDescription(nodeID),
					property: logNodePart,
					value: value,
					solutionProvided: solutionGiven,
			}, logObj);
			console.log("logobj is", logObj);
			if(logVal)
				this.logSolutionStep(logObj);
			return returnObj;
		},
		logSolutionStep: function(obj){
			//stub for logging user solution step
		}
	});
});