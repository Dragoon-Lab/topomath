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
define([
	"dojo/_base/array", "dojo/dom",
	"dijit/popup", "dijit/TooltipDialog"
], function(array, dom, popup, TooltipDialog){

	return {

		// In case any tool tips are still open.
		myTooltipDialog: new TooltipDialog({
			style: "width: 150px;",
			content: "Use decimals instead of percent."
		}),

		// Tool Tip for indicating non numeric data is not accepted
		myTooltipDialog2: new TooltipDialog({
			style: "width: 150px;",
			content: "Non-numeric data not accepted"
		}),

		dialogs: [this.myTooltipDialog, this.myTooltipDialog2],

		closePops: function(){
			array.forEach(this.dialogs, function(dialog){
				popup.close(dialog);
			});
		},

		checkNumericValue: function(nodeID){
			//Description : performs non number check and also checks if the  
			// value was changed from previously entered value
			//returns: status, a boolean value and value, the current  value
			// nodeID: string
			//     id of dom node to be checked.
			// lastInput: object 
			//     lastInput.value is old value of nodeID
			
			// Popups only occur for an error, so leave it up until
			// the next time the student attempts to enter a number.
			this.closePops();

			// Don't do anything if the value has not changed.
			//Also Don't do anything if the value is empty
			var domNode = dom.byId(nodeID);
			var inputString = domNode.value.trim();

			// we do this type conversion because we used a textbox for 
			// value input which is a numerical
			if(0  === inputString.length)
				return;
			var input= +inputString; // usage of + unary operator converts a string to number
			// use isNaN to test if conversion worked.

			if(isNaN(input) && (0  !== inputString.length)){
				var errorType;
				// Put in checks here
				console.log('not a number');
				//Value is the id of the textbox, we get the value in the textbox
				if(!inputString.match('%')){ //To check the decimals against percentages
					console.warn("Sachin should log when this happens");
					popup.open({
						popup: this.myTooltipDialog2,
						around: domNode
					});
					errorType = "number-with-percent";
				}else{
					// if entered string has percentage symbol, pop up a message to use decimals
					console.warn("Sachin should log when this happens");
					popup.open({
						popup: this.myTooltipDialog,
						around: domNode
					});
					errorType = "parse-error";
				}

				return {status: false, errorType: errorType};
			}
			else{

				return {status: undefined, errorType: undefined};
			}
		},

		checkLastInputValue: function(nodeID, lastInput){
			//checks the current input value with last input value and returns the appropriate object
			//also modifies the last input object

			var domNode = dom.byId(nodeID);
			var inputString = domNode.value.trim();

			// we do this type conversion because we used a textbox for 
			// value input which is a numerical
			if(0  === inputString.length)
				return;
			var input= +inputString; // usage of + unary operator converts a string to number
			
			//At this stage we already know this is proper numerical value
			//Just check for matching last input value
			if(inputString == lastInput.value || inputString==""){
				console.log("entered last input value again");
				return {status: false};
			}
			//Further if current number is not last input
			//update the last input value with current value
			lastInput.value = inputString;

			// update return object with value as current value and staus to be true
			return {status: true, value: input};

		}
	};

});
