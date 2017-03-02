/* global define */ /**  *Dragoon Project  *Arizona State University  *(c)
2014, Arizona Board of Regents for and on behalf of Arizona State University *
*This file is a part of Dragoon  *Dragoon is free software: you can
redistribute it and/or modify  *it under the terms of the GNU Lesser General
Public License as published by  *the Free Software Foundation, either version
3 of the License, or  *(at your option) any later version.  *  *Dragoon is
distributed in the hope that it will be useful,  *but WITHOUT ANY WARRANTY;
without even the implied warranty of  *MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the  *GNU Lesser General Public License for more
details.  *  *You should have received a copy of the GNU Lesser General Public
License  *along with Dragoon.  If not, see <http://www.gnu.org/licenses/>.  *
*/ /*  * AUTHOR mode-specific handlers  */

define([
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/keys',
	'dojo/ready',
	'dojo/on',
	'dojo/store/Memory',
	'dojo/aspect',
	'dojo/dom',
	'dojo/dom-class',
	'dijit/registry',
	'./controller',
	"./equation",
	"./typechecker",
	"dojo/domReady!",
], function(array, declare, lang, style, keys, ready, on, memory, aspect, dom, domClass, registry, controller, equation, typechecker){

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
				
				case "value":
					if(validInput){
						returnObj.push({id:"value", attribute:"status", value:"entered"});
					}else{
						// This never happens
						returnObj.push({id:"value", attribute:"status", value:"incorrect"});
					}
					break;

					case "description":
					if(!value){
						returnObj.push({id:"description", attribute:"status", value:""});
					}else if(nodeID && value){
						returnObj.push({id:"description", attribute:"status", value:"incorrect"});
						returnObj.push({id:"message", attribute:"append", value:"Description is already in use"});
					}else{
						returnObj.push({id:"description", attribute:"status", value:"entered"});
					}
					break;

					case "kind":
					var message="";
					returnObj.push({id:"kind", attribute:"status", value:"entered"});
					if(value == "allowed"){
						message	 = "One may include this quantity in a solution, but they can solve the problem without it.";
					}else if(value == "irrelevant"){
						message	 = "This quantity is not part of a valid solution and is not mentioned in the description.";
					}else if(value == "required"){
						message = "Solution quantity";
					}else{
						message = "Please select Kind of Quantity";
					}
					returnObj.push({id:"message", attribute:"append", value:message});
					break;

					case "variableName":
						if(!nodeID && validInput){
							returnObj.push({id:"message", attribute:"append", value:"node name is available for use"});
							returnObj.push({id:"variable", attribute:"status", value:"entered"});
						}else if(!validInput){
							returnObj.push({id:"message", attribute:"append", value:"Please enter a valid name without using numbers"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
						}else{
							returnObj.push({id:"message", attribute:"append", value:"Node name is already in use"});
							returnObj.push({id:"variable", attribute:"status", value:"incorrect"});
						}
						console.log("return obj is",returnObj);
					break;

					case "equation":
					if(validInput === false){
						returnObj.push({id:"equation", attribute:"status", value:"incorrect"});
					}
					else if(value){
						returnObj.push({id:"equation", attribute:"status", value:"entered"});
					} else {
						returnObj.push({id:"equation", attribute:"status", value:""});
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

		resettableControls: ["variable","description","value","units","equation"],

		controlMap: {
			inputs: "inputSelector",
			variable: "variableInputbox",
			equation: "equationInputbox",
			description: "descriptionInputbox",
			kind: "optionalitySelector",
			units: "unitsSelector",
			root: "rootNodeToggleCheckbox",
			dynamic: "dynamicNodeToggleCheckbox",
			setStudent: "givenToStudentCheckbox",
			modelType: "modelSelector",
		},
		authorControls: function(){
			console.log("++++++++ Setting AUTHOR format in Node Editor.");
			style.set('variableOptionalityContainer', 'display', 'block');
			style.set('descriptionInputboxContainer', 'display', 'inline-block');
			style.set('valueInputboxContainer', 'display', 'inline');
			//style.set('unitDiv', 'display', 'none');
			style.set('unitsSelectorContainer', 'display', 'inline');
			style.set('rootNodeToggleContainer', 'display', 'block');
			style.set('expressionDiv', 'display', 'block');
			style.set('inputSelectorContainer', 'display', 'block');

		},
		
		initAuthorHandles: function(){

			var variable_name = registry.byId(this.controlMap.variable);
			variable_name.on('Change', lang.hitch(this, function(){
				console.log("handling variable name");
				return this.disableHandlers || this.handleVariableName.apply(this, arguments);
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

			var givenEquation = registry.byId("equationInputbox");
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
			/* check if node with name already exists and
			 if name is parsed as valid variable
			 */
			var nameID = this._model.authored.getNodeIDByName(name);
			// If nameID is falsy give "null"; if it doesn't match, give "false"
			console.log("nameID, currentID",nameID,this.currentID,equation.isVariable(name));
			this.applyDirectives(this.authorPM.process(nameID?!(nameID==this.currentID):null,'variableName',name, equation.isVariable(name)));
			
			//var logObj = {};
			if(!this._model.authored.getNodeIDByName(name) && equation.isVariable(name)){
				// check all nodes in the model for equations containing name of this node
				// replace name of this node in equation with its ID
				this._model.active.setName(this.currentID, name);
				this.updateNodes();
				//not required - because updateNodes() will add connections automatically
				//this.setConnections(this._model.active.getInputs(this.currentID), this.currentID);
				// update equation labels is not required for quantity variable name handling , verify once
				//this.updateEquationLabels();
				
				logObj = {
					error: false
				};
				
			} else {
				//logging the error case
				logObj = {
					error: true
				};
				if(this._model.authored.getNodeIDByName(name)){
					lang.mixin(logObj, {
						message: "duplication"
					});
				} else if(equation.isVariable(name)){
					lang.mixin(logObj, {
						message: "parse"
					});
				}
			}
			this.enableDisableSetStudentNode();
			
			
			logObj = lang.mixin({
				type: "solution-enter",
				nodeID: this.currentID,
				propoerty: "name",
				node: name,
				value: name
			}, logObj);
			//this.logging.log('solution-step', logObj);
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
			if(kind == "defaultSelect" || kind == ''){
				/*
				this.logging.clientLog("error", {
					message: "no kind selected for author node type",
					functionTag: "handleKind"
				}); */
				kind = "defaultSelect";
				this._model.authored.setGenus(this.currentID, kind);
			}else{
				this._model.authored.setGenus(this.currentID, kind);
				this.applyDirectives(this. authorPM.process(this.currentID, "kind", kind));
			}

			/*
			this.logging.log('solution-step', {
				type: "solution-enter",
				nodeID: this.currentID,
				property: "kind",
				node: this._model.given.getName(this.currentID),
				value: kind
			});
			*/
		},

		handleDescription: function(description){
			// Summary: Checks to see if the given quantity node description exists; if the
			//		description doesn't exist, it sets the description of the current node.
			var descriptionID = this._model.authored.getNodeIDByDescription(description);
			// If descriptionID is falsy give "null"; if it doesn't match, give "false"
			var returnObj = this.authorPM.process(descriptionID?!(descriptionID==this.currentID):null, "description", description);
			console.log("return obj for quantity description", returnObj);
			this.applyDirectives(returnObj);
			
			//var logObj = {};

			if(!this._model.active.getNodeIDByDescription(description)){
				this._model.active.setDescription(this.currentID, description);
				/*
				logObj = {
					error: false
				};
				*/
			}else {
				console.warn("In AUTHOR mode. Attempted to use description that already exists: " + description);
				/*
				logObj = {
					error: true,
					message: "duplication"
				};
				*/
			}
			/*
			logObj = lang.mixin({
				type: "solution-enter",
				nodeID: this.currentID,
				property: "description",
				node: this._model.given.getName(this.currentID),
				value: description
			}, logObj);
			
			this.logging.log('solution-step', logObj);
			*/
			this.enableDisableSetStudentNode();
		},
		
		handleRoot: function(root){
			// Summary: Sets the current node to be parent node
			console.log("********************* in handleRoot", root);
			//this._model.given.setParent(this.currentID, root);
			/*
			this.logging.log("solution-step", {
				type: "solution-enter",
				nodeID: this.currentID,
				property: "root",
				node: this._model.given.getName(this.currentID),
				value: root
			});
			*/
		},

		handleDynamic: function(dynamic){
			// Summary: Sets the current node to be parent node
			console.log("********************* in handleDynamic", dynamic);
			//this._model.given.setParent(this.currentID, root);
			/*
			this.logging.log("solution-step", {
				type: "solution-enter",
				nodeID: this.currentID,
				property: "dynamic",
				node: this._model.given.getName(this.currentID),
				value: dynamic
			});
			*/
		},

		handleSetStudentNode: function(checked){
			console.log("********************* in handle set student quantity node", checked);
			if(checked){
				style.set('modelSelectorContainer', 'display', 'block');
				var studentNode = this._model.student.getNodeIDFor(this.currentID);
				if(studentNode == null){
					//TODO : to write addStudentNode which has to add a quantity node, pushing this it backlog 
					//this.addStudentNode(this.currentID);
				}
			}else{
				this._model.active = this._model.authored;
				registry.byId("modelSelector").set('value',"correct");
				style.set('modelSelectorContainer', 'display', 'none');
				//TODO : to write removeStudentNode , pushed to backlog
				//this.removeStudentNode(this.currentID);
				//also show the waveform assignment button and image
			}
		},

		handleSelectModel: function(modelType){

		},
		
		handleUnits: function(units){
			console.log("**************** in handleUnits ", units);

			var modelType = this.getModelType();
			// TODO : Use applyDirectives here
			var returnObj = this.authorPM.process(this.currentID, "units", units);
			
			console.log("Returned from author PM : ", returnObj)
			//var studentNodeID = this._model.student.getNodeIDFor(this.currentID);

			if(modelType == "given"){
				this._model.active.setUnits(studentNodeID, units);
				//this.updateStatus("units", this._model.given.getUnits(this.currentID), units);
			}
			else{
				/*
				this._model.active.setUnits(this.currentID, units);
				if(studentNodeID) this.updateStatus("units", units, this._model.student.getUnits(studentNodeID));
				*/
			}

			//update student node status
			/*
			var valueFor = modelType == "given" ? "student-model": "author-model";
			this.logging.log("solution-step", {
				type: "solution-enter",
				nodeID: this.currentID,
				property: "units",
				value: units,
				node: this._model.given.getName(this.currentID),
				usage: valueFor
			});
			*/
		},
		/*
		 Handler for value input
		 */
		handleValue: function(value){

			// value handler for quantity node

			//valueFlag contains the status and value

			var modelType = this.getModelType();
			console.log("model type is", modelType);
			var tempValId = dom.byId(this.widgetMap.value);
			var tempVal = tempValId.value.trim();
			console.log("temporary value is", tempVal);
			var valueFlag = {status: undefined, value: undefined };
			if(!((modelType === "authored") && (tempVal == '') )){
				
				valueFlag = typechecker.checkNumericValue(this.widgetMap.value, this.lastValue);
				
				if((valueFlag.errorType === undefined) && (valueFlag.status === undefined)){
					// check for last input value matching
					valueFlag = typechecker.checkLastInputValue(this.widgetMap.value, this.lastValue);
				}
			}
			else{
				valueFlag  = {status: true, value: undefined};
			}
			var logObj = {};
			if(valueFlag && valueFlag.status){
				// If the value is not a number or is unchanged from
				// previous value we dont process
				var newValue = valueFlag.value;
				
				//TODO: applying directives on PM processed object, for now just processing, yet to write apply directives
				var returnObj = this.authorPM.process(this.currentID, "value", newValue, true);
				console.log("author pm returned after evaluating value",returnObj);
				this.applyDirectives(returnObj);
				
				var studentNodeID = this._model.student.getNodeIDFor(this.currentID);
				var studNodeValue = this._model.student.getValue(studentNodeID);
				if(modelType == "authored"){
					//if the model type is authored , the last value is the new student model value
					//which in this case is second parameter
					this._model.active.setValue(studentNodeID, newValue);
					this.updateStatus("value", this._model.authored.getValue(this.currentID), newValue);
				}
				else{
					this._model.active.setValue(this.currentID, newValue);
					//if the model type is not given , the last  value is the new author model value
					//which in this case is first parameter
					//if(studentNodeID)
					this.updateStatus("value", newValue, studNodeValue);
				}
				//update student node status
				logObj = {
					error: false
				}; 
			}else if(valueFlag && valueFlag.errorType){ 
				logObj = {
					error: true,
					message: valueFlag.errorType
				};
			}
			/*
			var valueFor = modelType == "authored" ? "student-model": "author-model";
			logObj = lang.mixin({
				type: "solution-enter",
				node: this._model.active.getName(this.currentID),
				nodeID: this.currentID,
				property: "value",
				value: value,
				usage: valueFor
			}, logObj);

			this._logger.log("solution-step", logObj);
			*/
		},

		handleInputs: function(name){
			this.equationInsert(name); 
			// After variable input, reset control to its initial state.
			// Third argument keeps handler from being called.
			var inputWidget = registry.byId(this.controlMap.inputs);
			inputWidget.set('value', '', false);
		},

		equationDoneHandler: function(){
			var model = registry.byId("modelSelector").value;
			if(model && model == "correct"){
				var directives = [];
				var logObj = {};
				//if parse is successful, equation analysis returns an object with parameters for creating expression nodes further
				var returnObj = this.equationAnalysis(directives, true);
				if(returnObj){
					directives = directives.concat(this.authorPM.process(this.currentID, "equation", returnObj));
				} else {
					logObj = {
						error: true,
						message: "parse error"
					}
				}
				console.log("directives are", directives);
				this.applyDirectives(directives);
				this.createExpressionNodes(returnObj, true); 
			} /* TODO: when equation for student values
			else if(model && model =="given"){
				var studentNodeID = this._model.student.getNodeIDFor(this.currentID);
				var eqn = registry.byId(this.controlMap.equation).value;
				var inputs = [];
				if(typeof equation != "undefined" && eqn != null && eqn != ""){
					var parse = equation.parse(eqn);
					console.log("parse is ", parse);
					this.givenEquationEntered = true;
					array.forEach(parse.variables(), lang.hitch(this, function(variable){
						console.log("there are variables");
						var givenID = this._model.given.getNodeIDByName(variable);
						var studentID = this._model.student.getNodeIDFor(givenID);
						eqn = eqn.replace(variable, studentID);
						inputs.push({"ID": studentID});
						if(studentID == null){
							this.givenEquationEntered = false;
							eqn = "";
							this.applyDirectives([{
								id: "crisisAlert", attribute:
								"open", value: "You are trying to add a node that is not part of student model."
							}]);
							registry.byId(this.controlMap.equation).set("value", "");
							return;
						}
					}));

					this._model.student.setInputs(inputs, studentNodeID);
					this._model.student.setEquation(studentNodeID, eqn);
					if(this.givenEquationEntered){
						style.set(this.controlMap.equation, 'backgroundColor', "#2EFEF7");
					}
					var flag = equation.areEquivalent(this.currentID, this._model, eqn);
					//update student node status
					if(!flag){
						this._model.student.setStatus(studentNodeID, "equation" , {"disabled": false,"status":"incorrect"});
					}
					else{
						this._model.student.setStatus(studentNodeID, "equation" , {"disabled": false,"status":"correct"});
					}
				}else{
					 //set status if equation is empty
					 givenEqn = this._model.given.getEquation(this.currentID);
					 if(typeof givenEqn === 'undefined' || givenEqn === "" || givenEqn === null){
						this._model.student.setStatus(studentNodeID, "equation" , {"disabled": true,"status":"correct"});
					 }
					 else{
						this._model.student.setStatus(studentNodeID, "equation" , {"disabled": false,"status":"incorrect"});
					 }
					 this._model.student.setInputs(inputs, studentNodeID);
					 this._model.student.setEquation(studentNodeID, "");
				}
			}
			var valueFor = model == "given" ? "student-model": "author-model";
			logObj = lang.mixin({	
				type: "solution-enter",
				nodeID: this.currentID,
				node: this._model.given.getName(this.currentID),
				property: "equation",
				value: registry.byId(this.controlMap.equation).get("value"),
				usage: valueFor
			}, logObj);
			this.logging.log("solution-step", logObj);
			*/
		},
		
		handleGivenEquation: function(equation){
			//Summary: changes the status of givenEquationEntered when given equation is modified
		},
		
		handleErrorMessage: function(){
			//Summary: Displays a message on opening node editor if expression was cleared
		},

		initialViewSettings: function(type){
			//make display none for all fields initially
			var qtyElements = ["variableOptionalityContainer","descriptionInputboxContainer","valueUnitsContainer","rootNodeToggleContainer","dynamicNodeToggleContainer"];
			var eqElements = ["descriptionInputboxContainer","expressionDiv"];
		
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
		
		initialControlSettings: function(nodeid){
			console.log("initial control settings in author mode");
			// Apply settings appropriate for a new node
			// This is the equivalent to newAction() in student mode.
			this.applyDirectives([
				{attribute:"disabled", id:"root", value:true}
			]);

			var nodeType = this._model.authored.getType(nodeid);
			//desc widget is common to both node types in topomath
			var descriptionWidget = registry.byId(this.controlMap.description);

			var inputs = [];
			var descriptions = [];
			var units = [];

			var desc = this._model.authored.getDescription(nodeid);
			registry.byId(this.controlMap.description).set('value', desc || '', false);

			// Initialize student node checkbox
			//this is common to both quantity and equation nodes in topomath
				var givenNode = this._model.authored.getNode(nodeid);
				var studentNodes = this._model.student.getNodes();
				var checked = false;
				checked = array.some(studentNodes, function(node){
					return node.authoredID === givenNode.ID;
				}, this);
				registry.byId(this.controlMap.setStudent).set('value', checked);
				this.handleSetStudentNode(checked);
			
			
			// Get descriptions and units in AUTHOR mode to sort as alphabetic order
			//sort the author descriptions as this is common to both node types in topomath
			var authorDesc = this._model.authored.getDescriptions();
			authorDesc.sort(function(obj1, obj2){
				return obj1.label > obj2.label;
			});


			array.forEach(authorDesc, function(desc){
				if(desc.label){
					var name = this._model.authored.getName(desc.value);
					var obj = {name:name, id: desc.id};
					inputs.push(obj);
					descriptions.push({name: this._model.authored.getDescription(desc.value), id: desc.id});
				}
			}, this);
			// Sort inputs in AUTHOR mode as alphabetic order
			//this should go into equation editor into inputs and also quantity editor to variable list
			
			inputs.sort(function(obj1, obj2){
				return obj1.name > obj2.name;
			});
			

			if(nodeType == "quantity"){
				
				var variable = this._model.authored.getName(nodeid);
				registry.byId(this.controlMap.variable).set('value', variable || '', false);

				// Initialize root node checkbox
				registry.byId(this.controlMap.root).set('value', this._model.authored.getParent(nodeid));

				//Initialize dynamic node checkbox
				registry.byId(this.controlMap.dynamic).set('value', this._model.authored.getDynamic(nodeid));

				// populate inputs
			
				var varWidget = registry.byId(this.controlMap.variable);
				var unitsWidget = registry.byId(this.controlMap.units);
				var kind = registry.byId(this.controlMap.kind);
			
				var value = this._model.authored.getGenus(this.currentID);
				if(!value)
					value='required';
				kind.set('value',value);

				//Enable or disable the given to student checkbox
				if(variable != null && desc != null){
					registry.byId(this.controlMap.setStudent).set('disabled', false);
				}
				else{
					registry.byId(this.controlMap.setStudent).set('disabled', true);
				}

				//sort units and store in units array
				var authorUnits = this._model.getAllUnits();
				authorUnits.sort();
				array.forEach(authorUnits, function(unit){
					units.push({name: unit, id: unit});
				}, this);

				var m = new memory({data: descriptions});
				descriptionWidget.set("store", m);

				m = new memory({data: units});
				unitsWidget.set("store", m);

				m = new memory({data: inputs});
				varWidget.set("store", m);

				//node is not created for the first time. apply colors to widgets
				//color name widget

				//false value is set because while creating a name we are already checking for uniqueness and checking again while re-opening the node is not needed.
				if(variable){
					var nodes = this._model.authored.getNodes();
					var isDuplicateName = false;
					array.forEach(nodes, lang.hitch(this, function(node){
						if(node.variable == this._model.authored.getName(this.currentID) && node.ID != this.currentID)
							isDuplicateName = true;
					}));

					this.applyDirectives(this.authorPM.process(isDuplicateName, "variableName", variable, equation.isVariable(variable)));
				}
				//color kind widget
				if(this._model.authored.getGenus(this.currentID) === '' || this._model.authored.getGenus(this.currentID)){
					this.applyDirectives(this.authorPM.process(this.currentID, "kind", this._model.authored.getGenus(this.currentID)));
				}

				//color units widget
				var unitsChoice = this._model.authored.getUnits(this.currentID);
				if(unitsChoice && unitsChoice != 'defaultSelect'){
					this.applyDirectives(this.authorPM.process(this.currentID, 'units', this._model.authored.getUnits(this.currentID)));
				}
				//color value widget
				if(typeof this._model.authored.getValue(this.currentID) === "number"){
					this.applyDirectives(this.authorPM.process(this.currentID, 'value', this._model.authored.getValue(this.currentID), true));
				}
				
			}
			else if(nodeType == "equation"){
				
				// populate inputs
				var inputsWidget = registry.byId(this.controlMap.inputs);
				var eqWidget = registry.byId(this.controlMap.equation);

				//Enable or disable the given to student checkbox
				if(desc != null){
					registry.byId(this.controlMap.setStudent).set('disabled', false);
				}
				else{
					registry.byId(this.controlMap.setStudent).set('disabled', true);
				}

				m = new memory({data: inputs});
				inputsWidget.set("store", m);
				
				//In case equation node is already present
				//color Equation widget
				
				if(this._model.authored.getEquation(this.currentID)){
					//we have not found a use case for getAuthorStatus yet so commenting this sesion for now
					/*
					if(this._model.authored.getAuthorStatus(this.currentID, "equation") && this._model.authored.getAuthorStatus(this.currentID, "equation").status == "incorrect"){

					}else{
						this.applyDirectives(this.authorPM.process(this.currentID, 'equation', this._model.authored.getEquation(this.currentID), true));
					}
					*/
				}
			}
			
			//color description widget , common to both node types
			//uniqueness taken care of by the handler while adding a new value. So a false value sent.
			if(this._model.authored.getDescription(this.currentID)){
				var nodes = this._model.authored.getNodes();
				var isDuplicateDescription = false;
				array.forEach(nodes, lang.hitch(this, function(node){
					if(node.description == this._model.authored.getDescription(this.currentID) && node.ID != this.currentID)
						isDuplicateDescription = true;
				}));

				this.applyDirectives(this.authorPM.process(isDuplicateDescription, "description", this._model.given.getDescription(this.currentID)));
			}
		},
		/* discontinuing use of author status
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
		*/
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
			//Summary: Enable Set student mode checkbox only when variable/equation and description/explanation are filled
			
			//based on the node type this function checks variable/equation and description/explanation
			console.log("enable disable set student node called");
			var nodeType = this._model.authored.getType(this.currentID);

			if(nodeType == "quantity"){
				var varName = registry.byId(this.controlMap.variable).value;
				var desc = registry.byId(this.controlMap.description).value;

				if(varName != '' && desc != ''){
					registry.byId(this.controlMap.setStudent).set("disabled",false);
				}
				else{
					registry.byId(this.controlMap.setStudent).set("disabled",true);
				}	
			}
			else if(nodeType == "equation"){
				//var eqnName = registry.byId(this.controlMap.equation).value;
				var expln = registry.byId(this.controlMap.description).value;

				if(expln != ''){
					registry.byId(this.controlMap.setStudent).set("disabled",false);
				}
				else{
					registry.byId(this.controlMap.setStudent).set("disabled",true);
				}	
			}

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
