/* global define */

/*
 * Student mode-specific handlers
 */

define([
	"dojo/aspect",
	"dojo/_base/array",
	'dojo/_base/declare',
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-style",
	'dojo/store/Memory',
	"dojo/ready",
	"dojo/on",
	"dojo/dom-construct",
	"dijit/focus",
	'dijit/registry',
	"dijit/TooltipDialog",
	"dijit/popup",
	"dojo/query",
	'./controller',
	"./pedagogical-module",
	"./typechecker",
	"./equation"
], function(aspect, array, declare, lang, dom, domClass, style, memory, ready,on,
 domConstruct, focusUtil, registry, tooltipDialog, popup, query, controller, PM, typechecker, expression) {
	/* Summary:	// Summary:
	 //			MVC for the node editor, for students
	 // Description:
	 //			Handles selections from the student as he/she completes a model;
	 //			inherits controller.js
	 // Tags:
	 //			controller, student mode

	 /*
	 Methods in controller specific to the student modes
	 */

	return declare(controller, {
		_PM: null,
		_assessment: null,
		constructor: function (mode, model) {
			console.log("++++++++ In student constructor");
			lang.mixin(this.widgetMap, this.controlMap);
			this._PM = new PM(model, this._config.get("feedbackMode"), this._fixPosition);
			ready(this, "populateSelections");
			// used in equation done handler to handle scenario of new nodes created
			// from demo nodes
			this.demoParse = null;
			this.studentControls();
			this.variableUpdateBySystem = false;
			this.deleteNodeActivated = false;
			this.ambigiousSchemas = ["P2W","P3W","P4W","P5W","A2","A3","A4","M2","M3","M4"];
		},
		studentPM:{
			process: function(nodeID, nodeType, value, validInput, message, attemptCount, correctAnswer){
				var returnObj=[];
				switch(nodeType){
					case "schema":
						if(validInput && attemptCount <= 1){
							returnObj.push({id:"schemas", attribute:"status", value:"correct"});
							registry.byId("entitySelectorStudent").set("disabled", false);
							registry.byId("schemaSelector").set("disabled", true);
						}else{
							if(value == ""){
								returnObj.push({id:"schemas", attribute:"status", value:""});
								registry.byId("entitySelectorStudent").set("disabled", true);
							}
							else{
								if(attemptCount > 1 && correctAnswer){
									returnObj.push({id:"schemas", attribute:"status", value:"demo"});
									registry.byId("schemaSelector").set("value", correctAnswer);
									registry.byId("entitySelectorStudent").set("disabled", false);
									registry.byId("schemaSelector").set("disabled", true);	
								}
								else if(attemptCount != 2){
									returnObj.push({id:"schemas", attribute:"status", value:"incorrect"});
									registry.byId("entitySelectorStudent").set("disabled", true);
								}
							}
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
					case "entity":
						if(validInput && attemptCount <=1){
							returnObj.push({id:"entity", attribute:"status", value:"correct"});
							registry.byId("entitySelectorStudent").set("disabled", true);
						}else{
							if(value == ""){
								returnObj.push({id:"entity", attribute:"status", value:""});
								//registry.byId("entitySelectorStudent").set("disabled", true);
							}
							else{
								if(attemptCount == 1){
									returnObj.push({id:"entity", attribute:"status", value:"incorrect"});	
								}
								else if(attemptCount > 1){
									returnObj.push({id:"entity", attribute:"status", value:"demo"});
									registry.byId("entitySelectorStudent").set("value", correctAnswer);
									registry.byId("entitySelectorStudent").set("disabled", true);
								}
								
							}
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
					case "equation":
						if(validInput){
							returnObj.push({id:"equation", attribute:"status", value:"correct"});
						}else{
							if(value == "")
								returnObj.push({id:"equation", attribute:"status", value:""});
							else
								returnObj.push({id:"equation", attribute:"status", value:"incorrect"});
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
					case "description":
						if(validInput && (attemptCount == "green")){
							returnObj.push({id:"description", attribute:"status", value:"correct"});
						}else{
							if(value == "")
								returnObj.push({id:"description", attribute:"status", value:""});
							else if(attemptCount == "yellow")
								returnObj.push({id:"description", attribute:"status", value:"demo"});
							else if(attemptCount == "red")
								returnObj.push({id:"description", attribute:"status", value:"incorrect"})
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
					case "qtyDescription":
						console.log("in quantity description", value, validInput);
						if(validInput){
							if(value != "" && value != "defaultSelect"){
								returnObj.push({id:"qtyDescription", attribute:"status", value:"correct"});
								registry.byId("qtyDescriptionInputboxStudent").set("disabled", true);
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
						if(validInput){
							if(value != ""){
								returnObj.push({id:"variable", attribute:"status", value:"correct"});	
							}
							returnObj.push({id:"message", attribute:"append", value:message});
						}
					break;
					case "variableName":
						console.log()
						if(!nodeID && validInput){
							returnObj.push({id:"message", attribute:"append", value:"node name is available for use"});
							returnObj.push({id:"variable", attribute:"status", value:"correct"});
						}else if(!validInput){
							returnObj.push({id:"message", attribute:"append", value:"Please enter a valid name without using numbers"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
						}else{
							returnObj.push({id:"message", attribute:"append", value:"Node name is already in use"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
						}
						//console.log("return obj is",returnObj);
						break;

					/*
					case "variableSlot":
						var vsslotid = "holder"+extra.schema+nodeID+value;
						console.log("vs slot", vsslotid)
						extra.controlMap.currentSlot = vsslotid;
						if(validInput){
							returnObj.push({id:"currentSlot", attribute:"status", value:"correct"});
						}else{
							if(value == "")
								returnObj.push({id:"currentSlot", attribute:"status", value:""});
							else
								returnObj.push({id:"currentSlot", attribute:"status", value:"incorrect"});
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						console.log("return obj for var slots", returnObj);
						break;
						*/
					default:
						throw new Error("Unknown type: "+ nodeType + ".");
				}
				return returnObj;
			}
		},

		// A list of control map specific to students
		resettableControls: ["equation"],
		variableNodeControls: ["variable","value","units"],
		equationNodeControls: ["equation","schemas","entity"],
		commonNodeControls: ["modelType","description"],
		qtyElements: ["qtyDescriptionInputboxContainerStudent","variableTypeContainer","variableInputboxContainer", "unitsSelectorContainerStudent"],
		eqElements: ["descriptionInputboxContainer","expressionDiv","schemaSelectorContainer","entitySelectorStudentContainer","variableSlotControlsContainer"],

		/*
		init: function () {
			// TODO : Check Model Completeness
			// this.studentControls();
		},
		*/
		studentControls: function(){
			console.log("++++++++ Setting STUDENT format in Node Editor.");
			style.set('schemaSelectorContainer', 'display', 'block');
			style.set('entitySelectorStudentContainer', 'display', 'block');
			style.set('descriptionInputboxContainer', 'display', 'inline-block');
			style.set('qtyDescriptionInputboxContainerStudent', 'display', 'inline-block');
			style.set('variableInputboxContainer', 'display', 'inline-block');
			//style.set('valueInputboxContainer', 'display', 'block');
			if(this._skipUnits != "on")
				style.set('unitsSelectorContainerStudent', 'display', 'block');
			else{
				style.set('unitsSelectorStudentLabel', 'display', 'none');
				style.set('unitsSelectorStudent', 'display', 'none');
			}
			style.set('expressionDiv', 'display', 'block');
			//This has been removed in new author mode editor design
			//style.set('inputSelectorContainer', 'display', 'block');
			style.set('equationInputbox', 'display', 'block');
			style.set('variableSlotControlsContainer', 'display', 'block');
		},

		controlMap: {
			variable: "variableInputbox",
			equation: "equationInputbox",
			qtyDescription: "qtyDescriptionInputboxStudent",
			description: "descriptionInputbox",
			units: "unitsSelectorStudent",
			modelType: "modelSelector",
			value: "valueInputbox",
			unknown: "unknownType",
			parameter: "parameterType",
			dynamic: "dynamicType",
			schemas: "schemaSelector",
			entity: "entitySelectorStudent",
			schemaDisplay: "schemaDescriptionQuestionMark",
		},
		populateSelections: function () {
			//check later if this can be used or is needed
			//for now controlsettings is being used
		},
		handleDescription: function (selectDescription) {
			console.log("****** in handleDescription ", this.currentID, selectDescription);
			if (selectDescription == 'defaultSelect') {
				return; // don't do anything if they choose default
			}
			var _description = this._model.authored.getDescription(selectDescription);
			this._model.active.setAuthoredID(this.currentID, selectDescription);
			this._model.active.setDescription(this.currentID, _description);

			// This is only needed if the type has already been set,
			// something that is generally only possible in TEST mode.
			//this.updateEquationLabels();
			this.applyDirectives(this._PM.processAnswer(this.currentID, 'description', selectDescription));
			this.updateNodeView(this._model.active.getNode(this.currentID));

		},
		handleVariableName: function(name){
			console.log("Handle variable Name ", name);
			var nameID = this._model.student.getNodeIDByName(name);
			this.applyDirectives(this.studentPM.process(nameID? !(nameID==this.currentID):null,'variableName',name, expression.isVariable(name)));
			if(!this._model.student.getNodeIDByName(name) && expression.isVariable(name)){
				// check all nodes in the model for equations containing name of this node
				// replace name of this node in equation with its ID
				this._model.active.setVariable(this.currentID, name);
				this.updateNodes();
			} else {
				//logging the error case
			}
			/*
			if(!this._model.student.getAuthoredID(this.currentID))
				this._model.student.setAuthoredID(this.currentID);
			*/
		},
		handleValue: function(value){
			console.log("Handle Value ", value);
			var tempValId = dom.byId(this.controlMap.value);
			var tempVal = tempValId.value.trim();
			var valueFlag = {status: undefined, value: undefined };

			if(tempVal !== ''){
				valueFlag= typechecker.checkNumericValue(this.controlMap.value, this.lastValue);
			}else{
				valueFlag  = {status: true, value: undefined};
			}
			if(valueFlag && (valueFlag.errorType === undefined) && (valueFlag.status === undefined)){
				// check for last input value matching
				valueFlag = typechecker.checkLastInputValue(this.controlMap.value, this.lastValue);
			}
			if (valueFlag.status) {
				//If the initial value is not a number or is unchanged from
				// previous value we dont process
				var newValue = valueFlag.value;
				this._model.active.setValue(this.currentID, newValue);
				//console.log("ini value action");
				this.applyDirectives(this._PM.processAnswer(this.currentID, 'value', newValue));
			}
			//else if (valueFlag.errorType) {
				// Log Error
			//}
		},
		handleVariableType: function(e){
			// Summary : Sets variableType to Unknown/Parameter/Dynamic
			// Value is not allowed when variableType is Unknown
			// Value is handled when variableType is parameter or dynamic.
			console.log("********************* in handleVariableType");
			var _variableType = e.target.value;
			this._model.student.setVariableType(this.currentID, _variableType);
			this.variableTypeControls(this.currentID, _variableType);
			this.applyDirectives(this._PM.processAnswer(this.currentID, 'variableType', _variableType));
		},
		handleUnits: function (unit) {
			console.log("*******Student has chosen unit", unit, this);
			this._model.student.setUnits(this.currentID,unit);
			this.applyDirectives(this._PM.processAnswer(this.currentID, 'units', unit));
			// Logging
		},
		/* handle schema for student mode
		*/
		handleSchemas: function(schema){
			var message;
			var returnObj;
			this.schema = "";
			//case default
			var currentAttemptCount = this._model.student.getAttemptCount(this.currentID,"schema");
			//At this stage there is not correct answer as far as schema is considered, the correct answer would be any random legit schema
			var correctAnswer = this._model.student.getLegitSchema();
			if(schema == "defaultSelect"){
				message = "Please choose a valid schema";
				this._model.student.setAttemptCount(this.currentID, "schema", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "schema", "", false, message,this._model.student.getAttemptCount(this.currentID,"schema"), correctAnswer);
			}
			//case 1: the student has entered a schema that isn’t use in the author’s model
			else if(!this._model.authored.hasSchema(schema)){
				message = "The author’s model doesn’t uses any "+schema+" schemas.";
				this._model.student.setAttemptCount(this.currentID, "schema", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "schema", schema, false, message, this._model.student.getAttemptCount(this.currentID,"schema"), correctAnswer);
			}else if(!(this._model.authored.getGivenSchemaCount(schema) > this._model.student.getGivenSchemaCount(schema))){
			//case 2: the student has already entered a number of equations corresponding to all the 
			//        equations in the author’s model that have this schema name
				message = "You don’t need any more "+schema+" schema applications.";
				this._model.student.setAttemptCount(this.currentID, "schema", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "schema", schema, false, message, this._model.student.getAttemptCount(this.currentID,"schema"), correctAnswer);

			}else{
				message = "You have entered a valid schema.";
				//this._model.student.setAttemptCount(this.currentID, "schema", currentAttemptCount+1);				
				returnObj = this.studentPM.process(this.currentID, "schema", schema, true, message, this._model.student.getAttemptCount(this.currentID,"schema"));
				this.schema = schema;
			}
			this.applyDirectives(returnObj);
			this._model.student.setSchema(this.currentID,schema);
			//change entity to default or to choose again
			registry.byId(this.controlMap.entity).set("value", "defaultSelect");
			this.updateEquationDescription();
			this.updateEqnDelete();
		},
		/*handle entities for student node
		*/
		handleEntities: function(entity){
			var returnObj;
			var message;
			this.entity = "";
			var correctAnswer = this._model.student.getLegitEntity(this.schema);
			//case default
			var currentAttemptCount = this._model.student.getAttemptCount(this.currentID,"entity");
			if(entity == "defaultSelect"){
				message = "Please choose a valid entity";
				this._model.student.setAttemptCount(this.currentID, "entity", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "entity", "", false, message, this._model.student.getAttemptCount(this.currentID,"entity"), correctAnswer);
			}
			//case 1: entity should not be a duplicate entry for a given schema
			else if(this._model.student.isDuplicateSchemaInstance(this.schema, entity)){
				message = "This entity already exists for given schema";
				this._model.student.setAttemptCount(this.currentID, "entity", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "entity", entity, false, message, this._model.student.getAttemptCount(this.currentID,"entity"), correctAnswer);
			}
			//case 2: schema and entity combo has to match from authors nodes
			else if(!this._model.authored.isStudentEntityValid(this.schema, entity)){
				message = "incorrect entity for the chosen schema";
				this._model.student.setAttemptCount(this.currentID, "entity", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "entity", entity, false, message, this._model.student.getAttemptCount(this.currentID,"entity"), correctAnswer);
			}
			//case 3: success
			else{
				message = "You have chosen a valid entity";
				//this._model.student.setAttemptCount(this.currentID, "entity", currentAttemptCount+1);
				returnObj = this.studentPM.process(this.currentID, "entity", entity, true, message,  this._model.student.getAttemptCount(this.currentID,"entity"));
				this.entity = entity;
				this.updateSlotVariables();
				this.updateEquation();
			}
			this.applyDirectives(returnObj);
			this._model.student.setEntities(this.currentID, entity);
			this.updateEqnDelete();
			this.updateEquationDescription();
		},
		/*
		 *	 handle event on inputs box
		 */
		handleInputs: function (id) {
			//check if id is  not select else return
			console.log("*******Student has chosen input", id, this);
			// Should add name associated with id to equation
			// at position of cursor or at the end.

			var expr = this._model.authored.getName(id);

			// if user selected selectdefault selection [--select--] no action required, calling return on handler
			if (expr === null) return;

			this.equationInsert(expr);
			//restore to default  - creating select input as stateless
			registry.byId(this.controlMap.inputs).set('value', 'defaultSelect', false);
			// Logging
		},
		equationDoneHandler: function(){
			// TODO : Add Handler and process answer
			var directives = [];
			var parse = this.equationAnalysis(directives, false);
			console.log("************",parse);
			if (parse) {
				this._model.student.setEquation(this.currentID, parse.equation);
				this.createExpressionNodes(parse, false);
				var dd = this._PM.processAnswer(this.currentID, 'equation', parse,
						registry.byId(this.controlMap.equation).get("value"));
				// work around to remove disable and status in case the demo
				// equation has prior node error
				console.log("equation processed directives", dd);
				/*
				for(var i = 0; i < dd.length; i++){
					if(dd[i].attribute === "value")
						this.demoParse = this.equationAnalysis([], false, dd[i].value);
				}
				
				if(this.demoParse && this.demoParse.error){
					for(i = 0; i < dd.length; i++){
						if(dd[i].attribute === "status" || dd[i].attribute === "disabled" || dd[i].id === "message"){
							dd.splice(i, 1);
							i--;
						}
					}
				} */
				if(!parse.error)
					directives = directives.concat(dd);
				var context = this;
			}
			this.applyDirectives(directives);
			if(!parse){
				//in case parse fails, get valid variable count. If the valid variable count is zero, the equation status should be empty rather than incorrect
				var validVars = this.validVariableCount();
				if(validVars == 0){
					console.log("valid var count", validVars, this.currentID);
					this._model.student.setStatus(this.currentID, "equation" , {disabled: true, status: ""});
				}
			}
			return directives;
		},
		equationSet: function (value) {
			// applyDirectives updates equationBox, but not equationText:
			// dom.byId("equationText").innerHTML = value;
			console.log("in equation set");
			/*
			if(value != ""){
				var directives = [];
				// Parse and update model, connections, etc.
				// if new nodes are created then demoParse will contain them
				// if we parse again at this point then the newNodeList comes empty
				var parse = this.demoParse || this.equationAnalysis(directives);
				// Generally, since this is the correct solution, there should be no directives
				this.applyDirectives(directives);

				//Set equation and process answer
				//var parsedEquation = parse.toString(true);
				this._model.active.setEquation(this.currentID, parse.equation);
				//Create expression nodes for parsed equation
				this.createExpressionNodes(parse);
				var dd = this._PM.processAnswer(this.currentID, 'equation', parse, registry.byId(this.controlMap.equation).get("value"));
				this.demoParse = null; // emptying it for next feedback
				//this.applyDirectives(dd);
			} */
		},
		initialViewSettings: function(type){
			//make display none for all fields initially
			//removed optionality container from initial view settings
			//TODO: further clean up necessary after discussion
			this.deleteNodeActivated = false;
			if(type == "quantity"){
				this.eqElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","none");
				});
				this.qtyElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","block");
				});
				//initially disable the type value and units which will be later handled in control settings based on state
				this.disableTypeValueUnits(true);
				
				//can the qty node have delete option
				var canHaveDeleteNode = this.canHaveDeleteNode(this.currentID);
				console.log("can have delete node", canHaveDeleteNode);
				if(canHaveDeleteNode){
					registry.byId("deleteButton").set("disabled",false);
				}
				else{
					registry.byId("deleteButton").set("disabled",true);
				}
				
			}else if(type == "equation"){
				this.qtyElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","none");
				});
				this.eqElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","block");
				});
				//enable the deletebutton always
				registry.byId("deleteButton").set("disabled",false);
			}
			//emptying message box when a node is open
			console.log("emptying message");
			dojo.empty("messageOutputbox");
		},
		initialControlSettings: function (nodeid) {
			var nodeType = this._model.student.getType(nodeid);
			if(nodeType == "equation"){
				var descriptionWidget = registry.byId(this.controlMap.description);
				var equationWidget = registry.byId(this.controlMap.equation);
				var validSchemaInput;
				var validEntityInput;
				var correctSchemaAnswer;
				//for the schema select load schema options
				this.loadSchemaOptions();
				var schema = this._model.student.getSchema(nodeid);
				if(!schema)
					schema = "";
				registry.byId(this.controlMap.schemas).set('value', schema);
				var count = 0;
				var schemaStatus =  this._model.student.getStatus(this.currentID,"schemas");
				if((schemaStatus && (schemaStatus.status == "incorrect" || schemaStatus.status == "")) || schemaStatus == undefined){
					validSchemaInput = false;
					correctSchemaAnswer = this._model.student.getLegitSchema();
				}
				else{
					validSchemaInput = true;
					correctSchemaAnswer = schema;
				}
				this.applyDirectives(this.studentPM.process(nodeid, "schema", schema, validSchemaInput, "", this._model.student.getAttemptCount(this.currentID, "schema"), correctSchemaAnswer));
				this.schema = schema;

				//for the entity select load entities
				var entityWid = registry.byId(this.controlMap.entity);
				var entityList = [];
				var authorEntities = this._model.getAllEntities();
				authorEntities.sort();
				entityWid.removeOption(entityWid.getOptions());
				entityWid.addOption({value: 'defaultSelect',label: 'Select an entity'});
				array.forEach(authorEntities, function(ent){
					var obj = {value: ent, label: ent};
					entityWid.addOption(obj);
				}, this);
				var entVal = this._model.student.getEntity(this.currentID);
				if(!entVal)
					entVal = "";
				registry.byId(this.controlMap.entity).set('value', entVal);
				var entityStatus =  this._model.student.getStatus(this.currentID,"entity");
				if( (entityStatus && entityStatus.status == "incorrect" ) || entityStatus == undefined || entityStatus.status == "")
					validEntityInput = false;
				else
					validEntityInput = true;
				this.applyDirectives(this.studentPM.process(nodeid, "entity", entVal, validEntityInput, "", this._model.student.getAttemptCount(this.currentID, "entity"), this._model.student.getLegitEntity(this.schema) ));
				this.entity = entVal;
				this.updateEquationDescription();	
				this.updateEqnDelete();
				//set up equation
				var eqVal = this._model.student.getEquation(nodeid);
				if(eqVal){
					var params = {
					subModel: this._model.student,
					equation: eqVal
					};
					eqVal = expression.convert(params);
				}
				var convEq = eqVal ? eqVal.equation : "";
				registry.byId(this.controlMap.equation).set('value', convEq);
				this.equation = convEq;

				this.updateSlotVariables();
				this.fillVariableNames();
				//give feedback on variables
				this.verifyVariableSlots();
				equationWidget.set('disabled', true);	
			}
			else if(nodeType == "quantity"){
				// Apply settings from PM
				console.log("Initial Control Settings for Student Quantity Node");
				var directives = this._model.student.getStatusDirectives(nodeid);
				console.log("statusDirectives: ",directives)
				var nodeDirectives = this._PM.getNodeDisplayStatus(nodeid);
				console.log("nodeDirectives: ",nodeDirectives)
				array.forEach(directives, function(directive){
					if(directive.attribute == "status"){
						nodeDirectives = nodeDirectives.concat(this._PM.getNodeDisplayStatus(nodeid, directive.id,directive.value));
					}
				}, this);
				console.log("updated nodeDirectives: ",nodeDirectives)
				console.log("a quantity node has been opened");
				var variable = this._model.student.getName(nodeid);
				registry.byId(this.controlMap.variable).set('value', variable || '');
				var parSchema = this._model.student.getParentSchema(nodeid);
				var parEquation = this._model.student.getParentEquation(nodeid);
				console.log("qty node details", this._model.student.getParentSchema(nodeid), this._model.student.getParentEquation(nodeid), this._model.student.getSelfEquation(nodeid));
				var qtyDescWidget = registry.byId(this.controlMap.qtyDescription);
				//qtyDescWidget.set("disabled", false)
				qtyDescWidget.removeOption(qtyDescWidget.getOptions());
				var authorModel = this._model.authored;
				var studDesc = this._model.student.getDescription(this.currentID);
				console.log("student desc is", studDesc);
				if(!studDesc){
					this.applyDirectives(this.studentPM.process(nodeid, "qtyDescription", "", "", ""));
					qtyDescWidget.set("disabled", false);
					qtyDescWidget.addOption({value: 'defaultSelect',label: 'choose a description'});
				}
				if(this.ambigiousSchemas.includes(parSchema)){
					var rightVarAr = expression.getRightSideEquationStrings(this._model.student.getParentEquation(nodeid));
					var rightSelfAr = expression.getRightSideEquationStrings(this._model.student.getSelfEquation(nodeid));
					
					if(rightSelfAr.includes(variable)){
						if(studDesc){
							qtyDescWidget.addOption({value: studDesc,label: studDesc});
							this.applyDirectives(this.studentPM.process(nodeid, "qtyDescription", studDesc, studDesc, "A valid description has been entered",));
							this._model.student.setDescription(nodeid, studDesc);
							this.disableTypeValueUnits(false);
						}
						else{
							array.forEach(rightVarAr, function(rightVar){
								//console.log(this);
								var curDesc = authorModel.getDescription(rightVar);
								qtyDescWidget.addOption({value: curDesc,label: curDesc});
							});
							var tillNowDescs = this._model.student.getAllDescriptions();
							array.forEach(tillNowDescs, function(existingDesc){
								if(existingDesc)
									qtyDescWidget.removeOption({value: existingDesc, label: existingDesc});
							});
							console.log("till now descriptions", tillNowDescs);
						}
					}
					else{
						if(this._model.student.getAuthoredID(nodeid)){
							var curDesc = authorModel.getDescription(this._model.student.getAuthoredID(nodeid));
							qtyDescWidget.removeOption(qtyDescWidget.getOptions());
							qtyDescWidget.addOption({value: curDesc,label: curDesc});
							this.applyDirectives(this.studentPM.process(nodeid, "qtyDescription", curDesc, curDesc, "A valid description has been entered",));
							this._model.student.setDescription(nodeid, curDesc);
							this.disableTypeValueUnits(false);
						}
					}
				}
				else{
					if(this._model.student.getAuthoredID(nodeid)){
						var curDesc = authorModel.getDescription(this._model.student.getAuthoredID(nodeid));
						qtyDescWidget.removeOption(qtyDescWidget.getOptions());
						qtyDescWidget.addOption({value: curDesc,label: curDesc});
						this.applyDirectives(this.studentPM.process(nodeid, "qtyDescription", curDesc, curDesc, "A valid description has been entered",));
						this._model.student.setDescription(nodeid, curDesc);
						this.disableTypeValueUnits(false);
					}
				}
				var varType = this._model.student.getVariableType(this.currentID);
				var curVal = this._model.student.getValue(this.currentID);
				var curUnit =  this._model.student.getUnits(this.currentID);
				console.log("other qty node details",this._model.student.getVariableType(this.currentID), this._model.student.getValue(this.currentID), this._model.student.getUnits(this.currentID));
				//for now commenting out this part, this commit comes after editors have been finalized
				//var qtyDesc = this._model.getDescriptionForVariable(variable);

				//Before units are set, verify if the author has set units to the qty
				var curAuthID = this._model.student.getAuthoredID(nodeid);
				if(curAuthID && this._model.authored.getUnits(curAuthID)){
					var u = registry.byId(this.controlMap.units);
					u.removeOption(u.getOptions());
					var units = this._model.getAllUnits();
					units.sort();
					var curUnit = this._model.student.getUnits(nodeid);
					if(!curUnit){
						u.addOption({label: "choose a unit", value: "default"});
					}
					array.forEach(units, function(unit){
						u.addOption({label: unit, value: unit});
					});
					if(curUnit){
						u.set('value', curUnit);
					}
				}
				else{
					//Either the node does not have authoredId assigned ( Alien) or author has not given units
					//In either case hide units field
					console.log("hiding the units field");
					style.set("unitsSelectorContainerStudent","display","none");
				}

				var prevSelected = query("input[name='variableType']:checked")[0] ? query("input[name='variableType']:checked")[0].value : undefined;
				if(prevSelected)
					registry.byId(prevSelected+"Type").set('checked', false);
				if(varType){
					registry.byId(varType+"Type").set('checked', true);
					this.variableTypeControls(this.currentID, varType);
				}			
				this.applyDirectives(nodeDirectives);
				registry.byId(this.controlMap.variable).set("disabled",false);
			}
			
		        /*
			var d = registry.byId(this.controlMap.description);
			
			console.log("description widget = ", d, this.controlMap.description);
			// Add options each time node editor is opened.
			// By this, we can have quantity and equation options for those nodes
			d.removeOption(d.getOptions()); // Delete all options

			//get descriptions to sort as alphabetic order
			var descriptions = this._model.authored.getDescriptions();
			//create map of names for sorting
			var descNameMap = {};
			array.forEach(descriptions, function (desc) {
				var _name = this._model.authored.getName(desc.value);
				descNameMap[desc.value] = _name;
			}, this);
			descriptions.sort(function (obj1, obj2) {
				//return obj1.label > obj2.label;
				if(descNameMap[obj1.value] && descNameMap[obj2.value])
					return descNameMap[obj1.value].toLowerCase().localeCompare(descNameMap[obj2.value].toLowerCase());
			}, this);
			
			d.addOption({label: "--Select--", value: "defaultSelect"});
			array.forEach(descriptions, function (desc) {
				if(desc.label !== undefined){
					d.addOption(desc);
					console.log("Description is : ", desc);
					var name = this._model.authored.getName(desc.value);
					var option = {label: name + " (" + desc.label + ")", value: desc.value};
					console.log("option is",option);
				}
			}, this);
			var options = d.options;
			d.options = d.options.filter(lang.hitch(this,function(item){
				return ((this._model.authored.getType(item.value) === this.nodeType) || item.value === "defaultSelect" ) ;
			}));

			// Set the selected value in the description.
			var desc = this._model.student.getAuthoredID(nodeid);
			var variableName = this._model.student.getVariable(nodeid);
			console.log('description is', desc || "not set");
			d.set('value', desc || 'defaultSelect', false);

			registry.byId(this.controlMap.variable).set('value', variableName || 'defaultSelect', false);

			array.forEach(this._variableTypes, function(_type){
				registry.byId(_type+"Type").set('checked',false);
				registry.byId(_type+"Type").set('disabled',false);
			})

			var _variableType = this._model.student.getVariableType(nodeid);
			if(_variableType){
				registry.byId(_variableType+"Type").set('checked', 'checked');
			}
			*/
			
			//style.set(this.genericDivMap.inputs, "display", "block");
			
		},

		verifyVariableSlots: function(){
			//console.log("verify variable slots",this.slotMap, this.currentID);
			if(registry.byId(this.controlMap.equation).value){
				var original_id = this._model.student.getAuthoredID(this.currentID);
				var original_eq = this._model.authored.getEquation(original_id);
				var original_Ar = expression.getVariableStrings(original_eq);
				var original_RightAr = expression.getRightSideEquationStrings(original_eq);
				var current_Ar = expression.getVariableStrings(this._model.student.getEquation(this.currentID));

				console.log("current, original", original_Ar, current_Ar, this._model.student.getStatus(this.currentID, "equation"));
				this.variableUpdateBySystem = false;
				for(var i=0;i<original_Ar.length;i++){
					var get_original = this._model.student.getAuthoredID(current_Ar[i]);
					var get_original_name = this._model.authored.getName(original_Ar[i]);
					var slot_id = Object.values(this.slotMap)[i];
					var isLeftHandSideVal = false;
					if(i == 0)
						isLeftHandSideVal = true;
					else
						isLeftHandSideVal = false;
					console.log("original right ar", original_RightAr, get_original, get_original_name);
					
					/* this case has been handle while nodes are created
					if(!get_original && !isLeftHandSideVal && this.ambigiousSchemas.includes(this.schema)){
						//we need to assign an authoredID to the current slot id
						for(var p = 0; p < original_RightAr.length; p++){
							if(!this._model.student.isAuthoredIDNotAssigned(original_RightAr[p])){
								console.log("assigning authored id", original_RightAr[p], current_Ar[i]);
								this._model.student.setAuthoredID(current_Ar[i], original_RightAr[p]);
								get_original = original_RightAr[p];
								break;
							}
						}
					} */

					if(get_original == original_Ar[i] || (!isLeftHandSideVal && this.ambigiousSchemas.includes(this.schema)  && original_RightAr.includes(get_original))){
						if(this._model.student.getSlotStatus(this.currentID, slot_id) == "correct"){
							style.set(dojo.byId("widget_holder"+this.schema+this.currentID+slot_id), 'backgroundColor', 'lightGreen');
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("disabled", true);
						}
						else if(this._model.student.getSlotStatus(this.currentID, slot_id) == "demo"){
							style.set(dojo.byId("widget_holder"+this.schema+this.currentID+slot_id), 'backgroundColor', 'yellow');
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("disabled", true);
						}
						else{
							this._model.student.setSlotStatus(this.currentID, slot_id, "correct");
							style.set(dojo.byId("widget_holder"+this.schema+this.currentID+slot_id), 'backgroundColor', 'lightGreen');
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("disabled", true);	
						}
					}
					else{
						//this.applyDirectives(this.studentPM.process(this.currentID, "variableSlot", slot_id, false, "the variable is incorrect", this));
						if(this._model.student.getSlotStatus(this.currentID, slot_id) == "incorrect"){
							var studID = this._model.student.getNodeIDFor(original_Ar[i]);
							var studName = this._model.student.getName(studID);
							var slotAr = expression.getVariableStrings(registry.byId(this.controlMap.equation).value);
							var slotRightAr = expression.getRightSideEquationStrings(registry.byId(this.controlMap.equation).value);
							var deriveNameFrom = original_Ar[i];
							if(slotRightAr.includes(slotAr[i]) && slotRightAr.includes(studName)){
								//if the existing slots for equation on the right side already have the variable, topomath needs to avoid duplicates and throw in alternate "correct" variable that could be used
								var curID = original_Ar[i];
								console.log(original_RightAr, curID)
								for(var j=0; j<original_RightAr.length;j++){
									if(curID != original_RightAr[j] && !slotRightAr.includes(original_RightAr[j])){
										studID = this._model.student.getNodeIDFor(original_RightAr[j]);
										studName = this._model.student.getName(studID);
										deriveNameFrom = original_RightAr[j];
										break;
									}
								}
							}
							if(!studName){
								var tempName =  this._model.authored.getName(deriveNameFrom);
								var authNameValid = false;
								while(!authNameValid){
									var nameAlreadyExists = this._model.student.getNodeIDByName(tempName);
									console.log("name already exists", tempName, nameAlreadyExists)
									if(!nameAlreadyExists){
										studName = tempName;
										authNameValid = true;
									}
									else{
										tempName = tempName + "1";
									}
								}
							}
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("value", studName);
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("disabled", true);
							this._model.student.setSlotStatus(this.currentID, slot_id, "demo");
							style.set(dojo.byId("widget_holder"+this.schema+this.currentID+slot_id), 'backgroundColor', 'yellow');
							this.variableUpdateBySystem = true;
						}
						else{
							this._model.student.setSlotStatus(this.currentID, slot_id, "incorrect");
							style.set(dojo.byId("widget_holder"+this.schema+this.currentID+slot_id), 'backgroundColor', 'red');
							registry.byId("holder"+this.schema+this.currentID+slot_id).set("disabled", false);
						}
					}
				}

				//this._model.student.setEquation(this.currentID,);
				//this.applyDirectives(this.studentPM.process(this.currentID, "equation", original_eq, original_eq, "equation value is correct"));
			}
		},

		// Need to save state of the node editor in the status section
		// of the student model.  See documentation/json-format.md
		updateModelStatus: function (desc, id) {
			//in case of autocreation nodes, id must be passed explicitly
			id = id || this.currentID;
			if (this.validStatus[desc.attribute]) {
				var opt = {};
				opt[desc.attribute] = desc.value;
				this._model.student.setStatus(id, desc.id, opt);
			} else {
				// There are some directives that should update
				// the student model node (but not the status section).

				// console.warn("======= not saving in status, node=" + this.currentID + ": ", desc);
			}
		},
		updateInputNode: function(/** auto node id **/ id, /**variable name**/ variable){
			console.log("updating nodes in student controller");
			//update the name for nodeid
			// BvdS:  when we set the name we don't send to author PM
			// since there is nothing to update in the node editor since
			// this is a different node.
			//this._model.active.setName(id, variable);
			// update Node labels upon exit
			//this.updateNodeLabel(id);
			var authoredID = this._model.student.getAuthoredID(id);
			//console.log("update inp node auth id is", authoredID, this._model.student.getAuthoredID(id));
			//console.log(id,descID,this._model.given.getName(descID));
			var directives = this._PM.processAnswer(id, 'description', authoredID);
			if(!this._model.authored.isNodeIrrelevant(authoredID))
				directives.push.apply(directives,
						this._PM.processAnswer(id, 'variable', variable));
			// Need to send to PM and update status, but don't actually
			// apply directives since they are for a different node.
			console.log("update input node directives are", directives);
			array.forEach(directives, function (directive) {
				this.updateModelStatus(directive, id);
			}, this);
		},
		checkDone: function(){
			/*
				When the student clicks on the main menu "Done" button,
				the system checks whether everynode is complete, 
				all quantity and equation nodes are created and exits
			*/
			var returnObj = {};
			returnObj.errorNotes = "";
			var isComplete = this._model.matchesGivenSolution();
			var _errorNotes = [];
			var nodes = this._model.active.getNodes();
			var l = nodes.length;

			if(!isComplete){
				_errorNotes.push("Nodes in the model are not complete");
			}
			if((this._model.authored.getRequiredNodeCount() - this._model.active.getRequiredNodeCount()) > 0){
				_errorNotes.push("Some nodes are missing compared to authored model");
				isComplete = false;
			}

			if(_errorNotes && _errorNotes.length > 0){
				array.forEach(_errorNotes, function(_error){
					returnObj.errorNotes += "<li>" + _error + "</li>";
				});
			}
			
			return returnObj;
		},
		setNodeDescription: function(id, variable){
			console.log("setting node description", variable);
			//we need to get original ids 
			var authoredID = this._model.student.getAuthoredID(id);
			//var authoredID = this._model.authored.getNodeIDByName(variable);
			console.log("authored id is", authoredID, id, variable);
			if(authoredID){
				this._model.active.setAuthoredID(id, authoredID);
				console.log(this._model.active.getNode(id));
				if(this._giveParams == "on"){
					this._model.active.setDescription(id, this._model.authored.getDescription(authoredID));
				}
				// Fixing position is a part of feedback to student
				if(this._config.get("feedbackMode") !== "nofeedback" && this._fixPosition){
					this._model.active.setPosition(id, 0, this._model.authored.getPosition(authoredID,0));
				}
			}
			return authoredID;
		},
		createStudentNode: function(node){
			var authoredID = this.setNodeDescription(node.id, node.variable);
			if(authoredID){
				this.updateInputNode(node.id, node.variable);
				//if the give parameters switch is on, according to the latest design update refer card #473, all the unknown nodes should be automatically set along with the status
				if(this._giveParams == "on"){
					this._model.student.setVariableType(node.id, "unknown");
					this._model.student.setStatus(node.id, "variableType" , {"disabled":true,"status":"correct"});
				}
				var canHaveDeleteNode = this.canHaveDeleteNode(node.id);
				this._model.student.setCanDelete(node.id,canHaveDeleteNode);
				this.updateNodeView(this._model.active.getNode(node.id));
			}

			return authoredID;
		},

		updateVariableTypeValue: function(value){
			if(value == "unknown")
				this._model.student.setValue(this.currentID, "");
			registry.byId(value+"Type").set("checked", "checked");
			this._model.student.setVariableType(this.currentID, value);
		},

		updateVariableTypeStatus: function(attribute, value){
			if(attribute === "disabled" && value === true){
				array.forEach(this._variableTypes, function(type){
					registry.byId(type+"Type").set("disabled", true);
				});
			} else if(attribute === "status"){
				var selectedVariableType = query("input[name='variableType']:checked")[0].value;
				registry.byId(selectedVariableType+"Type").set(attribute, value);
			}
		},
		handleEquationDescription: function(description){
			//equation description is auto generated
			//so, no feedback coloring/messages is necessary here
			this._model.student.setDescription(this.currentID,description);
		},
		handleQtyDescription: function(description){
			//quantity description is also auto generated but might have options
			console.log("selected description is", description);
			if(description == "defaultSelect"){
				//not a valid selection, hide type, value and units
				this.disableTypeValueUnits(true);
			}
			else{
				this.disableTypeValueUnits(false);
				//incase of valid description change, we need to update the authoredID incase description does not match ( we already assign authoredID's based on serial order, but users can always switch)
				var curAuthID = this._model.student.getAuthoredID(this.currentID);
				var authDesc = this._model.authored.getDescription(curAuthID);
				var isSameAuthNode =  authDesc == description ? true: false;
				if(!isSameAuthNode){
					// In this case, we need to get author ID to which the input description matches and set that authoredID to the current node but at the same time, we need to update the node whose author ID is being assigned here
					var newAuthID = this._model.authored.getNodeIDByDescription(description);
					var existingStudID = this._model.student.getNodeIDFor(newAuthID);

					if(existingStudID){
						this._model.student.setAuthoredID(existingStudID, curAuthID);
						if(this._config.get("feedbackMode") !== "nofeedback" && this._fixPosition){
							this._model.active.setPosition(existingStudID, 0, this._model.authored.getPosition(curAuthID,0));
							this.updateNodeView(this._model.active.getNode(existingStudID));
						}
					}
					//set new authored id to the current student node
					this._model.student.setAuthoredID(this.currentID, newAuthID);
					if(this._config.get("feedbackMode") !== "nofeedback" && this._fixPosition){
						this._model.active.setPosition(this.currentID, 0, this._model.authored.getPosition(newAuthID,0));
						this.updateNodeView(this._model.active.getNode(this.currentID));
					}
				}
				this.applyDirectives(this.studentPM.process(this.currentID, "qtyDescription", description, description, "A valid description has been entered",));
			}
			this._model.student.setDescription(this.currentID, description);
		},
		disableTypeValueUnits: function(disable){
			registry.byId(this.controlMap.value).set("disabled", disable);
			registry.byId(this.controlMap.units).set("disabled", disable);
			registry.byId(this.controlMap.unknown).set("disabled", disable);
			registry.byId(this.controlMap.parameter).set("disabled", disable);
			registry.byId(this.controlMap.dynamic).set("disabled", disable);
		},
		getSlotVariablesList: function(){
			return this._model.student.getAllVariables();
		},
		/*activateDeleteNode
		This function can be used for delete button specific checks
		deleteNodeActivated flag prevents equation being evaluated when delete button is clicked
		*/
		activateDeleteNode: function(){
			this.deleteNodeActivated = true;
		},
		updateEqnDelete: function(){
			var getEntStatus = this._model.student.getStatus(this.currentID, "entity");
			console.log("del status", getEntStatus);
			if( getEntStatus.status == "correct" || getEntStatus.status == "demo"){
				//disable delete
				registry.byId("deleteButton").set("disabled",true);
				this._model.student.setCanDelete(this.currentID,false);
			}
			else{
				registry.byId("deleteButton").set("disabled", false);
				this._model.student.setCanDelete(this.currentID,true);
			}
		},
		updateEquationDescription: function(){
			if(this.schema == 'defaultSelect' || this.schema == null)
				this.schema = '';
			//entity part of description is tricky to extract, so a seperate function processEntityString handles it
			//disable the description and equation fields
			var descriptionWidget = registry.byId(this.controlMap.description);
			descriptionWidget.set('disabled', true);
			var description = this.description = this.schema+": "+this.entity;
			descriptionWidget.set("value", this.description);
			descriptionWidget.set('value',description);
			var descAttempt = "";
			var entityAttempt = this._model.student.getAttemptCount(this.currentID, "entity");
			var schemaAttempt = this._model.student.getAttemptCount(this.currentID, "schema");
			var validSchemaInput; var validEntityInput;
			var schemaStatus =  this._model.student.getStatus(this.currentID,"schemas");
				if( (schemaStatus && schemaStatus.status == "incorrect" ) || schemaStatus == undefined)
					validSchemaInput = false;
				else
					validSchemaInput = true;
			var entityStatus =  this._model.student.getStatus(this.currentID,"entity");
				if( (entityStatus && entityStatus.status == "incorrect" ) || entityStatus == undefined || entityStatus.status == "")
					validEntityInput = false;
				else
					validEntityInput = true;
			var descAttempt = "";
			if(description != ": " && this.schema && this.entity){
				if(!validSchemaInput || !validEntityInput){
					descAttempt = "red";
				}
				else if(entityAttempt >=2 || schemaAttempt >=2){
					descAttempt = "yellow";
				}
				else{
					descAttempt = "green";
				}
			}
			this.applyDirectives(this.studentPM.process(this.currentID, "description", description, description, "", descAttempt));
		},
		//Incase slot gets a red feedback, when user tries to further change it, update background color to white
		adjustSlotColors: function(currentCombo){
			var curWidgetHolderID = currentCombo.id;
			var curWidgetID = currentCombo.widgetid;
			if(style.get(dojo.byId(curWidgetHolderID),"backgroundColor") == 'rgb(255, 0, 0)'){
					registry.byNode(currentCombo).on('change', lang.hitch(this, function(){
						style.set(dojo.byId(curWidgetHolderID), "backgroundColor", "white");
					}));
			}
		}
	});
});

