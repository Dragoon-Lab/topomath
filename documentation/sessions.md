# Sessions #

First, some definitions. We distinguish between the LMS and the tutor:

* __tutor__ is the JavaScript code for TopoMath. It is invoked
via the URL `index.php`. On startup, the URL includes name-value pairs
of the [major mode](major-modes.md), user name, section, 
problem name, and (optionally) the group name.
*  __LMS__ or Learning Management System refers to the "outer loop" that
invokes the tutor system for a particular user, section, problem, group. 
It could is a not a full LMS like, but a drupal based website which helps teachers
to maintain students, create assignments, helps authors make models and use 
them in there respective classes.

For the tutor, we distinguish between two usage modes:

* __author__ which corresponds to the AUTHOR major mode. In this mode,
the user modifies only a problem's "solution graph."
* __student__ (forth-coming) which includes [major modes](major-modes.md) COACHED, STUDENT, 
and TEST. In this usage mode, the user modifies 
the "student graph" which contains the model they are constructing.
The tutor compares the student graph with the "solution graph" that is
associated with that problem.

Also, there are two classes of solution graphs:

* __published__ or __static__ problems provided by the tutoring system. 
These are stored as files in `www/problems/` and are uniquely identified by
their name. They are available to all users
(no section restrictions), and one can assume that the LMS has a list of
these problems. Students select published problems via the LMS. 
* __custom__ or __dynamic__ problems are authored
by users. These problems are stored in the database only and would be managed
using TopoMath LMS.

## Session ID ##

Associated with each instance of TopoMath will be a unique session identifier. 
A page reload will generate a new session ID.   Opening more than one problem 
(or renaming a problem) *may* occur during a given session.

