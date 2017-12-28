/*
 * The "dtest" library is a set of functions useful for building tests for Topomath.
 * See README.md for documentation.
*/

var testPath = require('./test-paths.js');
var MAX_DROPDOWN_IDS = 27 // The maximum number of dropdown IDs we'll support
//var lastDropdownID = 0;  // Tracks the last dropdown ID.  Should be reset to 0 for every new session
var popupDialogButtonCloseID = 0; // Tracks number of times the popup dialog dialog is opened.
var TIMEOUT = 5000;
var studentFieldNamesMap = {
    "description":"selectDescription",
    "variable":"variableInputboxStudent",
    "variableType":"variableType",
    "value":"valueInputbox",
    "units":"unitsSelectorStudent",
    "equation":"equationInputboxStudent"
}
////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions (used within the API)
////////////////////////////////////////////////////////////////////////////////////////////////////

function convertArrayToMap(assocArray){
    var newMap = {};
    for (var pair in assocArray) {
        newMap[assocArray[pair][0]] = assocArray[pair][1];
    }
    return newMap;
}

function getDate(){
    var date = new Date();
    var dd = date.getDate();
    var mm = date.getMonth()+1;
    var yyyy = date.getFullYear();
    var seconds = date.getTime();

    date = mm + '/' + dd + '/' + yyyy + '/' +seconds ;
    return date;
}

function getCssPropertyofElement(client, element, property){
    return client.element(element).getCssProperty(property).value;
}

function findIdbyName(client, nodeName){
    var notFound = true;
    var counter = 1;
    var result = null;
    var text = "";
    while(notFound && counter < MAX_DROPDOWN_IDS){
        try{
            text = client.getText('.quantityWrapper '+'#id' + counter + "Content");
            if(text.indexOf("=") !== -1){
                text = text.split("=")[0].trim();
            }
        }catch(err){}
        if(text === nodeName){
            notFound = false;
            result = counter;
            break;
        }
        counter++;
    }
    return result;
}

function findIdbyDescription(client, description){
    client.execute()
}

function getUrlRoot(){
    var testTarget = testPath.getTestTarget();
    if(testTarget === "devel"){
        return 'http://topomath.asu.edu/devel/index.php'
    }else if(testTarget === "demo"){
        return testPath.getLocalPath(); // Demo URL if any
    }else if(testTarget === "local"){
        return testPath.getLocalPath();
    }else{
        throw "Test target is not valid please check test-paths.js";
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported functions - The dtest API
////////////////////////////////////////////////////////////////////////////////////////////////////

// 1. Open a problem
exports.openProblem = function(client,parameters){        
    // parameters should be an associative array of arguments corresponding to the values needed to
    // build the URL
    var paramMap = convertArrayToMap(parameters);

    // required params
    var urlRoot = getUrlRoot();
    var user = "u="+(paramMap["user"] || getDate()); // defaults to the current date
    var problem = "&p=" + (paramMap["problem"] || getDate());
    var mode = "&m=" + (paramMap["mode"]);
    var section = "&s=" + (paramMap["section"] || "autotest");
    var activity; 
    if (paramMap["activity"] === undefined){
        activity = "&a=construction";
    } else if (paramMap["activity"]){
        activity = "&a=" + paramMap["activity"];
    } else {
        activity = ""
    }
    var folder = paramMap["folder"];
    if( folder == null){
        folder = "";
    } else {
        folder = "&f=" + folder;
    }
    var url = urlRoot + '?' + user + section + problem + mode + folder + activity;
    
    popupDialogButtonCloseID = 0;

    console.log("*************************");
    console.log("******************* URL *", url);
    console.log("*************************");
    
    client.url(url);
    client.waitForEnabled('#createQuantityNodeButton');
}

//Test Functions
exports.getHtmlOfNode = function(client, nodeName){
    var html = client.getHTML('#' + nodeName);
    return html;
}

exports.saveScreenshot = function(client, fs){
    var screenshot = client.saveScreenshot(); // returns base64 string buffer
    fs.writeFileSync('./screenshot.png', screenshot)
    // save screenshot to file
    client.saveScreenshot('./snapshot'+'.png');        
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. Menu bar functions

exports.menuCreateNode = function(client, nodeType){
    var nodeId = "#";
    if(nodeType === 'quantity'){
        nodeId += "createQuantityNodeButton";
    }else if(nodeType === 'equation'){
        nodeId += "createEquationNodeButton";
    }
    client.waitForEnabled('#createQuantityNodeButton');
    client.waitForEnabled('#createEquationNodeButton');
    client.click(nodeId);
}

exports.closeModel = function(client){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') === 'none';
    }, TIMEOUT);
    client.click("#doneButton");
    popupDialogButtonCloseID++;
}

exports.closeModelCancel = function(client){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') !== 'none';
    }, TIMEOUT);
    client.click("#popupDialogCancelButton");
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') === 'none';
    }, TIMEOUT);
}

