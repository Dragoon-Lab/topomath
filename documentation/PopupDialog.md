## Popup Dialog

Popup dialog has 2 functions that could be applied on it's instance. 

* showDialog
This displays one button Cancel by default on the right bottom.
- title - String to set popup dialog title,
- popupContent - html String to be displayed in content,
- buttonsArray - buttons to be displayed on the dialog
  Format of button - {<text to be displayed on button>:<function that would be called on click of button},
- cancelTitle - Optional Argument to set the Cancel Button text

* destroydialog - This takes care of detachating handlers for the buttons on the popupdialog, resets content
