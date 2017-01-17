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
	<script type = "text/javascript" src = "version.js"></script>
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
				"dijit/layout/BorderContainer",
				"dijit/layout/ContentPane",
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
<body class="claro" style = "top: 0;
	left: 0;
	position: fixed;
	height: 100%;
	width: 100%;">
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
    <div id="drawingPane" class="restrict-vscroll" data-dojo-type="dijit/layout/ContentPane" region="center">
        <div id="errorMessageBox"></div>
        <!--<div id="tableGrid" data-dojo-type="dijit/layout/ContentPane" region="center"></div>-->
		<!-- div for descriptions for each type -->
		<div class = "quantity-description-wrapper" id="quantity-description"></div>
		<div class = "equation-description-wrapper" id="equation-description"></div>
        <!-- Putting jsPlumb-stuff for demo -->
        <div class="demo statemachine-demo" id="statemachine-demo">
        </div>

        <!-- Putting jsPlumb-stuff for demo  end-->
    </div>
	<!-- this is where the menu as well the node editor html code would be kept.
	Lets follow the hierarchy used earlier.-->
	<div id = "main" data-dojo-type="dijit/layout/BorderContainer" gutters="false">
	</div>
</body>
</html>
