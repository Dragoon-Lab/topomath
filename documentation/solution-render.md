# Rendering Solution
Solution in TopoMath means the solution of the model created by the user.
It can be shown in two ways -- Graph (plotting the values by solving the system of equations)
and Table (showing the numeric values). Solution is calculated using the [equation solver](equation-solver.md) 
module. In the code there are two solution objects that are calculated - activeSolution and authorSolution

* activeSolution -- it is calculated as the solution of the active model
* authorSolution -- it is calculated from the author model only in the student mode, 
where we provide feedback to the student.

A system is solved by calling the solver module with the system of equations given by the user. These steps
are followed when solving the system --

* get the equations enetered by the users by iterating over each node.
* parse the equations.
* preprocess them to see if all the equations have atleast 1 variable.
* change known variables with their appropriate values, like parameters with their value from the model.
and prior value of dynamic node with the value of the node in the previous time step.
* call the solver with these equations for every time step.
* create an array of values for each time step and return the solution object.

Graphs are of two different types --

* Graph vs time -- solving the system of equation for every time step.
* Graph vs Parameter -- solving the system of equations by varying one of the parameter value.
In the code this is refered as the static graph. It is only calculated if the Graph vs time is
constant, that is none of the values of the system do not change with time (static).

When the values of the model are static, then we also create an `authorStaticSolution` object in the
student mode.

All the entities of solution like -- graphs, tables, and sliders come from separate files in the code.
They follow the structure, where constructor sets the solution objects that would be needed by the
file and there is an `init` function that takes care of all the rendering. So if we create an object, it
needs the solutions, and then the object will call the init function that will render everything for
the solution. `_getHtml` function creates the html string which can be directly appended to the appropriate div.

## Implementation

* [equation.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/equation.js)
Acts as a wrapper file between external math-solver and internal user model, to calculate the solution
at each time step, and by changing the value of the parameter for graph vs parameter.
* [render-solution.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/render-solution.js)
It is the child object of calcuation.js. Creates the appropriate solution objects (active, author
and authorStatic), creates the graph, table and slider objects, handles all the events fired from the 
solution, like changing the values for the sliders, changing the tabs.
* [calculations.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/calculation.js)
Parent object of render-solution.js. Acts as a wrapper over equation.js (which interacts with math-solver).
Initializes and creates all the solution objects which can be used by different graph, and table objects for
actual rendering.
* [chart.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/chart.js)
Parent of graph.js and table.js. Contains code that are used to create parts of the graph and test whether
the solution is valid or not. Basically, contains the common code for graph and table objects.
* [graph.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/graph.js)
Child object of Creates the graph vs time and graph vs parameter. The active and author solutions are passed to it
while creating object and init function renders the both the graphs in appropriate div.
* [table.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/table.js)
Creates the table using the active solution, so that the current user can see the exact value. Follows the 
same structure explained earlier.
* [sliders.js](https://github.com/Dragoon-Lab/topomath/blob/master/www/js/sliders.js)
Creates the sliders and takes care of the event by updating the text box with appropriate value. Any change
to the textbox, is handled in render-solution.
