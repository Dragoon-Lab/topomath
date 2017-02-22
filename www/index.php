<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta http-equiv="X-UA-Compatible" content="IE=EDGE" />
	<title>TopoMath</title>
	<link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon"/>
	<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
	<!-- <script type = "text/javascript" src = "version.js"></script> -->
	<script type="text/javascript">
		var version = "";

		if(window.location.hostname == "topomath.asu.edu"){
			version = getVersion();  // Get version from version.js
		}else{
			version = new Date();
		}

		dojoConfig = {
			isDebug:true,
			parseOnLoad:true,
			async: true,
			// popup:true,
			baseUrl: "./",
			cacheBust: version,
			packages: [
				{name: "dojo", location: "dojo"},
				{name: "dijit", location: "dijit"},
				{name: "dojox", location: "dojox"},
				{name: "jsPlumb", location: "jsPlumb/src"},
				{name: "topomath", location: "js"},
				{name: "parser", location: "math-parser"},
				// AMD doesn't handle file names with dots,
				// need to specify explicitly
				{name: "jsBezier", location: "jsPlumb/lib", main: "jsBezier-0.6"},
				{name: "jsplumb-geom", location: "jsPlumb/lib", main: "jsplumb-geom-0.1"},
				{name: "demo", location: "jsPlumb/demo"}
			]
		};
		if(dojoConfig.isDebug){
			document.write('<link href="css/global.css?'+ version+'" rel="stylesheet" />');
			document.write('<scr'+'ipt src="dojo/dojo.js"></scr'+'ipt>');
		} else {
			document.write('<link href="release/css/global.css?'+ version+'"  rel="stylesheet" />');
		};
	</script>

	<script type="text/javascript">
		/**
		* This require should include all of the packages
		* needed by widgets defined in the html below.
		*
		* Most widgets have an associated css style sheet that is
		* loaded by css/global.css
		*
		* Place holder to load dojo related systems like menus, input box and so on.
		**/
		require(["dojo/domReady!"], function() {
			//Load once dom is ready

			require([
				"dojo/parser",
				"dijit/Dialog",
				"dijit/Editor",
				"dijit/_editor/plugins/LinkDialog",
				"dijit/MenuBar", "dijit/PopupMenuBarItem",
				"dijit/layout/BorderContainer", "dijit/MenuItem",
				"dijit/form/Select", "dijit/form/Textarea",
				"dijit/form/Button", "dijit/form/CheckBox", "dijit/form/TextBox",
				"dijit/form/ComboBox", "dijit/form/Textarea", "dijit/form/RadioButton",
				"dijit/form/SimpleTextarea", "dijit/Menu",
				"dijit/layout/ContentPane", "dijit/registry",
				"dijit/TooltipDialog",
				"dijit/layout/BorderContainer",
				"dijit/layout/ContentPane",
				"topomath", // Load up TopoMath itself
				"topomath/menu", // Wire up menus
			]);
		});
	</script>

	<!-- jsPlumb Libs Start Here -->
	<!-- Once AMD is correctly implemented in jsPlumb, these should go away -->

	<script type="text/javascript">
		// Use AMD to get jsPlumb
		require([
			// support lib for bezier stuff
			"jsBezier",
			// jsplumb geom functions
			"jsplumb-geom",
			// base DOM adapter 
			"jsPlumb/dom-adapter",
			// main jsplumb engine 
			"jsPlumb/jsPlumb",
			// endpoint 
			"jsPlumb/endpoint",
			// connection 
			"jsPlumb/connection",
			// anchors 
			"jsPlumb/anchors",
			// connectors, endpoint and overlays  
			"jsPlumb/defaults",
			// bezier connectors 
			// "jsPlumb/connectors-bezier",
			// state machine connectors 
			"jsPlumb/connectors-statemachine",
			// flowchart connectors 
			"jsPlumb/connectors-flowchart",
			"jsPlumb/connector-editors",
			// SVG renderer 
			"jsPlumb/renderers-svg",
			// canvas renderer 
			"jsPlumb/renderers-canvas",
			// vml renderer 
			"jsPlumb/renderers-vml",
			// jquery jsPlumb adapter 
			"jsPlumb/dojo-adapter",
			// Dojo interface layer
			"demo/demo-helper-dojo"
		]);
	</script>

</head>