The format for the session ID variable `sessionId` will be a string of length 50.
It is convenient to generate `sessionId` by applying a hash function
to the user name and section name and adding a timestamp.  An example
JavaScript implementation can be found in Andes:  see the function
`FNV1aHash` and the code that follows it in the file
[`web-UI/andes/startup.js`](https://github.com/bvds/andes/blob/master/web-UI/andes/startup.js).
In Andes, we found it convenient to include the session ID as an HTTP
header when communicating between client and server.

## Database tables ##

**`session`**: this table lists the sessions.

*	`session_id` - primary key for this table; it is generated by the client.
*	`mode` - Value is a [major mode](major-modes.md)
*	`time` - this will be the server time. This can be set using `CURRENT_TIMESTAMP` in mySQL.
*	`user` - user name (string)
*	`section` - section name (string).
*   `problem` - problem name (string).  May be NULL if `mode` is AUTHOR.
*	`group` - For custom problems (string).  Otherwise it will be NULL.

This table analogous to the table `PROBLEM_ATTEMPT` in Andes; see
[create_PROBLEM_ATTEMPT.sql](https://github.com/bvds/andes/blob/master/LogProcessing/database/create_PROBLEM_ATTEMPT.sql).
The Andes table can be used to see how the `session` table should be
formatted.  Note that the column names of this table correspond to the [list of variable names](sessions.md). 

**`solutions`** table stores solution graphs for custom problems as
well  as student work on any problem (custom or published).
This table has columns:

* `session_id` - see above
* `solution_graph` -  the [model in JSON format](json-format.md)
* `time` - a timestamp.

The primary key for the table is the `session_id`:  only one copy of
the solution persists for a given `sessionId`.

The share bit determines whether a custom problem can be viewed --
in either author or student mode -- by other members of a section. 
If `false`, then only the author may view the problem. If `true`, then
all students in a section may view that problem. Custom problems cannot
be viewed by users outside of a section.

## Retrieving completed problems from the database ##

Problem solutions are saved in the `solutions` table; you will need to reference the `session` table as well to 
get a solution for a specific problem and user. You can use a query like the following to access 
this information:

    SELECT S.user, S.problem, SOL.time, SOL.solution_graph FROM session S, solutions SOL 
        WHERE S.session_id = SOL.session_id 
        AND S.user = '<USERNAME>' 
        AND S.problem = '<PROBLEM-NAME>' 
        AND S.section = '<SECTION-NAME>' 
        AND S.group = '<GROUP-NAME>' 
        AND SOL.time LIKE '<YYYY-MM-DD>%';

Replace `<USERNAME>`, `<PROBLEM-NAME>`, *et cetera* with the appropriate 
values. You can omit any of these search constraints if you do not need them.

To place a a completed model on the server to access it as a regular model, 
retrieve the JSON code from the database using the above method. You can format 
it to be more readable by going to [http://jsonlint.com](http://jsonlint.com), pasting the code in the
entry box, and clicking "Validate". Then copy the formated code into a
new file in the `www/problems/` directory.  Next you will need edit
the file, wrapping the json with a new object containing only a member `task`:

    <object> -> {task: <object>}

Then you can add this file to the git repository.

You can also use the script `task_fetcher.php` to retrieve a problem
from the database.  **Need to add documentation for this.**

## Variable names identifying users and problems ##

In this section, we define variable names that identify problems and
users.  We specify associated short variable names to be used
in HTTP requests.  Eventually, we may want to switch over to using
using abstract IDs for some quantities so that we can change 
user, section, and problem names.
(See the way things are done in phpBB for an example.)

Here is a starting list.  Note that some items should not have an id.
The categories are *name*, *short name*, *id*, *short id*:

- user, u userId, uid
- section, s, sectionId, sid
- problem, p (can use sessionId for id)
- folder, f
- solutionGraph, sg  (for serialized solution graph)
- mode, m (value is a [major mode](major-modes.md))
- sessionId, x (see [Logging Format](logs-structure.md))
- restartProblem, rp (if "on", tells TopoMath to load the problem with the original student model)

For mysql database table column names, we will replace camelCase with
underscores: `sessionId` -> `session_id`, `userId` -> `user_id`, *et cetera*.
Quantities in  categories *name* and *short name* are strings, while
*id* and *short id* represent integers.

## Access to the custom problem solution graphs ##

To retrieve custom problems, or previous work, the script
`task_fetcher.php` looks for previous student work on a problem (if
student name is supplied), then
looks for a matching problem in the `solutions` table, then attempts
to find a matching published problem. 
Calls to `task_fetcher.php` use the GET method and must include a problem name, and may
include student name and section name or  group name and section
name.  Group name and section are
mandatory for a match to a custom problem.
We eventually want to switch to using `sessionId` to access custom problems.

## Custom Problem Selection ##

The server script `available_problems.php` retrieves all problems available
to the student giving, `sessionId`, `group`, `problem`.
(in xml or json format). It is called using the GET method with the user 
name and section (and maybe group) supplied.

Either the LMS or the tutor itself can request this list.
Note that the response includes a list of all problems that the
user has previously worked on, either as a student or as an author.

In the LMS, the student may be supplied with a list of 
available custom problems via a call to `available_problems.php`.
The student may choose one of
the existing problems, or, if they are in author mode, they
may choose a new problem name.

## Author Mode ##

In author mode, the LMS *may* choose to display only problems that the user
has themselves authored, along with the ability to create a new
problem name. The author can choose to share his problem with other
students to solve in  STUDENT, TEST, or COACHED mode.  This is done by enabling
the "share" option.  The author needs to be able to define a node as 
a "first node" for the coached mode target node strategy to work;
these could be set at export or by a toggle in the node editor.

In author mode, the tutor provides a menu where a student may
**merge** an existing solution with their solution. The solutions
are provided by the `available_problems.php`. Also, the tutor UI
has a switch that allows the user to change the share bit.

The mechanism for a user to "fork" an existing problem that 
they have authored is the following:  In the LMS, the student chooses a 
new problem name. This opens a new empty problem. 
They then use the **merge** menu to load the existing problem of interest. 
This creates a copy of
an existing problem with a new name. If student *A* chooses to open a
problem authored by student *B*, then that creates an identical problem
(with the same name) owned by student *A*.

The tutor will also have a "save as" button which allows the
author to rename the problem they are working on. This functionality
is not strictly needed but it fits better with the behavior of
many desktop computer applications and will probably be more
intuitive for most users.

Finally, the tutor needs a method for allowing the author to
create the "predefined" nodes for a problem. This would be some
sort of switch in the UI?

## Student Mode - Under Construction ##

In this mode, the user only modifies the student graph. This mode
is pretty restrictive: the student may not rename a problem or merge other
solutions with their solution or share their solution with other students.

If the student wants to "start over" on a problem, they may erase
all their current work on that problem. For convenience, we may provide
a button in the tutor for this purpose. For instance, the tutor could prompt
the student when a problem is opened.

## Read-only access for instructors and authors ##

We have the use cases:

* Instructors need to be able to view solution graphs for all problems in
a section, not just ones marked "shared".
* Instructors need to be able to view student graphs for all members of the section.
* Authors need to be able to view student graphs associated with all problems
that they have authored.

This is accomplished in the tutor using the `student_graphs.php` script.
We need to decide on the behavior of the tutor for this:

* Does it open a separate window or is it shown in the main window?
* Is this available in student mode, author mode or both?
* What happens to any currently loaded student graph for this problem?
* Is there some mechanism for closing the problem?
* If it is "Read-only" does that mean that student graph is frozen,
or that changes are not logged on the server?
* What, precisely, gets logged?

In all cases, the author/instructor must be able to open the
discussion tab for all nodes and add to the discussions.
