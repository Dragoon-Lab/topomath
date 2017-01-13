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

		resettableControls: ["name","description","initial","units","equation"],

		controlMap: {
			inputs: "setInput",
			name: "setName",
			description: "setDescription",
			kind: "selectKind",
			units: "setUnits",
			root: "markRootNode",
			student: "setStudentNode",
			modelType: "selectModel",
			waveForm: "assignWaveFormButton",
			nodeType: "typeId",
			preNodeType: "topoNodeSelectDone"
		},
		authorControls: function(){
			console.log("++++++++ Setting AUTHOR format in Node Editor.");
			style.set('nameControl', 'display', 'block');
			style.set('descriptionControlStudent', 'display', 'none');
			style.set('descriptionControlAuthor', 'display', 'inline-block');
			style.set('initialValueDiv', 'display', 'inline');
			style.set('unitDiv', 'display', 'none');
			style.set('setUnitsControl', 'display', 'inline');
			style.set('setRootNode', 'display', 'block');
			//style.set('expressionDiv', 'display', 'block');
			style.set('inputControlAuthor', 'display', 'block');
			style.set('inputControlStudent', 'display', 'none');
			style.set('studentModelControl', 'display', 'inline-block');
			style.set('editorLabel', 'display', 'block');
			style.set('cancelEditorButton', 'display', 'block');
			//style.set('assignButtonBox', 'display', 'block');
		},
		
		initAuthorHandles: function(){
			var name = registry.byId(this.controlMap.name);
			name.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleName.apply(this, arguments);
			}));
			var kind = registry.byId(this.controlMap.kind);
			kind.on('Change', lang.hitch(this, function(){
				return this.disableHandlers || this.handleKind.apply(this, arguments);
			}));
			var root = registry.byId(this.controlMap.root);
			root.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleRoot(checked);
			}));
			var setStudentNode = registry.byId(this.controlMap.student);
			setStudentNode.on('Change', lang.hitch(this, function(checked){
					return this.disableHandlers || this.handleSetStudentNode(checked);
			}));
			var selectModel = registry.byId(this.controlMap.modelType);
			selectModel.on('Change', lang.hitch(this, function(){
					return this.disableHandlers || this.handleSelectModel.apply(this, arguments);
			}));
			var givenEquation = registry.byId("setName2");
			givenEquation.on('Change', lang.hitch(this, function(){
					return this.disableHandlers || this.handleGivenEquation.apply(this, arguments);
			}));

			var OKEditorButton = registry.byId("OKEditorButton");
			OKEditorButton.on('click', lang.hitch(this, function(){
				return this.disableHandlers || this.handleOKButton.apply(this, arguments);
			}));

			this.handleErrorMessage(); //binds a function to Display Error message if expression is cleared.
		},
		/*
		 Handler for type selector
		 */
		handleName: function(name){
			console.log("**************** in handleName ", name);

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

		handleDescription: function(description){
			// Summary: Checks to see if the given description exists; if the
			//		description doesn't exist, it sets the description of the current node.
		},
		
		explanationHandler:function(){ 
		},

		handleOKButton: function(){

		},

		handleRoot: function(root){
			// Summary: Sets the current node to be parent node
			console.log("********************* in handleRoot", root);
		},

		handleSetStudentNode: function(checked){
			console.log("********************* in handleSelecetModel", checked);
		},

		handleSelectModel: function(modelType){

		},
		
		handleType: function(type){

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
