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
*/

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
	"dojo/dom-style",
	'dijit/registry',
	'dijit/form/ComboBox',
	'dojo/NodeList-dom',
	'dojo/html',
	'dojo/query',
	'./con-author',
	"./equation",
	"./typechecker",
	"./popup-dialog",
	"./auth-edit-lib",
	"dojo/domReady!"
], function(array, declare, lang, style, keys, ready, on, memory, aspect, dom, domClass, domStyle, registry, comboBox, domList, html, query, conAuthor, equation, typechecker, popupDialog, autheditLib){

	// Summary:
	//			MVC for the node editor, for editor mode (schema editing)
	// Description:
	//			Makes pedagogical desicions for schema editing mode; handles selections
	//			for users working in schema editing mode; inherits con-author.js
	// Tags:
	//			controller, pedagogical module, editor mode

	return declare(conAuthor, { // 


		constructor: function(){
			console.log("++++++++ In editor constructor");
		},

		qtyElements: ["qtyDescriptionInputboxContainer","variableTypeContainer","variableInputboxContainer","valueUnitsContainer"],		

		authorControls: function(){
			console.log("++++++++ Setting SEDITOR format in Node Editor.");
			//style.set('givenToStudentToggleContainer', 'display', 'block');	// unused in SEDITOR
			//style.set('variableOptionalityContainer', 'display', 'block');	// unused in SEDITOR
			style.set('schemaSelectorContainer', 'display', 'block');
			style.set('entityInputboxContainer', 'display', 'block');
			style.set('descriptionInputboxContainer', 'display', 'inline-block');
			style.set('qtyDescriptionInputboxContainer', 'display', 'inline-block');
			style.set('variableInputboxContainer', 'display', 'inline-block');
			style.set('valueInputboxContainer', 'display', 'block');
			style.set('unitsSelectorContainer', 'display', 'block');
			//style.set('rootNodeToggleContainer', 'display', 'block');	// sought not used in SEDITOR
			style.set('expressionDiv', 'display', 'block');
			//This has been removed in new author mode editor design
			//style.set('inputSelectorContainer', 'display', 'block');
			style.set('equationInputbox', 'display', 'block');
			style.set('variableSlotControlsContainer', 'display', 'block');

		},

		checkDone: function(){
			/*
				No checks needed for SEDITOR.
			*/
			console.log("Done Action called");
			var returnObj = {};
			returnObj.errorNotes = "";
			return returnObj;
		},

		enableDisableSetStudentNode: function(){
			// Overridden to do nothing in SEDTOR mode
			return;
		}
	});
});
