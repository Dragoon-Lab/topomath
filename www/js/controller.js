/**
 *Dragoon Project
 *Arizona State University
 *(c) 2014, Arizona Board of Regents for and on behalf of Arizona State University
 *
 *This file is a part of Dragoon
 *Dragoon is free software: you can redistribute it and/or modify
 *it under the terms of the GNU Lesser General Public License as published by
 *the Free Software Foundation, either version 3 of the License, or
 *(at your option) any later version.
 *
 *Dragoon is distributed in the hope that it will be useful,
 *but WITHOUT ANY WARRANTY; without even the implied warranty of
 *MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 *GNU Lesser General Public License for more details.
 *
 *You should have received a copy of the GNU Lesser General Public License
 *along with Dragoon.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* global define */

define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/aspect",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/keys",
	"dojo/on",
	"dojo/ready",
	"dijit/popup",
	"dijit/registry",
	"dijit/TooltipDialog",
	"dijit/focus",
], function(array, declare, lang, aspect, dom, domClass, domConstruct, domStyle, keys, on, ready, popup, registry, TooltipDialog, focusUtil){

	/* Summary:
	 *			Controller for the node editor, common to all modes
	 * Description:
	 *			Handles selections from the student or author as he/she
	 *			completes a model; inherited by con-student.js and con-author.js
	 * Tags:
	 *			controller, student mode, coached mode, test mode, author mode
	 */

	return declare(null, {
		_model: null,
		_nodeEditor: null, // node-editor object- will be used for populating fields
		_nodeEditor2: null,
		/*
		 * When opening the node editor, we need to populate the controls without
		 * evaluating those changes.
		 */
		disableHandlers: false,
		/* The last value entered into the intial value control */

		lastInitial: {value: null},
		logging: null,
		equationEntered: null,	// Variable to track if an equation has been entered and checked value is set when node editor opened
		// A list of common controls of student and author
		genericControlMap: {
			type: "typeId",
			initial: "initialValue",
			equation: "setName2",
		},
		genericDivMap: {
			initial: "initialValueDiv",
			units: "unitDiv",
			equation: "expressionDiv"
		},
		// A list of all widgets.  (The constructor mixes this with controlMap)
		widgetMap: {
			message: 'messageBox',
			crisisAlert: 'crisisAlertMessage'
		},

		// Controls that are select menus
		selects: ['description', 'type', 'units', 'inputs'],

		constructor: function(mode, model, ui_config){

			console.log("+++++++++ In generic controller constructor");
			lang.mixin(this.controlMap, this.genericControlMap);

			this._model = model;
			this._mode = mode;
			//this.structured._model = this._model;

			ready(this, this._initCrisisAlert);
			// The Node Editor widget must be set up before modifications
			// It might be a better idea to only  call the controller
			// after widgets are set up.
			//if(this.activityConfig.get("showNodeEditor")){
			ready(this, this._setUpNodeEditor);
			//ready(this, this._setUpPreNodeEditor);
			ready(this, this._initHandles);
			//}
			//this.nodeConnections = [];
		},

		// A stub for connecting routine to draw new node.
		addNode: function(node, autoflag){
			console.log("Node Editor calling addNode() for ", node.id);
		},

		_initCrisisAlert: function(){
			//Crisis Alert widget
			var crisis = registry.byId(this.widgetMap.crisisAlert);
			var that = this;
			crisis._setOpenAttr = function(message){
				var crisisMessage = dom.byId('crisisMessage');
				console.log("crisis alert message ", message);
				crisisMessage.innerHTML = message;
				crisis.show();
			};
			on(registry.byId("OkButton"), "click", function(){
				if(crisis.title && crisis.title.indexOf("Equation for") >= 0){
					var nodeName = crisis.title.replace("Equation for ", "");
					/*
					that.logging.log('ui-action', {
						type: "close-equation", 
						node: nodeName
					}); */
				}
				crisis.hide();
			});
		},

		_setUpNodeEditor: function(){
			// get Node Editor widget from tree
			this._nodeEditor = registry.byId('nodeeditor');
			this._nodeEditor.set("display", "block");
			this._nodeEditor2 = registry.byId('nodeeditor2');
			this._nodeEditor2.set("display", "block");
		},

		//set up event handling with UI components
		_initHandles: function(){
			// Summary: Set up Node Editor Handlers

			/*
			 Attach callbacks to each field in node Editor.

			 The lang.hitch sets the scope to the current scope
			 and then the handler is only called when disableHandlers
			 is false.

			 We could write a function to attach the handlers?
			 */

			var desc = registry.byId(this.controlMap.description);
			desc.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleDescription.apply(this, arguments);
			}));

			/*
			 *	 event handler for 'type' field
			 *	 'handleType' will be called in either Student or Author mode
			 * */
			var type = registry.byId(this.controlMap.type);
			type.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleType.apply(this, arguments);
			}));

			/*
			 *	 event handler for 'Initial' field
			 *	 'handleInitial' will be called in either Student or Author mode
			 * */

			var initialWidget = registry.byId(this.controlMap.initial);
			// This event gets fired if student hits TAB or input box
			// goes out of focus.
			initialWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleInitial.apply(this, arguments);
			}));

			// Look for ENTER key event and fire 'Change' event, passing
			// value in box as argument.  This is then intercepted by the
			// regular handler.
			initialWidget.on("keydown", function(evt){
				// console.log("----------- input character ", evt.keyCode, this.get('value'));
				if(evt.keyCode == keys.ENTER){
					this.emit('Change', {}, [this.get('value')]);
				}
			});
			// undo color on change in the initial value widget
			initialWidget.on("keydown",lang.hitch(this,function(evt){
				if(evt.keyCode != keys.ENTER){
					var w = registry.byId(this.controlMap.initial);
					w.set('status','');
				}
			}));

			var inputsWidget = registry.byId(this.controlMap.inputs);
			inputsWidget.on('Change',  lang.hitch(this, function(){
				return this.disableHandlers || this.handleInputs.apply(this, arguments);
			}));

			var unitsWidget = registry.byId(this.controlMap.units);
			unitsWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleUnits.apply(this, arguments);
			}));

			/*
			var positiveWidget = registry.byId("positiveInputs");
			positiveWidget.on('Change', lang.hitch(this.structured, this.structured.handlePositive));

			var negativeWidget = registry.byId("negativeInputs");
			negativeWidget.on('Change', lang.hitch(this.structured, this.structured.handleNegative));

			//workaround to handleInputs on Same Node Click
			/* inputsWidget.on('Click', lang.hitch(this, function(){
			 return this.disableHandlers || this.handleInputs.apply(this, arguments);
			 }));*/

			var equationWidget = registry.byId(this.controlMap.equation);
			equationWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEquation.apply(this, arguments);
			}));

			// When the equation box is enabled/disabled, do the same for
			// the inputs widgets.
			array.forEach(["nodeInputs", "positiveInputs", "negativeInputs"], function(input){
				var widget = registry.byId(input);
				equationWidget.watch("disabled", function(attr, oldValue, newValue){
					// console.log("************* " + (newValue?"dis":"en") + "able inputs");
					widget.set("disabled", newValue);
				});
			});

			// For each button 'name', assume there is an associated widget in the HTML
			// with id 'nameButton' and associated handler 'nameHandler' below.
			var buttons = ["plus", "minus", "times", "divide", "undo", "equationDone", "sum", "product","explanation"];
			array.forEach(buttons, function(button){
				var w = registry.byId(button + 'Button');
				if(!w){
					/* logging will be added later
					this.logging.clientLog("assert", {
						message: "button not found, button id : "+button,
						functionTag: '_initHandles'
					});
					*/
				}
				var handler = this[button + 'Handler'];
				if(!handler){
					/*
					this.logging.clientLog("assert", {
						message: "button handler not found, handler id : "+handler,
						functionTag: '_initHandles'
					}); */
				}
			}, this);

			//undo background color on change
			array.forEach(this.resettableControls, function(con){
				var w = registry.byId(this.controlMap[con]);
				w.on("keydown", lang.hitch(this, function(evt){
					if(evt.keyCode != keys.ENTER){
						w.set('status','');
					}
				}));
			}, this);

		},
		
		//show node editor
		showNodeEditor: function(/*string*/ id){
			//Checks if the current mode is COACHED mode and exit from node editor if all the modes are defined
			console.log("showNodeEditor called for node ", id);
			this.currentID = id; //moved using inside populateNodeEditorFields
			//this.nodeStartAssessment();
			this.disableHandlers = true;
			this.initialControlSettings(id);
			this.populateNodeEditorFields(id);

			// Hide the value and expression controls in the node editor, depending on the type of node		
			//var type=this._model.active.getType(this.currentID);
			//this.adjustNodeEditor(type);

			this._nodeEditor.show().then(lang.hitch(this, function(){
				this.disableHandlers = false;
			}));
		},

		showNodeEditor2: function(/*string*/ id){
			//Checks if the current mode is COACHED mode and exit from node editor if all the modes are defined
			console.log("showNodeEditor2 called for node ", id);
			this.currentID = id; //moved using inside populateNodeEditorFields
			//this.nodeStartAssessment();
			this.disableHandlers = true;
			this.initialControlSettings(id);
			this.populateNodeEditorFields(id);

			// Hide the value and expression controls in the node editor, depending on the type of node		
			//var type=this._model.active.getType(this.currentID);
			//this.adjustNodeEditor(type);

			this._nodeEditor2.show().then(lang.hitch(this, function(){
				this.disableHandlers = false;
			}));
		},
		// Stub to be overwritten by student or author mode-specific method.
		initialControlSettings: function(id){
			console.error("initialControlSettings should be overwritten.");
			//log message added through aspect.
		},

		populateNodeEditorFields: function(nodeid){
			
			console.log("populate node editor fields enter");
			/*
			//populate description
			var model = this._model.active;
			var editor = this._nodeEditor;
			//set task name
			var nodeName = model.getName(nodeid) || "New quantity";
			editor.set('title', nodeName);

			/*
			 Set values and choices based on student model

			 Set selection for description, type, units, inputs (multiple selections)

			 Set value for initial value, equation (input),
			 */

			 /*
			if(model.getNodeIDFor){
				var d = registry.byId(this.controlMap.description);
				array.forEach(this._model.given.getDescriptions(), function(desc){
					var exists =  model.getNodeIDFor(desc.value);
					d.getOptions(desc).disabled=exists;
					if(desc.value == nodeName){
						d.getOptions(desc).disabled=false;
					}});
			}

			var type = model.getType(nodeid);
			console.log('node type is', type || "not set");

			registry.byId(this.controlMap.type).set('value', type || 'defaultSelect');
			if(type == "parameter"){
				dom.byId("initLabel").innerHTML = "";
			}
			else if(type == "accumulator"){
				dom.byId("initLabel").innerHTML = "Initial ";
			}
			//update labels
			this.updateEquationLabels(type);

			var initial = model.getInitial(nodeid);
			console.log('initial value is ', initial, typeof initial);
			// Initial value will be undefined if it is not in the model
			var isInitial = typeof initial === "number";
			this.lastInitial.value = isInitial?initial.toString():null;
			registry.byId(this.controlMap.initial).attr('value', isInitial?initial:'');

			var unit = model.getUnits(nodeid);
			console.log('unit is', unit || "not set");
			// Initial input in Units box
			registry.byId(this.controlMap.units).set('value', unit || '');

			// Input choices are different in AUTHOR and student modes
			// So they are set in con-author.js and con-student.js

			var equation = model.getEquation(nodeid);
			console.log("equation before conversion ", equation);
			var mEquation = equation ? expression.convert(model, equation) : '';
			console.log("equation after conversion ", mEquation);
			/* mEquation is a number instead of a string if equation is just a number; convert to string before setting the value */
			/*
			registry.byId(this.controlMap.equation).set('value', mEquation.toString());
			dom.byId("equationText").innerHTML = mEquation;
			this.equationEntered = true;

			/*
			 The PM sets enabled/disabled and color for the controls

			 Set enabled/disabled for input, units, initial value, type
			 description

			 Color for Description, type, initial value, units, input,
			 and equation.

			 Note that if equation is disabled then
			 input, +, -, *, /, undo, and done should also be disabled.
			 */

		},
	});
});
