
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
	"dojo/aspect",
	"./equation",
	"./logging"
], function(array, declare, lang, dom, keys, on, ready, registry, domStyle, domConstruct, aspect, 
	expression, clientLogging){

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
			value: "valueInputbox",
		},
		genericDivMap: {
			value: "valueInputboxContainer",
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
			this.nodeConnections = [];
			this._logger = clientLogging.getInstance();
		},

		// A stub for connecting routine to draw new node.
		
		addNode: function(node, autoflag){
			console.log("Node Editor calling addNode() for ", node.id);
		},
		// Stub to setting description for auto craeted nodes.
		setNodeDescription: function(id, variable){
		},
		// Stub to set connections in the graph
		setConnections: function(from, to){
			// console.log("======== setConnections fired for node" + to);
		},
		//stub to update node in draw model
		updateNode: function(nodeId){
			//calling updateNode in controller
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

		hideCloseNodeEditor: function(/* originical hide method*/ doHide){
			doHide.apply(this._nodeEditor);
			this.closeEditor.call(this);
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
						var equation = registry.byId("equationInputbox");
						
						//if the equation is in the box but has not been checked(or entered)
						if(equation.value && !myThis.equationEntered){
							
							//call equation done handler(equation done handlers in one of the modes will be called based on current mode)
							var directives = myThis.equationDoneHandler();
							var isAlertShown = array.some(directives, function(directive){
								if(directive.id === 'crisisAlert'){
									return true;
								}
							});
							
							//isAlertShown records if the crisis alert was shown, if not we have to close editor programatically
							if(!isAlertShown) {
								//TODO: discuss premature nodes deletion
								//further hide editor and call closeEditor function
								myThis.hideCloseNodeEditor(doHide);
							}
						} // if the mode is author and user has selected to enter student values (" given ")
						else if(myThis._mode == "AUTHOR" && registry.byId("modelSelector").value == "given"){
							var equation = registry.byId("givenEquationInputbox");
							
							//equation value in this case if from givenEquationInputbox and check if the value is entered/checked
							//if not throw a crisis alert message
							if(equation.value && !myThis.givenEquationEntered){
								
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

			 //event handler for quantity node description field
			var desc_qty = registry.byId(this.controlMap.description);
			desc_qty.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleDescription.apply(this, arguments);
			}));

			/*
			 *	 event handler for 'value' field
			 *	 'handleValue' will be called in either Student or Author mode
			 * */

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
			if(this._mode == "AUTHOR"){
				//Reset to given on close of node editor
				this._model.active = this._model.authored;
				registry.byId("modelSelector").set('value',"correct");
				
				if(this.nodeType == "equation"){
					this.controlMap.equation = "equationInputbox";
					domStyle.set('equationInputbox', 'display', 'block');
					domStyle.set('givenEquationInputbox', 'display', 'none');
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
			/* TODO: this enable/disable options looks like for student mode
			array.forEach(this.selects, function(control){
				var w = registry.byId(this.controlMap[control]);
				w.set("enableOption", null);  // enable all options
			}, this);
			*/
			//for all controls corresponding to a node type , enable and remove colors
			var allControls = (this.nodeType == "equation" ? this.equationNodeControls : this.variableNodeControls).concat(this.commonNodeControls);
			console.log("all controls", allControls);
			array.forEach(allControls,lang.hitch(this,function(control){
				console.log("current control is", control);
				var w = registry.byId(this.controlMap[control]);
				w.set("disabled", false);  // enable everything
				w.set("status", '');  // remove colors
			}));
			
			this.disableHandlers = true;
			//TODO: check logging
		},



		checkDone: function () {
			/*
				When the author clicks on the main menu "Done" button,
				the system checks that one variable is Root, 
				and make sure every variable is part of at least one equation.
			*/
			console.log("Done Action called");
			var returnObj = {};
			returnObj.errorNotes = "";
			var hasRootNode = false;
			var _variables = [];
			var _equations = [];
			var _errorNotes = [];
			
			if( this._model ){
				array.forEach(this._model.active.getNodes(), function (node) {
					if(node.root){
						hasRootNode = true;
					}
					console.log(node);

					// get variables and equations
					if(node.variable !== "" && node.genus && node.genus === "required" && node.type === "quantity"){
						_variables.push(node.ID);
					}else if(node.type === "equation"){
						_equations.push(node.equation);
					}

				});
				console.log("Equations : ", _equations);
				// check if each variable is present in atleast one equation
				var _usedVariables = _variables.map(function(_variable){
					var tmp = array.some(_equations, function(_equation) {
						
						if( _equation && _equation.search(_variable) > -1){
							return true;
						};
					});
					var obj = {};
					obj[_variable] = tmp;
					return obj;
				});

				// for each variable if it is not present in any equation, add it to array 
				var _requiredVariables = [];
				array.forEach(_usedVariables, function(item){
					
					if(!Object.values(item)[0]){	
						_requiredVariables.push(Object.keys(item)[0]);
					}
				});

				// Add errorNote adding all unused variables
				if( _requiredVariables && _requiredVariables.length > 0 ){
					var errorNote = "Following variables are required, but unused by equations - ";
					array.forEach(_requiredVariables,lang.hitch(this, function(id){
						errorNote += this._model.active.getName(id) + ", ";
					}));
					errorNote = errorNote.slice(0, -2); // removing trailing comma and space
					_errorNotes.push(errorNote);
				}	
			}

			console.log("required" + _requiredVariables);

			if(!hasRootNode){
				_errorNotes.push("No variable is marked as Root");
			}
			if(_errorNotes && _errorNotes.length > 0){
				array.forEach(_errorNotes, function(_error){
					returnObj.errorNotes += "<li>" + _error + "</li>";
				})
			}
			
			console.log("returning ", returnObj);
			return returnObj;
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
					d.getOptions(desc).disabled=exists;
					if(desc.value == nodeName){
						d.getOptions(desc).disabled=false;
					}});
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
				/*TODO : for now not using authorModelStatus, so updateModelStatus function has no significance
				if(!noModelUpdate)
					this.updateModelStatus(directive); */
				if (directive.attribute != "display" && this.widgetMap[directive.id]) {
					var w = registry.byId(this.widgetMap[directive.id]);
					if (directive.attribute == 'value') {
						w.set("value", directive.value, false);
						// Each control has its own function to update the
						// the model and the graph.
						// keep updating this section as we handle the editor input fields
						if(w.id == 'valueInputbox'){
							this._model.active.setValue(this.currentID, directive.value);
						}else if(w.id == 'selectDescription'){
							this.updateDescription(directive.value);
						}else if(w.id == 'equationBox'){
							this.equationSet(directive.value);
						}
						//TODO : update explanation function but right now no directives with att value for explanations not being processed 

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
			this.addQuantity(this.currentID, this._model.active.getLinks(this.currentID));
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

		equationAnalysis: function(directives, ignoreUnknownTest){
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
			var inputEquation = widget.get("value");

			//var parse = {};
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
					subModel: this._model.active
				}
				returnObj = expression.convert(equationParams);
			}catch(err){
				console.log("Parser error: ", err);
				console.log(err.message);
				console.log(err.Error);
				//error by definition says equation is unacceptable
				//this._model.active.setEquation(this.currentID, inputEquation);
				if(err.message.includes("unexpected variable"))
					directives.push({id: 'message', attribute: 'append', value: 'The value entered for the equation is incorrect'});
				else if(err.message.includes("Please make a node dynamic before")) //This case occurs when an equation used prior(node) but that quantity node is not set to be dynamic
					directives.push({id: 'message', attribute: 'append', value: 'Please make a node dynamic before using it in prior function'});
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
			if(this._model.active != this._model.student){
				return returnObj;
			}
			//TODO : as suggested in above comment if the mode is student we enable the below code
			//For now, commenting
			/*
			var cancelUpdate = false;
			var resetEquation = false;
			var authoredID = this._model.student.getAuthoredID(this.currentID);

			var mapID = this._model.active.getAuthoredID || function(x){ return x; };
			var unMapID = this._model.active.getNodeIDFor || function(x){ return x; };
			//there is no error in parse. We check equation for validity
			//Check 1 - accumulator equation is not set to 0, basically the type of a node should be parameter.
			if(this._model.active.getType(this.currentID) === "accumulator" &&
				!parse.variables().length && parse.tokens.length == 1 && parse.tokens[0].number_ == 0){
				cancelUpdate = true;
				directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
				directives.push({
					id: 'crisisAlert',
					attribute: 'open',
					value: "Equation of accumulator can not be set to 0. If this is the case then please change the type of the node to parameter."
				});
				this.logging.log("solution-step", {
					type: "zero-equation-accumulator",
					node: this._model.active.getName(this.currentID),
					nodeID: this.currentID,
					property: "equation",
					value: inputEquation,
					correctResult: this._model.given.getEquation(this.currentID),
					checkResult: "INCORRECT"
				});
			}
			array.forEach(parse.variables(), function(variable){
				var givenID = this._model.given.getNodeIDByName(variable);
				var badVarCount = "";
				// Check 2 - Checks for nodes referencing themselves; this causes problems because
				//		functions will always evaluate to true if they reference themselves
				if(!givenID){
					if(!ignoreUnknownTest){
						// Check for number of unknown var, only in student mode.
						badVarCount = this._model.given.getAttemptCount(authoredID, "unknownVar");
					}
					cancelUpdate = true;  // Don't update model or send ot PM.

					// The following if statement prevents a user from being endlessly stuck if he/she is using an incorrect variable.
					//		To organize this better in the future we may want to move this check into another file with the code from
					//		pedagogical_module.js that is responsible for deciding the correctness of a student's response.
					if(badVarCount){
						this._model.given.setAttemptCount(authoredID, "unknownVar", badVarCount+1);
						if(badVarCount > 2){
							//resetEquation = true;
						//} else {
							this._model.given.setAttemptCount(authoredID, "equation", badVarCount+1);
							cancelUpdate = false;
						}
					}else{
						this._model.given.setAttemptCount(authoredID, "unknownVar", 1);
						//resetEquation = true;
					}
					directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
					directives.push({id: 'message', attribute: 'append', value: "Unknown variable '" + variable + "'."});
					directives.push({
						id: 'crisisAlert',
						attribute: 'open',
						value: "Unknown variable '" + variable + "' entered in equation."
					});
					this.logging.log("solution-step", {
						type: "unknown-variable",
						node: this._model.active.getName(this.currentID),
						nodeID: this.currentID,
						property: "equation",
						value: inputEquation,
						correctResult: this._model.given.getEquation(this.currentID),
						checkResult: "INCORRECT"
					});
				}

				if(givenID && this._model.active.getType(this.currentID) === "function" &&
					givenID === mapID.call(this._model.active, this.currentID)){
					cancelUpdate = true;
					directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
					directives.push({id: 'message', attribute: 'append', value: "You cannot use '" + variable + "' in the equation. Function nodes cannot reference themselves."});
					this.logging.log("solution-step", {
						type: "self-referencing-function",
						node: this._model.active.getName(this.currentID),
						nodeID: this.currentID,
						property: "equation",
						value: inputEquation,
						correctResult: this._model.given.getEquation(this.currentID),
						checkResult: "INCORRECT"
					});
				}
				//Check 3 - check if accumulator has a reference to itself as per the Trello card https://trello.com/c/0aqmwqqG
				if(givenID && this._model.active.getType(this.currentID) === "accumulator" &&
					givenID === mapID.call(this._model.active, this.currentID)){
					cancelUpdate = true;
					directives.push({id: 'equation', attribute: 'status', value: 'incorrect'});
					directives.push({
						id: 'crisisAlert',
						attribute: 'open',
						value: "The old value of the accumulator is already included in the expression, so you don't have to mention it in the expression.  Only put an expression for the change in the accumulators value."
					});
					this.logging.log("solution-step", {
						type: "self-referencing-accumulator",
						node: this._model.active.getName(this.currentID),
						nodeID: this.currentID,
						property: "equation",
						value: inputEquation,
						correctResult: this._model.given.getEquation(this.currentID),
						checkResult: "INCORRECT"
					});
				}
			}, this);

			if(resetEquation){
				this._model.active.setEquation(this.currentID, "");
				directives.push({id: 'equation', attribute: 'value', value: ""});
			}
			// changing this as it is essential to update the equation using createExpressionNodes.
			// otherwise equation with correct nodes not converted to their corresponding id stays in the equation of the model
			// fix for bug : https://trello.com/c/bVYAQBKT ~ Sachin Grover
			/*else if(cancelUpdate){
				//in case we are not calling the pm then we need to save the equation to the model.
				//this._model.active.setEquation(this.currentID, inputEquation);
			}*/
			//if(true || !cancelUpdate){
			//return parse;
			//}
			//return null; */

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
				var autoCreationFlag = true; //can be read from the source
				var cancelUpdate = false; // any purpose of this variable ??
				var directives = [];
				var widget = registry.byId(this.controlMap.equation);
				var inputEquation = widget.get("value");

				//TODO : ignoreUnknownTest should be discussed
				if(autoCreationFlag){
					array.forEach(newNodesList, function(newNode){
						//newNodeList containts those nodes which were not present when equation has been parsed
						//these nodes were added to model, substituted into equation but should be added here
						this.addNode(this._model.active.getNode(newNode.id));
						this.setNodeDescription(newNode.id,newNode.variable);
					}, this);
					
					//dynamicList contains those nodes for which prior node UI changes have to be made
					//Accordingly, make the node dynamic by changing the variable type and setting the accumulator
					//Also updateNodeView makes sure changes are reflected instantly on the UI
					var dynamicList = parseObject.dynamicList;
					array.forEach(dynamicList, lang.hitch(this,function(prior){
						this._model.authored.setVariableType(prior.id,"dynamic");
						this._model.authored.setAccumulator(prior.id, true);
						console.log("prior id", prior.id);
						this.updateNodeView(this._model.active.getNode(prior.id));
					}));
				}
				if(directives.length > 0){
					this._model.active.setEquation(this.currentID, inputEquation);
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
				console.log("inputs for" ,this.currentID,inputs,this._model.authored.getNodes());
				this._model.active.setLinks(inputs, this.currentID);
				this.setConnections(this._model.active.getLinks(this.currentID), this.currentID);
				// console.log("************** equationAnalysis directives ", directives);

				array.forEach(newNodesList, lang.hitch(this, function(node){
					this.updateInputNode(node.id, node.variable);
				}));

				var variableList = parseObject.variableList;
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
		}
	});
});
