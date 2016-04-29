module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        'gh-pages': {
            options: {
                base: '.',
            },
            src: ['index.html', 'dist/*']
        },
        jade: {
            compile: {
                options: {
                    pretty: true,
                },

                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: '.', // Src matches are relative to this path.
                    src: ['*.jade'], // Actual pattern(s) to match.
                    ext: '.html', // Dest filepaths will have this extension.
                }]
            }
        },
        sass: {
            dist: {
                options: {
                    noCache: true,
                    style: 'compressed'
                },
                files: {
                    'dist/css/style.min.css': 'scss/style.scss'
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    'dist/js/script.min.js': ['js/script.js']
                }
            }
        },
        watch: {
            grunt: { files: ['Gruntfile.js'] },
            jade: {
                files: '*.jade',
                tasks: ['jade']
            },
            sass: {
                files: 'scss/**/*.scss',
                tasks: ['sass']
            }, 
            uglify: {
                files: 'js/script.js',
                tasks: ['uglify']
            }
        }
    });
    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-gh-pages');

    // Default task.
    grunt.registerTask('default', 'Convert Jade templates into html templates', ['jade', 'sass', 'uglify', 'watch']);
    grunt.registerTask('deploy', 'launch on GH pages', [])
    grunt.loadNpmTasks('grunt-contrib-watch');
};
