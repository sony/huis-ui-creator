/*
 * specified cordova build target script.
 * called from cordova-cli.
 */

module.exports = function (grunt) {

    var fs = require('fs');

    grunt.extendConfig({

        // config variable entries: directory
        porting: 'porting',                     // porting directory
        platform_porting: 'porting',            // platforms/<platform>/platform_porting directory

        // config variable entries: tasks
        cordova_platform_porting_src: '<%= cordova_platform_porting %>',

        // internal variable
        cordova_build_called: false,    // flag for build all
        cordova_target_platforms: [],   // build target platforms
        cordova_platform: '',           // current target platform
        cordova_work_platforms: [],     // build target platform scheduller, set by "cordova_set_work_platforms" task

        cordova_platform_porting: 'platforms/<%= cordova_platform %>/<%= platform_porting %>',
        cordova_platform_www: 'platforms/<%= cordova_platform %>/platform_www',

        cordova_copy_src_scripts: ['<%= scripts %>/**'],
        cordova_copy_src_stylesheets: ['<%= stylesheets %>/**'],
        cordova_copy_src_templates: ['<%= templates %>/**'],

        // clean
        clean: {
            cordova_platform: {
                files: {
                    src: [
                        '<%= cordova_platform_www %>/<%= porting %>'
                    ],
                },
            },
            cordova_platform_all: {
                files: {
                    src: [
                        'platforms/*/platform_www/<%= porting %>',
                    ],
                },
            },
        },

        // file copy
        copy: {
            // for build copy task
            cordova_platform: {
                files: [
                    {// scripts.
                        expand: true,
                        cwd: '<%= cordova_platform_porting_src %>',
                        src: '<%= cordova_copy_src_scripts %>',
                        dest: '<%= cordova_platform_www %>/<%= porting %>'
                    },
                    {// stylesheets
                        expand: true,
                        cwd: '<%= cordova_platform_porting_src %>',
                        src: '<%= cordova_copy_src_stylesheets %>',
                        dest: '<%= cordova_platform_www %>/<%= porting %>'
                    },
                    {// templates
                        expand: true,
                        cwd: '<%= cordova_platform_porting_src %>',
                        src: '<%= cordova_copy_src_templates %>',
                        dest: '<%= cordova_platform_www %>/<%= porting %>'
                    },
                ]
            },
        },

        // remove empty directories
        cleanempty: {
            cordova: {
                options: {
                    files: false,
                },
                src: ['<%= cordova_platform_www %>/<%= porting %>/**/*'],
            },
        },

        /** entry tasks from Kick_Grunt **/

        cordova_register_platform: {
            android: {},
            ios: {},
            firefoxos: {},
            windows8: {},
            browser: {},
            'amazon-fireos': {},
            blackberry10: {},
            windows: {},
            wp8: {},
        },

        cordova_build_debug: {
            all: {},
            android: {},
            ios: {},
            firefoxos: {},
            windows8: {},
            browser: {},
            'amazon-fireos': {},
            blackberry10: {},
            windows: {},
            wp8: {},
        },

        cordova_build_release: {
            all: {},
            android: {},
            ios: {},
            firefoxos: {},
            windows8: {},
            browser: {},
            'amazon-fireos': {},
            blackberry10: {},
            windows: {},
            wp8: {},
        },

        cordova_prepare: {
            debug: {},
            release: {},
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // hook task
    grunt.cdp = grunt.createCustomTaskEntry(grunt.cdp, 'cordova_prepare_hook');

    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // build entry I/F. call from kick_grunt.js
    grunt.registerMultiTask('cordova_register_platform', function () {
        var targetPratforms = grunt.config.get('cordova_target_platforms');
        targetPratforms.push(this.target);
        grunt.config.set('cordova_target_platforms', targetPratforms);
    });

    // debug build entry I/F.
    grunt.registerMultiTask('cordova_build_debug', function () {
        cordova_tasks('debug', this.target);
    });

    // release build entry I/F.
    grunt.registerMultiTask('cordova_build_release', function () {
        cordova_tasks('release', this.target);
    });

    // prepare hook entry I/F.
    grunt.registerMultiTask('cordova_prepare', function () {
        switch (this.target) {
            case 'release':
                grunt.cdp.custom_tasks['cordova_prepare_hook'].release.forEach(function (task) {
                    grunt.task.run([task]);
                });
                break;
            case 'debug':
                grunt.cdp.custom_tasks['cordova_prepare_hook'].debug.forEach(function (task) {
                    grunt.task.run([task]);
                });
                break;
            default:
                throw 'unknown build option: ' + this.target;
        }
    });

    function cordova_tasks(buildTarget, platfromTarget) {
        var targetPratforms = grunt.config.get('cordova_target_platforms');
        if (grunt.config.get('cordova_build_called')) {
            console.log('skip - cordova build already called.');
            return;
        }

        grunt.config.set('cordova_build_called', true);

        if (targetPratforms.length <= 0) {
            if ('all' === platfromTarget) {
                fs.readdirSync('platforms').forEach(function (platform) {
                    targetPratforms.push(platform);
                });
            } else {
                targetPratforms.push(platfromTarget);
            }
        }
        grunt.config.set('cordova_buildtarget', buildTarget);
        grunt.config.set('cordova_target_platforms', targetPratforms);

        console.log('cordova_buildtarget: ' + grunt.config.get('cordova_buildtarget'));
        console.log('cordova_target_platforms: ' + JSON.stringify(grunt.config.get('cordova_target_platforms')));

        grunt.task.run('cordova_platform_preprocess');
    }


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    grunt.registerTask('cordova_set_work_platforms', function () {
        grunt.config.set('cordova_work_platforms', grunt.config.get('cordova_target_platforms').slice(0));
    });

    grunt.registerTask('cordova_clean_platforms', function () {
        var platforms = grunt.config.get('cordova_work_platforms');
        var platform;
        if (!!platforms && 0 < platforms.length) {
            platform = platforms.shift();
            // update target platform
            grunt.config.set('cordova_work_platforms', platforms);
            grunt.config.set('cordova_platform', platform);
            // next task
            grunt.task.run('clean:cordova_platform');
            grunt.task.run('cordova_clean_platforms');
        }
    });

    grunt.registerTask('cordova_platform_preprocess', function () {
        grunt.task.run('core_config');
        grunt.task.run('cordova_set_work_platforms');
        grunt.task.run('cordova_clean_platforms');
        grunt.task.run('glue_cordova_launch');
    });

    grunt.registerTask('glue_cordova_launch', function () {
        var buildtarget = grunt.config.get('cordova_buildtarget') || 'debug'; // default 'debug'
        grunt.task.run('glue_cordova:' + buildtarget);
    });

};
