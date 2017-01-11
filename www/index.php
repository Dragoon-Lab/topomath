<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
				"topomath/menu", // Wire up menus
				"topomath" // Load up TopoMath itself
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

<!-- topomath needs a loadingOverlay division here -->
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
			<button type="button" data-dojo-type="dijit/form/Button" id="createNodeButton" disabled="true" style="display: none">Create Node</button>
		</div>
    	<div id="drawingPane" class="restrict-vscroll" data-dojo-type="dijit/layout/ContentPane" region="center">
        	<div id="errorMessageBox"></div>
        	<!--<div id="tableGrid" data-dojo-type="dijit/layout/ContentPane" region="center"></div>-->
        	<!-- Putting jsPlumb-stuff for demo -->
        	<canvas id="myCanvas" height = "1000" width="800"></canvas>
        	<div class="demo statemachine-demo" id="statemachine-demo">
        	</div>

        <!-- Putting jsPlumb-stuff for demo  end-->
    	</div>
	<!-- this is where the menu as well the node editor html code would be kept.
	Lets follow the hierarchy used earlier.-->

	
	<!-- pre node editor dialog , user decides to open a Quantity Node or an Equation Node-->
	<div class="claro sameedit" data-dojo-type="dijit/Dialog" id="prenodeeditor">
		<div id="topoNodeControl" class="fieldgroup">
			Select Node Type
			<input id="QNodeSelect" type="radio" data-dojo-type="dijit/form/RadioButton" name="topoCurrentNode" checked value="Quantity Node" />
			<label for="QNodeSelect">Quantity Node</label>
			<input id="EQNodeSelect" type="radio" data-dojo-type="dijit/form/RadioButton" name="topoCurrentNode"  value="Equation Node" />
			<label for="EQNodeSelect">Equation Node</label>
		</div>

		<div class="fieldgroup" style="text-align:right;padding-right:15px;">
				<button id="topoNodeSelectCancel" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" >Cancel</button>
				<button id="topoNodeSelectDone" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Done</button>
		</div>
	</div>

	
	<!-- Putting Node-Editor -Dialog stuff for demo -->
	<div class="claro sameedit" data-dojo-type="dijit/Dialog" id="nodeeditor">
		<div id="studentModelControl" class="fieldgroup"  >
			<label style="width:20ex;" for="setStudentNode">Show to student</label>
			<input id="setStudentNode" name="markStudentNode" data-dojo-type="dijit/form/CheckBox" checked="false"/>
		</div>
		<div id="selectModelControl" class="fieldgroup" style="display:none" >
			<label for="selectModel">Select Model</label>
			<select id="selectModel" data-dojo-type="dijit/form/Select">
				<option value='correct' selected>Author's Values</option>
				<option value='given'>Initial Student Values</option>

			</select>
		</div>
		<div id="nameControl" class="fieldgroup">
			<label for="setName">Variable</label>
			<input id="setName" data-dojo-type="dijit/form/ComboBox">
			<label for="selectKind">Kind of quantity:</label>
			<select id="selectKind" data-dojo-type="dijit/form/Select">
				<option value='defaultSelect'>--Select--</option>
				<option value='required'>in equation & required</option>
				<option value='allowed'>in equation & optional</option>
				<option value='irrelevant'>not in equation</option>
			</select>
		</div>
		<div class="fieldgroup">
			<div id="descriptionControlStudent" class="fieldgroup">
				<span class="fixedwidth">
					<div id="descriptionQuestionMark" class="questionMark"></div>
					<label for="selectDescription">Description</label>
				</span>
				<select id="selectDescription" data-dojo-type="dijit/form/ComboBox">
				</select>
			</div>
			<div id="descriptionControlAuthor" class="fieldgroup" style="display:none">
				  <span class="fixedwidth">
					  <div id="authorDescriptionQuestionMark" class="questionMark"></div>
			 <label for="setDescription">Description</label>
				  </span>
				<input id="setDescription" data-dojo-type="dijit/form/ComboBox">
			</div>
			<!-- Explanation button -->
			<div data-dojo-type="dijit/Dialog" data-dojo-id="myFormDialog" title="Explanation">

				<div class="dijitDialogPaneContentArea" data-dojo-attach-point="name">
					<label id="editorLabel" for="editorInput" style="display:none"><b>Insert your explanation below: </b></label>
					<input id="editorInput" type="hidden" name="editorContent" data-dojo-attach-point="name" style="display:none"/>
					<div  id="editorContent" dojoType="dijit/Editor"
						  height="200px"
						  extraPlugins=" ['createLink', 'unlink', 'insertImage'] " >
					</div>
				</div>

				<div class="dijitDialogPaneActionBar">
					<button id="OKEditorButton" data-dojo-type="dijit/form/Button" type="submit" onClick="return myFormDialog.isValid();" >
						OK
					</button>
					<button id="cancelEditorButton" data-dojo-type="dijit/form/Button" type="button" onClick="myFormDialog.hide()">
						Cancel
					</button>
				</div>
			</div>
			<div class="buttonBox" style="display: none">
				<button id="explanationButton" data-dojo-type="dijit/form/Button" type="button" iconClass="dijitNoIcon" onclick="myFormDialog.show()">
					Explanation
				</button>
			</div>
			<!--  End of explanation part -->

		</div>
		<div class="fieldgroup">
				<span class="fixedwidth" style="display: none;">
					 <div id="typeQuestionMark" class="questionMark"></div>
					<label for="typeId">Type</label>
				</span>
			<select id="typeId" data-dojo-type="dijit/form/Select" style="display: none;">
				<option value='defaultSelect'>--Select--</option>
				<option value="parameter">Parameter</option>
				<option value="accumulator">Accumulator</option>
				<option value="function">Function</option>
			</select>
			<!-- adding a div for value field to control its display in UI -->
			<div id="initialValueDiv" style="">
				<span>
					<div id="initialValueQuestionMark" class="questionMark"></div>
					<label for="initialValue"><p id="initLabel" style="display:inline"></p>Value</label>
				</span>
				<input id="initialValue" type="text" style="width:5em" data-dojo-type="dijit/form/TextBox">
			</div>
			 <div id = "unitDiv" style="display: none">
					<div id="unitsQuestionMark" class="questionMark"></div>
					<label id="selectUnitsControl">Units
						<select id="selectUnits" data-dojo-type="dijit/form/Select">
							<option value='defaultSelect'>No Units</option>
						</select>
					</label>
			 </div>
			<div id="setUnitsControl" style="">
				<!-- Setting display:none in the widget itself doesn't work.
					 setting display:none in the label doesn't work in FireFox. -->
				<label for="setUnits">Units
					<input id="setUnits" data-dojo-type="dijit/form/ComboBox" style="width:6em">
				</label>
			</div>
		</div>
		<div id="setRootNode" class="fieldgroup" style="">
			<label for ="markRootNode" title ="Mark this node as a root node.">Root:</label>
			<input id ="markRootNode" name ="markRootNode" data-dojo-type="dijit/form/CheckBox" value="agreed" checked="false"/>
			<div id="questionMarkRoot" class="questionMark"></div>
		</div>
		<div id="setDynamicNode" class="fieldgroup" style="">
			<label for ="markDynamicNode" title ="Mark this node as a root node.">Dynamic:</label>
			<input id ="markDynamicNode" name ="markDynamicNode" data-dojo-type="dijit/form/CheckBox" value="agreed" checked="false"/>
			<div id="questionMarkDynamic" class="questionMark"></div>
		</div>
		<div class="ExpressionContainer" id="expressionDiv" style="display: none">
			<div class="fieldgroup">
					 <span class="fixedwidth">
						 <div id="expressionBoxQuestionMark" class="questionMark"></div>
						 <label for="equationBox">Expression</label>
					 </span>
				<div class="vertical">
					<div id="equationLabel"></div>
					<textarea id="equationBox" rows=2 cols=35 data-dojo-type="dijit/form/SimpleTextarea"></textarea>
					<!-- adding givenEquationBox for equations in given model for author , hidden in student mode -->
					<textarea id="givenEquationBox" rows=2 cols=35 data-dojo-type="dijit/form/SimpleTextarea" style="display:none; min-height:48px;"></textarea>
					<div id="equationText"></div>
					<!--<div id="timeStepLabel"></div>-->
				</div>
				<div class="buttonBox">
					<button id="undoButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Undo</button>
					<button id="equationDoneButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Check Expression</button>
				</div>
			</div>
			<div class="fieldgroup" id="algebraic">
					<span class="fixedwidth">
						<div id="inputsQuestionMark" class="questionMark"></div>
						<label>Insert above </label>
					</span>
				<div class="vertical">
					<div id="inputControlStudent" style="background-color:#fff;">
						<select id="nodeInputs" data-dojo-type="dijit/form/Select">
							<option value='defaultSelect'>--Select--</option>
						</select>
					</div>

					<div id="inputControlAuthor" style="display:none; background-color:#fff;">
						<select id="setInput" data-dojo-type="dijit/form/ComboBox">
						</select>
					</div>
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
			<div class="fieldgroup" id="structured">
				<label>Insert above </label>
				<div class="vertical">
					<div class="horizontal">
						<button id="sumButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Sum</button>
						<button id="productButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Product</button>
					</div>
					<div class="horizontal">
						<label id="positiveInputsText" for="positiveInputs" style="display:inline">Add quantity:</label><br>
						<select id="positiveInputs" data-dojo-type="dijit/form/Select" style="display:inline-block">
							<option value='defaultSelect'>--Select--</option>
						</select>
					</div>
					<div class="horizontal">
						<label id="negativeInputsText" for="negativeInputs" style="display:inline">Subtract quantity:</label><br>
						<select id="negativeInputs" data-dojo-type="dijit/form/Select" style="display:inline-block">
							<option value='defaultSelect'>--Select--</option>
						</select>
					</div>
				</div>
			</div>
		</div>
		<div class="fieldgroup">
			<div id="assignButtonBox" style="padding-top:0px; display: none" >
				<button id="assignWaveFormButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float: left; margin-right: 5px;">Assign Waveform</button>
				<div id="waveformStore" style="float: left"></div>
				<div id="removeWaveform" style="float: left; color: #ff0000; display: none; cursor: pointer; margin-left: 5px;">X</div>
			</div>
		</div>
		<div class="fieldgroup">
			<label for="messageBox">Messages</label>
			<div id="messageBox" class="textscroll" data-dojo-type="dijit/layout/ContentPane"></div>
			<div class="buttonBox" style="padding-top:0px">
				<!-- Strut to move close button down.  It would be
						better to do this with css... -->
			</div>
			<div style="margin-bottom:10px; display:block">
				<span>&nbsp;</span>
				<button id="closeButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float:right;">Done</button>
				<button id="deleteButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float:left;">Delete Node</button>
				<button id="imageButton" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="float:left; display: none;" disabled="true">Image Highlighting</button>
			</div>
		</div>
		<div class="claro sameedit" id="markImageBox" data-dojo-type="dijit/Dialog" title="Image Highlighting" style="width:600px; display: none;">
			<div class="imagebox-container" >
				<div class="image-container" style="float:left; margin-left:20px; position:relative; width:44%">
					<canvas id="markImageCanvas"></canvas>
					</br>
					<label style="color:grey;">Click and drag to mark the region of the image you wish to highlight when the user puts their mouse over the node.  Then click "Add" to add it to the list of regions to highlight.</label>
				</div>
				<div class="coordinates-container" style="float:right; width:44%; position:relative; text-align:right; padding-top:25px; padding-right:15px;">
					<div class="fieldgroup">
						<label style="width:80px; padding-left:5px;padding-right:5px;text-align:right; margin-left:0px;">Selected Region</label>
						<input type="text" id="newMark" data-dojo-type="dijit/form/TextBox" style="width:128px"readonly/>
					</div>
					<div class="fieldgroup" style="text-align:right">
						<button id="markImageAdd" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" >Add</button>
						<button id="markImageClear" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" >Clear Selection</button>
					</div>

					<div class="fieldgroup" style="text-align:right;">
						<label style="width:80px; padding-left:5px;padding-right:5px; text-align:right; margin-left:0px;">Regions to Highlight</label>
						<select id="savedMark" data-dojo-type="dijit/form/Select" style="width:128px"></select><br/>
						<div class="fieldgroup" style="text-align: right; display:block;"> <button id="markImageRemove" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" style="text-align:right;" >Remove</button> </div>
					</div>
				</div>
			</div>
			<div class="fieldgroup" style="text-align:right;padding-right:15px;">
				<button id="markImageCancel" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon" >Cancel</button>
				<button id="markImageDone" type="button" data-dojo-type="dijit/form/Button" iconClass="dijitNoIcon">Done</button>
			</div>
		</div>
	</div> <!-- end of node editor -->
	</div>

	<!-- crisis Alert -->
	<div class="claro crisisDialog" id="crisisAlertMessage" data-dojo-type="dijit.Dialog" title="Message">
		<div id = "crisisMessage"> </div>
		<button id="OkButton" type="button" data-dojo-type="dijit/form/Button">OK</button>
	</div>
</body>
</html>
