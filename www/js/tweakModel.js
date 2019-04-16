define([
	"dojo/_base/declare", 
	"dojo/_base/array",
	"./equation"
], function(declare, array, equation){
	return declare(null,{

		constructor: function(model_object){
			this.curObj = model_object;
			this.authObj = model_object.authorModelNodes;
			this.studObj = model_object.studentModelNodes;
		},
		/*
		copyParams: function(){
			var getNewID = this.getStartID()+1;
			var snodesCount = 0;
			var rightStatus = {
				description: {status: "correct", disabled: true},
				qtyDescription: {status: "correct"},
				units: {status: "correct", disabled: true},
				value: {status: "correct", disabled: true},
				variable: {status: "correct", disabled: true},
				variableType: {status: "correct", disabled: true}
			}
			//traverse through authObj
			for(var prop in this.authObj){
				//console.log("current prop is", prop, this.authObj.hasOwnProperty(prop));
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "quantity"){
					var curAuthID = this.authObj[prop].ID;
					var parentDet = this.findParentDetails(curAuthID);
					this.curObj["studentModelNodes"][snodesCount++] = {
						ID: "id" + getNewID++,
						attemptCount: {
							schema: 1,
							entity: 0,
							variables: 0,
						},
						authoredID: curAuthID,
						color: this.authObj[prop].color,
						description: this.authObj[prop].description,
						links: this.authObj[prop].links,
						parentSchema: parentDet.schema,
						parentEquation: parentDet.equation,
						position: this.authObj[prop].position,
						selfEquation: this.authObj[prop].selfEquation,
						status: rightStatus,
						type: "quantity",
						units: this.authObj[prop].units,
						value: this.authObj[prop].value,
						variable: this.authObj[prop].variable,
						variableType: this.authObj[prop].variableType
					}
					this.updateAssistanceScore(curAuthID); 
				}
			}
		},
		*/

		updateModel: function(showParams, showSchema){
			console.log("shows", showParams, showSchema);
			var schema = "DRT";
			var getNewID = this.getStartID()+1;
			var newObj = {};
			var snodesCount = 0;
			var rightQtyStatus = {
				description: {status: "correct", disabled: true},
				qtyDescription: {status: "correct"},
				units: {status: "correct", disabled: true},
				value: {status: "correct", disabled: true},
				variable: {status: "correct", disabled: true},
				variableType: {status: "correct", disabled: true}
			};
			var rightAuthStatus = {
				description: {status: "correct"},
				entity: {status: "correct"},
				equation: {status: "correct", disabled: true},
				schemas: {status: "correct"},
			};
			var authStudIDMap = [];
			//traverse through authObj
			for(var prop in this.studObj){
				if(this.studObj.hasOwnProperty(prop) && this.studObj[prop].hasOwnProperty("ID")){
					authStudIDMap[this.studObj[prop].authoredID] = this.studObj[prop].ID;
				}
			}
			for(var prop in this.authObj){
				//console.log("current prop is", prop, this.authObj.hasOwnProperty(prop));
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "quantity"){
					var curAuthID = this.authObj[prop].ID;
					var parentDet = this.findParentDetails(curAuthID);
					var schemaCheck = (showSchema == "on" && showParams != "on") ? ( parentDet.schema == schema ) : (showParams == "on"? true: false);
					if(schemaCheck && !authStudIDMap[curAuthID]){
							this.studObj[snodesCount++] = {
							ID: "id" + getNewID,
							attemptCount: {
								schema: 1,
								entity: 0,
								variables: 0,
							},
							authoredID: curAuthID,
							color: this.authObj[prop].color,
							description: this.authObj[prop].description,
							links: this.authObj[prop].links,
							parentSchema: parentDet.schema,
							parentEquation: parentDet.equation,
							position: this.authObj[prop].position,
							selfEquation: this.authObj[prop].selfEquation,
							status: rightQtyStatus,
							type: "quantity",
							units: this.authObj[prop].units,
							value: this.authObj[prop].value,
							variable: this.authObj[prop].variable,
							variableType: this.authObj[prop].variableType
						}
						authStudIDMap[curAuthID] = "id" + getNewID;
						getNewID = getNewID + 1;
						this.updateAssistanceScore(curAuthID);
					} 
				}
			}
			if(showSchema == "on"){
				for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "equation"){
					var curAuthID = this.authObj[prop].ID;
					var parentDet = this.findParentDetails(curAuthID);
					if(this.authObj[prop].schema == schema && !authStudIDMap[curAuthID]){
						console.log("adding", getNewID, this.authObj[prop]);
						this.studObj[snodesCount++] = {
							ID: "id" + getNewID,
							attemptCount: {
								schema: 0,
								entity: 0,
								variables: 0,
							},
							authoredID: curAuthID,
							color: this.authObj[prop].color,
							entity: this.getRefinedEntity(this.authObj[prop].entity),
							explanation: this.authObj[prop].explanation,
							position: this.authObj[prop].position,
							schema: this.authObj[prop].schema,
							type: "equation",
							equation: this.getUpdatedStudentEquation(this.authObj[prop].equation, authStudIDMap),
							links: this.getUpdatedStudentLinks(this.authObj[prop].links, authStudIDMap),
							status: rightAuthStatus
						}
						authStudIDMap[curAuthID] = "id" + getNewID;
						getNewID = getNewID + 1;
						this.updateAssistanceScore(curAuthID);		
					}
				}
				}	
			}
			console.log("updated DRTs obj", newObj);
		},
		getStartID: function(){
			var authObjLen = Object.keys(this.authObj).length;
			var studObjLen = Object.keys(this.studObj).length;
			return authObjLen+studObjLen;
		},

		findParentDetails: function(nodeID){
			var parentDet = {"schema": "", "equation": ""};
			for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "equation"){
					var curEq = this.authObj[prop].equation;
					var varAr = equation.getVariableStrings(curEq);
					if(varAr.includes(nodeID)){
						parentDet["schema"] = this.authObj[prop].schema;
						parentDet["equation"] = this.authObj[prop].equation;
						return parentDet;
						break;
					}
				}
			}	
		},

		getUpdatedStudentEquation : function(authEqn, authStudIDMap){
			var varAr = equation.getVariableStrings(authEqn);
			for(var i=0;i<varAr.length;i++){
				authEqn = authEqn.replace(varAr[i], "$"+varAr[i]+"$");
			}
			for(var i=0; i<varAr.length; i++){
				authEqn = authEqn.replace("$"+varAr[i]+"$", authStudIDMap[varAr[i]]);
			}
			return authEqn;
		},

		getUpdatedStudentLinks: function(authLinks, authStudIDMap){
			for(var i=0;i<authLinks.length;i++){
				var curLink = authLinks[i].ID;
				authLinks[i].ID = authStudIDMap[curLink];
			}
			return authLinks;
		},

		getRefinedEntity: function(authEnt){
			var finalEnt = authEnt.split(";");
			return finalEnt[0];
		},

		updateAssistanceScore: function(authID){
			for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("ID") && this.authObj[prop].ID == authID){
					this.authObj[prop].attemptCount.assistanceScore = 1;
				}
			}
		}

	});
});