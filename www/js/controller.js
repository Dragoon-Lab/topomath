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
	"dojo/dom-style",
	"dojo/dom-construct",
	"./equation"
], function(array, declare, lang, dom, keys, on, ready, registry, domStyle, domConstruct, expression){

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
		_nodeEditor: null,
		/*
		 * When opening the node editor, we need to populate the controls without
		 * evaluating those changes.
		 */
		disableHandlers: false,
		/* The last value entered into the intial value control */

		lastInitial: {value: null},

		genericControlMap: {
			initial: "initialValueInputbox",
		},
		genericDivMap: {
			initial: "initialValueInputboxContainer",
			units: "unitsSelectorContainer",
			equation: "expressionDiv"
		},
		// A list of all widgets.  (The constructor mixes this with controlMap)
		widgetMap: {
			message: 'messageOutputbox',
			crisisAlert: 'crisisAlertMessage'
		},

		// Controls that are select menus
		selects: ['description', 'units', 'inputs'],

		// attributes that should be saved in the status section
		validStatus: {status: true, disabled: true},
		
		constructor: function(mode, model, ui_config){

			console.log("+++++++++ In generic controller constructor");
			lang.mixin(this.controlMap, this.genericControlMap);

			this._model = model;
			this._mode = mode;

			ready(this, this._initCrisisAlert);
			// The Node Editor widget must be set up before modifications
			// It might be a better idea to only  call the controller
			// after widgets are set up.

			ready(this, this._setUpNodeEditor);
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
		_setStatus : function(value){
			var colorMap = {
				correct: "lightGreen",
				incorrect: "#FF8080",
				demo: "yellow",
				premature: "lightBlue",
				entered: "#2EFEF7"
			};
			if(value && !colorMap[value]){
				this.logging.clientLog("assert", {
					message: 'Invalid color specification, color value : '+value,
					functionTag: 'setStatus'
				});
			}
			/* BvdS:  I chose bgColor because it was easy to do
			 Might instead/also change text color?
			 Previously, just set domNode.bgcolor but this approach didn't work
			 for text boxes.   */
			// console.log(">>>>>>>>>>>>> setting color ", this.domNode.id, " to ", value);
			domStyle.set(this.domNode, 'backgroundColor', value ? colorMap[value] : '');
		},

		_setUpNodeEditor: function(){
			// get Node Editor widget from tree
			// In TopoMath this functions sets up display of both quantity and equation node editor
			this._nodeEditor = registry.byId('nodeEditor');
			this._nodeEditor.set("display", "block");
			/*
			 Add attribute handler to all of the controls
			 When "status" attribute is changed, then this function
			 is called.
			 */

			//we do not yet have activity parameters, for now setting it to true by default
			var showFeedback = /*this.activityConfig.get("showFeedback")*/true;
			if(showFeedback){
				for(var control in this.controlMap){
					var w = registry.byId(this.controlMap[control]);
					console.log(control);
					w._setStatusAttr = this._setStatus;
				}
				/*
				 * If the status is set for equationBox, we also need to set
				 * the status for equationText.  Since equationText is not a widget,
				 * we need to set it explicitly.
				 * Adding a watch method to the equationBox didn't work.
				 */
				//commenting out this section for now as we do not yet use equationText
				/* 
				aspect.after(registry.byId(this.controlMap.equation), "_setStatusAttr",
					lang.hitch({domNode: dom.byId("equationText")}, this._setStatus),
					true);
				*/	
			}

			var setEnableOption = function(value){
				console.log("++++ in setEnableOption, scope=", this);
				array.forEach(this.options, function(option){
					if((!value || option.value == value ) && option.value !== "defaultSelect")
						option.disabled = false;
				});
				this.startup();
			};
			var setDisableOption = function(value){
				console.log("++++ in setDisableOption, scope=", this);
				array.forEach(this.options, function(option){
					if(!value || option.value == value)
						option.disabled = true;
				});
				this.startup();
			};
			// All <select> controls
			array.forEach(this.selects, function(select){
				var w = registry.byId(this.controlMap[select]);
				w._setEnableOptionAttr = setEnableOption;
				w._setDisableOptionAttr = setDisableOption;
			}, this);

			// Add appender to message widget
			var messageWidget = registry.byId(this.widgetMap.message);
			messageWidget._setAppendAttr = function(message){
				var message_box_id=dom.byId("messageOutputbox");

				// Set the background color for the new <p> element
				// then undo the background color after waiting.
				var element=domConstruct.place('<p style="background-color:#FFD700;">'
					+ message + '</p>', message_box_id);

				/*Set interval for message blink*/
				window.setTimeout(function(){
					// This unsets the "background-color" style
					domStyle.set(element, "backgroundColor", "");
				}, 3000);  // Wait in milliseconds

				// Scroll to bottoms
				this.domNode.scrollTop = this.domNode.scrollHeight;
			};

			/*
			 Add fields to units box, using units in model node
			 In author mode, this needs to be turned into a text box.
			 */
			//to do : selectUnits comes with student mode
			/* 
			var u = registry.byId("selectUnits");
			// console.log("units widget ", u);

			var units = this._model.getAllUnits();
			units.sort();

			array.forEach(units, function(unit){
				u.addOption({label: unit, value: unit});
			});
			*/
			//to do: discuss with team implications of autho complete for now commenting
			/*
			if(this.activityConfig.get('showEquationAutoComplete')){
				var mathFunctions = dojo.xhrGet({
					url: 'mathFunctions.json',
					handleAs: 'json',
					load: lang.hitch(this, function(response){
						//get math functions
						var mathFunctions = Object.keys(response);

						//Add Node names
						var descriptions = this._model.given.getDescriptions();
						var nodeNames = [];
						array.forEach(descriptions, function (desc) {
							var name = this._model.given.getName(desc.value);
							nodeNames.push(name)
						}, this);

						//Combine node names and math functions
						nodeNames = nodeNames.concat(mathFunctions);

						var equationAutoComplete = new AutoComplete('equationBox', nodeNames ,[' ',  '+', '-' , '/', '*', '(' , ')', ','], response);
					}),
					error: function(){

					}
				});
			} */

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
				return this.disableHandlers || this.handleDescription.apply(this, arguments);
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
			var buttons = ["plus", "minus", "times", "divide", "undo", "equationDone"];
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
				w.on('click', lang.hitch(this, handler));
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
			console.log("showNodeEditor called for node ", id);
			this.currentID = id; //moved using inside populateNodeEditorFields
			//this.nodeStartAssessment();
			this.disableHandlers = true;
			//based on the type decide what fields to show or hide
			//call get type once the model is intergrated
			//for now commenting it and randomly giving nodetype value
			var nodeType = this._model.active.getType(this.currentID);
			console.log("nodeType",nodeType);
			this.initialViewSettings(nodeType);
			this.initialControlSettings(id);
			this.populateNodeEditorFields(id);

			// Hide the value and expression controls in the node editor, depending on the type of node		
			//var type=this._model.active.getType(this.currentID);
			//this.adjustNodeEditor(type);

			this._nodeEditor.show().then(lang.hitch(this, function(){
				this.disableHandlers = false;
			}));

		},
		initialViewSettings: function(type){
			//over written by student or author specific method
		},
		// Stub to be overwritten by student or author mode-specific method.
		initialControlSettings: function(id){
			console.error("initialControlSettings should be overwritten.");
			//log message added through aspect.
		},

		populateNodeEditorFields: function(nodeid){
			console.log("populate node editor fields enter");
			//populate description
			var model = this._model.active;
			var editor = this._nodeEditor;
			//set task name
			var nodeHeading =  "New "+(this._model.active.getType(nodeid)?this._model.active.getType(nodeid): "node");
			var nodeName = model.getName(nodeid) || nodeHeading;
			editor.set('title', nodeName);

			/*
			 Set values and choices based on student model

			 Set selection for description, type, units, inputs (multiple selections)

			 Set value for initial value, equation (input),
			 */


			if(model.getNodeIDFor){
				var d = registry.byId(this.controlMap.description);
				array.forEach(this._model.given.getDescriptions(), function(desc){
					var exists =  model.getNodeIDFor(desc.value);
					d.getOptions(desc).disabled=exists;
					if(desc.value == nodeName){
						d.getOptions(desc).disabled=false;
					}});
			}


			var nodeType = this._model.authored.getType(nodeid);

			if(nodeType == "quantity"){

				//Populate initial value of quantity node
				//to do : fetch initial value from model, for now giving empty value,
				var initial = "";//model.getInitial(nodeid);
				console.log('initial value is ', initial, typeof initial);
				// Initial value will be undefined if it is not in the model
				var isInitial = typeof initial === "number";
				this.lastInitial.value = isInitial?initial.toString():null;
				registry.byId(this.controlMap.initial).attr('value', isInitial?initial:'');

				var unit = model.getUnits(nodeid);
				console.log('unit is', unit || "not set");
				// Initial input in Units box
				registry.byId(this.controlMap.units).set('value', unit || '');

			}
			else if(nodeType == "equation"){
				//populate nodeEditor fields for an equation node

				var equation = model.getEquation(nodeid);
				console.log("equation before conversion ", equation);
				var mEquation = equation ? expression.convert(model, equation) : '';
				console.log("equation after conversion ", mEquation);
				/* mEquation is a number instead of a string if equation is just a number; convert to string before setting the value */
				registry.byId(this.controlMap.equation).set('value', mEquation.toString());
				//This was used when structured was also there, once confirm with team before removing it, for now commenting it 
				//dom.byId("equationText").innerHTML = mEquation;
				this.equationEntered = true;
			}
		},

		/*
		 Take a list of directives and apply them to the Node Editor,
		 updating the model and updating the graph.

		 The format for directives is defined in documentation/node-editor.md
		 */
		applyDirectives: function(directives, noModelUpdate){
			// Apply directives, either from PM or the controller itself.
			var tempDirective = null;
			array.forEach(directives, function(directive) {
				/*to do: for now not using authorModelStatus, so updateModelStatus function has no significance
				if(!noModelUpdate)
					this.updateModelStatus(directive); */
				if (directive.attribute != "display" && this.widgetMap[directive.id]) {
					var w = registry.byId(this.widgetMap[directive.id]);
					if (directive.attribute == 'value') {
						w.set("value", directive.value, false);
						// Each control has its own function to update the
						// the model and the graph.
						// keep updating this section as we handle the editor input fields
						if(w.id == 'initialValueInputbox'){
							this._model.active.setInitial(this.currentID, directive.value);
						}else if(w.id == 'selectDescription'){
							this.updateDescription(directive.value);
						}else if(w.id == 'equationBox'){
							this.equationSet(directive.value);
						}
						//to do : update explanation function but right now no directives with att value for explanations not being processed 

					}else{
						console.log("w is",w);
						w.set(directive.attribute, directive.value);
						if(directive.attribute === "status"){
							//tempDirective variable further input to editor tour
							//for now commenting the variable copy
							//tempDirective = directive;
						}
					}
				}else if(directive.attribute == "display"){
					//directives where display is updated/ given feedback from here
					//genericDivMap needs to be checked eachtime for topoMath editor's fields
					if(this.genericDivMap[directive.id]){
						domStyle.set(this.genericDivMap[directive.id], directive.attribute, directive.value);
					}
				}else{
					//this code needs to be uncommented when logging module is included
					/*
					this.logging.clientLog("warning", {
						message: "Directive with unknown id, id :"+directive.id,
						functionTag: 'applyDirectives'
					});
					*/
				}
			}, this);
			/* check after node editor tour has been included into topomath
			if(tempDirective && this.activityConfig.get("showNodeEditorTour")) {
				this.continueTour(tempDirective);
			}
			*/
		},

		updateModelStatus: function(desc){
			//stub for updateModelStatus
			//actual implementation in con-student and con-author
		},
		plusHandler: function(){
			console.log("****** plus button");
			this.equationInsert('+');
		},
		minusHandler: function(){
			console.log("****** minus button");
			this.equationInsert('-');
		},
		timesHandler: function(){
			console.log("****** times button");
			this.equationInsert('*');
		},
		divideHandler: function(){
			console.log("****** divide button");
			this.equationInsert('/');
		},
		undoHandler: function(){
			var equationWidget = registry.byId("equationInputbox");
			equationWidget.set("value", "");
			//to do: based on how we handle select model, for now commenting it out
			/*
			var givenEquationWidget = registry.byId("givenEquationBox");//if value of selectModel was equal to "given"
			givenEquationWidget.set("value", "");
			dom.byId("equationText").innerHTML = "";
			*/
		},
		equationInsert: function(text){
			//todo: initialize domNode
			var widget = registry.byId(this.controlMap.equation);
			var oldEqn = widget.get("value");
			// Get current cursor position or go to end of input
			// console.log("	   Got offsets, length: ", widget.domNode.selectionStart, widget.domNode.selectionEnd, oldEqn.length);
			var p1 = widget.domNode.selectionStart;
			var p2 = widget.domNode.selectionEnd;
			widget.set("value", oldEqn.substr(0, p1) + text + oldEqn.substr(p2));
			// Set cursor to end of current paste
			widget.domNode.selectionStart = widget.domNode.selectionEnd = p1 + text.length;
		},

		updateNodes: function(){
			// Update node editor and the model.
			this._nodeEditor.set('title', this._model.active.getName(this.currentID));

			// Update inputs and other equations based on new quantity.
			expression.addQuantity(this.currentID, this._model.active);

			// need to delete all existing outgoing connections
			// need to add connections based on new inputs in model.
			// add hook so we can do this in draw-model...
			this.addQuantity(this.currentID, this._model.active.getOutputs(this.currentID));
		},
		/* Stub to update connections in graph */
		addQuantity: function(source, destinations){
		},

		handleEquation: function(equation){
			console.log("inside equation handler");
			var w = registry.byId(this.widgetMap.equation);
			this.equationEntered = false;
			w.set('status','');
			// undo color when new value is entered in the equation box widget
			w.on("keydown",lang.hitch(this,function(evt){
				if(evt.keyCode != keys.ENTER){
					w.set('status','');
				}
			}));
		},

		//TODO: delete node is to be implemented in drawModel
		deleteNode: function(id){
			//Stub to delete node with id by inturn calling drawmodel.deleteNode in main.js
			return id;
		},


	});
});
