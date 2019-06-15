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
			console.log("giving", giveParams, giveSchema);
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
			//Initially fill in authStudIDMap with existing student node's authorId=studentID. Using this later what nodes have to be added or ignored can be decided
			for(var prop in this.studObj){
				if(this.studObj.hasOwnProperty(prop) && this.studObj[prop].hasOwnProperty("ID")){
					authStudIDMap[this.studObj[prop].authoredID] = this.studObj[prop].ID;
				}
			}
			//traverse through authObj, looking for quantities to give first
			
			//separating the give parameters flag and give SChema flag because when give schema is set the associated constituent params or unknowns have to bear autogen names as per new design

			if(giveParams == "on"){ //giveParams is a new default setting
				for(var prop in this.authObj){
					//consider all param nodes from the author model
					if(this.authObj.hasOwnProperty(prop) && this.authObj[prop].hasOwnProperty("type") && this.authObj[prop].type == "quantity" && this.authObj[prop].variableType == "parameter"){
						var curAuthID = this.authObj[prop].ID;
						console.log("cur auth id in", curAuthID, this.authObj[prop]);
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
			console.log("after leaving studObj", this.studObj);

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
					//after the current node equation has been auto generated
					//create the constituent nodes with auto generated variable names
					for(var k = 0; k < authEqAr.length; k++){
						console.log("authEqAr", authEqAr);
						var getCurProps = this.findAuthProp(authEqAr[k]);
						console.log("getCurProps", getCurProps);
						var parentDet = this.findParentDetails(authEqAr[k]);
						if(getCurProps["variableType"] == "parameter" || (getCurProps["variableType"] == "unknown") && authStudIDMap[authEqAr[k]] ){
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
							getNewID = getNewID + 1;

						}
						else if(getCurProps["variableType"] == "unknown" && !authStudIDMap[authEqAr[k]]){
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
							value: "",
							variable: curNodeEqAr[k],
							variableType: "unknown"
							}	
							authStudIDMap[authEqAr[k]] = "id" + getNewID;
							studLinkMap[authEqAr[k]] = "id" + getNewID;
							getNewID = getNewID + 1;
							this.updateAssistanceScore(authEqAr[k]);
						}
					}
					
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
							entity: curEntity,
							explanation: this.authObj[prop].explanation,
							position: this.authObj[prop].position,
							schema: this.authObj[prop].schema,
							type: "equation",
							equation: curNodeEq,
							links: this.getUpdatedStudentLinks(this.authObj[prop].links, studLinkMap),
							status: rightAuthStatus
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
					console.log("pdet",nodeID, curEq, varAr)
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
			//console.log(entity, entityFW, schemaEq, schemaEqAr);
			for(var i=0; i<schemaEqAr.length;i++){
				schemaEq = schemaEq.replace(schemaEqAr[i], "$"+schemaEqAr[i]);
			}
			for(var i=0; i<schemaEqAr.length;i++){
				schemaEq = schemaEq.replace("$"+schemaEqAr[i], schemaEqAr[i] + entityFW)
			}
			return schemaEq;
		},

		getUpdatedStudentLinks: function(authLinks, authStudIDMap){
			console.log("auth links are", authLinks);
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
			console.log("getAutoGendet", currentEqAr, variableName, schema, currentEqAr.length);
			var varNamePos;
			if(currentEqAr.length > 0){
				for(var i = 0; i < currentEqAr.length; i++){
					if(currentEqAr[i] == variableName){
						varNamePos = i;
						break;
					}
				}
				console.log(varNamePos, this.schemaEqAr)
				return this.schemaEqAr[schema][varNamePos];
			}
		},
		getSchemaEq: function(selectedSchema){
			console.log("selectedSchema", selectedSchema);
			var schemaTable = JSON.parse(sessionStorage.getItem("schema_tab_topo"));
			var property = "Equation";
			var propVal = '';
			for(var schemaCategory in schemaTable){
				var hasSchema = schemaTable[schemaCategory].some(function(schema){
					console.log(selectedSchema, schema["Name"]);
								if(selectedSchema == schema["Name"]){
									//for the matched schema get appropriate property value
									console.log("match found at", selectedSchema, schema, property)
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
			console.log("master position", masterPosition);
			var newSlavePos = {};
			var posMultiplier = 1;
			console.log("has tracker", this.posTracker[masterId]);
			if(this.posTracker[masterId]){
				this.posTracker[masterId] = this.posTracker[masterId] + 1;
				posMultiplier = this.posTracker[masterId];
			}
			else{
				this.posTracker[masterId] = 1;
			}
			console.log("new pos posMultiplier", posMultiplier);
			newSlavePos[0] = {'x': '', 'y': ''}
			newSlavePos[0].x = masterPosition[0].x;
			newSlavePos[0].y = masterPosition[0].y + posMultiplier*30;
			console.log("slave position", newSlavePos, this.posTracker);
			return newSlavePos;
		}

	});
});