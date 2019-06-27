
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
	'dojo/store/Memory',
	"dojo/ready",
	"dijit/registry",
	"dojo/dom-style",
	"dojo/dom-construct",
	"dojo/aspect",
	"dojo/query",
	"dojo/dom-class",
	"dijit/Tooltip",
	"dojo/_base/event",
	"dojo/mouse",
	"dojo/html",
	'dijit/form/ComboBox',
	"./equation",
	"./popup-dialog",
	"./logging"
], function(array, declare, lang, dom, keys, on, memory, ready, registry, domStyle, domConstruct, aspect, query, domClass, toolTip, event,
	mouse, html, comboBox, expression, popupDialog, clientLogging){

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
		_doneDialog: null,
		/*
		 * When opening the node editor, we need to populate the controls without
		 * evaluating those changes.
		 */
		disableHandlers: false,
		/* The last value entered into the intial value control */

		lastValue: {value: null},

		genericControlMap: {
			value: "valueInputbox"
		},
		// list of parent divs for toggle display for directives.
		// fields over written in con-student
		genericDivMap: {
			variableType: 'variableTypeContainer',
			value: "valueInputboxContainer",
			units: "unitsSelectorContainerStudent",
			equation: "expressionDiv"
		},
		// A list of all widgets.  (The constructor mixes this with controlMap)
		widgetMap: {
			message: 'messageOutputbox',
			crisisAlert: 'crisisAlertMessage'
		},

		// Controls that are select menus
		// note that topomath author design has been updated, so updating selects and equationButtons array
		//selects: ['description', 'units', 'inputs'],
		selects: ['description', 'units'],
		
		//equationButtons: ["plus", "minus", "times", "divide", "equals", "undo", "equationDone"],
		equationButtons: [],
		// attributes that should be saved in the status section
		validStatus: {status: true, disabled: true},
		_variableTypes: ["unknown","parameter","dynamic"],
		
		questionMarkButtons : {
					//"inputsQuestionMark": "Select a quantity to enter into the expression above.  Much faster than typing.",
					"valueQuestionMark": "This is a number, typically given to you in the system description.",
					"variableInputboxQuestionMark": "The name of the variable used in equations",
					"qtyDescriptionQuestionMark": "Describes the quantity represented by the variable",
					"qtyDescriptionQuestionMarkStudent": "Select a description for the quantity represented by the variable",
					"variableTypeQuestionMark": "Parameters are quantities whose values are known (or given in the system description). Unknowns are not given, but can be solved for by TopoMath if there are enough equations",
					//"operationsQuestionMark": "Click one of these to enter it in the expression above. <br> See the Help menu at the top of the screen for a list of other mathematical operators and functions that you can type in.",
					"questionMarkRoot": "Indicates that this variable is one the problem will ask the student to solve for",
					"descriptionQuestionMark": "A description for this equation",
					//"descriptionQuestionMarkStudent": "A description for this equation",
					"entityDescriptionQuestionMark": "Enter a list of entity names or descriptions of relationships, separated by semicolons",
					"entityDescriptionQuestionMarkStudent":"Select the relationship/entity this schema is about.",
					"variableSlotNamesQuestionMark": "This section contains variable names to choose from or type in for the selected schema"
		},
		constructor: function(mode, model, config, fixPosition){
			console.log("+++++++++ In generic controller constructor");
			lang.mixin(this.controlMap, this.genericControlMap);

			this._model = model;
			this._mode = mode;
			this._config = config;
			if(this._model.isStudentMode())
				this._fixPosition = fixPosition;

			ready(this, this._initCrisisAlert);
			// The Node Editor widget must be set up before modifications
			// It might be a better idea to only  call the controller
			// after widgets are set up.

			ready(this, this._setUpNodeEditor);
			ready(this, this._initHandles);
			this.nodeConnections = [];
			this._logger = clientLogging.getInstance();
			ready(this, this._attachTooltips);
			this.schema = "";
			this.slotMap = "";
			this.entity = "";
			this.description = "";
			this._giveParams = this._config.get("giveParameters");
			this._skipUnits = this._config.get("skipUnits");
		},

		// A stub for connecting routine to draw new node.
		addNode: function(node, autoflag){
			console.log("Node Editor calling addNode() for ", node.ID);
		},

		// Stub to update node count for unknown quantities and equations
		computeNodeCount: function(id){
		},

		// Stub to setting description for auto craeted nodes.
		setNodeDescription: function(id, variable){
		},

		// Stub to set connections in the graph
		setConnections: function(from, to){
			// console.log("======== setConnections fired for node" + to);
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
				}
				crisis.hide();
			});
		},
		// function is not in this scope and is in scope of the event that has been
		// fired. Thus the work around for this is that we set up the variableTypes
		// here as well as maintaining all the colors and feedback at different places
		// could be difficult.
		_setStatus : function(value){
			var _variableTypes = ["unknown", "parameter", "dynamic"];
			var colorMap = {
				correct: "lightGreen",
				incorrect: "#FF8080",
				demo: "yellow",
				premature: "lightBlue",
				entered: "#2EFEF7",
				partial: "#FF0080",
				"": ""
			};
			var updateColor = function(domNode, color){
				domStyle.set(domNode, 'backgroundColor', color);
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
			if(this.domNode && this.domNode.firstChild &&
				(this.domNode.firstChild.name == "variableType" ||
				this.domNode.name == "variableType")){
				// TODO remove the old color as well
				array.forEach(_variableTypes, function(type){
					updateColor(registry.byId(type+"Type").domNode.firstChild.labels[0], "");
				});
				updateColor(this.domNode.firstChild.labels[0], colorMap[value]);
			} else {
				updateColor(this.domNode, colorMap[value]);
			}
		},

		hideCloseNodeEditor: function(/* originical hide method*/ doHide){
			doHide.apply(this._nodeEditor);
			// added this.currentID because it is needed for logging node details
			this.closeEditor.call(this, this.currentID);
			this._removeTooltips.call(this);
		},

		_setUpNodeEditor: function(){
			// get Node Editor widget from tree
			// In TopoMath this functions sets up display of both quantity and equation node editor
			console.log("in set up node editor", this.nodeType);
			this._nodeEditor = registry.byId('nodeEditor');
			this._nodeEditor.set("display", "block");

			// Wire up this.closeEditor.  Aspect.around is used so we can stop hide()
			// from firing if equation is not entered.
			aspect.around(this._nodeEditor, "hide", lang.hitch(this, function(doHide){ 
				console.log("nodeeditor hide");
				//To keep the proper scope throughout
				//TODO: check node type
				var myThis = this;
				return function(){
					if(myThis.nodeType == "equation"){
						console.log("starting hide", myThis.equationEntered);
						var equation = registry.byId("equationInputbox");
						if(myThis._model.active.isStudentMode() && myThis.schema != "" && myThis.entity!= "" ){
							var authorAssignedEquation = myThis._model.authored.getEquationBySchemaEntity(myThis.schema, myThis.entity);
							if(!myThis._model.student.getAuthoredID(myThis.currentID)){
								myThis._model.student.setAuthoredID(myThis.currentID, authorAssignedEquation["id"]);
							}
						}
						
						if(myThis._model.active.isStudentMode() && myThis._fixPosition && myThis._model.student.getAuthoredID(myThis.currentID) ){
							myThis._model.active.setPosition(myThis.currentID, 0, myThis._model.authored.getPosition(myThis._model.student.getAuthoredID(myThis.currentID),0));
							console.log("updating node view for currentID")
							myThis.updateNodeView(myThis._model.active.getNode(myThis.currentID));
						}
					
						if(equation.value && !myThis.deleteNodeActivated &&  myThis.checkForSlotDuplicates(equation.value)){
							myThis.applyDirectives([{
								id: "crisisAlert",
								attribute: "open",
								value: "The same variable cannot be used in multiple slots. Please correct the duplicate variable."
							}]);
							return;
						}

						//if the equation is in the box but has not been checked(or entered) and deleteNode is not calling for this function or if equation is changed after validating in author mode
						if((equation.value && !myThis.equationEntered && !myThis.deleteNodeActivated)|| (equation.displayedValue !== equation.value)){
							//call equation done handler(equation done handlers in one of the modes will be called based on current mode)
							console.log("equation entered",myThis.equationEntered);
							var directives = myThis.equationDoneHandler();
							
							var isAlertShown = array.some(directives, function(directive){
								// If Done is clicked and equation is incorrect, donot hide editor
								if(directive.id === 'crisisAlert' || directive.value === "incorrect"){
									myThis.equationEntered = false;
									return true;
								}
							});
							console.log("equation done directives", directives, isAlertShown, myThis._model.active.isStudentMode());
							//isAlertShown records if the crisis alert was shown, if not we have to close editor programatically
							if(myThis._model.active.isStudentMode)
								isAlertShown = false;
							if(!isAlertShown) {
								//TODO: discuss premature nodes deletion
								//further hide editor and call closeEditor function
								myThis.hideCloseNodeEditor(doHide);
							}
						} // if the mode is author and user has selected to enter student values (" given ")
						else if(myThis._model.active.isStudentMode() && registry.byId("modelSelector").value == "authored"){
							//equation = registry.byId(myThis.controlMap["equation"]);
							
							//equation value in this case if from equationInputboxStudent and check if the value is entered/checked
							//if not throw a crisis alert message
							/*
							if(equation.value && !myThis.equationEntered){
								//Crisis alert popup if equation not checked
								
								myThis.applyDirectives([{
									id: "crisisAlert", attribute:
										"open", value: "Initial Student Expression value is not checked!  Go back and check your expression to verify it is correct, or delete the expression, before closing the node editor."
								}]); 
							}
							else{
								// Else, do normal closeEditor routine and hide
								myThis.hideCloseNodeEditor(doHide);
							}
							*/
							//there is no case of equation not checked for now in new reconstruction mode, so above case has been commented out and we directly hide the editor
							myThis.hideCloseNodeEditor(doHide);
						}else{ // this case implies either equation box is empty or value has already been checked/entered
							// Else, do normal closeEditor routine and hide
							myThis.hideCloseNodeEditor(doHide);
						}
						//empty the node connections finally
						this.nodeConnections = [];
					}
					else{ //node type is variable (not equation)
						myThis.hideCloseNodeEditor(doHide);
					}
				};
			}));

			/*
			 Add attribute handler to all of the controls
			 When "status" attribute is changed, then this function
			 is called.
			 */

			//we do not yet have activity parameters, for now setting it to true by default
			var showFeedback = true;
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
				//TODO: discuss why equation text was used in dragoon
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
			//TODO : selectUnits comes with student mode
			/* 
			var u = registry.byId("selectUnits");
			// console.log("units widget ", u);

			var units = this._model.getAllUnits();
			units.sort();

			array.forEach(units, function(unit){
				u.addOption({label: unit, value: unit});
			});
			*/
			//TODO: discuss with team implications of autho complete for now commenting
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

			var variable_name = registry.byId(this.controlMap.variable);
			variable_name.on('Change', lang.hitch(this, function(){
				console.log("handling variable name");
				return this.disableHandlers || this.handleVariableName.apply(this, arguments);
			}));

			 //event handler for equation node description field
			var desc_eq = registry.byId(this.controlMap.description);
			desc_eq.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEquationDescription.apply(this, arguments);
			}));

			/*
			 *	 event handler for 'value' field
			 *	 'handleValue' will be called in either Student or Author mode
			 * */
				var variableTypeToggle = dojo.query(".handleVariable");
				variableTypeToggle.forEach(function(toggleNode){
				registry.byNode(toggleNode).on('click', lang.hitch(this, function(event){
					return this.disableHandlers || this.handleVariableType(event);
				}));
			}, this);

			var valueWidget = registry.byId(this.controlMap.value);
			// This event gets fired if student hits TAB or input box
			// goes out of focus.
			valueWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleValue.apply(this, arguments);
			}));

			// Look for ENTER key event and fire 'Change' event, passing
			// value in box as argument.  This is then intercepted by the
			// regular handler.
			valueWidget.on("keydown", function(evt){
				// console.log("----------- input character ", evt.keyCode, this.get('value'));
				if(evt.keyCode == keys.ENTER){
					this.emit('Change', {}, [this.get('value')]);
				}
			});
			// undo color on change in the  value widget
			valueWidget.on("keydown",lang.hitch(this,function(evt){
				if(evt.keyCode != keys.ENTER){
					var w = registry.byId(this.controlMap.value);
					w.set('status','');
				}
			}));

			/*
			var inputsWidget = registry.byId(this.controlMap.inputs);
			inputsWidget.on('Change',  lang.hitch(this, function(){
				return this.disableHandlers || this.handleInputs.apply(this, arguments);
			}));
			*/
			var unitsWidget = registry.byId(this.controlMap.units);
			unitsWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleUnits.apply(this, arguments);
			}));

			var schemasWidget = registry.byId(this.controlMap.schemas);
			schemasWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleSchemas.apply(this, arguments);
			}));

			var entityWidget = registry.byId(this.controlMap.entity);
			entityWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEntities.apply(this, arguments);
			}));

			entityWidget.on('keypress', lang.hitch(this, function(evt){
				return this.disableHandlers || this.handleEntityKeypress.apply(this, arguments);
			}));

			var qtyDescriptionWidget = registry.byId(this.controlMap.qtyDescription);
			qtyDescriptionWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleQtyDescription.apply(this, arguments);
			}));

			var equationWidget = registry.byId(this.controlMap.equation);
			equationWidget.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleEquation.apply(this, arguments);
			}));

			/* equation widget is disabled and uneditable, so commenting the focus and blur functionalities
			equationWidget.on("focus", function(){
				var cursorPosition = this.get("cursorPosition");
				if(cursorPosition){
					this.textbox.setSelectionRange(cursorPosition[0], cursorPosition[1]);
				}
			});

			equationWidget.on("blur", function(){
				var start = this.textbox.selectionStart;
				var end = this.textbox.selectionEnd;
				this.set("cursorPosition", [start, end]);
			});
			*/
			var schemaDisplayQmark = registry.byId(this.controlMap.schemaDisplay);
			schemaDisplayQmark.on('Click', lang.hitch(this, function(){
				return this.disableHandlers || this.handleSchemaDisplay.apply(this, arguments);
			}));

			/* 
			// When the equation box is enabled/disabled, do the same for
			// the inputs widgets.
			array.forEach(["inputSelectorStudent"], function(input){
				var widget = registry.byId(input);
				equationWidget.watch("disabled", function(attr, oldValue, newValue){
					// console.log("************* " + (newValue?"dis":"en") + "able inputs");
					widget.set("disabled", newValue);
				});
			});
			*/

			// For each button 'name', assume there is an associated widget in the HTML
			// with id 'nameButton' and associated handler 'nameHandler' below.
			array.forEach(this.equationButtons, function(button){
				var w = registry.byId(button + 'Button');
				if(!w){
					this._logger.logClientEvent("assert", {
						message: "button not found, button id : "+button,
						functionTag: '_initHandles'
					});
				}
				var handler = this[button + 'Handler'];
				if(!handler){
					this._logger.logClientEvent("assert", {
						message: "button handler not found, handler id : "+handler,
						functionTag: '_initHandles'
					});
				}
				w.on('click', lang.hitch(this, handler));
			}, this);

			//undo background color on change
			array.forEach(this.resettableControls, function(con){
				var w = registry.byId(this.controlMap[con]);
				w.on("keydown", lang.hitch(this, function(evt){
					if(evt.keyCode != keys.ENTER && evt.keyCode != keys.TAB){
						w.set('status','');
					}
				}));
			}, this);

			//add tooltips to a disabled delete button for quantity node on click and mouse leave
			var delButton = dom.byId('deleteButton');
			on(delButton, mouse.enter, function(){
				if(registry.byId("deleteButton").get("disabled"))
					toolTip.show("Note: Quantities can only be deleted when they are not part of any equation.  Equations can only be deleted before their schema and entity are selected.", delButton);
			});

			on(delButton, mouse.leave, function(){
				if(registry.byId("deleteButton").get("disabled"))
					toolTip.hide(delButton);
			});
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
			this.nodeType = this._model.active.getType(this.currentID);
			console.log("nodeType",this.nodeType);
			this.initialViewSettings(this.nodeType);
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

		closeEditor: function(){ 
			console.log("++++++++++ entering closeEditor");
			if(!this._model.isStudentMode()){
				//Reset to given on close of node editor
				//this._model.active = this._model.authored;
				registry.byId("modelSelector").set('value',"correct");
				
				/*if(this.nodeType == "equation"){
					this.controlMap.equation = "equationInputbox";
					domStyle.set('equationInputbox', 'display', 'block');
					domStyle.set('equationInputboxStudent', 'display', 'none');
				}
				/* check the usage of this code
				var kind = registry.byId(this.controlMap.kind).value;
				if(kind == "required"){
					this._model.authored.setGenus(this.currentID, kind);
				}
				*/
			}
			// Erase modifications to the control settings.
			// Enable all options in select controls.
			//TODO: this enable/disable options looks like for student mode
			array.forEach(this.selects, function(control){
				var w = registry.byId(this.controlMap[control]);
				w.set("enableOption", null);  // enable all options
			}, this);
			
			//for all controls corresponding to a node type , enable and remove colors
			var allControls = (this.nodeType == "equation" ? this.equationNodeControls : this.variableNodeControls).concat(this.commonNodeControls);
			console.log("all controls", allControls);
			array.forEach(allControls,lang.hitch(this,function(control){
				var w = registry.byId(this.controlMap[control]);
				w.set("disabled", false);  // enable everything
				w.set("status", '');  // remove colors
			}));

			if(this.nodeType == "equation"){
				array.forEach(this.equationButtons, function(button){
					registry.byId(button + 'Button').set("disabled", false);
				});
			}

			// reset the variablte type radio button labels
			if(this.nodeType == "quantity"){
				array.forEach(this._variableTypes, function(type){
					var w = registry.byId(type+"Type")
					w.set("status", "");
					w.set("disabled", false);
				});
			}

			for(control in this.genericDivMap)
				domStyle.set(this.genericDivMap[control], "display", "none"); // hide everything

			/* Erase messages, eventually, we probably want to save and restore
			messages for each node. */
			var messageWidget = registry.byId(this.widgetMap.message);
			messageWidget.set('content', '');

			this.disableHandlers = true;
		},

		// Stub to be overwritten by student or author mode-specific method.
		checkDone: function () {
			console.log("checkDone should be overwritten.");
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

			 Set value for  value, equation (input),
			 */

			if(model.getNodeIDFor){
				var d = registry.byId(this.controlMap.description);
				array.forEach(this._model.authored.getDescriptions(), function(desc){
					var exists =  model.getNodeIDFor(desc.value);
					
					if( d.getOptions !== undefined && d.getOptions(desc)) {
						d.getOptions(desc).disabled=exists;
						if(desc.value == nodeName){
							d.getOptions(desc).disabled=false;
						}
					}
				});
			}

			if(this.nodeType == "quantity"){

				//Populate value of quantity node
				//TODO : fetch value from model, for now giving empty value,
				var value = model.getValue(nodeid);//model.getValue(nodeid);
				console.log(' value is ', value, typeof value);
				//  value will be undefined if it is not in the model
				var isValue = typeof value === "number";
				this.lastValue.value = isValue?value.toString():null;
				registry.byId(this.controlMap.value).attr('value', isValue?value:'');

				var unit = model.getUnits(nodeid);
				console.log('unit is', unit || "not set");
				// Initial input in Units box
				registry.byId(this.controlMap.units).set('value', unit || '');

			}
			else if(this.nodeType == "equation"){
				//populate nodeEditor fields for an equation node

				var equation = model.getEquation(nodeid);
				console.log("equation before conversion ", equation);
				params = {
					subModel: model,
					equation: equation,
					nameToId: false
				};
				var mEquation = equation ? expression.convert(params).equation : '';
				console.log("equation after conversion ", mEquation);
				/* mEquation is a number instead of a string if equation is just a number; convert to string before setting the value */
				registry.byId(this.controlMap.equation).set('value', mEquation.toString());
				//This was used when structured was also there, once confirm with team before removing it, for now commenting it 
				//dom.byId("equationText").innerHTML = mEquation;
				
				this.equationEntered = true;
				if(this.variableUpdateBySystem) this.equationEntered = false;
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

				//TODO : for now not using authorModelStatus, so updateModelStatus function has no significance
				
				if(!noModelUpdate)
					this.updateModelStatus(directive);
				if(directive.id == "currentSlot"){
					var w = registry.byId(this.controlMap[directive.id]);
					console.log("current slot w is", w.set(directive.attribute, directive.value));
					w.set(directive.attribute, directive.value);
				}
				if (directive.attribute != "display" && this.widgetMap[directive.id]
					&& directive.id !== "variableType") {
					var w = registry.byId(this.widgetMap[directive.id]);
					if (directive.attribute == 'value') {
						this.disableHandlers = true;
						w.set("value", directive.value, false);
						// Each control has its own function to update the
						// the model and the graph.
						// keep updating this section as we handle the editor input fields
						if(w.id == this.controlMap["value"]){
							this._model.active.setValue(this.currentID, directive.value);
						}else if(w.id == this.controlMap["description"]){
							this.updateDescription(directive.value);
						}else if(w.id == this.controlMap["equation"]){
							this.equationSet(directive.value);
						}else if(w.id == this.controlMap["variable"]){
							this._model.active.setVariable(this.currentID, directive.value);
						}else if(w.id == this.controlMap["units"]){
							this._model.active.setUnits(this.currentID, directive.value);
						}else if(w.id == this.controlMap["variableType"]){
							this.updateVariableTypeValue(directive.value);
						}
						this.disableHandlers = false;
						//TODO : update explanation function but right now no directives with att value for explanations not being processed 
					} else{
						// disabling other buttons as well
						if(w.id == this.controlMap["equation"] && directive.attribute === "disabled"
							&& directive.value){
							array.forEach(this.equationButtons, function(button){
								registry.byId(button + 'Button').set(directive.attribute, directive.value);
							});
						}
						w.set(directive.attribute, directive.value);
						//if(directive.attribute === "status"){
							//tempDirective variable further input to editor tour
							//for now commenting the variable copy
							//tempDirective = directive;
						//}
					}
				}else if(directive.attribute == "display"){
					//directives where display is updated/ given feedback from here
					//genericDivMap needs to be checked eachtime for topoMath editor's fields
					if(this.genericDivMap[directive.id]){
						domStyle.set(this.genericDivMap[directive.id], directive.attribute, directive.value);
					}
				}else if(directive.id === "variableType"){
					// this has been moved out from other widget handlers as these are 
					// group of radio buttons and they dont have one parent id for the whole widget. 
					// Being radio buttons events are fired with different ids everytime.
					if(directive.attribute == "value")
						this.updateVariableTypeValue(directive.value);
					else
						this.updateVariableTypeStatus(directive.attribute, directive.value);
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

		updateVariableTypeValue: function(value){
			// stub for handling variable type value, code updated in con-student
		},

		updateVariableTypeStatus: function(attribute, value){
			// stub for handling variable type status value, code update in con-student
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
		equalsHandler: function(){
			console.log("****** equals button");
			this.equationInsert('=');
		},
		undoHandler: function(){
			var equationWidget = registry.byId(this.controlMap.equation);
			equationWidget.set("value", "");
			//TODO : based on how we handle select model, for now commenting it out
			/*
			var givenEquationWidget = registry.byId("givenEquationBox");//if value of selectModel was equal to "given"
			givenEquationWidget.set("value", "");
			dom.byId("equationText").innerHTML = "";
			*/
		},
		equationInsert: function(text){
			//TODO: initialize domNode
			var widget = registry.byId(this.controlMap.equation);
			var oldEqn = widget.get("value");
			// Get current cursor position or go to end of input
			// console.log("	   Got offsets, length: ", widget.domNode.selectionStart, widget.domNode.selectionEnd, oldEqn.length, widget.cursorPosition);
			var p1 = widget.textbox.selectionStart;
			var p2 = widget.textbox.selectionEnd;
			widget.set("value", oldEqn.substr(0, p1) + text + oldEqn.substr(p2));
			widget.focus();
			var newPosition = p1+text.length;
			widget.textbox.setSelectionRange(newPosition, newPosition);
			// Set cursor to end of current paste
		},

		enableEquation: function(nodeIDs){
			var directives = [
				{attribute: 'status', id: 'equation', value: ''},
				{attribute: 'disabled', id: 'equation', value: false}
			]
			array.forEach(nodeIDs, function(id){
				array.forEach(directives, function(directive){
					this.updateModelStatus(directive, id);
				}, this);
			}, this);
		},

		updateNodes: function(){
			// Update node editor and the model.
			this._nodeEditor.set('title', this._model.active.getName(this.currentID));

			// Update inputs and other equations based on new quantity.
			expression.addQuantity(this.currentID, this._model.active);

			// need to delete all existing outgoing connections
			// need to add connections based on new inputs in model.
			// add hook so we can do this in draw-model...
			this.addQuantity(this.currentID, this._model.active.getLinks(this.currentID));
		},

		/* Stub to update connections in graph */
		addQuantity: function(source, destinations){
		},

		variableTypeControls: function(id, _variableType){
			registry.byId(this.controlMap.value).set('status','');
			this._model.active.setVariableType(id, _variableType);
			if( _variableType != "unknown"){
				//domStyle.set('valueInputboxContainer','display','block');
				var initLabel = dom.byId("initLabel");
				initLabel.innerHTML = "";
				if(_variableType == "dynamic"){
					var givenID = this._model.active.getAuthoredID(id);
					var position = this._model.authored.getPosition(givenID, 1);
					if(this._config.get("feedbackMode") !== "nofeedback" && position && this._fixPosition)
						this._model.active.setPosition(id, 1, position);
					// Update position to avoid overlap of node
					if(this._model.active.getPosition(id).length === 1)
						this._model.active.updatePositionXY(id);
					initLabel.innerHTML = "Initial ";
				}
			}else{
				// Find all nodes that have reference to the initial node of this node and delete links to them
				registry.byId(this.controlMap.value).set('value','');
				this._model.active.setValue(id, '');
				//domStyle.set('valueInputboxContainer','display','none');
				//this.handleValue(null);
			}
			//this.updateNodeView(this._model.active.getNode(id));
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

		equationAnalysis: function(directives, ignoreUnknownTest, eq){
			this.equationEntered = true;
			console.log("****** enter button");
			/*
			 This takes the contents of the equation box and parses it.

			 If the parse fails:
			 * send a warning message, and
			 * log attempt (the PM does not handle syntax errors).

			 Note: the model module may do some of these things automatically.

			 Also, the following section could just as well be placed in the PM?
			 */
			var widget = registry.byId(this.controlMap.equation);
			var inputEquation = eq || widget.get("value");

			//var parse = null;
			var returnObj = {};
			if (inputEquation == "") {
				directives.push({id: 'message', attribute: 'append', value: 'There is no equation to check.'});
				return null;
			}
			try{
				//send the input equation entered to convert function in equation.js
				//which parses, converts the equation to ids and sends back necessary params
				console.log("converting expression");
				var equationParams = {
					equation: inputEquation,
					autoCreateNodes: true, // where do we get this input from 
					nameToId: true,
					subModel: this._model.active,
				};
				if(this._model.isStudentMode()){
					var authorAssignedEquation = this._model.authored.getEquationBySchemaEntity(this.schema, this.entity);
					equationParams.originalEq = authorAssignedEquation["equation"];
					equationParams.originalID = authorAssignedEquation["id"];
					equationParams.currentID = this.currentID;
					equationParams.originalSchema = this.schema;
				}
				returnObj = expression.convert(equationParams);
			}catch(err){
				console.log("Parser error: ", err);
				console.log(err.message);
				console.log(err.Error);
				this.changeControlState("equation","authorStatus","incorrect");
				//error by definition says equation is unacceptable
				//this._model.active.setEquation(this.currentID, inputEquation);
				if(err.message.includes("unexpected variable"))
					directives.push({id: 'message', attribute: 'append', value: 'The value entered for the equation is incorrect'});
				if(err.message.includes("unknown variables")){
					var _returnObj = JSON.parse(err.message.replace("unknown variables", ""));
					var _message = "Unknown variable(s) entered in the equation : " + _returnObj.unknownNodesList.toString();
					directives.push({ id: 'crisisAlert', attribute: 'open', value: _message});
					directives.push({id: 'message', attribute: 'append', value: _message});
					this.autoCreateNodes(_returnObj.newNodeList);
				}
				else
					directives.push({id: 'message', attribute: 'append', value: 'Incorrect equation syntax.'});
				directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
				/*
				this.logging.log("solution-step", {
					type: "parse-error",
					node: this._model.active.getName(this.currentID),
					nodeID: this.currentID,
					property: "equation",
					value: inputEquation,
					correctResult: this._model.given.getEquation(this.currentID),
					checkResult: "INCORRECT",
					message: err
				});
				*/
				return null;
			}
			//rest of the analysis is only needed for the student mode. So returning in case the active model is not student.
			return returnObj;
		},
		autoCreateNodes: function(newNodeList){
			//newNodeList contains those nodes which were not present when equation has been parsed
			//these nodes were added to model, substituted into equation but should be added here
			array.forEach(newNodeList, function(newNode){
				this.addNode(this._model.active.getNode(newNode.id));
				// Auto-populate node description only in Student mode
				// check added to make sure that the node is not an unknown node
				console.log("node added",newNode);
				if(newNode.variable){
					this.createStudentNode(newNode);
				}
			}, this);
		},
		createExpressionNodes: function(parseObject, ignoreUnknownTest){
			/*
			 Create Expression nodes if equation is valid and parsed sucessfully.

			 If the parse succeeds:
			 * substitute in student id for variable names (when possible),
			 * save to model,
			 * update inputs,
			 * update the associated connections in the graph, and
			 * send the equation to the PM. **Done**
			 * Handle the reply from the PM. **Done**
			 * If the reply contains an update to the equation, the model should also be updated.

			 */
			if(parseObject){
				var newNodesList = parseObject.newNodeList;
				var variableList = parseObject.variableList;
				var unknownNodesList = parseObject.unknownNodesList;
				var autoCreationFlag = true; //can be read from the source
				var cancelUpdate = false; // any purpose of this variable ??
				var directives = [];
				var widget = registry.byId(this.controlMap.equation);
				var inputEquation = widget.get("value");

				//TODO : ignoreUnknownTest should be discussed

				if(autoCreationFlag){
					this.autoCreateNodes(newNodesList);
					//dynamicList contains those nodes for which prior node UI changes have to be made
					//Accordingly, make the node dynamic by changing the variable type and setting the accumulator
					//Also updateNodeView makes sure changes are reflected instantly on the UI
					var dynamicList = parseObject.dynamicList;
					array.forEach(dynamicList, lang.hitch(this,function(prior){
						this.variableTypeControls(prior.id, "dynamic");
					}));
				}

				if(parseObject.error){ //error specifically indicates if there is an error where in a non dynamic node/variable is used inside prior function
					directives.push({id: 'message', attribute: 'append', value: 'Please make a node dynamic before using it in prior function'});
					directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
					if(widget.disabled)
						widget.set('disabled', false);
					this.changeControlState("equation","authorStatus","incorrect");
				}
				else{
					this.changeControlState("equation","authorStatus","correct");
				}

				if(directives.length > 0){
					this._model.active.setEquation(this.currentID, parseObject.equation);
					this.applyDirectives(directives);
					return;
				}
				//Check to see if there are unknown variables in parsedEquation if in student mode
				//If unknown variable exist, do not update equation in model. 
				//Do the same if a function node references itself.
				if (cancelUpdate){
					return null;
				}
				// Expression now is written in terms of student IDs, when possible.
				console.log("********* Saving equation to model: ", parseObject.equation);
				this._model.active.setEquation(this.currentID, parseObject.equation);

				var inputs = parseObject.connections;
				// Update inputs and connections
				this._model.active.setLinks(inputs, this.currentID);
				this.setConnections(inputs, this.currentID);
				// console.log("************** equationAnalysis directives ", directives);
/*
				array.forEach(newNodesList, lang.hitch(this, function(node){
					this.updateInputNode(node.id, node.variable);
				}));
*/
				array.forEach(variableList, lang.hitch(this, function(n){
					this.nodeConnections.push(n);
				}));

			}
		},
		/**
		* creates the object to be logged after each solution step.
		* @params - obj -   object to be logged. Important parameter in the object is property of the node.
		*                   without which the logged object wont be sent.
		*           return obj - complete object which should be used by aspect.after to send it to logs.
		*/
		logSolutionStep: function(obj){
			//Stub for logging the messages, updated in con-author and con-student
			if(!obj.property) return null;

			var property = obj.property;
			// if node ID was not in the object then send node ID as the current ID.
			// used for auto created nodes.
			if(!obj.nodeID){
				obj.nodeID = this.currentID;
				obj.node = this._model.authored.getVariable(this.currentID);
			}
			if(!obj.value) obj.value = registry.byId(this.controlMap[property]).get("value");
			obj.type = this._model.active == this._model.authored ? "solution-enter" : "solution-check";

			return obj;
		},
		updateNodeView: function(node){
			// stub for calling draw model update node
		},
		createStudentNode: function(node){
			// stub for setting up student node for autocreated nodes
		},
		toggleTooltip: function(id){
			//Hide Tooltip
			var _position="before-centered";
			if(! domClass.contains(dom.byId(id), "active")) {
				if(id==="operationsQuestionMark") _position="after";
				toolTip.show(this.questionMarkButtons[id], dom.byId(id), [_position]);
			}else{
				toolTip.hide(dom.byId(id));
			}
			domClass.toggle(dom.byId(id), "active");

			//Reset Buttons
			array.forEach(Object.keys(this.questionMarkButtons), function(buttonID){
				if(buttonID !== id) {
					domClass.remove(dom.byId(buttonID), "active");
				}
			});
		},
		_attachTooltips: function(){
			array.forEach(Object.keys(this.questionMarkButtons), lang.hitch(this, function(buttonID){
				on(dom.byId(buttonID), "click", lang.hitch(this,function(evt){
					this.toggleTooltip(buttonID);
				}));
			}));
		},
		_removeTooltips: function(){
			array.forEach(Object.keys(this.questionMarkButtons), function(buttonID){
				domClass.remove(dom.byId(buttonID), "active");
				toolTip.hide(dom.byId(buttonID));
			});
		},
		/** function: changeControlState
		* this function udpates a control related data (like status, etc) for a specific control(like equation, description)
		*/
		changeControlState: function(control, data, value){
			//this stub is defined individually mode specifically
		},

		sortDescriptions: function(){
			return this._model.active.getDescriptionsSortedByName();
		},

		descriptionsReady: function(){
			//empty function for now, can be used in future to play with descriptions before view gets updated
		},

		getSchemaHtml: function(){
			//store schema html once in sessionStorage if it does not exist and return from sessionStorage each time
			if(sessionStorage.getItem("schema_table"))
				return sessionStorage.getItem("schema_table");
			var schemaHtml = "<table id='schemaDisplayTable'><col style='width: 20%''><col style='width:20%'><col style='width:60%'><thead><tr><th>Name</th><th>Equation</th><th>Description</th></tr></thead><tbody>";
			var schemaTable = JSON.parse(sessionStorage.getItem("schema_tab_topo"));
			for(var schemaCategory in schemaTable){
				schemaTable[schemaCategory].forEach(function(schema){
					var sname = schema["Name"];
					var seq = schema["Equation"];
					var scom = schema["Comments"];
					schemaHtml = schemaHtml + "<tr><td>"+ sname + "</td><td>" + seq + "</td><td>" + scom + "</td></tr>";
				})
			}
			schemaHtml = schemaHtml + "</tbody></table>";
			sessionStorage.setItem("schema_table", schemaHtml);
			return sessionStorage.getItem("schema_table");	
		},

		loadSchemaOptions: function(){
			console.log("In loadSchemaOptions")
			//check if schema options have been loaded and if not, load them to schemaWidget
			if(sessionStorage.getItem("schema_options_loaded"))
				return;
			var schemasList = [];
			var schemaTable = JSON.parse(sessionStorage.getItem("schema_tab_topo"));
			var schemaWidget = registry.byId(this.controlMap.schemas);
			for(var schemaCategory in schemaTable){
				schemaTable[schemaCategory].forEach(function(schema){
					var sname = schema["Name"];
					var obj = {value: sname, label: sname};
					schemaWidget.addOption(obj);
				})
			}
			sessionStorage.setItem("schema_options_loaded", true);
		},

		getSchemaProperty: function(property, selectedSchema){
			var schemaTable = JSON.parse(sessionStorage.getItem("schema_tab_topo"));
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

		updateSlotVariables: function(){
			console.log("In updateSlotVariables")
			this.slotMap = this.getSchemaProperty("Mapping", this.schema);
			//for each of these combo boxes we have to generate the options	respectively
			var subscript = this.generateVariablesForSlots(this.slotMap);
			//labels and combo boxes have to be generated in the slots container
			//destroy any previously generated comboboxes, html
			var widgets = dijit.findWidgets(dom.byId("variableSlotControlsbox"));
			dojo.forEach(widgets, function(w){
				w.destroyRecursive(true);
			});
			var slotContHtml = "";
			for(var varKey in this.slotMap){
				slotContHtml = slotContHtml+'<div class="fieldgroup"><label for="holder'+this.schema+this.currentID+this.slotMap[varKey]+'">'+this.slotMap[varKey]+'</label><input id="holder'+this.schema+this.currentID+this.slotMap[varKey]+'" ></div>';
			}
			html.set(dom.byId("variableSlotControlsbox"), slotContHtml);
			var varAr = this.getSlotVariablesList();

			//slots by default should have variables of the format schemaname and first word of relationship (entity)
			//extract relationship first word
			var relFW = this.entity.split(" ")[0];

			for(var varKey in this.slotMap){
				// Authors get some free options for new variable names, but other modes do not
				var choices = (this._mode === "AUTHOR") ? [{id: ""+varKey+subscript, name: ""+varKey+subscript}] : []; 
				//concatenate all variables and current default variable for the respective combo box
				choices = choices.concat(varAr);
				var stateStore = new memory({ data: choices });
				var curDiv = 'holder'+this.schema+this.currentID+this.slotMap[varKey];
				var currentComboBox = new comboBox({
										store: stateStore,
										searchAttr: "name",
										class: "slotComboBox",
										placeholder: "Select or type your variable name here."
										}, curDiv);
				//if the user is in feedback mode, autogenerate variable names to fill schema slots
				if(this._model.active.isStudentMode())
					currentComboBox.set("value", varKey+relFW);
				currentComboBox.startup();
			}
			var eachComboBox = dojo.query(".slotComboBox");
				console.log("each combo", eachComboBox);
				eachComboBox.forEach(function(childcomboBox){
					registry.byNode(childcomboBox).on('change', lang.hitch(this, function(){
						this.updateEquation();
						this.adjustSlotColors(childcomboBox);
					}));
				}, this);
		},
		generateVariablesForSlots: function(slotMap){
			//This function generates a variable slot map in the session storage if not existing
			// and returns the appropriate variable number subscript which will be used as suffix in the dynamic variable comboboxes
			if(!sessionStorage.getItem("slot_number_map") || sessionStorage.getItem("slot_number_map")!= ""){
				// Generate the map first time
				var numberMap = {};
				var varAr = this.getSlotVariablesList();
				for(var i=0; i<varAr.length; i++){
					//the variables are generally in mostcases of the form D1, id4 etc
					var curVar = ""+varAr[i].name;
					var nump = curVar.match(/\d+$/);
					//if only the variable has a number attached add it to numberMap
					if(nump){
						var strp = curVar.replace(/\d+$/,"");
						if(!numberMap[nump[0]]){
							numberMap[nump[0]] = [strp];
						}
						else{
							numberMap[nump[0]].push(strp);
						}
					}
				}
				sessionStorage.setItem("slot_number_map", JSON.stringify(numberMap));
			}
			//now we have slot number map, we need to check the map and return appropriate vars
			var numGenOb = JSON.parse(sessionStorage.getItem("slot_number_map"));
			var numList = Object.keys(numGenOb);
			var slotVars = Object.keys(slotMap);
			var nextSubscript = 1;
			var finished = false;
			while(!finished){
				if(nextSubscript in numGenOb){
					// This subscript is in use by some variable, but maybe not one in the current schema
					if(this.isSubscriptInUse(nextSubscript,slotVars,numGenOb)){
						// This subscript is in use, increment and try again
						nextSubscript++;
						continue;
					}else{
						// The subscript was in the map, but not in use by any of this schema's variables
						finished = true;
						continue;
					}
				}else{
						// The subscript isn't in the map yet
						finished = true;
				}
			}
			return nextSubscript;
		},

		/*
		isSubscriptInUse
		Given a subscript, list of variables, and the numGenOb
		Return true if the subscript is already in use by any of the variables
		*/
		isSubscriptInUse: function(subscript,slotVars,numGenOb){
			var inUse = slotVars.some(function(v){
				return numGenOb[subscript].includes(v);
			});
			return inUse;
		},
		/*updateEquation
		updates the equation based on selected schema and variables
		*/
		updateEquation: function(){
			//var schema = registry.byId(this.controlMap.schemas).get("value");
			//var equation = this.getSchemaProperty("Equation", this.schema);
			//var slotMap = this.getSchemaProperty("Mapping", schema);
			//retrieve the generic equation always when updating to replace the equation
			var equation = this.getSchemaProperty("Equation", this.schema);

			// add $ to all strings in the generic equation to keep replacement accurate
			for(var varKey in this.slotMap){
				equation = equation.replace(varKey,"$"+varKey)
			}
			for(var varKey in this.slotMap){
				var updatedValue = dom.byId("holder"+this.schema+this.currentID+this.slotMap[varKey]).value;
				console.log("replacing", varKey, "\'"+updatedValue+"\'");
				equation = equation.replace("$"+varKey, updatedValue);
			}
			console.log("before", registry.byId(this.controlMap.equation).value, "after", equation);
			registry.byId(this.controlMap.equation).set("value",equation);
			this.equation = equation;
			//console.log("updated equation");
		},
		/*fillVariableNames
		reads the current equation string when the node is opened and loads the variable combo boxes
		inside initialControlSettings
		*/
		fillVariableNames: function(){
			var currentEquation = registry.byId(this.controlMap.equation).get("value");
			if(currentEquation == "")
				return;
			var varList = expression.getVariableStrings(currentEquation);
			var i = 0;
			for(var varKey in this.slotMap){
				var currentComboBox = 'holder'+this.schema+this.currentID+this.slotMap[varKey];
				registry.byId(currentComboBox).set("value", varList[i]);
				i++;
			}
		},
		/*allVariablesFilled
		reads the slots and confirms whether all variables have valid values
		*/
		allVariablesFilled: function(){
			if(this.equation !== ""){
				for(var varKey in this.slotMap){
					var currentComboBox = 'holder'+this.schema+this.currentID+this.slotMap[varKey];
					var currentVal = registry.byId(currentComboBox).get("value");
					if(currentVal == ""){
						return false;
					}
				}
			}
			return true;
		},
		/*valid variable count in the slots
		*/
		validVariableCount: function(){
			var count = 0;
			if(this.equation !== ""){
				for(var varKey in this.slotMap){
					var currentComboBox = 'holder'+this.schema+this.currentID+this.slotMap[varKey];
					var currentVal = registry.byId(currentComboBox).get("value");
					if(currentVal != ""){
						count++;
					}
				}
			}
			return count;
		},
		/*canHaveDeleteNode
		checks whether the current qty node is part of any equation and decides if it can be deleted accordingly
		*/
		canHaveDeleteNode: function(nodeid){
			//only applicable to quantity nodes
			var eqList = this._model.active.getAllEquations();
			var found = array.some(eqList,function(currentEq){
				try{
					var currentVars = expression.getVariableStrings(currentEq.equation);
					if(currentVars.includes(nodeid))
						return true;
				}
				catch(err){
					//later we can log these
					console.log("Parser error: ", err);
					console.log(err.message);
					console.log(err.Error);
				}
			});
			return !found;
		},

		handleSchemaDisplay: function(){
			var schemaDialog =  new popupDialog();
			var schemaHtml = this.getSchemaHtml();
			schemaDialog.showDialog("Schema Table", schemaHtml, [], "Close Table");
		},
		
		//entity values can only be alpha numerics separated by ';'
		handleEntityKeypress: function(evt){
			var charCode = evt.charCode;
			if (charCode && null === String.fromCharCode(charCode).match("[ a-zA-Z0-9;]")){
				event.stop(evt);
			}
		},
		checkForSlotDuplicates: function(eqn){
			try{
				var varAr = expression.getVariableStrings(eqn);
				var finalList = [];
				array.forEach(varAr, function(variable){
					if(!finalList.includes(variable))
						finalList.push(variable);
				});
				var slotCount = Object.keys(this.slotMap).length;
				if(finalList.length === slotCount)
					return false;
				else
					return true;
			}
			catch(err){
				console.log("Parser error: ", err);
				console.log(err.message);
				console.log(err.Error);
				return false;
			}
		}
	});
});
