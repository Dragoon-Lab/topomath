/* global define */
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
/*
 * AUTHOR mode-specific handlers
 */

define([
	"dojo/_base/array",
	'dojo/_base/declare',
	"dojo/_base/lang",
	'dojo/dom-style',
	'dojo/keys',
	'dojo/ready',
	"dojo/on",
	"dojo/store/Memory",
	"dojo/aspect",
	'dijit/registry',
	'./controller',
	"./typechecker",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/domReady!",
], function(array, declare, lang, style, keys, ready, on, memory, aspect, registry, controller, typechecker, dom, domClass){

	// Summary:
	//			MVC for the node editor, for authors
	// Description:
	//			Makes pedagogical desicions for author mode; handles selections
	//			from the author; inherits controller.js
	// Tags:
	//			controller, pedagogical module, author mode

	return declare(controller, { // 
		//author PM controller
		//pedagogical module class for author
		authorPM:{
			process: function(nodeID, nodeType, value, validInput){
				var returnObj=[];
				switch(nodeType){
				
				case "initial":
					if(validInput){
						returnObj.push({id:"initial", attribute:"status", value:"entered"});
					}else{
						// This never happens
						returnObj.push({id:"initial", attribute:"status", value:"incorrect"});
					}
					break;

				default:
					throw new Error("Unknown type: "+ nodeType + ".");
				}
				return returnObj;
			}
		},

		constructor: function(){
			console.log("++++++++ In author constructor");
			lang.mixin(this.widgetMap, this.controlMap);
			//can we use initialValueSettings instead
			this.authorControls();
			//initialize error status array to track cleared expression for given model nodes
			this.errorStatus =[];
			ready(this, "initAuthorHandles");
		},

		resettableControls: ["variable","explanation","description","initial","units","equation"],

		controlMap: {
			inputs: "setInput",
			variable: "setVariable",
			equation: "setEquation",
			description: "setDescription",
			explanation: "setExplanation",
			kind: "selectKind",
			units: "setUnits",
			root: "markRootNode",
			dynamic: "markDynamicNode",
			setStudent: "setStudentNode",
			modelType: "selectModel",
		},
		authorControls: function(){
			console.log("++++++++ Setting AUTHOR format in Node Editor.");
			style.set('nameControl', 'display', 'block');
			style.set('descriptionControlAuthor', 'display', 'inline-block');
			style.set('initialValueDiv', 'display', 'inline');
			style.set('unitDiv', 'display', 'none');
			style.set('setUnitsControl', 'display', 'inline');
			style.set('setRootNode', 'display', 'block');
			style.set('expressionDiv', 'display', 'block');
			style.set('inputControlAuthor', 'display', 'block');
		},
		
		initAuthorHandles: function(){

			var variable_name = registry.byId(this.controlMap.variable);
			variable_name.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleVariableName.apply(this, arguments);
			}));

			var explanation_name = registry.byId(this.controlMap.explanation);
			explanation_name.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleExplanationName.apply(this, arguments);
			}));

			var kind = registry.byId(this.controlMap.kind);
			kind.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleKind.apply(this, arguments);
			}));

			var root_check = registry.byId(this.controlMap.root);
			root_check.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleRoot(checked);
			}));

			var dynamic_check = registry.byId(this.controlMap.dynamic);
			root_check.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleDynamic(checked);
			}));

			var setStudentNode = registry.byId(this.controlMap.setStudent);
			setStudentNode.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleSetStudentNode(checked);
			}));

			var givenEquation = registry.byId("setEquation");
			givenEquation.on('Change', lang.hitch(this, function(){
					return this.disableHandlers || this.handleGivenEquation.apply(this, arguments);
			}));

			this.handleErrorMessage(); //binds a function to Display Error message if expression is cleared.
		},
		/*
		 Handler for type selector
		 */
		handleVariableName: function(name){
			console.log("**************** in handle Variable Name ", name);
		},

		handleExplanationName: function(name){
			console.log("**************** in handle Explanation Name ", name);

		},

		updateInputNode: function(/** auto node id **/ id, /**variable name**/ variable){
			console.log("updating nodes in author controller");
			//update the name for nodeid
			// BvdS:  when we set the name we don't send to author PM
			// since there is nothing to update in the node editor since
			// this is a different node.
			//this._model.active.setName(id, variable);
			// update Node labels upon exit
			//this.updateNodeLabel(id);
		 },

		handleKind: function(kind){
			console.log("**************** in handleKind ", kind);
		},

		handleQuantityDescription: function(description){
			// Summary: Checks to see if the given quantity node description exists; if the
			//		description doesn't exist, it sets the description of the current node.
		},

		handleEquationExplanation: function(description){
			// Summary: Checks to see if the given equation node description exists; if the
			//		description doesn't exist, it sets the description of the current node.
		},
		
		handleRoot: function(root){
			// Summary: Sets the current node to be parent node
			console.log("********************* in handleRoot", root);
		},

		handleDynamic: function(root){
			// Summary: Sets the current node to be parent node
			console.log("********************* in handleDynamic", root);
		},

		handleSetStudentNode: function(checked){
			console.log("********************* in handle set student quantity node", checked);
			if(checked){
				style.set('selectModelControl', 'display', 'block');
				var studentNode = this._model.student.getNodeIDFor(this.currentID);
				if(studentNode == null){
					//to do : to write addStudentNode which has to add a quantity node, pushing this it backlog 
					//this.addStudentNode(this.currentID);
				}
			}else{
				this._model.active = this._model.authored;
				registry.byId("selectModel").set('value',"correct");
				style.set('selectModelControl', 'display', 'none');
				//to do : to write removeStudentNode , pushed to backlog
				//this.removeStudentNode(this.currentID);
				//also show the waveform assignment button and image
			}
		},

		handleSelectModel: function(modelType){

		},
		
		handleUnits: function(units){
			console.log("**************** in handleUnits ", units);

		},
		/*
		 Handler for initial value input
		 */
		handleInitial: function(initial){

			//Initial value handler for quantity node

			//IniFlag contains the status and initial value

			var modelType = this.getModelType();
			console.log("model type is", modelType);
			var tempIni = dom.byId(this.widgetMap.initial);
			var tempInival = tempIni.value.trim();
			console.log("temporary value is", tempInival);
			var IniFlag = {status: undefined, value: undefined };
			if(!((modelType === "authored") && (tempInival == '') )){
				
				IniFlag = typechecker.checkNumericValue(this.widgetMap.initial, this.lastInitial);
				
				if((IniFlag.errorType === undefined) && (IniFlag.status === undefined)){
					// check for last input value matching
					IniFlag = typechecker.checkLastInputValue(this.widgetMap.initial, this.lastInitial);
				}
			}
			else{
				IniFlag  = {status: true, value: undefined};
			}
			var logObj = {};
			if(IniFlag && IniFlag.status){
				// If the initial value is not a number or is unchanged from
				// previous value we dont process
				var newInitial = IniFlag.value;
				
				//to do: applying directives on PM processed object, for now just processing, yet to write apply directives
				var returnObj = this.authorPM.process(this.currentID, "initial", newInitial, true);
				console.log("author pm returned after evaluating initial value",returnObj);
				this.applyDirectives(returnObj);
				
				var studentNodeID = this._model.student.getNodeIDFor(this.currentID);
				var studNodeInitial = this._model.student.getInitial(studentNodeID);
				if(modelType == "authored"){
					//if the model type is authored , the last initial value is the new student model value
					//which in this case is second parameter
					this._model.active.setInitial(studentNodeID, newInitial);
					this.updateStatus("initial", this._model.authored.getInitial(this.currentID), newInitial);
				}
				else{
					this._model.active.setInitial(this.currentID, newInitial);
					//if the model type is not given , the last initial value is the new author model value
					//which in this case is first parameter
					//if(studentNodeID)
					this.updateStatus("initial", newInitial, studNodeInitial);
				}
				//update student node status
				logObj = {
					error: false
				}; 
			}else if(IniFlag && IniFlag.errorType){ 
				logObj = {
					error: true,
					message: IniFlag.errorType
				};
			}
			var valueFor = modelType == "authored" ? "student-model": "author-model";
			/*
			logObj = lang.mixin({
				type: "solution-enter",
				node: this._model.active.getName(this.currentID),
				nodeID: this.currentID,
				property: "initial",
				value: initial,
				usage: valueFor
			}, logObj);

			this.logging.log("solution-step", logObj);
			*/
		},

		handleInputs: function(name){
		},

		equationDoneHandler: function(){

		},
		
		handleGivenEquation: function(equation){
			//Summary: changes the status of givenEquationEntered when given equation is modified
		},
		
		handleErrorMessage: function(){
			//Summary: Displays a message on opening node editor if expression was cleared
		},

		initialViewSettings: function(type){
			//make display none for all fields initially
			var qtyElements = ["nameControl","descriptionControlAuthor","valueUnitsControl","setRootNode","setDynamicNode"];
			var eqElements = ["explanationControlAuthor","expressionDiv"];
		
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
		},	
		
		initialControlSettings: function(nodeid){
			console.log("initial control settings in author mode");
			// Apply settings appropriate for a new node
			// This is the equivalent to newAction() in student mode.
			this.applyDirectives([
				{attribute:"disabled", id:"root", value:true}
			]);

			var nodeType = this._model.authored.getType(nodeid);
			if(nodeType == "quantity"){
				
				var variable = this._model.authored.getName(nodeid);
				registry.byId(this.controlMap.variable).set('value', variable || '', false);

				var desc = this._model.authored.getDescription(nodeid);
				registry.byId(this.controlMap.description).set('value', desc || '', false);

				// Initialize root node checkbox
				registry.byId(this.controlMap.root).set('value', this._model.authored.getParent(nodeid));

				//Initialize dynamic node checkbox
				registry.byId(this.controlMap.dynamic).set('value', this._model.authored.getDynamic(nodeid));

				// populate inputs
			
				var varWidget = registry.byId(this.controlMap.variable);
				var descriptionWidget = registry.byId(this.controlMap.description);
				var unitsWidget = registry.byId(this.controlMap.units);
				var kind = registry.byId(this.controlMap.kind);
			
				var value = this._model.authored.getGenus(this.currentID);
				if(!value)
					value='required';
				kind.set('value',value);
				
			}
			else if(nodeType == "equation"){
				var desc = this._model.authored.getExplanation(nodeid);
				registry.byId(this.controlMap.explanation).set('value', desc || '', false);

				// populate inputs
				var inputsWidget = registry.byId(this.controlMap.inputs);
				var eqWidget = registry.byId(this.controlMap.equation);
				var explanationWidget = registry.byId(this.controlMap.explanation);
			}
			
			
			
			// Initialize student node checkbox
			//this is common to both quantity and equation nodes in topomath
				var givenNode = this._model.authored.getNode(nodeid);
				var studentNodes = this._model.student.getNodes();
				var checked = false;
				checked = array.some(studentNodes, function(node){
					return node.authoredID === givenNode.ID;
				}, this);
				registry.byId(this.controlMap.student).set('value', checked);
				this.handleSetStudentNode(checked);
			if(name != null && desc != null){
				registry.byId(this.controlMap.student).set('disabled', false);
			}
			else{
				registry.byId(this.controlMap.student).set('disabled', true);
			}

			
			/*
			*	populate the nodes in the Name, Description, Units, and Inputs tab
			*	For combo-box we need to setup a data-store which is collection of {name:'', id:''} object
			*
			*/
			//to do : pausing for a while , will be picked after handlers
			/*
			var inputs = [];
			var descriptions = [];
			var units = [];

			// Get descriptions and units in AUTHOR mode to sort as alphabetic order
			var authorDesc = this._model.authored.getDescriptions();
			authorDesc.sort(function(obj1, obj2){
				return obj1.label > obj2.label;
			});
			var authorUnits = this._model.getAllUnits();
			authorUnits.sort();

			array.forEach(authorDesc, function(desc){
				if(desc.label){
					var name = this._model.authored.getName(desc.value);
					var obj = {name:name, id: desc.id};
					inputs.push(obj);
					descriptions.push({name: this._model.given.getDescription(desc.value), id: desc.id});
				}
			}, this);
			array.forEach(authorUnits, function(unit){
				units.push({name: unit, id: unit});
			}, this);

			// Sort inputs in AUTHOR mode as alphabetic order
			//this should go into equation editor
			inputs.sort(function(obj1, obj2){
				return obj1.name > obj2.name;
			});

			var m = new memory({data: inputs});
			inputsWidget.set("store", m);
			nameWidget.set("store", m);
			m = new memory({data: descriptions});
			descriptionWidget.set("store", m);
			m = new memory({data: units});
			unitsWidget.set("store", m);

			var value;
			//node is not created for the first time. apply colors to widgets
			//color name widget

			//false value is set because while creating a name we are already checking for uniqueness and checking again while re-opening the node is not needed.
			if(name){
				var nodes = this._model.given.getNodes();
				var isDuplicateName = false;
				array.forEach(nodes, lang.hitch(this, function(node){
					if(node.name == this._model.given.getName(this.currentID) && node.ID != this.currentID)
						isDuplicateName = true;
				}));

				this.applyDirectives(this.authorPM.process(isDuplicateName, "name", name, equation.isVariable(name)));
			}
			//color kind widget
			if(this._model.given.getGenus(this.currentID) === '' || this._model.given.getGenus(this.currentID)){
				this.applyDirectives(this.authorPM.process(this.currentID, "kind", this._model.given.getGenus(this.currentID)));
			}
			//color description widget
			//uniqueness taken care of by the handler while adding a new value. So a false value sent.
			if(this._model.given.getDescription(this.currentID)){
				var nodes = this._model.given.getNodes();
				var isDuplicateDescription = false;
				array.forEach(nodes, lang.hitch(this, function(node){
					if(node.description == this._model.given.getDescription(this.currentID) && node.ID != this.currentID)
						isDuplicateDescription = true;
				}));

				this.applyDirectives(this.authorPM.process(isDuplicateDescription, "description", this._model.given.getDescription(this.currentID)));
			}
			//color units widget
			var unitsChoice = this._model.given.getUnits(this.currentID);
			if(unitsChoice && unitsChoice != 'defaultSelect'){
				this.applyDirectives(this.authorPM.process(this.currentID, 'units', this._model.given.getUnits(this.currentID)));
			}
			//color initial value widget
			if(typeof this._model.given.getInitial(this.currentID) === "number"){
				this.applyDirectives(this.authorPM.process(this.currentID, 'initial', this._model.given.getInitial(this.currentID), true));
			}
			//color Equation widget
			if(this._model.given.getEquation(this.currentID)){
				if(this._model.given.getAuthorStatus(this.currentID, "equation") && this._model.given.getAuthorStatus(this.currentID, "equation").status == "incorrect"){
					this.applyDirectives(this.authorPM.process(this.currentID, 'equation', this._model.given.getEquation(this.currentID), false));
				}else{
					this.applyDirectives(this.authorPM.process(this.currentID, 'equation', this._model.given.getEquation(this.currentID), true));
				}
			}
			var type = this._model.given.getType(this.currentID);
			//color type widget
			if(type){
				this.applyDirectives(this.authorPM.process(this.currentID, 'type', type));
			}
			if(type && type != 'function'){
				if(typeof this._model.given.getInitial(this.currentID) === "number")
					this.applyDirectives([{id:"initial", attribute:"status", value:"entered"}]);
			}
			if(type && type != 'parameter'){
				if(this._model.given.getEquation(this.currentID) && this._model.given.getAuthorStatus(this.currentID, "equation").status != "incorrect")
					this.applyDirectives([{id:"equation", attribute:"status", value:"entered"}]);
			}
			this.enableDisablewaveFormAssignmentButton(this.currentID);

			if(this.activityConfig.get("disableNodeEditorFields")){
				console.log("using apply directives");

				this.applyDirectives([{id: "setName", attribute : "disabled", value: true}]);

				
					DQuery("#nodeeditor input").attr("disabled",true);
					DQuery("#nodeeditor textarea").attr("disabled",true);
					dijit.byId("setName").readOnly = true;
					dijit.byId("selectKind").readOnly = true;
				

			}
			*/

		},
		updateModelStatus: function(desc, id){
			//stub for updateModelStatus
			//valid status object is defined in controller
			id = id || this.currentID;
			if(this.validStatus[desc.attribute]){
				var opt = this._model.authored.getAuthorStatus(id, desc.id) ? this._model.authored.getAuthorStatus(id, desc.id) : {};
				opt[desc.attribute] = desc.value;
				this._model.authored.setAuthorStatus(id, desc.id, opt);
			}
			console.log("model obj is",this._model);
		},

		getModelType: function(){
			return (registry.byId(this.controlMap.setStudent).checked ? registry.byId(this.controlMap.modelType).value : "correct");
		},

		addStudentNode: function(nodeid){

		},

		removeStudentNode: function(nodeid){

		},

		getStudentNodeValues: function(nodeid){

		},

		enableDisableFields: function(/*String*/modelType){

		},
		enableDisableSetStudentNode: function(){

		},
		updateStatus: function(/*String*/control, /*String*/correctValue, /*String*/newValue){
			//Summary: Updates the status of the student model nodes
			var studentNodeID = this._model.student.getNodeIDFor(this.currentID);
			if(studentNodeID != null){
				if(newValue != correctValue){ //If given value not same as correct Value
					this._model.student.setStatus(studentNodeID, control , {"disabled": false,"status":"incorrect"});
				}
				else{
					this._model.student.setStatus(studentNodeID, control, {"disabled": true,"status":"correct"});
				}
			}
		},


	});
});
