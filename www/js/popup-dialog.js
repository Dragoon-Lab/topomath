

define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/query",
	"dijit/registry",
	"dojo/html",
	"dojo/aspect",
	"dijit/form/Button",
], function(array, declare, lang, on, dom, domConstruct,  query, registry, html, aspect, Button) {
	/* Summary:
	 * Returns methods for displaying, resetting Dialog
	 */
	 
	return declare(null, {
		_clickHandlers : {},
		_buttonsArray : [],

		showDialog: function(title, popupContent, buttonsArray, cancelTitle){
			popupDialog.set('title', title);
			this._buttonsArray = buttonsArray;
			d = dojo.byId('popupDialogButtons');
			var cancelLabel = "Cancel";
			if(cancelTitle && cancelTitle !== ""){
				cancelLabel = cancelTitle;
			}

			var closeButton = new Button({
				label: cancelLabel,
				id: 'popupDialogCancelButton'
			});
			var handler = on(closeButton, "click", lang.hitch(this, function(buttonsArray){
				this.destroyDialog();
			}));
			this._clickHandlers[closeButton]= handler;
			domConstruct.place(closeButton.domNode, d, "last");
			
			var popupDialogCancelButton = dojo.byId('popupDialogCancelButton');

			array.forEach(this._buttonsArray.reverse(), lang.hitch(this, function(button){
				var b = new Button({
					label: Object.keys(button)
				});
				
				aspect.after(button,b.label[0],lang.hitch(this, function(){
 					this.destroyDialog();
 				}));

				handler = on(b, "click", Object.values(button)[0]);
				this._clickHandlers[button] = handler;
				domConstruct.place(b.domNode, d, "first");
				
			}));

			html.set(dojo.query('#popupDialog .dijitDialogPaneContentArea #popupDialogContent')[0], popupContent);
			popupDialog.show();
		},
		
		destroyDialog: function(){
			console.log("End Called");
			registry.byId("popupDialog").hide();
			var closeButton = registry.byId('popupDialogCancelButton');
			console.log("Removing handler for ", closeButton);
			this._clickHandlers[closeButton].remove();
			array.forEach(this._buttonsArray, lang.hitch(this, function(button){
				console.log("Removing handler for button", button);
				this._clickHandlers[button].remove();
			}));

			this._clickHandlers = {};
			var widgets = dijit.findWidgets(dojo.byId("popupDialogButtons"));
			dojo.forEach(widgets, function(w) {
			    w.destroyRecursive(true);
			});
			dojo.byId('popupDialogButtons').innerHTML = "";
			html.set(dojo.query('#popupDialog .dijitDialogPaneContentArea #popupDialogContent')[0], "");
		}
	});
});
