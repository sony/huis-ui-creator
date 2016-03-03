/*
 * specified cordova typescript build target script.
 * called from build.cordova.js.
 */

module.exports = function (grunt) {

    var path = require('path');

    grunt.extendConfig({

        // internal variable
        glue_ts_cordova_tmpdir_org: '<%= tmpdir %>',
        glue_ts_cordova_tmpdir: '<%= glue_ts_cordova_tmpdir_org %>/<%= orgsrc %>',
        glue_ts_cordova_platform_work_dir: '<%= glue_ts_cordova_tmpdir_org %>/platforms/<%= cordova_platform %>',       // for release build. platform working directory.
        glue_ts_cordova_platform_pkg_dir: '<%= glue_ts_cordova_tmpdir_org %>/<%= porting %>_<%= cordova_platform %>',   // for release build. platform temporary package directory.

        // clean
        clean: {
            glue_ts_cordova_porting_all: {
                files: [
                    {// porting/scripts.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>/<%= scripts %>',
                        src: ['**/*.js', '**/*.map'],
                    },
                    {// porting/stylesheets.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>/<%= stylesheets %>',
                        src: ['*.css', '.sass-cache'],
                    },
                    {// platforms/*/porting/scripts.
                        expand: true,
                        cwd: 'platforms/*/<%= porting %>/<%= scripts %>',
                        src: ['**/*.js', '**/*.map'],
                    },
                    {// platforms/*/porting/stylesheets.
                        expand: true,
                        cwd: 'platforms/*/<%= porting %>/<%= stylesheets %>',
                        src: ['*.css', '.sass-cache'],
                    },
                ],
            },
        },

        // file copy
        copy: {
            // for relase build preprocess prepare task
            glue_ts_cordova_platform_build_src: {
                files: [
                    {// platforms/<platform>/porting/*
                        expand: true,
                        cwd: '<%= cordova_platform_porting %>',
                        src: '**',
                        dest: '<%= glue_ts_cordova_platform_work_dir %>/<%= porting %>',
                    },
                    {// app/index.html
                        '<%= glue_ts_cordova_platform_work_dir %>/index.html': '<%= orgsrc %>/index.html',
                    },
                ],
            },
            // instead of minify copy task
            glue_ts_cordova_instead_of_minify: {
                files: [
                    {// "templates"
                        expand: true,
                        cwd: '<%= glue_ts_cordova_platform_work_dir %>/<%= porting %>',
                        src: ['<%= templates %>/**/*.<%= template_ext %>'],
                        dest: '<%= glue_ts_cordova_platform_pkg_dir %>',
                    },
                ],
            },
        },

        // html minify
        htmlmin: {
            glue_ts_cordova: {
                files: [
                    {// "templates"
                        expand: true,
                        cwd: '<%= glue_ts_cordova_platform_work_dir %>/<%= porting %>',
                        src: ['<%= templates %>/**/*.<%= template_ext %>'],
                        dest: '<%= glue_ts_cordova_platform_pkg_dir %>',
                    },
                ],
            },
        },

        // url string lower task
        lower: {
            glue_ts_cordova: {
                src: '<%= cordova_platform_www %>/<%= porting %>/**',
            },
        },

        // for html internal paths.
        lower_path_in_html: {
            glue_ts_cordova: {
                src: ['<%= cordova_platform_www %>/<%= porting %>/<%= scripts %>/**/*.<%= lib_module_scripts_ext %>'],
            },
        },

        // custom task: set package souces.
        glue_ts_cordova_platform_package: {
            release: {},
            debug: {},
        },
    });

    // set environment.
    grunt.registerTask('glue_ts_cordova_set_env', function () {
        grunt.config.set('glue_ts_cordova_tmpdir_org', grunt.config.get('tmpdir'));
        grunt.config.set('tmpdir', grunt.config.get('glue_ts_cordova_tmpdir'));
    });

    // restore environment.
    grunt.registerTask('glue_ts_cordova_restore_env', function () {
        grunt.config.set('tmpdir', grunt.config.get('glue_ts_cordova_tmpdir_org'));
    });

    // custom task: copy release build sources.
    grunt.registerTask('glue_ts_cordova_copy_platform_release_build_src', function () {
        doPlatformTask(this, function () {
            grunt.task.run('copy:glue_ts_cordova_platform_build_src');
        });
    });

    // custom task: set debug build sources.
    grunt.registerTask('glue_ts_cordova_set_debug_build_src', function () {
        var platforms = grunt.config.get('cordova_target_platforms');
        platforms.forEach(function (platform) {
            var portingDir = path.join('platforms', platform, grunt.config.get('porting'));
            (function () {
                // .ts target
                var tsDebugSrc = grunt.config.get('typescript_debug_src');
                tsDebugSrc.push(path.join(portingDir, grunt.config.get('scripts'), '**/*.ts'));
                grunt.config.set('typescript_debug_src', tsDebugSrc);
            }());
            (function () {
                // .scss target
                grunt.cdp.setCompassTarget('porting_' + platform, path.join(path.join(portingDir, grunt.config.get('stylesheets'))));
            }());
        });
    });

    // custom task: release build for "platform/porting".
    grunt.registerTask('glue_ts_cordova_build_platform_release', function () {
        doPlatformTask(this, function () {
            // "tmpdir" to "temp/platforms/<platform>".
            grunt.config.set('tmpdir', grunt.config.get('glue_ts_cordova_platform_work_dir'));
            // "lib_kind" to "porting".
            grunt.config.set('lib_kind', 'porting');
            // "lib_root_dir" to "temp/platforms/<platform>/porting".
            grunt.config.set('lib_root_dir', path.join(grunt.config.get('glue_ts_cordova_platform_work_dir'), grunt.config.get('porting')));
            // "lib_target_dir" to "temp/porting_<platform>".
            grunt.config.set('lib_target_dir', grunt.config.get('glue_ts_cordova_platform_pkg_dir'));

            // build
            grunt.task.run('lib_extract_module_info:scripts');
            grunt.task.run('lib_build_release');
            // html minify.
            if (!grunt.option('no-minify')) {
                grunt.task.run('htmlmin:glue_ts_cordova');
            } else {
                grunt.task.run('copy:glue_ts_cordova_instead_of_minify');
            }
        });
    });

    // custom task: set package souces.
    grunt.registerTask('glue_ts_cordova_set_package_src', function () {
        var copySrcStyleSheets = grunt.config.get('cordova_copy_src_stylesheets');
        copySrcStyleSheets.push('!**/*.scss');
        copySrcStyleSheets.push('!**/*.rb');
        grunt.config.set('cordova_copy_src_stylesheets', copySrcStyleSheets);
    });

    // custom task: package souces by platform.
    grunt.registerMultiTask('glue_ts_cordova_platform_package', function () {
        var isRelease = ('release' === this.target);

        doPlatformTask(this, function () {
            if (isRelease) {
                grunt.config.set('cordova_platform_porting_src', grunt.config.get('glue_ts_cordova_platform_pkg_dir'));
            } else {
                grunt.config.set('cordova_platform_porting_src', grunt.config.get('cordova_platform_porting'));
            }
            grunt.task.run('copy:cordova_platform');
            grunt.task.run('lower:glue_ts_cordova');
            if (isRelease) {
                grunt.task.run('cleanempty:cordova');
            } else {
                grunt.task.run('lower_path_in_html:glue_ts_cordova');
            }
        });
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // Helper API

    function doPlatformTask(owner, taskCallback) {
        var platforms = grunt.config.get('cordova_work_platforms');
        var platform;
        if (!!platforms && 0 < platforms.length) {
            platform = platforms.shift();
            // update variable.
            grunt.config.set('cordova_work_platforms', platforms);
            grunt.config.set('cordova_platform', platform);
            taskCallback();
            grunt.task.run(owner.nameArgs);
        }
    }


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    grunt.registerTask('glue_ts_cordova_prepare_release',   ['cordova_set_work_platforms', 'glue_ts_cordova_copy_platform_release_build_src']);
    grunt.registerTask('glue_ts_cordova_prepare_debug',     ['glue_ts_cordova_set_debug_build_src'                                          ]);

    grunt.registerTask('glue_ts_cordova_build_release',     ['app_release', 'cordova_set_work_platforms', 'glue_ts_cordova_build_platform_release']);
    grunt.registerTask('glue_ts_cordova_build_debug',       ['app_debug'                                                                          ]);

    grunt.registerTask('glue_ts_cordova_package_release',   ['glue_ts_cordova_set_package_src', 'cordova_set_work_platforms', 'glue_ts_cordova_platform_package:release']);
    grunt.registerTask('glue_ts_cordova_package_debug',     ['glue_ts_cordova_set_package_src', 'cordova_set_work_platforms', 'glue_ts_cordova_platform_package:debug'  ]);

    grunt.registerTask('glue_ts_cordova_release',           ['glue_ts_cordova_set_env', 'glue_ts_cordova_prepare_release', 'glue_ts_cordova_build_release',    'glue_ts_cordova_package_release', 'glue_ts_cordova_restore_env']);
    grunt.registerTask('glue_ts_cordova_debug',             [                           'glue_ts_cordova_prepare_debug',   'glue_ts_cordova_build_debug',      'glue_ts_cordova_package_debug'                                 ]);

    grunt.registerTask('glue_cordova:release',  ['glue_ts_cordova_release', 'clean:tmpdir']);
    grunt.registerTask('glue_cordova:debug',    ['glue_ts_cordova_debug'                  ]);
};
