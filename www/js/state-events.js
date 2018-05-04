define([
	'dojo/aspect',
	'dojo/ready',
	'dojo/_base/lang',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/on',
	'dijit/TooltipDialog',
	'dijit/popup',
	'./controller',
	'./pedagogical-module',
	'./session',
	'./render-solution',
	'./message-box'
], function(aspect, ready, lang, dom, domClass, on, tooltipDialog, popup, controller, pm, session, solution, messageBox){

	aspect.after(solution.prototype, "setGraphHelpState", function(state){		
		var graphHelpButton = dom.byId('graphHelpButton');
		state.get("isGraphHelpShown").then(lang.hitch(this,function(reply){
			console.log("reply for graph",reply);
			if(!reply && graphHelpButton ) {
				domClass.add(graphHelpButton, "glowNode");
				state.put("isGraphHelpShown",true);
			}else if(graphHelpButton){
				domClass.remove(graphHelpButton, "glowNode");
			}
		}));
	}, true);
	aspect.after(session.prototype, "checkBrowserCompatibility", function(state){
		if(!this.isBrowserCompatible){
			var errorMessage = new messageBox("errorMessageBox", "warn","You are using "+ this.browser.name+
				" version "+this.browser.version +
				"." + state._messages["incompatible"]);
			// adding close callback to update the state for browser message
			state.get("browserCompatibility").then(lang.hitch(this, function(res) {
				var v;
				if(window.location.hostname == "topomath.asu.edu"){
					v = getVersion();
				}else{
					v = Date.now();
				}
				if(!(res && res == "ack_" + v)){
					errorMessage.show();
					state.put("browserCompatibility", "ack_" + v);
				}
			}));
		}
	}, true);
	aspect.after(solution.prototype, "setDoneMessageShown", lang.hitch(this, function(state){
		state.get("isDoneMessageShown").then(lang.hitch(this, function(reply){
			if(!reply){
				problemDoneHint = new tooltipDialog({
					style: "width: 300px;",
					content: '<p>'+state._messages['problemComplete']+'</p>' +
						' <button type="button" data-dojo-type="dijit/form/Button" id="closeHint">Ok</button>',
					onShow: function () {
						on(dom.byId('closeHint'), 'click', function () {
							popup.close(problemDoneHint);
						});
					},
					onBlur: function(){
						popup.close(problemDoneHint);
					}
				});
				popup.open({
					popup: problemDoneHint,
					around: dom.byId('doneButton')
				});
				state.put("isDoneMessageShown", true);
			}
		}))
	}), true);
	aspect.after(pm.prototype, "setState", lang.hitch(this, function(state){
		allInterpretations = ['correct', 'firstFailure', 'secondFailure','incorrect'];
		for(var i in allInterpretations){
			state.init(allInterpretations[i], 0);
		};
		state.init("problemCompleted", 0);
	}), true);
	aspect.after(pm.prototype, "updateState", lang.hitch(this, function(state,property,val){
		state.increment(property, val);
	}), true);
});
