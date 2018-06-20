# Student Controller #
### Summary ###
* Controller for the node editor in student mode (in [con-student.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/controller.js))
* Renders pedagogical decisions taken by pedagogical module for student mode

### Functionalities ###
* Student Pedagogical Module (in [pedagogical-module.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/pedagogical-module.js)):
	* processes user inputs in student mode using four parameters nodeId, nodeType, value and validInput
	* returns an object which is used to produce appropriate feedback inside node editor, to the nodes on canvas (in feedback mode) each time an input is handled 
	* feedback returned is in the form of directives which contain status -correct/incorrect/demo, message to the user, disable state, value of the node attribute.
	* in no-feedback mode, just the next attribute to be filled is set and status, message about the correctness are not given.
	* Student is given 2 attempts to create the nodes in model. Upon each failure, assistance count is incremented.
		* If the answer is correct for an attribute, that attribute is disabled and further attributes are shown to student. 
		* If the answer is incorrect, assistance count is incremented and student is given another chance to give answer. If this answer is also incorrect, the correct answer is shown with proceeding to further nodes.	

* Initializes data objects particular for student mode which includes equation node controls, quantity node controls, resettable controls. Populates descriptions, variable names, units as dropdowns with author values.

* Defines student handlers 
	* Defined by names: handle description, handle value, handle variable name, handle variable type, handle units, handle inputs, equation done handler.

	* handle description sets the description of a student node for nodes relevant to the model. This information is provided using the pedagogical module. This also maps author ID of the author node to this student node.

	* handle variable name sets the variable name for a quantity node based on feedback from author.

	* handleVariableType sets the value of a quantity node depending on the Variable type. Variable Type can be Unknown, Parameter and Dynamic. Selecting Unknown does not require the value for a node, parameter requires a value to be present whereas dynamic requires value to be present. Selecting dynamic adds a prior node with initial value equal to value of the node. Variable type Unknown sets value to empty string.

	* handle value is checked for number type and if the value for the node exists in parameter or dynamic variable type. It is then verified with author's value.

	* handle units sets up units for a quantity node value upon verificaion from author.

	* equation done handler: sends the equation text for analysis where it is checked for any errors and then converted from names to ids(ids are used to represent node in the json object) and updates equation in the model upon verification from author. If there are any unknown variables, these are detected and student is alerted for using these. These will not be regarded as incorrect attempt. 

* Defines control settings for node editor in student mode
	* Applies settings appropriate for a node. Retrieves and sets up values inside the node editor for elements if the current node has already a model in place. It defines controls based on the type of nodes, sets up the values for those controls, sorts out data in some cases like description and inputs where combo boxes are used to display all options from the model. As the existing data is retreived from the model, it calls PM to process the data and produces appropriate feed back by applying directives from PM.
