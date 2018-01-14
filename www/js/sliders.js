define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dijit/registry",
	"dojo/dom",
	"dojo/on",
	"dijit/form/HorizontalSlider",
], function(declare, lang, array, registry, dom, on, HorizontalSlider){
	return declare(null, {
		sliderIDPrefix: "sliderGraph",
		labelID: "labelGraph_",
		textBoxID: "textGraph",
		constructor: function(model, solution){
			this._model = model;
			this._solution = solution;
			this._dynamicLabelString = this._model.active.getInitialNodeIDString();
			this.sliders = {};
			this.sliderID = {};
			this.textBoxIDs = {};
			this.sliderPane = registry.byId("SliderPane");
		},

		init: function(){
			this.vars = lang.mixin(this._solution.xvars, this._solution.params);
			if(this.vars.length > 0){
				var content = this.sliderPane.get("content");
				this.sliderValues = this._getValues(this.vars);
				for(var i in this.vars){
					var variable = this.vars[i];
					var varID = this._model.active.getID(variable);
					content += this._getHTML(varID, this.sliderValues[varID]);
				}
				content += "</div></div></div>";
			}
			this.sliderPane.set("content", content);

			array.forEach(this.vars, function(ID){
				dom.byId(this.textBoxIDs[ID]).value = this.sliderValues[ID];
				dom.byId(this.sliderID[ID]).appendChild(this.sliders[ID].domNode);
				//this._applyTextValueToGraph();
			}, this);
		},

		_getValues: function(sliderVars){
			var values = {};
			keys = Object.keys(this._solution.values);
			array.forEach(sliderVars, function(ID){
				for(var i in keys){
					var key = keys[i];
					if(ID == key || key.indexOf(ID + "_") >= 0){
						values[ID] = this._solution.values[key];
						break;
					}
				}
			}, this);

			return values;
		},

		_getHTML: function(paramID, value){
			// create slider
			// The associated css style sheet is loaded by css/dragoon.css
			var html = "";
			var limits = this._getSliderLimits(value);
			this.sliderID[paramID] = this.sliderIDPrefix + "_" + paramID;
			this.sliders[paramID] = new HorizontalSlider({
				name: this.sliderIDPrefix + paramID,
				value: limits.val,
				minimum: limits.min,
				maximum: limits.max,
				intermediateChanges: true,
				style: "width:300px;margin:3px;"
			}, this.sliderIDPrefix + paramID);
			var labelText = this._model.active.getVariable(paramID);
			if(paramID in this._solution.xvars){
				labelText = this._dynamicLabelString +"(" + labelText + ")";
			}

			this.textBoxIDs[paramID] = this.textBoxID + "_" + paramID;
			html += "<label id=\"labelGraph_" + paramID + "\">" + labelText + " = " + "</label>";
				// The input element does not have an end tag so we can't use
				// this.createDom().
				// Set width as number of characters.
			html += "<input id=\"" + this.textBoxIDs[paramID] + "\" type=\"text\" size=10 value=\"" + this.sliderValues[paramID] + "\">";
			var units = this._model.active.getUnits(paramID);
			if(units){
				html += " <span id=\"sliderUnits_"+ paramID +"\">" + units + "</span>";
			}
			this._registerEvent(paramID, limits.transform);
			html += "<br>";
			// DOM id for slider <div>
			html += "<div id='" + this.sliderID[paramID] + "'> " + "</div>";
			return html;
		},

		_getSliderLimits: function(value){
			obj = {};
			obj.transform = function(x){ return x;};
			if(value == 0){
				obj.min = -1;
				obj.max = 1;
			} else if(value > 0) {
				value = Math.log(value);
				obj.transform = Math.exp;
				obj.min = value - Math.log(10);
				obj.max = value + Math.log(10);
			} else {
				obj.min = 2*value;
				obj.max = -2*value;
			}
			obj.val = value;

			return obj;
		},

		_registerEvent: function(paramID, transform){
			var slider = this.sliders[paramID];
			var textBoxID = this.textBoxIDs[paramID];
			on(slider, "change", lang.hitch(this, function(){
				var input = dom.byId(textBoxID);
				input.value = transform(slider.value).toPrecision(3);
				this._logEvent(paramID, input.value);
				on.emit(input, "change", {});
			}));
		},

		_logEvent: function(paramID, value){
			// stub for calling aspect after in logger
			return {
				ID: paramID,
				value: value
			};
		}
	});
});
