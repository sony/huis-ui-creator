/*
 * scss compile tasks
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path');

    grunt.extendConfig({

        // clean
        clean: {
            sass: {
                files: [
                    {// root/.sass-cache.
                        src: ['.sass-cache'],
                    },
                ],
            },
        },

        // compass scss
        compass: {
            app: {
                options: {
                    basePath: '<%= orgsrc %>/<%= stylesheets %>',
                },
            },
        },

    });

    // load plugin(s).
    grunt.loadNpmTasks('grunt-contrib-compass');

    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // Helper API
    grunt.cdp = grunt.cdp || {};

    //! add compass target file to config.
    grunt.cdp.setCompassTarget = function (key, basePath) {
        var compass;
        var configPath = path.join(basePath, 'config.rb');
        if (fs.existsSync(configPath)) {
            compass = grunt.config.get('compass');
            // always overwrite.
            compass[key] = {
                options: {
                    basePath: basePath,
                },
            };
            grunt.config.set('compass', compass);
        }
    };

};
