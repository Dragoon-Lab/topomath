# Node Editor #

Node Editor is the user interface depicting a node's properties(refer model.md for more information about model json and what properties constitute nodes in a model). It gives the user (Author or Student) control to add new node properties or updating the existing node. User can further go ahead and delete a node from inside the Node Editor. Author will use Node Editor to create a new model and student can use Node Editor to solve a model.

### MVC for a Node Editor ###

* There are two views for a node editor, one which caters the Quantity Node and the other, an Equation Node. (refer nodes.md for more information about nodes and types of nodes)

* In the code base, we have AMD modules, js/model.js and js/controller.js(refere controller.md) which along with index.php implement the MVC for Node Editor.