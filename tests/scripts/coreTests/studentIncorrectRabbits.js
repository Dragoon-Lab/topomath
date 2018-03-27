// Set up initial variables


// Import Library
var dtest = require('../library.js');
var atest = require('../assertTestLib.js');
var assert = dtest.assert;

var INCORRECT_COLOR = "rgb(255, 128, 128)";
var DEMO_COLOR = "yellow";
var PERFECT_COLOR = 'lightgreen';

describe("Test Student mode - First and Second Failure", function() {

    dtest.openProblem(browser,[
        ["mode","STUDENT"],
        ["section","login.html"],
        ["folder","regression-test"],
        ["problem","Author-Rabbits2"]]);

    describe("Create and Verify Nodes", function(){
        it("Should create Parameter Quantity Node - Birth Probability Incorrectly in Attempt 1", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "The number of additional rabbits per year per rabbit" );
            dtest.setQuantityNodeVariable(browser, "Births");
            //dtest.setQuantityNodeVariableType(browser, "parameterType");
            //dtest.setQuantityNodeValue(browser,"0.03");
            //dtest.setQuantityNodeUnits(browser,"rabbits");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Parameter Quantity node is incorrect in Attempt 1", function(){
            dtest.openEditorforNode(browser, "id6", true);
            atest.checkNodeFieldColors("", INCORRECT_COLOR, "", "", "");
            dtest.nodeEditorDone(browser);
        })

        it("Should edit Parameter Quantity Node - Incorrect in Attempt 2", function(){
            dtest.openEditorforNode(browser, "id6", true);
            dtest.setQuantityNodeVariable(browser, "Rabbits");
            //dtest.setQuantityNodeValue(browser,"2.5");
            //dtest.setQuantityNodeUnits(browser,"No Units");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Parameter Quantity node is Incorrect in Attempt 2", function(){
            dtest.openEditorforNode(browser, "id6", true);
            atest.checkNodeFieldColors("", DEMO_COLOR, "", "", "");
            atest.checkNodeFieldValues("", "Birth Probability", "", "", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Unknown Quantity Node", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "The number of rabbits born per year");
            dtest.setQuantityNodeVariable(browser, "Rabbits");
            //dtest.setQuantityNodeVariableType(browser, "unknownType");
            //dtest.setQuantityNodeUnits(browser,"rabbits");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Unknown Quantity node - Rdan is Incorrect in Attempt 1", function(){
            dtest.openEditorforNode(browser, "id7", true);
            atest.checkNodeFieldColors("", INCORRECT_COLOR, "", "", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should edit Unknown Quantity Node Correctly in Attempt 2", function (argument) {
            dtest.openEditorforNode(browser, "id7", true);
            dtest.setQuantityNodeVariable(browser, "Births");
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.setQuantityNodeUnits(browser,"1/year");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect Unknown Quantity Node has correct values in Attempt 2", function (argument) {
            dtest.openEditorforNode(browser, "id7", true);
            atest.checkNodeFieldColors("", PERFECT_COLOR, "", PERFECT_COLOR, "");
            atest.checkNodeFieldValues("", "Births", "", "1/year", "");
            dtest.nodeEditorDone(browser);
        })
        
        it("Should create Equation Node - Births = Rabbits * Birth Probability", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, 'The number of births is the number of rabbits times the birth probability');
            dtest.setNodeExpression(browser, "Births = Rabbits / Birth Probability");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have incorrect equation colors in Attempt 1 - Births = Rabbits * Birth Probability", function () {
            dtest.openEditorforNode(browser, "id8", true);
            atest.checkNodeFieldColors("", "", "", "", INCORRECT_COLOR);
            dtest.nodeEditorDone(browser);
        })

        it("Should fill incorrectly in Equation Node - Births = Rabbits * Birth Probability", function(){
            dtest.openEditorforNode(browser, "id8", true);
            dtest.setNodeExpression(browser, "Births = Rabbits + Birth Probability");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have correct equation values and colors in Attempt 2- Ddan = Rdan * Tdan", function () {
            dtest.openEditorforNode(browser, "id8", true);
            atest.checkNodeFieldColors("", "", "", "", DEMO_COLOR);
            atest.checkNodeFieldValues("", "", "", "", "Births = Rabbits * Birth Probability");
            dtest.nodeEditorDone(browser);
        })

        it("Should create Equation Node - Rabbits = prior(Rabbits) + Births", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, "The number of rabbits increase by the number of births each year");
            dtest.setNodeExpression(browser, "Rabbits = prior(Rabbits) + Births");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have incorrect equation colors as Rabbits is not dynamic yet - Rabbits = prior(Rabbits) + Births", function () {
            dtest.openEditorforNode(browser, "id10", true);
            atest.checkNodeFieldColors("", "", "", "", INCORRECT_COLOR);
            dtest.nodeEditorDone(browser);
        })

        it("Should fill in Rabbits dynamic node", function(){
            dtest.openEditorforNode(browser, "id9", true);
            dtest.setQuantityNodeVariable(browser, "Rabbits");
            dtest.setQuantityNodeVariableType(browser, "dynamicType");
//            dtest.setQuantityNodeValue(browser,"24");
            dtest.setQuantityNodeUnits(browser,"rabbits");
            dtest.nodeEditorDone(browser);
        })

        it("Should check Equation Node ", function(){
            dtest.openEditorforNode(browser, "id10", true);
            //dtest.setNodeExpression(browser, "Rabbits = prior(Rabbits) + Births");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have correct equation values and colors in Attempt 2- Rabbits = prior(Rabbits) + Births", function () {
            dtest.openEditorforNode(browser, "id10", true);
            atest.checkNodeFieldColors("", "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("", "", "", "", "Rabbits = prior(Rabbits) + Births");
            dtest.nodeEditorDone(browser);
        })

        it("Should detect nodes in the model are incomplete", function(){
            dtest.closeModel(browser);
            var result = dtest.getPopupMessage(browser, "Nodes in the model are not complete");
            assert(result === true, "Node incomplete message missing");
            dtest.closeModelCancel(browser);
        })

    })
})

