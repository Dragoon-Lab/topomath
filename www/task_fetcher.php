<?php
require "error-handler.php";
require "db-login.php";

$mysqli = mysqli_connect("localhost", $dbuser, $dbpass, $dbname)
			or trigger_error('Could not connect to database', E_USER_ERROR);

// problem is mandatory
$problem = mysqli_real_escape_string($mysqli, $_REQUEST['p'])
			or trigger_error('Problem name not supplied.', E_USER_ERROR);
$problem = strlen($problem) > 50 ? substr($problem, 0, 50) : $problem;

//user, section, mode and folder are mandatory for fetching model from db
((isset($_REQUEST['u']) && !empty($_REQUEST['u'])) ?
	($user = mysqli_real_escape_string($mysqli, $_REQUEST['u'])) : ($user = ''));
((isset($_REQUEST['m']) && !empty($_REQUEST['m'])) ?
	($mode = mysqli_real_escape_string($mysqli, $_REQUEST['m'])) : ($mode = ''));
$section = ((isset($_REQUEST['s']) && !empty($_REQUEST['s'])) ?
			mysqli_real_escape_string($mysqli, $_REQUEST['s']) : '');
$folder = ((isset($_REQUEST['f']) && !empty($_REQUEST['f'])) ?
			mysqli_real_escape_string($mysqli, $_REQUEST['f']) : '');
$restartProb = ((isset($_REQUEST['rp']) && $_REQUEST['rp'] == 'on')) ? true: false;

/*
* Author mode logic is to get a problem from the database.
* There will be a folder precedence for this whose logic 
* is yet to be written.
* Student mode it was if the folder is not provided then check
* in database for the problem, mode, user, section. Else get a
* a published problem.
*/
/*
* For Author mode there is a precedence of the folder
* First we fetch the problem using section and mode only
* TODO -- There is a user precedence logic that is missing here
* I dont remember the use case as well the as the UI that we created
* As far as I remember the problem was to fetch problem 
* using group in forums, which I think is not present in Drupal website
* ~ Sachin
* Update - there is a change from the above comments in first if check
* where I think I found the use case of user precedence. I am not sure
* so I am still leaving the TODO as well as the new comment there ~ Sachin
*/
if($mode == "AUTHOR" || $mode == "SEDITOR"){
	$query = "";
	if($folder != ""){
		// this is with the user precedence logic I think
		// where the problem needs to be get based on the folder
		// so that teams can work on the same model. ~ Sachin
		$query = sprintf(get_query('problem_without_user_fetch'), $mode, $section, $problem, $folder);
	} else {
		$query = sprintf(get_query('problem_without_folder_fetch'), $user, $mode, $section, $problem);
	}
	get_model($mysqli, $query);
} else if(!$restartProb){
	if($folder != "")
		$query = sprintf(get_query('problem_fetch'), $user, $mode, $section, $problem, $folder);
	else
		$query = sprintf(get_query('problem_without_folder_fetch'), $user, $mode, $section, $problem);
	get_model($mysqli, $query);
}


//no previous data was found, that means there is no old work in database
//check if it is non published problem (with a folder) for the problem under the AUTHOR mode
if($folder != "" && $section != ""){
	$query = sprintf(get_query('problem_without_user_fetch'), "AUTHOR", $section, $problem, $folder);
	get_model($mysqli, $query);
	// it came here that means no data was found as get_model has an exit statement
	$statusCode=204;
	if(function_exists('http_response_code'))
		http_response_code($statusCode);
	else
		header('HTTP/1.0' . $statusCode +  ' No Content');
} else {
	/*
	* folder or section is missing, look for publisdhed problem
	* or no data was found in the database for custom problem
	*/
	$host = $_SERVER['HTTP_HOST'];
	$uri = rtrim(dirname($_SERVER['PHP_SELF']),'/\\');
	// REGEX: Replace any character other than alphabat, number, underscore or hypen with underscore 
	$problem = preg_replace('/[^A-Za-z0-9_\-]/', '_', $problem);
	$extra = 'problems/' . $problem . '.json';
	/* Redirect to a page relative to the current directory.
	   HTTP/1.1 requires an absolute URI as argument to Location. */
	if(isset($_SERVER['HTTPS'])){
		header("Location: https://$host$uri/$extra");
	} else {
		header("Location: http://$host$uri/$extra");
	}
}
/*
* return query based on the type you need.
* one needs to do sprintf and give it needed values in the order
* user, mode, section, problem, folder. If any of them are missing
* then the next value will take that index. For example, if user is missing
* then mode will be the first value.
*/
function get_query($type){
	$query = array();
	$query['problem_fetch'] = 'SELECT sol.solution_graph FROM session AS s JOIN solutions AS sol USING (session_id) WHERE s.user = "%s" AND s.mode = "%s" AND s.section = "%s" AND s.problem = "%s" AND s.folder = "%s" ORDER BY s.time desc LIMIT 1;';
	$query['problem_without_user_fetch'] = 'SELECT sol.solution_graph FROM session AS s JOIN solutions AS sol USING (session_id) WHERE s.mode = "%s" AND s.section = "%s" AND s.problem = "%s" AND s.folder = "%s" ORDER BY s.time desc LIMIT 1;';
	$query['problem_without_folder_fetch'] = 'SELECT sol.solution_graph FROM session AS s JOIN solutions AS sol USING (session_id) WHERE s.user = "%s" AND s.mode = "%s" AND s.section = "%s" AND s.problem = "%s" ORDER BY s.time desc LIMIT 1;';
	$query['problem_without_user_folder_fetch'] = 'SELECT sol.solution_graph FROM session AS s JOIN solutions AS sol USING (session_id) WHERE s.mode = "%s" AND s.section = "%s" AND s.problem = "%s" ORDER BY s.time desc LIMIT 1;';
	return $query[$type];
}

function get_model($mysqli, $query){
	$result = $mysqli->query($query);
	if($row = $result->fetch_row()){
		header("Content-type: application/json");
		print $row[0];
		mysqli_close($mysqli);
		exit;
	}
}
?>
