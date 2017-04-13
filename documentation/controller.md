# Controller 
Controller, primarly takes inputs from the user (Author/Student) through various html based input elements in the node editor whose user interface is described in ui_model.md. Each of these inputs correspond to node properties like value, units, equation etc. Controller processes these inputs and updates the model. It also provides feedback to the user using Pedagogical Module(PM) based on his/her inputs. Further, based on model changes, it directs the view changes like node completeness, node connections in the model using "draw model" module.

Controller for node editor is mainly implemented by controller.js, con-author.js(Author Controller) and con-student.js(Student Controller). For now, since we only implemented author mode, information about con-student.js will be updated later in the documentation.

### Controller.js 
	
##### Summary
* Controller for the Node Editor, common to all modes			
* Handles selections from the student or author as he/she completes a model
* Inherited by con-student.js and con-author.js

##### Functionalities
* Initializes generic data objects common to student and author mode
	* genericControlMap, genericDivMap, widgetMap and selects which stores the controls, divs, widgets and select inputs common for author and student controllers.
				
* Sets up Node Editor for use:
	* Identifies the Node Editor widget and sets up the display.
				
* Initializes input handles: 
    * Sets up Node Editor handlers.
    * Attaches callbacks to certain events on node editor fields (basically event handling is done to node editor UI components) and these call backs are called input handlers.
    * Handlers are specific to the mode in which the model is open. Each of these handlers are in turn defined inside specific controllers (author/student). These include handleValue, handleUnits, handleEquation, handleInputs etc.
	* Also attaches button handlers inside node editor like plus, minus, times, divide, undo, equationDone.

* Handling opening of Node Editor:
    * Calls for initializing initial view and control settings inside editor which are defined by derived controllers.
	* Populates Node Editor fields 
	    * Sets the title of Node Editor based on node name
	    * Fetches value and units in case of a quantity node
    Converts equation from ids to names and populates the value in case of an equation node.
        * Initializes message widget and sets up timing for each feedback message inside the widget.
* Handling the closing of Node Editor:

    * State of node editor elements keep changing based on user inputs, feedback given (by using various colors) and also certain inputs are disabled/hidden in this process. A Node Editor has to be brought back to normal state for next node/ new node opening.
	* So, based on current mode and type of node, close editor functionality removes colors and enables corresponding elements.
	* It also hides "given equation input box" and enables the display of "equation input box".
	* It is also important to note that model changes happen as the user changes input, so we do not specifically save them at end before closing the editor.
				
* Applying directives: 
	* Based on user input and feedback given by pedagogical module in both modes, data object of directives is generated. These directives incorporate the input element, its attributes which need to updated/set. Applying these directives is one of the important functionality of this module.

* Creating expression nodes
					After an equation is provided by user for a node and sent to analysis, if there are any new nodes in the equation user provides, they are auto created and connections are updated once an equation is updated.

* Checking Doneness of the problem: (checkDone from main menu bar):
	* Clicking this checks for the completeness of the model. 
		A model is complete when it satisfies the following conditions
		* One variable is root
		* Every required variable is part of atleast one equation

	* A popup dialog is shown when model does not satisfy above conditions. Once Popup dialog.js is loaded, an instance of popupDialog can be used to show popup dialog box for any button. (* [PopUp Dialog](PopupDialog.md))
				

