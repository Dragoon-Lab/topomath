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
	"dojo/dom",
	"dojo/dom-class",
	"dojo/domReady!",
], function(array, declare, lang, style, keys, ready, on, memory, aspect, registry, controller, dom, domClass){

	// Summary:
	//			MVC for the node editor, for authors
	// Description:
	//			Makes pedagogical desicions for author mode; handles selections
	//			from the author; inherits controller.js
	// Tags:
	//			controller, pedagogical module, author mode

	return declare(controller, { // 
		//author PM controller

		constructor: function(){
			console.log("++++++++ In author constructor");
			lang.mixin(this.widgetMap, this.controlMap);
			this.authorControls();
			//initialize error status array to track cleared expression for given model nodes
			this.errorStatus =[];
			ready(this, "initAuthorHandles");
		},

		resettableControls: ["variable","explanation","description","description2","initial","units","equation"],

		controlMap: {
			inputs: "setInput",
			variable: "setName",
			explanation: "setName2",
			description: "setDescription",
			description2: "setDescription2",
			kind: "selectKind",
			units: "setUnits",
			root: "markRootNode",
			dynamic: "markDynamicNode",
			setStudentQty: "setStudentNode",
			setStudentEq: "setStudentNode2"
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

			var setStudentQtyNode = registry.byId(this.controlMap.setStudentQty);
			setStudentQtyNode.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleSetStudentQtyNode(checked);
			}));

			var setStudentEqNode = registry.byId(this.controlMap.setStudentEq);
			setStudentEqNode.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleSetStudentEqNode(checked);
			}));

			var givenEquation = registry.byId("setName2");
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

		handleEquationDescription: function(description){
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

		handleSetStudentQtyNode: function(checked){
			console.log("********************* in handle set student quantity node", checked);
		},

		handleSetStudentEqNode: function(checked){
			console.log("********************* in handle set student equation node", checked);
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
		
		initialControlSettings: function(nodeid){
			console.log("initial control settings in author mode");

		},
		updateModelStatus: function(desc, id){
			//stub for updateModelStatus
		},

		getModelType: function(){

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

		},

	});
});
