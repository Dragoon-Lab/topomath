<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta http-equiv="X-UA-Compatible" content="IE=EDGE" />
	<title>TopoMath</title>
	<link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon"/>
	<link rel="stylesheet" href="css/fontawesome.min.css">
	<link rel="stylesheet" href="./dijit/themes/claro/claro.css">

	<script type="text/javascript">
		// Appending timestamp to get the latest version of version.js for every request
		var d = Date.now();
		if(window.location.hostname == "topomath.asu.edu"){
			document.write('<scr'+'ipt type = "text/javascript" src=version.js?'+ d +'></scr'+'ipt>');
		}
	</script>
	<script type="text/javascript" >
		var version = "";
		if(window.location.hostname == "topomath.asu.edu"){
			version = getVersion();  // Get version from version.js
		}else{
			version = d;
		}
		dojoConfig = {
			isDebug:false,
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
				{name: "solver", location: "math-solver"},
				// AMD doesn't handle file names with dots,
				// need to specify explicitly
				{name: "jsBezier", location: "jsPlumb/lib", main: "jsBezier-0.6"},
				{name: "jsplumb-geom", location: "jsPlumb/lib", main: "jsplumb-geom-0.1"},
				{name: "demo", location: "jsPlumb/demo"}
			]
		};
		if(dojoConfig.isDebug){
			document.write('<link href="css/state-machine.css?'+version+'" rel="stylesheet" />');
			document.write('<link href="css/global.css?'+ version+'" rel="stylesheet" />');
			document.write('<scr'+'ipt src="dojo/dojo.js"></scr'+'ipt>');
		} else {
			document.write('<link href="css/state-machine.css?'+version+'" rel="stylesheet" />');
			document.write('<link href="css/global.css?'+ version+'" rel="stylesheet" />');
			document.write('<scr'+'ipt src="dojo/dojo.js"></scr'+'ipt>');
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
				"dijit/layout/ContentPane", "dijit/registry", "dijit/layout/TabContainer",
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
			<button type="button" data-dojo-type="dijit/form/Button" id="createQuantityNodeButton" disabled="true" style="display: none">Add Quantity</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="createEquationNodeButton" disabled="true" style="visibility: hidden">Add Equation</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="graphButton" disabled="true" style="visibility: hidden">Graph</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="tableButton" disabled="true" style="visibility: hidden">Table</button>
			<button type="button" data-dojo-type="dijit/form/Button" id="doneButton" disabled="true" style="visibility: hidden">Done</button>
		</div>

		<div id="drawingPane" class="restrict-vscroll" data-dojo-type="dijit/layout/ContentPane" region="center">
			<div id="errorMessageBox"></div>
			<!--<div id="tableGrid" data-dojo-type="dijit/layout/ContentPane" region="center"></div>-->
			<!-- div for descriptions for each type -->
			<div class = "quantity-description-wrapper" id="quantity-description">
				
				<div class="quantity-count">
					<div>Unknowns : 
						<span id="unknown-quantity-node-count"></span>
					</div>
				</div>
			</div>
			<div class = "equation-description-wrapper" id="equation-description">
				<div class="equation-count">
					<div>Equations : 
						<span id="equation-node-count">
					</div>
				</div>
			</div>
			<!-- Putting jsPlumb-stuff for demo -->
			<div class="demo statemachine-demo" id="statemachine-demo">
			</div>
		</div>

		<!-- this is where the menu as well the node editor html code would be kept.
		Lets follow the hierarchy used earlier.-->

		<!-- Putting Node-Editor -Dialog stuff for demo -->
		<div class="claro sameedit" data-dojo-type="dijit/Dialog" id="nodeEditor">
			
			<div id="givenToStudentToggleContainer" class="fieldgroup" style="display: none;">
				<label style="" for="givenToStudentCheckbox">Given to student</label>
				<input id="givenToStudentCheckbox" name="markStudentNode" data-dojo-type="dijit/form/CheckBox" checked="false"/>
			</div>

			<div id="modelSelectorContainer" class="fieldgroup" style="display:none" >
				<label for="modelSelector">Select Model</label>
				<select id="modelSelector" data-dojo-type="dijit/form/Select">
					<option value='authored' selected>Author's Values</option>
					<option value='student'>Initial Student Values</option>
				</select>
			</div>

			
			<div id="schemaSelectorContainer" class="fieldgroup" style="display: none">
				<span class="fixedwidth">
					<button id="schemaDescriptionQuestionMark" type="button"data-dojo-type="dijit/form/Button"></button>
					<label for="schemaSelector">Schema</label>
				</span>
				<select id="schemaSelector" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>Select a schema</option>
				</select>
			</div>
			
			<div id="entityInputboxContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="entityDescriptionQuestionMark" class="questionMark"></div>
					<label for="entityInputbox">Entity</label>
				</span>
				<input id="entityInputbox" data-dojo-type="dijit/form/TextBox">
			</div>

			<div id="entitySelectorStudentContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="entityDescriptionQuestionMarkStudent" class="questionMark"></div>
					<label for="entitySelectorStudent">Entity</label>
				</span>
				<select id="entitySelectorStudent" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>Select an entity</option>
				</select>
			</div>

			<div class="fieldgroup">

				<div id="descriptionInputboxContainer" class="fieldgroup" style="display: none;">
					<span class="fixedwidth">
						<div id="descriptionQuestionMark" class="questionMark"></div>
						<label for="descriptionInputbox">Description</label>
					</span>
					<input id="descriptionInputbox" data-dojo-type="dijit/form/TextBox">
				</div>

				<div id="descriptionInputboxContainerStudent" class="fieldgroup" style="display: none;">
					<span class="fixedwidth">
						<div id="descriptionQuestionMark" class="questionMark"></div>
						<label for="selectDescription">Description</label>
					</span>
					<select id="selectDescription" data-dojo-type="dijit/form/Select">
						<option value='defaultSelect'>--Select--</option>
					</select>
				</div>
			</div>

			<div class="fieldgroup">
				<div id="variableSlotControlsContainer" class="fieldgroup" style="display: none;">
					<span class="fixedwidth">
						<div id="variableSlotNamesQuestionMark" class="questionMark"></div>
						<label for="variableSlotControlsbox">Variables</label>
					</span>
					<div id="variableSlotControlsbox"></div>
				</div>
			</div>

			<div id="variableOptionalityContainer" class="fieldgroup" style="display: none;">
				<label for="optionalitySelector">Optionality</label>
				<select id="optionalitySelector" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>--Select--</option>
					<option value='required'>In equations & required</option>
					<option value='allowed'>In equations & optional</option>
					<option value='irrelevant'>Not in equations</option>
				</select>
			</div>

			<div id="rootNodeToggleContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="questionMarkRoot" class="questionMark"></div>
					<label for ="rootNodeToggleCheckbox" title ="Mark this node as Sought node.">Sought</label>
				</span>
				<input id ="rootNodeToggleCheckbox" name ="markRootNode" data-dojo-type="dijit/form/CheckBox" value="agreed" checked="false"/>
			</div>	

			<div id="variableInputboxContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="variableInputboxQuestionMark" class="questionMark"></div>
					<label for="variableInputbox">Variable</label>
				</span>
				<input id="variableInputbox" data-dojo-type="dijit/form/TextBox">
			</div>

			<div id="qtyDescriptionInputboxContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="qtyDescriptionQuestionMark" class="questionMark"></div>
					<label for="qtyDescriptionInputbox">Description</label>
				</span>
				<input id="qtyDescriptionInputbox" data-dojo-type="dijit/form/TextBox">
			</div> 
			<div id="qtyDescriptionInputboxContainerStudent" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="qtyDescriptionQuestionMark" class="questionMark"></div>
					<label for="qtyDescriptionInputboxStudent">Description</label>
				</span>
				<select id="qtyDescriptionInputboxStudent" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>--Select--</option>
					<option value='test1'>test1</option>
					<option value='test2'>test2</option>
				</select>
			</div> 

			<div id="variableInputboxContainerStudent" class="fieldgroup" style="display: none;">
				<label for="variableInputboxStudent">Variable Name</label>
				<select id="variableInputboxStudent" data-dojo-type="dijit/form/Select">
					<option value='defaultSelect'>--Select--</option>
				</select>
			</div>

			<div id="variableTypeContainer" class="fieldgroup" style="display: none;">
				<span class="fixedwidth">
					<div id="variableTypeQuestionMark" class="questionMark"></div>
					<label>Type</label>
				</span>
				<input data-dojo-type="dijit/form/RadioButton" name="variableType" class="handleVariable" id="unknownType" value="unknown"/>
				<label for="unknownType">Unknown</label>
				<input data-dojo-type="dijit/form/RadioButton" name="variableType" class="handleVariable" id="parameterType" value="parameter"/>
				<label for="parameterType">Parameter</label>
				<span id="variableTypeDynamicOption" style="display: none;">
					<input data-dojo-type="dijit/form/RadioButton" name="variableType" class="handleVariable" id="dynamicType" value="dynamic"/>
					<label for="dynamicType">Dynamic</label>
				</span>
			</div>

			<div class="fieldgroup" id="valueUnitsContainer" style="display: block;">
				<!-- adding a div for value field to control its display in UI -->
				<div id="valueInputboxContainer" class="fieldgroup" style="display: none;">
					<span class="fixedwidth">
						<div id="valueQuestionMark" class="questionMark"></div>
						<label for="valueInputbox"><p id="initLabel" style="display:inline"></p>Value</label>
					</span>
					<input id="valueInputbox" type="text" style="width:5em" data-dojo-type="dijit/form/TextBox">
				</div>
				
				<div id = "unitsSelectorContainerStudent" class="fieldgroup" style="display: none">
					<label for="unitsSelectorStudent">Units</label>
					<select id="unitsSelectorStudent" data-dojo-type="dijit/form/Select">
						<option value='defaultSelect'>No Units</option>
					</select>
				</div>
				
				<div id="unitsSelectorContainer" class="fieldgroup" style="display: none;">
					<label for="unitsSelector">Units</label>
					<input id="unitsSelector" data-dojo-type="dijit/form/ComboBox" style="width:6em">
				</div>
			</div>
			
			<div class="equationInputsContainer" id="expressionDiv" style="display: none;">
				 <div class="vertical">
					<div id="equationLabel">
						<label for="equationInputbox">Equation</label>
					</div>
					<div id="equationInputboxContainer" class="fieldgroup">
						<textarea id="equationInputbox" rows=4 cols=50 data-dojo-type="dijit/form/SimpleTextarea" style="min-height:60px;display: display: none;"></textarea>
					</div>
				</div>
				<!-- the author mode design for new topomath has been updated, below elements are no longer in use
				<div class="fieldgroup" id="algebraic">
					<span class="fixedwidth">
						<div id="inputsQuestionMark" class="questionMark"></div>
						<label>Insert above </label>
					</span>
					<div class="vertical">
						<div id="inputSelectorContainer" style="background-color:#fff; display: none;">
							<select id="inputSelector" data-dojo-type="dijit/form/ComboBox">
							</select>
						</div>
						<div id="inputSelectorContainerStudent" style="background-color:#fff; display: none;">
							<select id="inputSelectorStudent" data-dojo-type="dijit/form/Select">
								<option value='defaultSelect'>--Select--</option>
							</select>
						</div>
					</div>
					<div class="equationUndoDoneButtonsContainer">
						<button id="undoButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Undo</button>
						<button id="equationDoneButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Check Equation</button>
					</div>
				</div>

				<div class="fieldgroup" id="operations">
					<div>
						<button id="plusButton" title="Plus" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-plus"></span></button>
						<button id="minusButton" title="Minus" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-minus"></span></button>
						<button id="timesButton"  title="Times" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><span class="fa fa-asterisk"></span></button>
						<button id="divideButton"  title="Divide" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><strong class="fa fa-minus fa-division"></strong></button>
						<button id="equalsButton"  title="Equals" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon"><strong >=</strong></button>
						<div id="operationsQuestionMark" class="questionMark" style="margin: 0 0 -8px 0"></div>
					</div>
				</div>-->
			</div>

			<div class="fieldgroup" id="messageOutputboxContainer" style="">
				<label for="messageOutputbox">Messages</label>
				<div id="messageOutputbox" class="textscroll" data-dojo-type="dijit/layout/ContentPane" ></div>

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
		<!-- Dialog showing plot or table of solution  -->
		<div class="claro dijitLayoutContainer dijitDialog" id="solution" data-dojo-type="dijit.Dialog" style="min-width: 70%; min-height: 80%; background-color: #FFFFFF">
			<div id= 'graphErrorMessage'></div>
			<div data-dojo-type= 'dijit/layout/ContentPane' style='overflow:visible; width:55%; height:95%; float:left; background-color: #FFFFFF;'>
				<div id="GraphTabContainer" data-dojo-type='dijit/layout/TabContainer' style='overflow:visible; display:none;'>
					<div id='GraphTab' data-dojo-type='dijit/layout/ContentPane' style='overflow:auto;visibility:hidden;display:none' title=""></div>
					<div id='TableTab' data-dojo-type='dijit/layout/ContentPane' style='overflow:auto' title="Table"></div>
					<div id='StaticTab' data-dojo-type='dijit/layout/ContentPane' style='overflow:auto' title="Graph vs Parameter"></div>
				</div>
			</div>
			<div id="SliderPane" data-dojo-type='dijit/layout/ContentPane' style='overflow:visible; min-height: 95%; width:40%; float:right; background-color: #FFFFFF'>
				<div id= 'solutionMessage'></div>
			</div>
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
