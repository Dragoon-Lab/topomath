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
        ["problem","distance2"]]);

    describe("Creating Nodes", function(){
        it("Should create Parameter Quantity Node - Tdan", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Duration (time) of Dan's drive" );
            dtest.setQuantityNodeVariable(browser, "Tdan");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"4.5");
            dtest.setQuantityNodeUnits(browser,"hrs");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Unknown Quantity Node", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Speed (rate) of Dan's drive");
            dtest.setQuantityNodeVariable(browser, "Rdan");
            dtest.setQuantityNodeUnits(browser,"mph");
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Parameter Quantity Node - Ddan", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Distance Dan drove before");
            dtest.setQuantityNodeVariable(browser, "Ddan");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"500");
            dtest.setQuantityNodeUnits(browser,"m");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Equation Node - Ddan = Rdan * Tdan", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, 'Distance-Rate-Time: [Dan] travels Ddan [miles] in Tdan [hours] at a rate of Rdan [mph].');
            dtest.setNodeExpression(browser, "Ddan = Rdan + Tdan");
            dtest.undoExpression(browser);
            dtest.setNodeExpression(browser, "Ddan = Rdan * Tdan");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
        })
        it("Should create Equation Node - Rdan = Rwin - Diff", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, "Compare: [Dan's speed] was [difference] less than [the winning speed]");
            dtest.setNodeExpression(browser, "Rdan = Rwin - Diff");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);            
        })
        it("Should open a node and edit - Diff", function(){
            dtest.openEditorforNode(browser, "Diff", false);
            dtest.setNodeDescription(browser, "How much slower Dan was than a winner");
            dtest.setQuantityNodeUnits(browser, "mph");
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.nodeEditorDone(browser);
        })
        it("Should open a node and edit - Rwin", function () {
            dtest.openEditorforNode(browser, "Rwin", false);
            dtest.setNodeDescription(browser, "Speed (rate) of a winner");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"142");
            dtest.setQuantityNodeUnits(browser, "mph");
            dtest.nodeEditorDone(browser);
        })
    })

    describe("Verify Nodes", function(){
        it("Should have correct values and colors - unknownType", function () {
            dtest.openEditorforNode(browser, "Diff", false);
            atest.checkNodeFieldColors(PERFECT_COLOR, PERFECT_COLOR, "", PERFECT_COLOR, "");
            atest.checkNodeFieldValues("How much slower Dan was than a winner", "Diff", "", "mph", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct values and colors - parameterType", function () {
            dtest.openEditorforNode(browser, "Tdan", false);
            atest.checkNodeFieldColors(PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, PERFECT_COLOR, "");
            atest.checkNodeFieldValues("Duration (time) of Dan's drive", "Tdan", "4.5", "hrs", "");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct equation values and colors - Ddan = Rdan * Tdan", function () {
            dtest.openEditorforNode(browser, "id11", true);
            atest.checkNodeFieldColors(PERFECT_COLOR, "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("Distance-Rate-Time: [Dan] travels Ddan [miles] in Tdan [hours] at a rate of Rdan [mph].", "", "", "", "Ddan = Rdan * Tdan");
            dtest.nodeEditorDone(browser);
        })
        it("Should have correct equation values and colors - Rdan = Rwin - Diff", function () {
            dtest.openEditorforNode(browser, "id12", true);
            atest.checkNodeFieldColors(PERFECT_COLOR, "", "", "", PERFECT_COLOR);
            atest.checkNodeFieldValues("Compare: [Dan's speed] was [difference] less than [the winning speed]", "", "", "", "Rdan = Rwin - Diff");
            dtest.nodeEditorDone(browser);
        })
        it("Should open Graph successfully", function () {
            dtest.selectGraphTab(browser);
            var message = dtest.getGraphMessage(browser);
            assert(message === "Congratulations, Your model's behavior matches the author's!", "Graph Incorrect ");
        })
    })
})
