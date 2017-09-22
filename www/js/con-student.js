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
	"dojo/ready",
	"dojo/on",
	"dojo/dom-construct",
	"dijit/focus",
	'dijit/registry',
	"dijit/TooltipDialog",
	"dijit/popup",
	'./controller',
	"./pedagogical-module",
	"./typechecker",
	"./equation",
], function(aspect, array, declare, lang, dom, domClass, style, ready,on,
 domConstruct, focusUtil, registry, tooltipDialog, popup, controller, PM, typechecker, expression) {
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
			this._PM = new PM(model, this._config.get("feedbackMode"));
			ready(this, "populateSelections");
			this.init();
		},

		resettableControls: ["variable","description","value","units","equation"],
		variableNodeControls: ["variable","value","units"],
		equationNodeControls: ["inputs","equation"],
		commonNodeControls: ["modelType","description"],

		init: function () {
			// TODO : Check Model Completeness
			this.studentControls();
		},
		// A list of control map specific to students
		resettableControls: ["variable","description","value","units","equation"],

		controlMap: {
			inputs: "inputSelectorStudent",
			variable: "variableInputboxStudent",
			equation: "equationInputboxStudent",
			description: "selectDescription",
			units: "unitsSelectorStudent",
			modelType: "modelSelector",
			value: "valueInputbox"
		},
		studentControls: function(){
			console.log("++++++++ Setting AUTHOR format in Node Editor.");
			style.set('descriptionInputboxContainerStudent', 'display', 'inline-block');
			style.set('variableInputboxContainerStudent', 'display', 'inline-block');
			//style.set('valueInputboxContainer', 'display', 'block');
			style.set('unitsSelectorContainerStudent', 'display', 'block');
			style.set('expressionDiv', 'display', 'block');
			style.set('inputSelectorContainerStudent', 'display', 'block');
			style.set('equationInputboxStudent', 'display', 'block');
		},
		populateSelections: function () {
			/*
			 Initialize select options in the node editor that are
			 common to all nodes in a problem.

			 In AUTHOR mode, this needs to be done when the
			 node editor is opened.
			 */
			// Add fields to Description box and inputs box
			// In author mode, the description control must be a text box
			var d = registry.byId(this.controlMap.description);
			// populate input field
			var t = registry.byId(this.controlMap.inputs);
			var u = registry.byId(this.controlMap.units);
			var variableName = registry.byId(this.controlMap.variable);
			if (!t) {
				///Log if no widget found
			}

			console.log("description widget = ", d, this.controlMap.description);
			//  d.removeOption(d.getOptions()); // Delete all options

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
			
			array.forEach(descriptions, function (desc) {
				if(desc.label !== undefined){
					d.addOption(desc);
					console.log("Description is : ", desc);
					var name = this._model.authored.getName(desc.value);
					var option = {label: name + " (" + desc.label + ")", value: desc.value};
					console.log("option is",option);
					
					if(name !== undefined && name !== ""){
						variableName.addOption({label: name , value: name});
						t.addOption(option);
					}
				}

			}, this);

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
				console.log("current ID", this.currentID, newValue);
				this.applyDirectives(this._PM.processAnswer(this.currentID, 'value', newValue));
			} else if (valueFlag.errorType) {
				// Log Error
			}
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
				var dd = this._PM.processAnswer(
				this.currentID, 'equation', parse, registry.byId(this.controlMap.equation).get("value"));
				directives = directives.concat(dd);
				var context = this;
			}
			console.log(directives);
			this.applyDirectives(directives);

			return directives;
		},
		equationSet: function (value) {
			// applyDirectives updates equationBox, but not equationText:
			// dom.byId("equationText").innerHTML = value;

			if(value != ""){
				var directives = [];
				// Parse and update model, connections, etc.
				var parse = this.equationAnalysis(directives);
				// Generally, since this is the correct solution, there should be no directives
				this.applyDirectives(directives);

				//Set equation and process answer
				//var parsedEquation = parse.toString(true);
				this._model.active.setEquation(this.currentID, parse.equation);
				//Create expression nodes for parsed equation
				this.createExpressionNodes(parse);
				var dd = this._PM.processAnswer(this.currentID, 'equation', parse, registry.byId(this.controlMap.equation).get("value"));
				this.applyDirectives(dd);
			}
		},
		/*
		 Settings for a new node, as supplied by the PM.
		 These don't need to be recorded in the model, since they
		 are applied each time the node editor is opened.
		 */
		initialViewSettings: function(type){
			//make display none for all fields initially
			var qtyElements = ["descriptionInputboxContainerStudent","variableTypeContainer",
			"variableInputboxContainerStudent","valueUnitsContainer"];
			var eqElements = ["descriptionInputboxContainerStudent","expressionDiv"];
		
			if(type == "quantity"){
				eqElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","none");
				});
				qtyElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","block");
				});
			}else if(type == "equation"){
				qtyElements.forEach(function(elem){	
					console.log("element",elem);
					style.set(elem,"display","none");
				});
				eqElements.forEach(function(elem){
					console.log("element",elem);
					style.set(elem,"display","block");
				});

			}
			//emptying message box when a node is open
			console.log("emptying message");
			dojo.empty("messageOutputbox");
		},
		initialControlSettings: function (nodeid) {
			// Apply settings from PM
			console.log("Initial Control Settings for Student");
			
			// Set the selected value in the description.
			var desc = this._model.student.getAuthoredID(nodeid);
			var variableName = this._model.student.getVariable(nodeid);
			console.log('description is', desc || "not set");
			
			registry.byId(this.controlMap.description).set('value', desc || 'defaultSelect', false);
			
			registry.byId(this.controlMap.variable).set('value', variableName || 'defaultSelect', false);

			//var _variableTypes = ["unknown","parameter","dynamic"];
			var _variableTypes = ["unknown","parameter"];
			array.forEach(_variableTypes, function(_type){
				registry.byId(_type+"Type").set('checked',false);
				registry.byId(_type+"Type").set('disabled',false);
			})
			
			style.set('valueInputboxContainer','display','none');
			style.set('valueInputboxContainer','disabled',false);
			
			var _variableType = this._model.student.getVariableType(nodeid);
			if(_variableType){
				var _returnObj = this._PM.getActionForType(nodeid, _variableType);
				
				array.forEach(_returnObj, function(directive) {
					registry.byId(_variableType+"Type").set('checked','checked');
					if(directive.attribute == "status" && directive.value == "correct"){
						array.forEach(_variableTypes, function(_type){
							if(_type !== _variableType && this._config.get("feedbackMode") != "nofeedback"){
								registry.byId(_type+"Type").set('disabled',true);
							}
						}, this);
					}
					if(_variableType =="parameter" || _variableType == "dynamic"){
						style.set('valueInputboxContainer','display','block');
					}else{
						style.set('valueInputboxContainer','display','none');
						style.set('valueInputboxContainer','disabled',false);
					}
				}, this);
			}
			/*
			 Set color and enable/disable
			 */
			array.forEach(this._model.student.getStatusDirectives(nodeid), function (directive) {
				if(directive.id != "variableType"){
					var w = registry.byId(this.controlMap[directive.id]);
					w.set(directive.attribute, directive.value);
					// The actual values should be in the model itself, not in status directives.
					if (directive.attribute == "value") {
					//Logging
					}					
				}

			}, this);

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
			directives.push.apply(directives, this._PM.processAnswer(id, 'variable', variable));
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
			
			console.log("returning ", returnObj);
			return returnObj;
		}
	});
});

