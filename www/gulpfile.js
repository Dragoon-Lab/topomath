/*
 *  Topomath Project
 *  Arizona State University
 *
 */

var gulp = require('gulp'),
	jshint = require('gulp-jshint-cached'),
	cache = require('gulp-cached'),
	shell = require('gulp-shell'),
	replace = require('gulp-replace'),
	zip = require('gulp-zip'),
	mocha = require('gulp-mocha'),
	version = require('./version.js'),
	webdriver = require('gulp-webdriver'),
	fs = require('fs'),
	testPaths = require('../tests/scripts/test-paths.js');

//Set Configuration parameters
var config = {
	buildPath: 'util/buildscripts/build.sh',
	buildProfile: 'release.profile.js',
	buildOutputFile: 'build-output.txt',
	releasePath: '../release/'+ version.getVersion(),
	wwwPath: '../release/www',
	destinationDir: '../release/live',
};

gulp.task('default', ['watch']);

gulp.task('watch', ['lint'], function (){
	gulp.watch('js/*.js', ['lint']);
	gulp.watch('index.html', ['lint']);
});

gulp.task('test', function() {
	return gulp.src('wdio.conf.js').pipe(webdriver({specs:['../tests/scripts/coreTests/*.js'], baseUrl: testPaths.getLocalPath() }));
});

gulp.task('build', ['dojoBuild'], function (done){
	console.log("Copying files ...");
	var filesToCopy = [
		'./css/**/*.*',
		'./Liviz/**/*.*',
		'./cryptoJS/**/*.*',
		'./publicLogin/*/*.*',
		'./jsPlumb/lib/**/*.*',
		'./jsPlumb/demo/**/*.*',
		'./*.php',
		'./*.html',
		'./*.json',
		'form.js',
		'version.js'];

	var externalFiles = [
		'../*.sql',
		'../db_user_password'
	];

	gulp.src(['../release/www/jsPlumb/*.*']).pipe(gulp.dest(config.wwwPath +'/jsPlumb/src')).on("end", function(){
		gulp.src(filesToCopy , {base: './'}).pipe(gulp.dest(config.wwwPath)).on("end", function(){
			console.log("Modifying Index.php");
			gulp.src(['index.php']).pipe(replace("document.write('<scr'+'ipt src=\"dojo/dojo.js\"></scr'+'ipt>');",
				"document.write('<scr'+'ipt src=\"dojo/dojo.js?'+ version +'\"></scr'+'ipt>'); \n document.write('<scr'+'ipt src=\"topomath/index.js?'+ version +'\"></scr'+'ipt>');"))
				.pipe(gulp.dest(config.wwwPath)).on("end", function(){
					gulp.src(config.wwwPath+'/**', {base:'../release'}).pipe(gulp.dest(config.releasePath)).on("end", function(){
						console.log('Copying other folders...');
						gulp.src(externalFiles).pipe(gulp.dest(config.releasePath)).on("end", function(){
							console.log("Build Complete");
							// generateZip();  // No longer needed since we do builds on the server directly now.
							done();
						});
					});
				});
		});
	});
});

gulp.task('dojoBuild', ['clean'],  shell.task(config.buildPath + ' --profile '+ config.buildProfile +' > ../release/'+ config.buildOutputFile));

gulp.task('clean', shell.task(['mkdir -p ../release/' ]));

gulp.task('lint', function (){
	return gulp.src('js/*.js')
		.pipe(cache('linting'))
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});

function generateZip(){
	console.log("Generating Zip...");
	gulp.src(config.releasePath +'/**/*.*')
		.pipe(zip(version.getVersion()+'.zip'))
		.pipe(gulp.dest('../release'))
		.on("end", shell.task(['rm -rf '+ config.wwwPath,
			'rm -rf '+ config.destinationDir,
			'mv '+ config.releasePath+' '+ config.destinationDir,
			'mkdir '+ config.destinationDir + '/www/problems',
			'mkdir '+ config.destinationDir + '/www/images',
			'cp -R ./problems/* '+ config.destinationDir + '/www/problems/',
			'cp -R ./images/* '+ config.destinationDir +'/www/images/',
			'cp ../db_user_password '+ config.destinationDir +'/db_user_password']
		));
}
