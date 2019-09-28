define([
	"dojo/_base/declare", 
	"dojo/_base/array",
	"./equation",
	"./model"
], function(declare, array, equation){
	return declare(null,{

		constructor: function(model_object){
			this.curObj = model_object;
			this.authObj = model_object.authorModelNodes;
			this.studObj = model_object.studentModelNodes;
			this.schemaEqAr = [];
			this.posTracker = [];
		},

		updateModel: function(giveParams, giveSchema){
			var schema = "DRT";
			var getNewID = this.getLargestID()+1;
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
			var wrongAuthStatus = {
				description: {status: "correct"},
				entity: {status: "correct"},
				equation: {status: "incorrect", disabled: false},
				schemas: {status: "correct"},
			};
			var authStudIDMap = [];
			var studNameMap = [];
			//Initially fill in authStudIDMap with existing student node's authorId=studentID. Using this later what nodes have to be added or ignored can be decided
			for(var prop in this.studObj){
				if(this.studObj.hasOwnProperty(prop) && this.studObj[prop].hasOwnProperty("ID")){
					if(this.studObj[prop].authoredID)
						authStudIDMap[this.studObj[prop].authoredID] = this.studObj[prop].ID;
					if(this.studObj[prop].hasOwnProperty("variable")){
						studNameMap.push(this.studObj[prop].variable);
					}
				}
			}
			//traverse through authObj, looking for quantities to give first
			
			//separating the give parameters flag and give SChema flag because when give schema is set the associated constituent params or unknowns have to bear autogen names as per new design

			if(giveParams == "on"){ //giveParams is a new default setting (from LMS)
				for(var prop in this.authObj){
					//consider all param nodes from the author model
					if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "quantity" && this.authObj[prop].variableType == "parameter"){
						var curAuthID = this.authObj[prop].ID;
						var parentDet = this.findParentDetails(curAuthID);
						//if the authored ID is not already existing in studObj then we can add the node
						if(!authStudIDMap[curAuthID]){
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
			}
			/*
			for(var prop in this.authObj){
				//console.log("current prop is", prop, this.authObj.hasOwnProperty(prop));
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "quantity"){
					var curAuthID = this.authObj[prop].ID;
					var parentDet = this.findParentDetails(curAuthID);
					var schemaCheck = (giveSchema == "on") && (parentDet.schema == schema);
					var paramCheck = (giveParams == "on" ) && (this.authObj[prop].variableType == "parameter");
					if(!this.schemaEqAr.hasOwnProperty(schema)){
						this.schemaEqAr[schema] = this.getSchemaEqAr(schema);
					}
					var currentEqAr = equation.getVariableStrings(this.authObj[prop].selfEquation);
					if(!authStudIDMap[curAuthID] && (schemaCheck || paramCheck)){
							//get the variable name 
							var varName = this.authObj[prop].variableType == "parameter" ? this.authObj[prop].variable : this.getAutoGenVariableName(currentEqAr,this.authObj[prop].variable, schema)+parentDet.entityFW;
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
							variable: varName,
							variableType: this.authObj[prop].variableType
						}
						authStudIDMap[curAuthID] = "id" + getNewID;
						getNewID = getNewID + 1;
						this.updateAssistanceScore(curAuthID);
					} 
				}
			}
			*/
			if(giveSchema == "on"){
				for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "equation" && this.authObj[prop].schema == schema){
					var curAuthID = this.authObj[prop].ID;
					var curEntity = this.getRefinedEntity(this.authObj[prop].entity);
					var curNodeEq = this.getGeneratedStudentEquation(curEntity, this.getSchemaEq(this.authObj[prop].schema));
					var curNodeEqAr = equation.getVariableStrings(curNodeEq);
					var authEqAr = equation.getVariableStrings(this.authObj[prop].equation);
					var hasAlien = false;
					var studLinkMap = [];
					var localEqNodeIDCorresponder = [];
					//after the current node equation has been auto generated
					//create the constituent nodes with auto generated variable names
					for(var k = 0; k < authEqAr.length; k++){
						var getCurProps = this.findAuthProp(authEqAr[k]);
						var parentDet = this.findParentDetails(authEqAr[k]);
						var nodeNameAlreadyExists = this.findNodeNameDup(curNodeEqAr[k]);
						if( (getCurProps["variableType"] == "parameter" || (getCurProps["variableType"] == "unknown")) && authStudIDMap[authEqAr[k]] && !studNameMap.includes(curNodeEqAr[k]) && !nodeNameAlreadyExists.status){
							hasAlien = true;
							//parameters already are given as default, so the associated parameter has to be alien
							//if node is unknown but already existing
							this.studObj[snodesCount++] = {
								ID: "id"+ getNewID,
								attemptCount: {
									schema: 0,
									entity: 0,
									variables: 0,
								},
								authoredID: null,
								links: [],
								parentEquation: this.authObj[prop].equation,
								parentSchema: this.authObj[prop].schema,
								position: this.updateAlienPosition(this.authObj[prop].position, curAuthID),
								selfEquation: curNodeEq,
								status: {},
								type: "quantity",
								variable: curNodeEqAr[k]
							}
							studLinkMap[authEqAr[k]] = "id"+getNewID;
							localEqNodeIDCorresponder[curNodeEqAr[k]] = "id"+getNewID;
							getNewID = getNewID + 1;

						}
						else if( (getCurProps["variableType"] == "unknown" || getCurProps["variableType"] == "parameter") && !authStudIDMap[authEqAr[k]] && !studNameMap.includes(curNodeEqAr[k]) && !nodeNameAlreadyExists.status){
							//unknown node but does not exist so can be created
							this.studObj[snodesCount++] = {
							ID: "id" + getNewID,
							attemptCount: {
								schema: 1,
								entity: 0,
								variables: 0,
							},
							authoredID: authEqAr[k],
							color: getCurProps["color"],
							description: getCurProps["description"],
							links: getCurProps["links"],
							parentSchema: parentDet.schema,
							parentEquation: parentDet.equation,
							position: getCurProps["position"],
							selfEquation: curNodeEq,
							status: rightQtyStatus,
							type: "quantity",
							units: getCurProps["units"],
							value: getCurProps["value"],
							variable: curNodeEqAr[k],
							variableType: getCurProps["variableType"]
							}	
							authStudIDMap[authEqAr[k]] = "id" + getNewID;
							studLinkMap[authEqAr[k]] = "id" + getNewID;
							localEqNodeIDCorresponder[curNodeEqAr[k]] = "id"+getNewID;
							getNewID = getNewID + 1;
							this.updateAssistanceScore(authEqAr[k]);
						}
						else if(nodeNameAlreadyExists.status){
							localEqNodeIDCorresponder[curNodeEqAr[k]] = nodeNameAlreadyExists.authID;
							studLinkMap[authEqAr[k]] = nodeNameAlreadyExists.authID;
						}
					}
					
					if(this.authObj[prop].schema == schema && !authStudIDMap[curAuthID]){
						this.studObj[snodesCount++] = {
							ID: "id" + getNewID,
							attemptCount: {
								schema: 0,
								entity: 0,
								variables: 0,
							},
							authoredID: curAuthID,
							color: this.authObj[prop].color,
							entity: curEntity,
							explanation: this.authObj[prop].explanation,
							position: this.authObj[prop].position,
							schema: this.authObj[prop].schema,
							type: "equation",
							equation: this.getStudentEquation(curNodeEq, curNodeEqAr,localEqNodeIDCorresponder),
							links: this.getUpdatedStudentLinks(this.authObj[prop].links, studLinkMap),
							status: hasAlien ? wrongAuthStatus : rightAuthStatus,
							tweaked: hasAlien ? true : false
						}
						authStudIDMap[curAuthID] = "id" + getNewID;
						getNewID = getNewID + 1;
						this.updateAssistanceScore(curAuthID);		
					}
				}
				}	
			}
		},
		getLargestID: function(){
			//this function returns the largest number on the node ids from the current author and student model nodes
			var largest = 0;
			//traverse auth nodes
			for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("ID")){
					var nodeID = this.authObj[prop].ID;
					if(nodeID.length >= 2 && nodeID.slice(0, 2) == "id"){
						var n = parseInt(nodeID.slice(2));
						if(n && n > largest)
						largest = n;
					}
				}
			}
			//traverse stud nodes
			for(var prop in this.studObj){
				if(this.studObj.hasOwnProperty(prop) && this.studObj[prop].hasOwnProperty("ID")){
					var node = this.studObj[prop].ID;
					if(nodeID.length >= 2 && nodeID.slice(0, 2) == "id"){
						var n = parseInt(nodeID.slice(2));
						if(n && n > largest)
						largest = n;
					}
				}
			}
			return largest;
		},

		findParentDetails: function(nodeID){
			var parentDet = {"schema": "", "equation": "", "entityFW": ""};
			for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "equation"){
					var curEq = this.authObj[prop].equation;
					var varAr = equation.getVariableStrings(curEq);
					if(varAr.includes(nodeID)){
						parentDet["schema"] = this.authObj[prop].schema;
						parentDet["equation"] = this.authObj[prop].equation;
						var firstEnt = this.authObj[prop].entity.split(";")[0];
						var firstEntWord = firstEnt.split(" ")[0];
						parentDet["entityFW"] = firstEntWord;
						return parentDet;
						//break;
					}
				}
			}	
		},

		findAuthProp: function(id, property){
			for(var prop in this.authObj){
				if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("ID") && this.authObj[prop].ID == id){
					if(property)
						return this.authObj[prop].property;
					else
						return this.authObj[prop];
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

		getGeneratedStudentEquation: function(entity, schemaEq){
			var entityFW = entity.split(" ")[0];
			var schemaEqAr = equation.getVariableStrings(schemaEq);
			for(var i=0; i<schemaEqAr.length;i++){
				schemaEq = schemaEq.replace(schemaEqAr[i], "$"+schemaEqAr[i]);
			}
			for(var i=0; i<schemaEqAr.length;i++){
				schemaEq = schemaEq.replace("$"+schemaEqAr[i], schemaEqAr[i] + entityFW)
			}
			return schemaEq;
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
		},
		getAutoGenVariableName: function(currentEqAr, variableName, schema){
			var varNamePos;
			if(currentEqAr.length > 0){
				for(var i = 0; i < currentEqAr.length; i++){
					if(currentEqAr[i] == variableName){
						varNamePos = i;
						break;
					}
				}
				return this.schemaEqAr[schema][varNamePos];
			}
		},
		getSchemaEq: function(selectedSchema){
			var schemaTable = JSON.parse(sessionStorage.getItem("schema_tab_topo"));
			var property = "Equation";
			var propVal = '';
			for(var schemaCategory in schemaTable){
				var hasSchema = schemaTable[schemaCategory].some(function(schema){
								if(selectedSchema == schema["Name"]){
									//for the matched schema get appropriate property value
									propVal = schema[""+property];
									return true;
								}
							});
				if(hasSchema)
					break;
			}
			return propVal;
		},
		updateAlienPosition: function(masterPosition, masterId){
			var newSlavePos = {};
			var posMultiplier = 1;
			if(this.posTracker[masterId]){
				this.posTracker[masterId] = this.posTracker[masterId] + 1;
				posMultiplier = this.posTracker[masterId];
			}
			else{
				this.posTracker[masterId] = 1;
			}
			newSlavePos[0] = {'x': '', 'y': ''}
			newSlavePos[0].x = masterPosition[0].x;
			newSlavePos[0].y = masterPosition[0].y + posMultiplier*30;
			return newSlavePos;
		},
		getStudentEquation: function(equation, curNodeEqAr, eqIDLinker){
			//this function converts a human readable word equation to corresponding ids
			for(var i=0; i<curNodeEqAr.length; i++){
				equation = equation.replace(curNodeEqAr[i], "$"+curNodeEqAr[i]);
			}
			for(var i=0; i<curNodeEqAr.length; i++){
				equation = equation.replace("$"+curNodeEqAr[i], eqIDLinker[curNodeEqAr[i]]);
			}
			return equation;
		},
		findNodeNameDup: function(nodeName){
			for(var prop in this.studObj){
				if(this.studObj.hasOwnProperty(prop) && this.studObj[prop].hasOwnProperty("ID") && this.studObj[prop].variable == nodeName){
					return {"status": true, "authID": this.studObj[prop].ID};
				}
			}
			return {"status": false};
		}

	});
});