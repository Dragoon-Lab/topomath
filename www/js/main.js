define([
	'dojo/ready',
	'./session',
	'./model',
	'./equation',
	'./draw-model'
], function(ready, sess, model, equation, drawModel){
	var query = {
		'u': 'temp',
		'p': 'rabbits',
		'm': 'AUTHOR',
		's': 'temp-section',
		'f': 'temp-folder'
	};
	var session = sess(query);
	var _model = new model(query.m, query.p)
	session.getModel(query).then(function(solutionGraph){
		if(solutionGraph){
			try{
				_model.loadModel(solutionGraph);
			} catch(err){
				throw Error(err);
			}
		} else {
			throw Error("something went wrong");
		}
	});

	ready(function(){
		var dm = new drawModel(_model.active);
	});
});
