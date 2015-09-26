module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			options: {
				force: true
			},
			js:    ["assets/js/"],
			css:   ["assets/css/"],
			assets: [
				"dist/assets/*",
			]
		},
		concat: {
			options: {
				separator: '/**/'
			},
			script: {
				src: [
					// ...more  bootstrap JS you might want to add
					'bower_components/bootstrap/js/collapse.js',
					'bower_components/bootstrap/js/scrollspy.js',
					'bower_components/knockout/dist/knockout.js',
					'bower_components/jquery/dist/jquery.js',
					'develop/js/app.js'
				],
				dest: 'assets/js/app.js'
			}
		},
		uglify: {
			dist: {
				files: {
					'assets/js/app.min.js': ['assets/js/app.js']
				}
			}
		},
		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1
			},
			target: {
				files: {
					'assets/css/styles.min.css': [
						'bower_components/bootstrap/dist/css/bootstrap.css',
						'develop/css/styles.css'
					]
				}
			}			
		},
		watch: {
			grunt: { 
				files: ['Gruntfile.js'], 
				tasks: ['default'] 
			},
			scripts: {
				files: ['develop/js/**/*.js'],
				tasks: ['jsTask'],
				options: {
					spawn: false
				}
			},
			css: {
				files: ['develop/css/**/*.css'],
				tasks: ['cssTask'],
				options: {
					spawn: false
				},
			}
		},

	});
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	// Default task(s).

	grunt.registerTask('cssTask', ['clean:css', 'cssmin']);
	grunt.registerTask('jsTask',  ['clean:js', 'concat', 'uglify']);
	grunt.registerTask('default',  ['clean', 'cssTask', 'jsTask', 'watch']);

};