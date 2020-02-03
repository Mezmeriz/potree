
const path = require('path');
const gulp = require('gulp');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require("fs");
const fsp = fs.promises;
const concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const rename = require('gulp-rename');
const header = require('gulp-header');

let paths = {
	laslaz: [
		"build/workers/laslaz-worker.js",
		"build/workers/lasdecoder-worker.js",
	],
	html: [
		"src/viewer/potree.css",
		"src/viewer/profile.html"
	],
	resources: [
		"resources/**/*"
	],
	libs: [
		"libs/three.js/build/three.min.js",
		"libs/d3/d3.min.js",
		"libs/proj4/proj4.js",
		"libs/tween/tween.min.js"
	]
};

let workers = {
	"LASLAZWorker": [
		"libs/plasio/workers/laz-perf.js",
		"libs/plasio/workers/laz-loader-worker.js"
	],
	"LASDecoderWorker": [
		"src/workers/LASDecoderWorker.js"
	],
	"EptLaszipDecoderWorker": [
		"src/workers/EptLaszipDecoderWorker.js"
	],
	"EptBinaryDecoderWorker": [
		"src/workers/EptBinaryDecoderWorker.js"
	],
	"EptZstandardDecoderWorker": [
		"src/workers/EptZstandardDecoderWorker.js"
	]
};

// these libs are lazily loaded
// in order for the lazy loader to find them, independent of the path of the html file,
// we package them together with potree
let lazyLibs = {
	"geopackage": "libs/geopackage",
	"sql.js": "libs/sql.js"
};

let shaders = [
	"src/materials/shaders/pointcloud.vs",
	"src/materials/shaders/pointcloud.fs",
	"src/materials/shaders/pointcloud_sm.vs",
	"src/materials/shaders/pointcloud_sm.fs",
	"src/materials/shaders/normalize.vs",
	"src/materials/shaders/normalize.fs",
	"src/materials/shaders/normalize_and_edl.fs",
	"src/materials/shaders/edl.vs",
	"src/materials/shaders/edl.fs",
	"src/materials/shaders/blur.vs",
	"src/materials/shaders/blur.fs",
];

gulp.task("workers", async function(done){

	for(let workerName of Object.keys(workers)){

		gulp.src(workers[workerName])
			.pipe(concat(`${workerName}.js`))
			.pipe(gulp.dest('build/workers'));
	}

	done();
});

gulp.task("lazylibs", async function(done){

	for(let libname of Object.keys(lazyLibs)){

		const libpath = lazyLibs[libname];

		gulp.src([`${libpath}/**/*`])
			.pipe(gulp.dest(`build/lazylibs/${libname}`));
	}

	done();
});

gulp.task("shaders", async function(){

	const components = [
		"let Shaders = {};"
	];

	for(let file of shaders){
		const filename = path.basename(file);

		const content = await fsp.readFile(file);

		const prep = `Shaders["${filename}"] = \`${content}\``;

		components.push(prep);
	}

	components.push("export {Shaders};");

	const content = components.join("\n\n");

	const targetPath = `./build/shaders/shaders.js`;

	if(!fs.existsSync("build/shaders")){
		fs.mkdirSync("build/shaders");
	}
	fs.writeFileSync(targetPath, content, {flag: "w"});
});

gulp.task("pack", async function(done){
	await exec('rollup -c', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		done();
	});
});

gulp.task("add-import-header", function(){
	const importHeader = 'import * as THREE from \'./libs/three.min.js\';\n' +
		'import * as d3 from \'./libs/d3.min.js\';\n' +
		'import * as TWEEN from \'./libs/tween.min.js\';\n' +
		'import proj4 from \'./libs/proj4.js\';\n' +
		'import {Shaders} from \'./shaders/shaders.js\';\n';

	return gulp.src('build/potree.js')
		.pipe(header(importHeader))
		.pipe(gulp.dest('build'))
});

gulp.task("minify-potree", function(){
	return gulp.src('build/potree.js')
		.pipe(uglify())
		.pipe(rename('potree.min.js'))
		.pipe(gulp.dest('build/'));
});

gulp.task("minify-worker", function(){
	return gulp.src('build/workers/BinaryDecoderWorker.js')
		.pipe(uglify())
		.pipe(rename('BinaryDecoderWorker.min.js'))
		.pipe(gulp.dest('build/workers'));
});

gulp.task("minify", gulp.series("add-import-header", "minify-potree", "minify-worker"));

gulp.task('build',
	gulp.series(
		gulp.parallel("workers", "lazylibs", "shaders", "pack"),
		async function(done){
			gulp.src(paths.html).pipe(gulp.dest('build'));
			gulp.src(paths.libs).pipe(gulp.dest('build/libs'));
			gulp.src(paths.resources).pipe(gulp.dest('build/resources'));
			gulp.src(["LICENSE"]).pipe(gulp.dest('build'));
			done();
		},
		"minify"
	)
);
