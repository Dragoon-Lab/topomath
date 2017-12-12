<?php header("Content-type: text/css"); ?>
<?php
  function latest_version($file_name){
    echo $file_name."?".filemtime($file_name);
}?>
@import url("../dojo/resources/dojo.css");
@import url("../dijit/themes/dijit.css");
@import url("../dijit/themes/claro/layout/BorderContainer.css");
@import url("../dijit/themes/claro/layout/ContentPane.css");
/* @import url("../dijit/themes/claro/layout/AccordionContainer.css"); */
@import url("../dijit/themes/claro/form/Button.css");
@import url("../dijit/themes/claro/form/Checkbox.css");
@import url("../dijit/themes/claro/form/Select.css");
/* @import url("../dijit/themes/claro/form/Slider.css"); */
@import url("../dijit/themes/claro/Menu.css");
@import url("../dijit/themes/claro/Dialog.css");
@import url("../dijit/themes/claro/document.css");
@import url(<?php latest_version('state-machine.css');?>);
/*For styling the rich text editor*/
@import url("../dijit/themes/claro/Toolbar.css");
@import url("../dijit/themes/claro/Editor.css");
@import url("../dijit/icons/editorIcons.css");

html, body, #main{
	width:100%;	/* make the body expand to fill the visible window */
	height:100%;
	padding:0 0 0 0;
	margin:0 0 0 0;
	font:10pt Arial,Myriad,Tahoma,Verdana,sans-serif !important;
}

.claro .sameedit .dijitDisabled{
    background-color:#e6e6e6;
    cursor: pointer;
}

#crisisAlertMessage{
  background: #fff; /* override claro Dialog css for crisis alert message */
  max-width: 60ex;
  text-align: center;
}

/* Common Float classes */
.fLeft{
    float: left;
} 

.fRight{
    float: right;
}

.cBoth{
    clear: both;
}
/* menu bar*/
#menuBar{
    z-index: 3;
}

/*
                        Node Editor
*/

.sameedit, #crisisAlertMessage, .sameedit, div#solution {
    font:10pt Arial,Myriad,Tahoma,Verdana,sans-serif !important;
}

.sameedit .fieldgroup {
    display:block;
    margin-top:2ex;
    margin-bottom:2ex;
    margin-left:0ex;
    clear:both;
}

.sameedit .fieldgroup > label {
    text-align:left;
    margin-left:2ex;
    margin-right:1ex;
    width: 16ex;
}

.sameedit #variableTypeContainer.fieldgroup label:not(:first-child){
    width: 10ex;
    margin-left: 0.5ex;
    margin-right: 0.5ex;
}

.sameedit .fieldgroup > * {
    display:inline-block;
    vertical-align:top

}

.sameedit .fieldgroup > span label{
    vertical-align:top

}
/*
.sameedit .fieldgroup > label:first-child {
    width:10ex;
}
*/
.sameedit #equationText {
    max-width:40ex;
    border:solid black 1px;
    padding:2px;
    margin:2px;
}

.sameedit .textscroll {
    background:#e5e5e5;
    border:solid black 1px;
    overflow-y:scroll;
    height:50px;
    width:22em;
    margin: 2px 5px 5px 0;
}

.sameedit .textscroll p {
    margin-top:0.5ex;
    margin-bottom:0.5ex;
}

/*  Display contents as horizontal but this block as vertical. */
.sameedit .horizontal {
    display:block;
}

/* Display contents as vertical but this block as horizontal. */
.sameedit .vertical {
    display:inline-block;
    vertical-align:top;
    margin-left: 15px;
}

/* If we use float to horizontally align, there seems to be
   no way to vertically align the buttons.  */
.sameedit .equationUndoDoneButtonsContainer {
    margin-left: 10px;
    padding-top: 0px;
    margin-top: -5px;
}

.sameedit .equationUndoDoneButtonsContainer .dijitButtonContents{
    width:120px;
}

.sameedit .fieldgroup > span.fixedwidth {
    width: 16ex;
    margin-right: 20px;
}

/* Right align buttons */
.equationUndoDoneButtonsContainer > * {
    float:right;
    clear:right;
}

.claro .dijitDisabled .dijitEditorIFrame,
.claro .dijitDisabled .dijitEditorIFrameContainer{
  background-color: #FFFFFF !important; /*override claro Editor and keep the explanation dialog box background-color white when disabled*/
  color: black !important; 
}

