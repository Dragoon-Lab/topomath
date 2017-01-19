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
	"dojo/dom",
	"dojo/keys",
	"dojo/on",
	"dojo/ready",
	"dijit/registry",
], function(array, declare, lang, dom, keys, on, ready, registry){

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
		_quantityNodeEditor: null,
		_equationNodeEditor: null,

		/*
		 * When opening the node editor, we need to populate the controls without
		 * evaluating those changes.
		 */
		disableHandlers: false,
		/* The last value entered into the intial value control */

		lastInitial: {value: null},

		genericControlMap: {
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
			message2: 'messageBox2',
			crisisAlert: 'crisisAlertMessage'
		},

		// Controls that are select menus
		selects: ['description', 'units', 'inputs'],

		constructor: function(mode, model, ui_config){

			console.log("+++++++++ In generic controller constructor");
			lang.mixin(this.controlMap, this.genericControlMap);

			this._model = model;
			this._mode = mode;

			ready(this, this._initCrisisAlert);
			// The Node Editor widget must be set up before modifications
			// It might be a better idea to only  call the controller
			// after widgets are set up.

			ready(this, this._setUpNodeEditors);
			ready(this, this._initHandles);
		},

		// A stub for connecting routine to draw new node.
		/*
		addNode: function(node, autoflag){
			console.log("Node Editor calling addNode() for ", node.id);
		},
		*/

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
				}
				crisis.hide();
			});
		},

		_setUpNodeEditors: function(){
			// get Node Editor widget from tree
			// In TopoMath this functions sets up display of both quantity and equation node editor
			this._quantityNodeEditor = registry.byId('quantityNodeEditor');
			this._quantityNodeEditor.set("display", "block");
			this._equationNodeEditor = registry.byId('equationNodeEditor');
			this._equationNodeEditor.set("display", "block");
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

			 //event handler for quantity node description field
			var desc_qty = registry.byId(this.controlMap.description);
			desc_qty.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleQuantityDescription.apply(this, arguments);
			}));

			//event handler for equation node description field
			var desc_eq = registry.byId(this.controlMap.description2);
			desc_eq.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEquationDescription.apply(this, arguments);
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

			var equationWidget = registry.byId(this.controlMap.equation);
			equationWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEquation.apply(this, arguments);
			}));

			// When the equation box is enabled/disabled, do the same for
			// the inputs widgets.
			array.forEach(["nodeInputs"], function(input){
				var widget = registry.byId(input);
				equationWidget.watch("disabled", function(attr, oldValue, newValue){
					// console.log("************* " + (newValue?"dis":"en") + "able inputs");
					widget.set("disabled", newValue);
				});
			});

			// For each button 'name', assume there is an associated widget in the HTML
			// with id 'nameButton' and associated handler 'nameHandler' below.
			var buttons = ["plus", "minus", "times", "divide", "undo", "equationDone", "sum", "product"];
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
		showQuantityNodeEditor: function(/*string*/ id){
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

			this._quantityNodeEditor.show().then(lang.hitch(this, function(){
				this.disableHandlers = false;
			}));
		},

		showEquationNodeEditor: function(/*string*/ id){
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

			this._equationNodeEditor.show().then(lang.hitch(this, function(){
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

			//to do : fetch initial value from model, for now giving empty value,
			var initial = "";//model.getInitial(nodeid);
			console.log('initial value is ', initial, typeof initial);
			// Initial value will be undefined if it is not in the model
			var isInitial = typeof initial === "number";
			this.lastInitial.value = isInitial?initial.toString():null;
			registry.byId(this.controlMap.initial).attr('value', isInitial?initial:'');

		},
	});
});
