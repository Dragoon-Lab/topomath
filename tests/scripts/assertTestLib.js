
// Import Library
var dtest = require('./library.js');
var assert = dtest.assert;
// For Screenshots

exports.checkNodeFieldColors = function( desc_color, variable_name_color, value_color, units_color, eq_color){
    if( desc_color != ""){
        var d_color = dtest.getNodeFieldColor(browser, "description");
        assert(d_color === desc_color, "Description Color not matched");
    }
    if( variable_name_color != ""){
        var var_color = dtest.getNodeFieldColor(browser, "variable");
        assert(var_color === variable_name_color, "Variable Color not matched");
    }
    if( value_color != ""){
        var val_color = dtest.getNodeFieldColor(browser, "value");
        assert(val_color === value_color, "Value Color not matched");
    }
    if( units_color != ""){
        var u_color = dtest.getNodeFieldColor(browser, "units");
        assert(u_color === units_color, "Units Color not matched");
    }
    if( eq_color != ""){
        var e_color = dtest.getNodeFieldColor(browser, "equation");
        assert(e_color === eq_color, "Equation Color not matched");
    }
}

exports.checkNodeFieldValues = function( desc_val, variable_name_val, value_val, units_val, eq_val){
    if( desc_val != ""){
        var d_val = dtest.getNodeFieldValue(browser, "description");
        assert(d_val === desc_val, "Description Color not matched");
    }
    if( variable_name_val != ""){
        var v_val = dtest.getNodeFieldValue(browser, "variable");
        assert(v_val === variable_name_val, "Variable Color not matched");
    }
    if( value_val != ""){
        var val_v = dtest.getNodeValue(browser);
        assert(val_v === value_val, "Value Color not matched");
    }
    if( units_val != ""){
        var u_val = dtest.getNodeFieldValue(browser, "units");
        assert(u_val === units_val, "Units Color not matched");
    }
    if( eq_val != ""){
        var e_val = dtest.getNodeEquation(browser);
        assert(e_val === eq_val, "Equation Color not matched");
    }
}
