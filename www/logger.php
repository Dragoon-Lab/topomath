<?php
/*
  Start up sessions and log various messages

  This script is stateless, so we don't need to worry about php sessions
*/

// Using trigger_error() so logging level and destination can be modified.
require "error-handler.php";


//connect to database
require "db-login.php";
$mysqli = mysqli_connect("localhost", $dbuser, $dbpass, $dbname)
  or trigger_error('Could not connect to database.',E_USER_ERROR);

$sessionId = $_REQUEST['x'];
$method = $_REQUEST['method']; // system generated choices
$message =  $_REQUEST['message'];
//$folder = '';
//$folder = ((isset($_REQUEST['f']) && !empty($_REQUEST['f'])) ?
//      mysqli_real_escape_string($mysqli, $_REQUEST['f']) : '');
/*
   Work-around in case magic quotes are enabled.
   See http://stackoverflow.com/questions/220437/magic-quotes-in-php
 */
if (get_magic_quotes_gpc()) {
    $message = stripslashes($message);
}

if($method == 'start-session'||$method == 'rename-problem'){
  /*
    Create a new session 
    In this case, the message contains a list of session parameters,
    which we decode.
  */
  
  $x = json_decode($message) or
    trigger_error("Bad json " . json_last_error_msg());
  foreach($x as &$value){
    $value =  mysqli_real_escape_string($mysqli, $value);
  }
  $problem = isset($x->p)?"'$x->p'":"DEFAULT";
  $folder = isset($x->f)?"'$x->p'":"DEFAULT";
  
  // This should give an error if session id already exists.
  // Need to verify how error is handled.
  $query = "INSERT INTO session (session_id, mode, user, section, problem, folder) VALUES ('$sessionId','$x->m','$x->u','$x->s',$problem, $folder)";
  echo $query;
  // echo "Starting new session query $query\n";
  $mysqli->query($query)
    or trigger_error("Session creation failed: " . $mysqli->error);

} else {

  /* 
     Save log message, assuming session exists.
  */
  $id = isset($_REQUEST['id']) ? $_REQUEST['id'] : "";
  $message = mysqli_real_escape_string($mysqli, $message);

  $query = "INSERT INTO step (session_id,method,message,id) VALUES ('$sessionId','$method','$message','$id')";
  $mysqli->query($query)
    or trigger_error("Logging failed.". $mysqli->error);
}
mysqli_close($mysqli);
?>
