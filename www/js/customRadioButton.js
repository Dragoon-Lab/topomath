/* Summary : This overrides _onClick of Radio Button. This was required as the original
            Radio Button was resetting the click and we were unable to change selection programaticaly.
   Usecase : When variableType is selected by user in Student mode, after 2 attempts, we show the
            answer.
*/
require(["dojo/_base/declare", "dijit/form/RadioButton",
     "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/parser"], function(declare, RadioButton, _WidgetBase, _TemplatedMixin) {
    declare("dijit/form/RadioButton", [RadioButton, _WidgetBase, _TemplatedMixin], {
        _onClick: function(e){
            this.onClick(e);
        }
    }); 
});