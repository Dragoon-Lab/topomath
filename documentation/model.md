# Model Object #
Model is [JSON object](http://www.json.org/) which is used to store the nodes created by the user. TopoMath is a comparison based tutoring system, where the student's answers will be compared to an already constructed model. We call it the authored model.

Both models contain nodes and these nodes have node properties that were filled by the author or a student. The mnode object looks like this -

```javascript
{
    "authorModelNodes": [
        {
            "ID": "id1",
            "variable": "Rabbits",
            "description": "The number of rabbits in the population",
            "type": "quantity",
            "accumulator": true,
            "units": "rabbits",
            "value": 24, 
            "root": true,
            "genus": "required",
            "color": "", 
            "attemptCount": {
            },
            "position": [{
                "x": 500,
                "y": 200 
            }, {
                "x": 350,
                "y": 400 
            }],
            "status": {}
        },
		{
            "ID": "id4",
            "explanation": "The number of births is the number of rabbits times the birth probability",
            "type": "equation",
            "accumulator": false,
            "equation": "id3 = id1 * id2",
            "links": [{"ID": "id1"},{"ID": "id2"},{"ID": "id3"}],
            "root": false,
            "genus": "required",
            "color": "",
            "attemptCount": {
            },
            "position": [{
                "x": 700,
                "y": 200
            }],
            "status": {}
        },
...
```

The properties of a node are - 

* ID - node unique identifier. Starts with "id" string followed by a number.
* Variable (Name) - Name of the quantity. This is only available for quantity nodes and not for equation nodes. For example Rabbits
* Description - Extended node string to give a description for the node. This will be used to show the dropdown in Student node editor.
* Type - Quantity or equation node.
* Accumulator - If the node is dynamic node, that is if it's value changes over time.
* Units - Units of the quantity.
* Value - Value of the quantity node.
* Root - Whether is the starting node which a student should make to construct the model while using Target Node Strategy.
* Links - The quantity nodes that are linked through the equation node. It is an array of objects of the form {"ID": "id1"}.
* Genus - Whether a node is necessary to make the model or not. The values it takes are required (necessary to be used in the model), allowed (a student may or may not use it in the model) or irrelevant (just a distractor node for the student).
* Color - Color for a node. Color is used to show either the border color in a quantity node or background color in equation node.
* Attempt count - Student is allowed to delete a node, so the attempts that he makes are stored in the models authored nodes. These would be used for handling the students learning in the future.
* Position - X and Y coordinates where a node should be placed. A dynamic quantity node with an initial value has two UI nodes, so the position field is an array which holds position for both the nodes to be shown to the user.
* Status - This will hold the status of the user's model (both student and author), as to whether the field is correctly entered or not. For student it will show whether his answer was correct, incorrect or given. For author it would show that value passes certain sanity checks , like value can not be characters, variable name is unique.

### Implementation ###

* [model.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/model.js)
This file implements the getters and setters for each type of model, loading of the models and the maintains the user access to the data. Like ensuring that student part of the code gets no access to the author nodes. It can not change anything in them. 
There are many other functions like adding nodes, loading model (this function does the sanity checks) and gives access to the model level parameters, like global position starting point, counter to be apprended after the id of a node.
