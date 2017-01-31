<?php
require "error-handler.php";
require "db-login.php";

$mysqli = mysqli_connect("localhost", $dbuser, $dbpass, $dbname)
			or trigger_error('Could not connect to database', E_USER_ERROR);

$solutionGraph = mysqli_real_escape_string($mysqli,$_POST['model']);
$sessionId = $_POST['session_id'];

$query="REPLACE INTO solutions(session_id,solution_graph) VALUES ('$sessionId','$solutionGraph' )";
$result=$mysqli->query($query)
  or trigger_error("author_save insert failed: " . $mysqli->error);

mysqli_close($mysqli);  

?>