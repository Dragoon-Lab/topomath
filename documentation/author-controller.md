# Author Controller #
### Summary ###
* Controller for the node editor in author mode	(in con-author.js)		
* Makes pedagogical desicions for author mode; handles selections
				from the author
* Inherits the main controller (in controller.js)

### Functionalities ###
* Author Pedagogical Module:
	* processes user inputs in author mode using four parameters nodeId, nodeType, value and validInput
	* returns an object which is used to produce appropriate feedback inside node editor each time an input is handled 

* Initializes data objects particular for author mode which include equation node controls, quantity node controls, resettable controls and author controls

* Also sets up author mode specific handles(for handling setting a root node, dynamic node, setting whether to show to a student) by attaching them as call backs to events on these input elements( like change events in initAuthorHandles function). 

* Defines author handlers 
	* Defined by names: handle description, handle root, handle dynamic, handle variable name, handle setStudent node, handle model selector, equation done handler.

	* handle description updates/sets the description for a node if it has not been used already for a different node in the same mode.

	* handle variable name updates/sets the variable name for a quantity node if it has not been used for another node. When a variable name is updated, this handler also updates the name in previous usages in equations of other nodes.

	* handle kind sets up the optionality of the node, optionality is whether the node is in equations or not and if it is part of equation, is it optional or required?

	* handle value, handle set student node , handle model selector, handle dynamic and handle root : dharani udpates this section 

	* handle units sets up units for a quantity node value.

	* equation done handler: sends the equation text for analysis where it is checked for any errors and then converted from names to ids(ids are used to represent node in the json object) and updates equation in the model.

* Defines initial view settings for node editor in author mode
    * Modifies/switches the display for author controls initially based on the data objects we already initialized in the author controller. This task is part of opening a Node Editor.

* Defines control settings for node editor in author mode
	* Applies settings appropriate for a new node. Retrieves and sets up values inside the node editor for elements if the current node has already a model in place. It defines controls based on the type of nodes, sets up the values for those controls, sorts out data in some cases like description and inputs where combo boxes are used to display all options from the model. As the existing data is retreived from the model, it calls PM to process the data and produces appropriate feed back by applying directives from PM.

				