exports.forceCloseModel = function(client){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') !== 'none';
    }, TIMEOUT);
    client.click("#dijit_form_Button_"+(popupDialogButtonCloseID-1));
}

exports.selectGraphTab = function(client) {
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') === 'none';
    }, TIMEOUT);
    client.click("#graphButton");
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// 3. Canvas functions

// Node manipulation

exports.openEditorforNode = function(client, nodeName, isID){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#nodeEditor", 'opacity') === 0;
    }, TIMEOUT);
    var id = nodeName;
    if(isID){
        id = '#'+id;
    }else{
        id = '#id'+findIdbyName(client, nodeName);
    }
    client.click(id);
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#nodeEditor", 'opacity') === 1;
    }, TIMEOUT);
}

exports.setNodeDescription = function(client, description){
    if(client.isVisibleWithinViewport('#descriptionInputbox')){
        client.setValue('#descriptionInputbox', description);
    }
    else if(client.isVisibleWithinViewport('#selectDescription')){
        client.click("#selectDescription");
        client.execute(function(description){
            var ele = dijit.byId('selectDescription');
            var options = ele.options;
            var _desc = description;
            var _id = options.filter(function(el){
                return el.label === _desc;
            }, _desc);
            ele.set("value",_id[0].value);
        }, description);
        client.click("#selectDescription");
    }
}

exports.setQuantityNodeVariable = function(client, variable){
    if(client.isVisibleWithinViewport('#variableInputbox'))
        client.setValue('#variableInputbox', variable);
    else if(client.isVisibleWithinViewport('#variableInputboxStudent')){
        client.execute(function(variable){
            var ele = dijit.byId('variableInputboxStudent');
            var options = ele.options;
            var _desc = variable;
            var _id = options.filter(function(el){
                return el.label === _desc;
            }, _desc);
            ele.set("value",_id[0].value);
        }, variable);
    }
}

exports.setQuantityNodeVariableType = function(client, variableType){
    client.click('#'+variableType);
}

exports.setQuantityNodeValue = function(client,value){
    client.waitForExist('#valueInputbox', TIMEOUT);
    client.setValue('#valueInputbox', value);
}

exports.setQuantityNodeUnits = function(client, unitsValue){
    if(client.isVisibleWithinViewport('#unitsSelector')){
        client.setValue('#unitsSelector', unitsValue);
    }else if(client.isVisibleWithinViewport('#unitsSelectorStudent')){
        client.click('#unitsSelectorStudent');
        client.execute(function(unitsValue){
            var ele = dijit.byId('unitsSelectorStudent');
            var options = ele.options;
            var _desc = unitsValue;
            var _id = options.filter(function(el){
                return el.label === _desc;
            }, _desc);
            ele.set("value",_id[0].value);
        }, unitsValue);
        client.click('#unitsSelectorStudent');
    }
}

exports.setQuantityNodeRoot = function(client){ 
    client.click('#rootNodeToggleCheckbox');
}

exports.nodeEditorDone = function(client){
    client.click('#closeButton');
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#nodeEditor", 'opacity') === 0;
    }, TIMEOUT);
}

exports.clickInputSelector = function(client){
    client.click("#inputSelector");
}

exports.setInputSelector = function(client, inputSelector){
    client.setValue('#inputSelector', inputSelector);
}

exports.getNodeDescription = function(client){
    return client.getValue('#descriptionInputbox').trim();;
}

exports.getNodeVariable = function(client){
    return client.getValue('#variableInputbox');
}

exports.getNodeVariableType = function(client){
    var unknownType = client.element('#unknownType');
    var parameterType = client.element('#parameterType');
    var dynamicType = client.element('#dynamicType');
    if(unknownType.isSelected()){
        return "unknown";
    }else if(parameterType.isSelected()){
        return "parameter";
    }else if(dynamicType.isSelected()){
        return "dynamic";
    }
}

exports.getNodeValue = function(client){
    return client.getValue('#valueInputbox');
}

exports.getNodeUnits = function(client){
    return client.getValue('#unitsSelector');
}

