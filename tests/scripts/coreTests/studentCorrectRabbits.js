// Set up initial variables

// import chai assertion library
var assert = require('chai').assert;
// Import Library
var dtest = require('../library.js');
var atest = require('../assertTestLib.js');
// For Screenshots
var fs = require("fs");
var PERFECT_COLOR = 'lightgreen';

describe("Test Student mode", function() {

    dtest.openProblem(browser,[
        ["mode","STUDENT"],
        ["section","login.html"],
        ["folder","regression-test"],
        ["problem","Author-Rabbits2"]]);

    describe("Creating Nodes", function(){
        it("Should create Dynamic Quantity Node - Rabbits", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "The number of rabbits in the population");
            dtest.setQuantityNodeVariable(browser, "Rabbits");
            dtest.setQuantityNodeVariableType(browser, "dynamicType");
            dtest.setQuantityNodeValue(browser,"24");
            //dtest.setQuantityNodeUnits(browser,"rabbits");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Parameter Quantity Node - Birth Probability", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "The number of additional rabbits per year per rabbit" );
            dtest.setQuantityNodeVariable(browser, "Birth Probability");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"0.3");
            dtest.setQuantityNodeUnits(browser,"1/year");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Unknown Quantity Node - Births", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "The number of rabbits born per year");
            dtest.setQuantityNodeVariable(browser, "Births");
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.setQuantityNodeUnits(browser,"1/year");
            dtest.nodeEditorDone(browser);
        })
        
        
        it("Should open a node and edit - Rabbits", function () {
            dtest.openEditorforNode(browser, "Rabbits", false);
            //dtest.setNodeDescription(browser, "Speed (rate) of a winner");
            //dtest.setQuantityNodeVariableType(browser, "parameterType");
            //dtest.setQuantityNodeValue(browser,"142");
            dtest.setQuantityNodeUnits(browser, "rabbits");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Equation Node - Rabbits = prior(Rabbits) + Births", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, "The number of rabbits increase by the number of births each year");
            dtest.setNodeExpression(browser, "Rabbits = prior(Rabbits) + Births");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })
        it("Should create Equation Node - Births = Rabbits * Birth Probability", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, 'The number of births is the number of rabbits times the birth probability');
            dtest.setNodeExpression(browser, "Births = Rabbits - Birth Probability");
            dtest.undoExpression(browser);
            dtest.setNodeExpression(browser, "Births = Rabbits * Birth Probability");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })
    })

    describe("Verify Nodes", function(){
        it("Should have correct values and colors - unknownType", function () {
            dtest.openEditorforNode(browser, "Births", false);
            atest.checkNodeFieldColors(PERFECT_COLOR, PERFECT_COLOR, "", PERFECT_COLOR, "");
            atest.checkNodeFieldValues("The number of rabbits born per year", "Births", "", "1/year", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct values and colors - parameterType", function () {
            dtest.openEditorforNode(browser, "Birth Probability", false);
            atest.checkNodeFieldColors(PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, "");
            atest.checkNodeFieldValues("The number of additional rabbits per year per rabbit", "Birth Probability", "0.3", "1/year", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct values and colors - dynamicType", function () {
            dtest.openEditorforNode(browser, "Rabbits", false);
            atest.checkNodeFieldColors(PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, "");
            atest.checkNodeFieldValues("The number of rabbits in the population", "Rabbits", "24", "rabbits", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct equation values and colors - Births = Rabbits * Birth Probability", function () {
            dtest.openEditorforNode(browser, "id10", true);
            atest.checkNodeFieldColors(PERFECT_COLOR, "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("The number of births is the number of rabbits times the birth probability", "", "", "", "Births = Rabbits * Birth Probability");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct equation values and colors - Births = Rabbits * Birth Probability", function () {
            dtest.openEditorforNode(browser, "id9", true);
            atest.checkNodeFieldColors(PERFECT_COLOR, "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("The number of rabbits increase by the number of births each year", "", "", "", "Rabbits = prior(Rabbits) + Births");
            dtest.nodeEditorDone(browser);
        })
        it("Should open Graph successfully", function () {
            dtest.selectGraphTab(browser);
            var message = dtest.getGraphMessage(browser);
            assert(message === "Congratulations, Your model's behavior matches the author's!", "Graph Incorrect ");
        })
    })
})