<!-- topomath needs a loadingOverlay division here, using loading gears gif for now-->
<div id="loadingOverlay" class="loadingOverlay pageOverlay" style = "top: 0;
	left: 0;
	position: absolute;
	height: 100%;
	width: 100%;
	z-index: 1001;
	display: block;
	background:  #fff url('images/loading_gears.gif') no-repeat;
	background-position: center;
	background-color: #d9baa3;"></div>

<body class="claro" style = "top: 0;
	left: 0;
	position: fixed;
	height: 100%;
	width: 100%;" >
	<?php
		$data = $_REQUEST;
		$params = "";
		if(count($data) != 0)
			foreach($data as $key => $value){
				$params .= $key."=".$value."&";
			}

		$params = substr($params, 0, -1);
	?>
	<input type = "hidden" id = "query" value = "<?php echo $params?>"/>
	<div id="main" data-dojo-type="dijit/layout/BorderContainer" gutters="false">
	
		<div data-dojo-type="dijit/MenuBar" id="menuBar" region="top" splitter="false">
			<button type="button" data-dojo-type="dijit/form/Button" id="createQuantityNodeButton" disabled="true" style="visibility:hidden">Add Quantity</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="createEquationNodeButton" disabled="true" style="visibility: hidden">Add Equation</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="DoneButton" disabled="true" style="visibility: hidden">Done</button>
		</div>
	
		<div id="drawingPane" class="restrict-vscroll" data-dojo-type="dijit/layout/ContentPane" region="center">
			<div id="errorMessageBox"></div>
			<!--<div id="tableGrid" data-dojo-type="dijit/layout/ContentPane" region="center"></div>-->
			<!-- div for descriptions for each type -->
			<div class = "quantity-description-wrapper" id="quantity-description"></div>
			<div class = "equation-description-wrapper" id="equation-description"></div>
			<!-- Putting jsPlumb-stuff for demo -->
			<div class="demo statemachine-demo" id="statemachine-demo">
			</div>
		</div>

		<!-- this is where the menu as well the node editor html code would be kept.
		Lets follow the hierarchy used earlier.-->

		<!-- Putting Node-Editor -Dialog stuff for demo -->
		<div class="claro sameedit" data-dojo-type="dijit/Dialog" id="nodeEditor">
			
			<div id="givenToStudentToggleContainer" class="fieldgroup">
				<label style="width:20ex;" for="givenToStudentCheckbox">Given to student</label>
				<input id="givenToStudentCheckbox" name="markStudentNode" data-dojo-type="dijit/form/CheckBox" checked="false"/>
			</div>
			
			<div id="modelSelectorContainer" class="fieldgroup" style="display:none" >
				<label for="modelSelector">Select Model</label>
				<select id="modelSelector" data-dojo-type="dijit/form/Select">
					<option value='correct' selected>Author's Values</option>
					<option value='given'>Initial Student Values</option>
				</select>
			</div>

			<div id="variableOptionalityContainer" class="fieldgroup" style="display: none;">
				<label for="variableInputbox">Variable</label>
				<input id="variableInputbox" data-dojo-type="dijit/form/ComboBox">
				<label for="optionalitySelector">Optionality:</label>
				<select id="optionalitySelector" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>--Select--</option>
					<option value='required'>In equations & required</option>
					<option value='allowed'>In equations & optional</option>
					<option value='irrelevant'>Not in equations</option>
				</select>
			</div>
			
			<div class="fieldgroup">
				<div id="descriptionInputboxContainer" class="fieldgroup" style="display: none;">
					<span class="fixedwidth">
						<div id="authorDescriptionQuestionMark" class="questionMark"></div>
						<label for="descriptionInputbox">Description</label>
					</span>
					<input id="descriptionInputbox" data-dojo-type="dijit/form/ComboBox">
				</div>
			</div>

			<div class="fieldgroup" id="valueUnitsContainer" style="display: none;">
				<!-- adding a div for value field to control its display in UI -->
				<div id="initialValueInputboxContainer" >
					<span>
						<div id="initialValueQuestionMark" class="questionMark"></div>
						<label for="initialValueInputbox"><p id="initLabel" style="display:inline"></p>Value</label>
					</span>
					<input id="initialValueInputbox" type="text" style="width:5em" data-dojo-type="dijit/form/TextBox">
				</div>
				<!--
				<div id = "unitDiv" style="display: none">
					<div id="unitsQuestionMark" class="questionMark"></div>
					<label id="selectUnitsControl">Units
						<select id="selectUnits" data-dojo-type="dijit/form/Select">
							<option value='defaultSelect'>No Units</option>
						</select>
					</label>
				</div>
				-->
				<div id="unitsSelectorContainer" style="">
					<!-- Setting display:none in the widget itself doesn't work.
					 setting display:none in the label doesn't work in FireFox. -->
					<label for="unitsSelector">Units
						<input id="unitsSelector" data-dojo-type="dijit/form/ComboBox" style="width:6em">
					</label>
				</div>
			</div>
			
			<div id="rootNodeToggleContainer" class="fieldgroup" style="display: none;">
				<label for ="rootNodeToggleCheckbox" title ="Mark this node as a root node.">Root:</label>
				<input id ="rootNodeToggleCheckbox" name ="markRootNode" data-dojo-type="dijit/form/CheckBox" value="agreed" checked="false"/>
				<div id="questionMarkRoot" class="questionMark"></div>
			</div>

			<div id="dynamicNodeToggleContainer" class="fieldgroup" style="display: none;">
				<label for ="dynamicNodeToggleCheckbox" title ="Mark this node as a root node.">Dynamic:</label>
				<input id ="dynamicNodeToggleCheckbox" name ="markDynamicNode" data-dojo-type="dijit/form/CheckBox" value="agreed" checked="false"/>
				<div id="questionMarkDynamic" class="questionMark"></div>
			</div>

			<div class="equationInputsContainer" id="expressionDiv" style="display: none;">
				<div class="fieldgroup">
					 <div class="vertical">
						<div id="equationLabel"></div>
						<div id="equationInputboxContainer" class="fieldgroup">
							<label for="equationInputbox">Equation</label>
							<textarea id="equationInputbox" rows=4 cols=50 data-dojo-type="dijit/form/SimpleTextarea" style="min-height:60px;"></textarea>
						</div>
					</div>
				</div>

				<div class="fieldgroup" id="algebraic">
					<span class="fixedwidth">
						<div id="inputsQuestionMark" class="questionMark"></div>
						<label>Insert above </label>
					</span>
					<div class="vertical">
						<div id="inputSelectorContainer" style="background-color:#fff;">
							<select id="inputSelector" data-dojo-type="dijit/form/ComboBox">
							</select>
						</div>
					</div>
					<div class="equationUndoDoneButtonsContainer">
						<button id="undoButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Undo</button>
						<button id="equationDoneButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Check Equation</button>
					</div>
				</div>

				<div class="fieldgroup" id="operations">
					<span class="fixedwidth">
						 <div id="operationsQuestionMark" class="questionMark" style="margin-top:4px;"></div>
					</span>
					<div>
						<button id="plusButton" title="Plus" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-plus"></span></button>
						<button id="minusButton" title="Minus" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-minus"></span></button>
						<button id="timesButton"  title="Times" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-asterisk"></span></button>
						<button id="divideButton"  title="Divide" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><strong class="fa fa-minus fa-division"></strong></button>
					</div>
				</div>
			</div>


			<div class="fieldgroup" id="messageOutputboxContainer" style="">
				<label for="messageOutputbox">Messages</label>
				<div id="messageOutputbox" class="textscroll" data-dojo-type="dijit/layout/ContentPane"></div>

				<div style="margin-bottom:10px; display:block">
					<span>&nbsp;</span>
					<button id="closeButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float:right;">Done</button>
					<button id="deleteButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float:left;">Delete Node</button>
				</div>
			</div>

		</div><!-- end of node editor -->

		<!-- crisis Alert -->
		<div class="claro crisisDialog" id="crisisAlertMessage" data-dojo-type="dijit.Dialog" title="Message">
			<div id = "crisisMessage"> </div>
			<button id="OkButton" type="button" data-dojo-type="dijit/form/Button">OK</button>
		</div> 

		<!-- popup Dialog to show unfinished tasks before closing -->
		<div data-dojo-type="dijit/Dialog" data-dojo-id="popupDialog" id ="popupDialog" title="Message" data-dojo-props="closable:false">

			<div class="dijitDialogPaneContentArea">
				<div id="popupDialogContent">
				</div>
				<div id="popupDialogButtons">
				</div>
			</div>
		</div>
	</div>
</body>
</html>