.claro .dijitEditorIFrame{/*adding resizing ability to the explanation dialog box*/
   resize:both;
}

/* miscellenous */
.nodesDropdown{
	margin-bottom: 5px;
}

#selectDescription_dropdown {
    overflow-x: scroll;
    max-width: 320px;
}

.error{
	font:11pt Arial,Myriad,Tahoma,Verdana,sans-serif;
//	font-weight: bold;
	color: red;
}

input[type=radio]{
	opacity:1 !important;
}

#unitsSelectorStudent{
  overflow-x: scroll;
  width: 10em !important;
}

#buttons{
	/*position: fixed;*/
	float: right;
}

/* Bug fix: Buttons are sticky */

.dijitButtonNode {
    padding: 0 !important;
}

.dijitButtonContents{
    padding: 2px 4px 4px 4px;
}

.messageBox{
  position: relative;
  padding: 15px;
  border-radius: 7px;
  margin: 0 auto;
  width: 90%;
  text-align: center;
  margin-bottom:8px;
}

.error-message-close{
  float: right;
  display: inline-block;
  width: 20px;
  height: 20px;
}

.error-message{
  width: 90%;
  margin: 0;
  display: inline-block;
}

.messageBox-error{
   background-color: rgba(255,0,0,0.1);
   border: 2px solid red;
}

.messageBox-info{
   background-color: rgba(52,152,219,0.2);
   border: 2px solid #3498DB;
}

.messageBox-success{
   background-color: rgba(39,174,96,0.2);
   border: 2px solid #27AE60;
}

.messageBox-warn{
   background-color: antiquewhite;
   border: 2px solid #F39C12;
    z-index: 100;
    
}

.clear {
	content: " ";
	display: block;
	clear: both;
	height: 0;
}

.fa{
    font: normal normal normal 14px/1 FontAwesome;
}
#operations .fa{
    font: normal normal normal 11px/1 FontAwesome;
}

.bubble .fa{
    font-size:18px !important;
}

.crisisDialog{
    z-index:5000 !important;
}

#popupDialog .dijitDialogPaneContentArea{
    width: 300px !important;
}
#popupDialog .dijitDialogPaneContentArea #popupDialogContent{
  padding: 10px 20px;
}
#popupDialog .dijitDialogPaneContentArea #popupDialogContent li{
  padding: 5px 0px;
}
#popupDialog .dijitDialogPaneContentArea #popupDialogButtons{
  text-align: right;
}

#equationBox, #givenEquationBox{
    min-height:48px;
    font:10pt Arial,Myriad,Tahoma,Verdana,sans-serif !important;
}

.equationInputsContainer{
    background-color: #E1E1E1;
    border-radius: 5px;
    padding: 5px;
}

.fa-division{
    transform: rotate(-65deg);
    -webkit-transform: rotate(-65deg);
    -moz-transform: rotate(-65deg);
    -ms-transform: rotate(-65deg);
    -o-transform: rotate(-65deg);
    font-size: 13px !important;
}

/*Fix for tooltips to appear below  the dialogboxes */
.dijitTooltipDialogPopup {
    z-index: 951 !important;
}

.questionMark{
  width: 22px;
  height: 22px;
  margin: -6px -3px -6px 10px;
  display: inline-block;
  background-image: url(../images/help-inactive.png);
  background-size: cover;
}

/* Feedback Icons*/
.topomath-feedback{
  position: absolute;
  left: -15px;
  top: -15px;
  padding: 4px;
  font-size: 14px;
  background: white;
  border-radius: 32%;
  border: 2px solid transparent;
}
.topomath-feedback.fa-star{
  color: rgb(153, 134, 9);
  box-shadow: 2px 2px 2px darkolivegreen;
  border-color: forestgreen;
}
.topomath-feedback.fa-check{
  color: green;
  box-shadow: 2px 2px 2px darkolivegreen;
  border-color: green;
}
.topomath-feedback.fa-times{
  color: red;
  box-shadow: 2px 2px 2px red;
  border-color: red;
}
.topomath-feedback.fa-minus{
  color: orange;
  box-shadow: 2px 2px 2px orange;
  border-color: orange;
}

table.solution, table.solution th, table.solution td {
	border: 1px solid black;
	border-spacing: 0px;
}

table.solution th{
	padding: 0 10px;
	text-align: center;
}
.tabLabel:focus{
  outline: none;
}

div.legend{
	margin: 0 auto;
}
