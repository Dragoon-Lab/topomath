// Set up initial variables

// import chai assertion library
var assert = require('chai').assert;
// Import Library
var dtest = require('../library.js');
var atest = require('../assertTestLib.js');
// For Screenshots
var fs = require("fs");
var INCORRECT_COLOR = "rgb(255, 128, 128)";
var DEMO_COLOR = "yellow";
var PERFECT_COLOR = 'lightgreen';

describe("Test Student mode - First and Second Failure", function() {

    dtest.openProblem(browser,[
        ["mode","STUDENT"],
        ["section","login.html"],
        ["folder","regression-test"],
        ["problem","distance2"]]);

    describe("Create and Verify Nodes", function(){
        it("Should create Parameter Quantity Node - Tdan Incorrectly in Attempt 1", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Duration (time) of Dan's drive" );
            dtest.setQuantityNodeVariable(browser, "Ddan");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"3.5");
            dtest.setQuantityNodeUnits(browser,"m");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Parameter Quantity node is incorrect in Attempt 1", function(){
            dtest.openEditorforNode(browser, "id8", true);
            atest.checkNodeFieldColors("", INCORRECT_COLOR, INCORRECT_COLOR, INCORRECT_COLOR, "");
            dtest.nodeEditorDone(browser);
        })
        it("Should edit Parameter Quantity Node - Tdan Incorrect in Attempt 2", function(){
            dtest.openEditorforNode(browser, "id8", true);
            dtest.setQuantityNodeVariable(browser, "Diff");
            dtest.setQuantityNodeValue(browser,"2.5");
            dtest.setQuantityNodeUnits(browser,"mph");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Parameter Quantity node is Incorrect in Attempt 2", function(){
            dtest.openEditorforNode(browser, "id8", true);
            atest.checkNodeFieldColors("", DEMO_COLOR, DEMO_COLOR, DEMO_COLOR, "");
            atest.checkNodeFieldValues("", "Tdan", "4.5", "hrs", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Unknown Quantity Node", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Speed (rate) of Dan's drive");
            dtest.setQuantityNodeVariable(browser, "Diff");
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.setQuantityNodeUnits(browser,"m");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect that Unknown Quantity node - Rdan is Incorrect in Attempt 1", function(){
            dtest.openEditorforNode(browser, "id9", true);
            atest.checkNodeFieldColors("", INCORRECT_COLOR, "", INCORRECT_COLOR, "");
            dtest.nodeEditorDone(browser);
        })
        it("Should edit Unknown Quantity Node Correctly in Attempt 2", function (argument) {
            dtest.openEditorforNode(browser, "id9", true);
            dtest.setQuantityNodeVariable(browser, "Rdan");
            dtest.setQuantityNodeUnits(browser,"mph");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect Unknown Quantity Node has correct values in Attempt 2", function (argument) {
            dtest.openEditorforNode(browser, "id9", true);
            atest.checkNodeFieldColors("", PERFECT_COLOR, "", PERFECT_COLOR, "");
            atest.checkNodeFieldValues("", "Rdan", "", "mph", "");
            dtest.nodeEditorDone(browser);
        })
        
        it("Should create Equation Node - Ddan = Rdan * Tdan", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, 'Distance-Rate-Time: [Dan] travels Ddan [miles] in Tdan [hours] at a rate of Rdan [mph].');
            dtest.setNodeExpression(browser, "Ddan = Rdan + Tdan");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have incorrect equation colors in Attempt 1 - Ddan = Rdan * Tdan", function () {
            dtest.openEditorforNode(browser, "id10", true);
            atest.checkNodeFieldColors("", "", "", "", INCORRECT_COLOR);
            dtest.nodeEditorDone(browser);
        })

        it("Should fill incorrectly in Equation Node - Ddan = Rdan * Tdan", function(){
            dtest.openEditorforNode(browser, "id10", true);
            dtest.setNodeExpression(browser, "Ddan = Rdan - Tdan");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have correct equation values and colors in Attempt 2- Ddan = Rdan * Tdan", function () {
            dtest.openEditorforNode(browser, "id10", true);
            atest.checkNodeFieldColors("", "", "", "", DEMO_COLOR);
            atest.checkNodeFieldValues("", "", "", "", "Ddan = Rdan * Tdan");
            dtest.nodeEditorDone(browser);
        })

        it("Should create Equation Node - Rdan = Rwin - Diff", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, "Compare: [Dan's speed] was [difference] less than [the winning speed]", "Equation Description not matched");
            dtest.setNodeExpression(browser, "Rdan = Rwin + Diff");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have incorrect equation colors in Attempt 1 - Rdan = Rwin - Diff", function () {
            dtest.openEditorforNode(browser, "id12", true);
            atest.checkNodeFieldColors("", "", "", "", INCORRECT_COLOR);
            dtest.nodeEditorDone(browser);
        })

        it("Should fill correctly in Equation Node Rdan = Rwin - Diff", function(){
            dtest.openEditorforNode(browser, "id12", true);
            dtest.setNodeExpression(browser, "Rdan = Rwin - Diff");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })

        it("Should have correct equation values and colors in Attempt 2- Rdan = Rwin - Diff", function () {
            dtest.openEditorforNode(browser, "id12", true);
            atest.checkNodeFieldColors("", "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("", "", "", "", "Rdan = Rwin - Diff");
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