exports.getNodeEquation = function(client){
    if(client.isVisibleWithinViewport("#equationInputbox")){
        return client.getValue("#equationInputbox");
    }else if(client.isVisibleWithinViewport("equationInputboxStudent")){
        return client.getValue("#equationInputboxStudent");
    }
}

exports.pressPlusButton = function(client){    
    client.click("#plusButton");
}

exports.pressMinusButton = function(client){    
    client.click("#minusButton");
}

exports.pressMultiplyButton = function(client){    
    client.click("#timesButton");
}

exports.pressDivideButton = function(client){    
    client.click("#divideButton");
}

exports.undoExpression = function(client){
    client.click("#undoButton");
}

exports.checkExpression = function(client){
    client.click('#equationDoneButton');
}

exports.isRoot = function(client){
    return client.element('#rootNodeToggleCheckbox').isSelected();
}

exports.setNodeExpression = function(client, expression){
    if(client.isVisibleWithinViewport('#equationInputbox')){
        client.setValue('#equationInputbox', expression);
    }else if(client.isVisibleWithinViewport('#equationInputboxStudent')){
        client.setValue('#equationInputboxStudent', expression);
    }
}

exports.checkRootNode = function(client){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') !== 'none';
    }, TIMEOUT);
    var errors = client.getHTML("#popupDialogContent li", false);
    var result = errors.find(function(err){
        return err === 'No quantity is marked as Sought';
    })
    if(result === "No quantity is marked as Sought") return false;
    else return true;
}

exports.checkVariableEquationMap = function(client){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') !== 'none';
    }, TIMEOUT);
    var errors = client.getHTML("#popupDialogContent li", false);
    var result = errors.find(function(err){
        return err === 'Following variables are required, but unused by equations - Tdan, Rdan, Diff';
    })
    if(result === 'Following variables are required, but unused by equations - Tdan, Rdan, Diff') return false;
    else return true;
}

exports.getNodeColor = function(client, nodeName, isID){
    if(isID){
        nodeName = "#" + nodeName;
    }else{
        nodeName = "#id"+findIdbyName(client, nodeName);
    }
    return getCssPropertyofElement(client, nodeName, 'background-color');
}

exports.getNodeDescriptionColor = function(client, nodeName, isID){
    if(isID){
        nodeName = "#" + nodeName;
    }else{
        nodeName = "#id"+findIdbyName(client, nodeName);
    }
    var element = nodeName + '_description';
    return getCssPropertyofElement(client, element, 'background-color');
}

exports.getNodeDescriptionContent = function(client, nodeName, isID){
    if(isID){
        nodeName = "#" + nodeName;
    }else{
        nodeName = "#id"+findIdbyName(client, nodeName);
    }
    var element = nodeName + '_description';
    return client.getText(element);
}

exports.deleteNodeByButton = function(client){
    client.click("#deleteButton");
}

exports.deleteQuantityNodeByRightClick = function(client, nodeName){
    var id = findIdbyName(client, nodeName);
    client.rightClick('#id'+id,50,10);
    client.click('#dijit_Menu_'+(id-1));
}

exports.deleteEquationNodeByRightClick = function(client, nodeName){
    client.rightClick("#"+nodeName,50,10);
    nodeName = nodeName.replace("id","");
    client.click('#dijit_Menu_'+nodeName);
}

exports.getNodeFieldColor = function (client, field) {
    var returnObj =  client.execute(function(studentFieldNamesMap, field){
                        var ele = dijit.byId(studentFieldNamesMap[field]);
                        return ele.domNode.style.backgroundColor;
                    }, studentFieldNamesMap, field);
    return returnObj.value;
}

exports.getNodeFieldValue = function (client, field) {
    var returnObj = client.execute(function(studentFieldNamesMap, field){
                        var ele = dijit.byId(studentFieldNamesMap[field]);
                        var _returnObj = ele.options.filter(function(el){
                            return el.selected == true;
                        });
                        return _returnObj[0].label;
                    }, studentFieldNamesMap, field);
    return returnObj.value;
}

exports.getGraphMessage = function (client) {
    var returnObj = client.execute(function (){
        var ele = dojo.byId('solution');
        debugger;
        return ele.children[1].children.SliderPane.children.solutionMessage.children[0].children[0].children[0].innerText;
    });
    console.log(returnObj);
    return returnObj.value;
}

exports.getPopupMessage = function(client, msg){
    client.waitUntil(function(){
        return getCssPropertyofElement(client, "#popupDialog", 'display') !== 'none';
    }, TIMEOUT);
    var errors = client.getHTML("#popupDialogContent li", false);
    if(errors === msg) return true;
    else return false;
}