module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		dirs: {
			output: "assets"
		},
		env: grunt.option('env') || process.env.GRUNT_ENV || 'development',
		clean: {
			options: {
				force: true
			},
			js: ["<%= dirs.output %>/js/"],
			css: [
				"<%= dirs.output %>/css/styles.min.css"
			]
		},
		concat: {
			options: {
				separator: ";"
			},
			script: {
				src: [
					"bower_components/jquery/dist/jquery.js",
					"bower_components/underscore/underscore.js",
					"bower_components/jquery-ui/jquery-ui.js",
					"bower_components/knockout/dist/knockout.js",
					"develop/js/app.js"
				],
				dest: "<%= dirs.output %>/js/app.min.js"
			}
		},
		uglify: {
			dist: {
				files: {
					"<%= dirs.output %>/js/app.min.js": ["<%= dirs.output %>/js/app.min.js"]
				}
			}
		},
		concat_css: {
			files: {
				src: [
					"bower_components/bootstrap/dist/css/bootstrap.css",
					"develop/css/styles.css"
				],
				dest: "<%= dirs.output %>/css/styles.min.css"
			}
		},
		cssmin: {
			target: {
				files: {
					"<%= dirs.output %>/css/styles.min.css": ["<%= dirs.output %>/css/styles.min.css"]
				}
			}
		},
		critical: {
			test: {
				options: {
					pathPrefix: './',
					css: [
						"<%= dirs.output %>/css/styles.min.css"
					],
					width: 320,
					height: 70
				},
				src: "develop/index.html",
				dest: "index.html"
			}
		},
		watch: {
			grunt: {
				files: ["Gruntfile.js"],
				tasks: ["default"]
			},
			scripts: {
				files: ["develop/js/**/*.js"],
				tasks: ["jsTask"],
				options: {
					spawn: false
				}
			},
			css: {
				files: ["develop/css/**/*.css", "develop/index.html"],
				tasks: ["cssTask"],
				options: {
					spawn: false
				},
			}
		},

	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-concat-css");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-critical");
	grunt.loadNpmTasks("grunt-env");
	
	// Default task(s).
	
	grunt.registerTask("cssTask",(function () {
		if (grunt.config('env') === "development") {
			return ["clean:css", "concat_css", "critical"];
		}
		else {
			return ["clean:css", "concat_css", "cssmin", "critical"];
		}
	})());

	grunt.registerTask("jsTask",(function () {
		if (grunt.config('env') === "development") {
			return ["clean:js", "concat"];
		}
		else {
			return ["clean:js", "concat", "uglify"];
		}
	})());

	grunt.registerTask("default", ["clean", "cssTask", "jsTask", "watch"]);

};