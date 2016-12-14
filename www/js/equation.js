define([
	"parser/parser"
], function(Parser){
	return {
		parse: function(equation){
			return Parser.parse(equation);
		},
	};
});
