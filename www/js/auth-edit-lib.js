define([], function(){
	return {
		processEntityString: function(entity){
			var entityStr = ""+ entity;
			var entityAr = entityStr.split(';');
			var ourReg = new RegExp(/[~`!#$%\^&*+=\-\[\]\\',/{}|\\":<>\?()]/);
			var entityDesc = "";
			//correctness evaluates the special characters of the whole string at once
			//this variable is useful to give red feedback
			var correctness = !ourReg.test(entityStr);
			//Running through each entity helps to identify the exact entity which needs to go into description
			//and also the case where strings like ";;" are entered where the string is legal but empty entities
			for(var i=0;i<entityAr.length;i++){
				if(entityAr[i] != '' && !ourReg.test(""+entityAr[i])){
					entityDesc = entityAr[i];
					break;
				}
			}
			return {validValue: entityDesc, correctness: correctness};
		},
		/* 
		isSubscriptInUse
		Given a subscript, list of variables, and the numGenOb
		Return true if the subscript is already in use by any of the variables
		*/
		isSubscriptInUse: function(subscript,slotVars,numGenOb){
			var inUse = slotVars.some(function(v){
				return numGenOb[subscript].includes(v);
			});
			return inUse;
		},
	};
});