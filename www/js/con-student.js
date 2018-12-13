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
		},
		studentPM:{
			process: function(nodeID, nodeType, value, validInput, message){
				var returnObj=[];
				switch(nodeType){
					case "schema":
						if(validInput){
							returnObj.push({id:"schemas", attribute:"status", value:"entered"});
						}else{
							if(value == "")
								returnObj.push({id:"schemas", attribute:"status", value:""});
							else
								returnObj.push({id:"schemas", attribute:"status", value:"incorrect"});
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
					case "entity":
						if(validInput){
							returnObj.push({id:"entity", attribute:"status", value:"entered"});
						}else{
							if(value == "")
								returnObj.push({id:"entity", attribute:"status", value:""});
							else
								returnObj.push({id:"entity", attribute:"status", value:"incorrect"});
						}
						returnObj.push({id:"message", attribute:"append", value:message});
						break;
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
		qtyElements: ["qtyDescriptionInputboxContainerStudent","variableTypeContainer","variableInputboxContainer","valueInputboxContainer"],
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
			style.set('valueInputboxContainer', 'display', 'block');
			//style.set('unitsSelectorContainer', 'display', 'block');
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
			units: "unitsSelector",
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
			/*
			 Initialize select options in the node editor that are
			 common to all nodes in a problem.

			 In AUTHOR mode, this needs to be done when the
			 node editor is opened.
			 */
			// Add fields to Description box and inputs box
			// populate input field
			//var t = registry.byId(this.controlMap.inputs);
			var u = registry.byId(this.controlMap.units);

			var variableName = registry.byId(this.controlMap.variable);

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
			/*
			array.forEach(descriptions, function (desc) {
				if(desc.label !== undefined){
					var name = this._model.authored.getName(desc.value);
					var option = {label: name + " (" + desc.label + ")", value: desc.value};
					
					if(name !== undefined && name !== ""){
						variableName.addOption({label: name , value: name});
						t.addOption(option);
					}
				}
			}, this); */

			var units = this._model.getAllUnits();
			units.sort();

			array.forEach(units, function(unit){
				u.addOption({label: unit, value: unit});
			});
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
			this._model.active.setVariable(this.currentID, name);
			if(!this._model.student.getAuthoredID(this.currentID))
				this._model.student.setAuthoredID(this.currentID);
			if (name == 'defaultSelect') {
				return; // don't do anything if they choose default
			}
			this.applyDirectives(this._PM.processAnswer(this.currentID, 'variable', name));
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
			if(schema == "defaultSelect"){
				message = "Please choose a valid schema";
				returnObj = this.studentPM.process(this.currentID, "schema", "", false, message);
			}
			//case 1: the student has entered a schema that isn’t use in the author’s model
			else if(!this._model.authored.hasSchema(schema)){
				message = "The author’s model doesn’t uses any "+schema+" schemas.";
				returnObj = this.studentPM.process(this.currentID, "schema", schema, false, message);
			}else if(!(this._model.authored.getGivenSchemaCount(schema) > this._model.student.getGivenSchemaCount(schema))){
			//case 2: the student has already entered a number of equations corresponding to all the 
			//        equations in the author’s model that have this schema name
				message = "You don’t need any more "+schema+" schema applications.";
				returnObj = this.studentPM.process(this.currentID, "schema", schema, false, message);
			}else{
				message = "You have entered a valid schema.";
				returnObj = this.studentPM.process(this.currentID, "schema", schema, true, message);
				this.schema = schema;
			}
			this.applyDirectives(returnObj);
			this._model.student.setSchema(this.currentID,schema);
			//change entity to default or to choose again
			registry.byId(this.controlMap.entity).set("value", "defaultSelect");
			this.updateEquationDescription();
			this.updateSlotVariables();
			this.updateEquation();
		},
		/*handle entities for student node
		*/
		handleEntities: function(entity){
			var returnObj;
			var message;
			this.entity = "";
			//case default
			if(entity == "defaultSelect"){
				message = "Please choose a valid entity";
				returnObj = this.studentPM.process(this.currentID, "entity", "", false, message);
			}
			//case 1: entity should not be a duplicate entry for a given schema
			else if(this._model.student.isDuplicateSchemaInstance(this.schema, entity)){
				message = "This entity already exists for given schema";
				returnObj = this.studentPM.process(this.currentID, "entity", entity, false, message);
			}
			//case 2: schema and entity combo has to match from authors nodes
			else if(!this._model.authored.isStudentEntityValid(this.schema, entity)){
				message = "incorrect entity for the chosen schema";
				returnObj = this.studentPM.process(this.currentID, "entity", entity, false, message);
			}
			//case 3: success
			else{
				message = "You have chosen a valid entity";
				returnObj = this.studentPM.process(this.currentID, "entity", entity, true, message);
				this.entity = entity;
			}
			this.applyDirectives(returnObj);
			this._model.student.setEntities(this.currentID, entity);	
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
				}
				if(!parse.error)
					directives = directives.concat(dd);
				var context = this;
			}
			this.applyDirectives(directives);

			return directives;
		},
		equationSet: function (value) {
			// applyDirectives updates equationBox, but not equationText:
			// dom.byId("equationText").innerHTML = value;

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
			}
		},
		initialViewSettings: function(type){
			//make display none for all fields initially
			//removed optionality container from initial view settings
			//TODO: further clean up necessary after discussion
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
				/*
				//can the qty node have delete option
				var canHaveDeleteNode = this.canHaveDeleteNode();
				if(canHaveDeleteNode){
					registry.byId("deleteButton").set("disabled",false);
				}
				else{
					registry.byId("deleteButton").set("disabled",true);
				}
				*/
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
				//for the schema select load schema options
				this.loadSchemaOptions();
				var schema = this._model.student.getSchema(nodeid);
				if(!schema)
					schema = "";
				registry.byId(this.controlMap.schemas).set('value', schema);
				this.applyDirectives(this.studentPM.process(nodeid, "schema", schema, schema, ""));
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

				//disable the description and equation fields
				descriptionWidget.set('disabled', true);
				equationWidget.set('disabled', true);	
			}
			else if(nodeType == "quantity"){
				console.log("a quantity node has been opened");
				var variable = this._model.student.getName(nodeid);
				registry.byId(this.controlMap.variable).set('value', variable || '');
				//for now commenting out this part, this commit comes after editors have been finalized
				//var qtyDesc = this._model.getDescriptionForVariable(variable);
			
			}
			/*
			// Apply settings from PM
			console.log("Initial Control Settings for Student");
			var directives = this._model.student.getStatusDirectives(nodeid);
			var nodeDirectives = this._PM.getNodeDisplayStatus(nodeid);
			array.forEach(directives, function(directive){
				if(directive.attribute == "status"){
					nodeDirectives = nodeDirectives.concat(this._PM.getNodeDisplayStatus(nodeid, directive.id,directive.value));
				}
			}, this);

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

			this.applyDirectives(nodeDirectives);
			style.set(this.genericDivMap.inputs, "display", "block");
			*/
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
			var authoredID = this._model.authored.getNodeIDByName(variable);
			//console.log(id,descID,this._model.given.getName(descID));
			var directives = this._PM.processAnswer(id, 'description', authoredID);
			if(!this._model.authored.isNodeIrrelevant(authoredID))
				directives.push.apply(directives,
						this._PM.processAnswer(id, 'variable', variable));
			// Need to send to PM and update status, but don't actually
			// apply directives since they are for a different node.
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
			var authoredID = this._model.authored.getNodeIDByName(variable);
			if(authoredID){
				this._model.active.setAuthoredID(id, authoredID);
				this._model.active.setDescription(id, this._model.authored.getDescription(authoredID));
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
			//console.log("selected description is", description);
			if(description == "defaultSelect"){
				//not a valid selection, hide type, value and units
				this.disableTypeValueUnits(true);
			}
			else{
				this.disableTypeValueUnits(false);
			}
			this._model.student.setDescription(this.currentID, description);
		},
		disableTypeValueUnits: function(disable){
			registry.byId(this.controlMap.value).set("disabled", disable);
			registry.byId(this.controlMap.unknown).set("disabled", disable);
			registry.byId(this.controlMap.parameter).set("disabled", disable);
			registry.byId(this.controlMap.dynamic).set("disabled", disable);
		},
		getSlotVariablesList: function(){
			return this._model.student.getAllVariables();
		}
	});
});

