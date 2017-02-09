

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
	 *				
	 * 
	 *			
	 */
	return declare(null, {
		_clickHandlers: [],
		_buttonsArray: [],

		showDialog: function(title, alertContent, buttonsArray, cancelTitle){
			alertDialog.set('title', title);
			this._buttonsArray = buttonsArray;
			d = dojo.byId('dialogButtons');
			var cancelLabel = "Cancel";
			if(cancelTitle && cancelTitle != ""){
				cancelLabel = cancelTitle;
			}

			var closeButton = new Button({
				label: cancelLabel,
				id: 'cb'
			});
			var handler = on(closeButton, "click", lang.hitch(this, function(buttonsArray){
				this.closeDialog(this._buttonsArray);
			}));
			
			this._clickHandlers[closeButton]= handler;
			domConstruct.place(closeButton.domNode, d, "last");
			
			var cb = dojo.byId('cb');

			array.forEach(this._buttonsArray.reverse(), lang.hitch(this, function(button){
				var b = new Button({
					label: Object.keys(button)
				});
				
				aspect.after(button,b.label[0],lang.hitch(this, function(response){
 					this.close();
 				}));
				handler = on(b, "click", Object.values(button)[0]);
				this._clickHandlers[button] = handler;
				domConstruct.place(b.domNode, d, "first");
				
			}));

			var dialogContent = "";
			array.forEach(alertContent, function(message){
				dialogContent += "<li>" + message + "</li>"
			})	
			
			html.set(dojo.query('#alertDialog .dijitDialogPaneContentArea #content')[0], dialogContent);
			alertDialog.show();
		},

		closeDialog: function(){
			registry.byId("alertDialog").hide();
		},
		close: function(){
			console.log("Close Called!! ");
			if(window.history.length == 1)
				window.close();
			else
				window.history.back();
		},
		end: function(){
			console.log("End Called");
			var closeButton = registry.byId('cb');
			this._clickHandlers[closeButton].remove();
			array.forEach(this._buttonsArray, lang.hitch(this, function(button){
				this._clickHandlers[button].remove();
			}));

			this._clickHandlers = [];
			var widgets = dijit.findWidgets(dojo.byId("dialogButtons"));
			dojo.forEach(widgets, function(w) {
			    w.destroyRecursive(true);
			});
			dojo.byId('dialogButtons').innerHTML = "";
			html.set(dojo.query('#alertDialog .dijitDialogPaneContentArea #content')[0], "");
		}
	});
});
