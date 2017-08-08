// Set up initial variables

// import chai assertion library
var assert = require('chai').assert;
// Import Library
var dtest = require('../library.js');
// For Screenshots
var fs = require("fs");

describe("Test author mode", function() {

    dtest.openProblem(browser,[
        ["mode","AUTHOR"],
        ["section","login.html"],
        ["problem","distance"]]);

    describe("Testing check on empty problem", function(){
        it("Should detect that the problem is empty", function(){
            var htmlContent = dtest.getHtmlOfNode(browser, "statemachine-demo");
            assert(htmlContent !== "", "Block not empty");
        });
    });

    describe("Creating Nodes", function(){
        it("Should create Parameter Quantity Node", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Duration (time) of Dan's drive");
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
            dtest.setQuantityNodeVariableType(browser, "unknownType");
            dtest.nodeEditorDone(browser);
        })
        it("Should create Dynamic Quantity Node", function(){
            dtest.menuCreateNode(browser, 'quantity');
            dtest.setNodeDescription(browser, "Distance Dan drove before");
            dtest.setQuantityNodeVariable(browser, "Ddan");
            dtest.setQuantityNodeVariableType(browser, "dynamicType");
            dtest.setQuantityNodeValue(browser,"500");
            dtest.setQuantityNodeUnits(browser,"m");
            dtest.setQuantityNodeRoot(browser);
            dtest.nodeEditorDone(browser);
        })
        it("Should create Equation Node", function(){
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, 'Distance-Rate-Time: [Dan] travels Ddan [miles] in Tdan [hours] at a rate of Rdan [mph].');
            dtest.setNodeExpression(browser, "Ddan = Rdan * Tdan");
            dtest.undoExpression(browser);
            dtest.setNodeExpression(browser, "Ddan + prior(Ddan) = Rdan * Tdan");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);
            dtest.menuCreateNode(browser, 'equation');
            dtest.setNodeDescription(browser, "Compare: [Dan's speed] was [difference] less than [the winning speed]");
            dtest.setNodeExpression(browser, "Rdan = Rwin - Diff");
            dtest.checkExpression(browser);
            dtest.nodeEditorDone(browser);            
        })
        it("Should open a node and edit", function(){
            dtest.openEditorforNode(browser, "Diff", false);
            dtest.setNodeDescription(browser, "How much slower Dan was than a winner");
            dtest.setQuantityNodeUnits(browser, "mph");
            dtest.nodeEditorDone(browser);
            dtest.openEditorforNode(browser, "Rwin", false);
            dtest.setNodeDescription(browser, "Speed (rate) of a winner");
            dtest.setQuantityNodeVariableType(browser, "parameterType");
            dtest.setQuantityNodeValue(browser,"142");
            dtest.setQuantityNodeUnits(browser, "mph");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect quantity node is incomplete", function(){
            var value = null;
            dtest.openEditorforNode(browser, 'id6', true);
            var description = dtest.getNodeDescription(browser);
            var variable = dtest.getNodeVariable(browser);
            var variableType = dtest.getNodeVariableType(browser);
            if(variableType === 'parameter' || variableType === 'dynamic'){
                value = dtest.getNodeValue(browser);
            }
            assert( description !== "", "Node Incomplete - Description is missing!");
            assert( variable !== "", "Node Incomplete - Variable missing!");
            assert( value !== "", "Node Incomplete - Value missing!");
            dtest.nodeEditorDone(browser);
        })
        it("Should detect equation node is incomplete", function(){
            dtest.openEditorforNode(browser, 'id5', true);
            var description = dtest.getNodeDescription(browser);
            var equation = dtest.getNodeEquation(browser);
            assert( description !== "", "Node Incomplete - Description is missing!");
            assert( equation !== "", "Node Incomplete - Equation missing!");
            dtest.nodeEditorDone(browser);
        })
    })

    describe("Verify Nodes", function(){

       /* it("Should open an existing problem", function(){
            dtest.openProblem(browser,[
                ["mode","AUTHOR"],
                ["section","login.html"], 
                ["problem","distance"],
                ["user",'u_4']]);
            dtest.saveScreenshot(browser, fs);
        }) */ 

        it("Should verify quantity node and verify states", function(){
            var nodeName = "Ddan";
            var nodeBorderColor = dtest.getNodeColor(browser, nodeName, false);
            var quantityDescriptionColor = dtest.getNodeDescriptionColor(browser, nodeName, false);
            var quantityDescriptionContent = dtest.getNodeDescriptionContent(browser, nodeName, false);
            var quantityDescription = quantityDescriptionContent.split(":")[1].trim();
            dtest.openEditorforNode(browser,nodeName, false);
            var text = dtest.getNodeDescription(browser);
            var variable = dtest.getNodeVariable(browser);
            var variableType = dtest.getNodeVariableType(browser);
            var value = dtest.getNodeValue(browser);
            var units = dtest.getNodeUnits(browser);
            var rootExists = dtest.isRoot(browser);
            assert(text === "Distance Dan drove before", "Text not matched");
            assert(variable === "Ddan", "Variable not matched");
            assert(variableType === "dynamic", "VariableType not matched");
            assert(value === "500", "Value not matched");
            assert(units === "m", "Units not matched");
            assert(rootExists === true, "Root does not exist");
            assert(quantityDescription === text, "Description left not matching node description");
            assert(nodeBorderColor === quantityDescriptionColor, "Node Color not matching");
            dtest.nodeEditorDone(browser);
        })
        it("Should verify prior node", function(){
            nodeName = "id3_initial";
            dtest.openEditorforNode(browser,nodeName, true);
            nodeName = nodeName.replace("_initial","");
            var nodeBorderColor = dtest.getNodeColor(browser, nodeName, true);
            var quantityDescriptionColor = dtest.getNodeDescriptionColor(browser, nodeName, true);
            var quantityDescriptionContent = dtest.getNodeDescriptionContent(browser, nodeName, true);
            var quantityDescription = quantityDescriptionContent.split(":")[1].trim();
            var text = dtest.getNodeDescription(browser);
            var variable = dtest.getNodeVariable(browser);
            var variableType = dtest.getNodeVariableType(browser);
            var value = dtest.getNodeValue(browser);
            var units = dtest.getNodeUnits(browser);
            var rootExists = dtest.isRoot(browser);
            assert(text === "Distance Dan drove before", "Text not matched");
            assert(variable === "Ddan", "Variable not matched");
            assert(variableType === "dynamic", "VariableType not matched");
            assert(value === "500", "Value not matched");
            assert(units === "m", "Units not matched");
            assert(rootExists === true, "Root does not exist");
            assert(quantityDescription === text, "Description left not matching node description");
            assert(nodeBorderColor === quantityDescriptionColor, "Node Color not matching");
            dtest.nodeEditorDone(browser);
        })
        it("Should verify equation node and verify states", function(){
            var node = "id4";
            var nodeBorderColor = dtest.getNodeColor(browser, node, true);
            var equationDescriptionColor = dtest.getNodeDescriptionColor(browser, node, true);
            var equationDescriptionContent = dtest.getNodeDescriptionContent(browser, node, true);
            dtest.openEditorforNode(browser, node, true);
            var description = dtest.getNodeDescription(browser).trim();
            var equation = dtest.getNodeEquation(browser);
            assert(description === "Distance-Rate-Time: [Dan] travels Ddan [miles] in Tdan [hours] at a rate of Rdan [mph].", "Description not matched");
            assert(equation === "Ddan + prior(Ddan) = Rdan * Tdan", "Equation not matched");
            assert(equationDescriptionContent === description, "Description left not matching node description");
            assert(nodeBorderColor === equationDescriptionColor, "Node Color not matching");
            dtest.nodeEditorDone(browser);
        })
    })

    describe("Should delete nodes",function(){
        it("Should delete the quantity node by clicking Delete Button", function(){
            dtest.openEditorforNode(browser, "Rwin", false);
            dtest.deleteNodeByButton(browser);
        })
        it("Should delete the equation node by clicking Delete Button", function(){
            dtest.openEditorforNode(browser, "id4", true);
            dtest.deleteNodeByButton(browser);
        })
        it("Should delete the quantity node by right clicking", function(){
            dtest.deleteQuantityNodeByRightClick(browser, "Ddan");
        })
        it("Should delete the equation node by right clicking", function(){
            dtest.deleteEquationNodeByRightClick(browser, "id5");
        })
    })

    describe("Should detect completion of Model", function(){
        it("Should detect root does not exist", function(){
            dtest.closeModel(browser);
            var rootExists = dtest.checkRootNode(browser);
            assert(rootExists === false, "Root should not exist");
            dtest.closeModelCancel(browser);
        })
        it("Should detect variable mapping", function(){
            dtest.closeModel(browser);
            var variableMapping = dtest.checkVariableEquationMap(browser);
            assert(variableMapping === false, "Variables should not be part of equations");
            dtest.closeModelCancel(browser);
        })
    })

    describe("Close Model", function(){
        it("Should cancel close model dialog", function(){
            dtest.closeModel(browser);
            dtest.closeModelCancel(browser);
        })
        it("Should force close model", function(){
            dtest.closeModel(browser);
            dtest.forceCloseModel(browser);
        })
    })    
})

