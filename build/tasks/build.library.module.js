/*
 * library build tasks
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path'),
        jsdom = require('jsdom'),
        window = jsdom.jsdom().defaultView,
        $ = require('jquery')(window);

    grunt.extendConfig({

        // config variable entries: directory
        libraries: 'lib',                                   // internal-lib modules default directory.

        // config variable entries: tasks
        lib_kind: 'lib',                                    // module kind definition.
        lib_module_scripts_ext: 'html',                     // construct modules scripts reference file's extension.
        lib_root_dir: '<%= tmpdir %>/<%= libraries %>',     // using module build source location.
        lib_target_dir: '<%= pkgdir %>/<%= libraries %>',   // using module build target location.

        // internal variable
        lib_work_dir_scripts: '<%= lib_root_dir %>/<%= scripts %>',
        lib_work_dir_stylesheets: '<%= lib_root_dir %>/<%= stylesheets %>',

        lib_module_target: null,
        lib_module_scripts: null,
        lib_js_modules_info: [],
        lib_css_modules_info: [],
        lib_kind_fileter_enable: true,

        // typescript building
        ts: {
            lib: {
                options: {
                    comments: true,
                    declaration: true,
                },
                files: [
                    {
                        '<%= lib_work_dir_scripts %>/<%= lib_module_target %>.js': ['<%= lib_work_dir_scripts %>/<%= lib_module_target %>.ts'],
                    },
                    {
                        '<%= lib_work_dir_scripts %>/<%= lib_module_target %>-all.js': '<%= lib_module_scripts %>',
                    },
                ],
            },
        },

        // js minify
        uglify: {
            lib: {
                files: [
                    {// "lib/scripts"
                        expand: true,
                        cwd: '<%= lib_root_dir %>',
                        src: ['<%= scripts %>/*.js'],
                        dest: '<%= lib_target_dir %>',
                    },
                ],
            },
        },

        // css minify
        cssmin: {
            lib: {
                files: [
                    {// "lib/stylesheets"
                        expand: true,
                        cwd: '<%= lib_root_dir %>',
                        src: ['<%= stylesheets %>/*.css'],
                        dest: '<%= lib_target_dir %>',
                    },
                ],
            },
        },

        // Rename files while in task
        rename: {
            lib_replace_d_ts: {
                files: [
                    {
                        '<%= lib_work_dir_scripts %>/<%= lib_module_target %>.d.ts': '<%= lib_work_dir_scripts %>/<%= lib_module_target %>-all.d.ts',
                    }
                ]
            },
        },

        // clean
        clean: {
            lib: {
                files: [
                    {// lib/scripts.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= libraries %>/<%= scripts %>',
                        src: ['**/*.js', '!**/cdp.core.js', '!**/cdp.lazyload.js', '**/*.map'],
                    },
                    {// lib/stylesheets.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= libraries %>/<%= stylesheets %>',
                        src: ['*.css', '.sass-cache'],
                    },
                ],
            },
        },

        // file copy
        copy: {
            // for release build.
            lib_release: {
                files: [
                    {// libraries css resources
                        expand: true,
                        cwd: '<%= lib_root_dir %>',
                        src: ['<%= stylesheets %>/**', '!**/*.css', '!**/*.scss', '!**/*.rb'],
                        dest: '<%= lib_target_dir %>',
                    },
                ],
            },
            // instead of minify copy task
            lib_instead_of_minify: {
                files: [
                    {// "lib/scripts"
                        expand: true,
                        cwd: '<%= lib_root_dir %>',
                        src: ['<%= scripts %>/*.js'],
                        dest: '<%= lib_target_dir %>',
                    },
                    {// "lib/stylesheets"
                        expand: true,
                        cwd: '<%= lib_root_dir %>',
                        src: ['<%= stylesheets %>/*.css'],
                        dest: '<%= lib_target_dir %>',
                    },
                ],
            },
            // prepare work directories: *support for "lib" package only.
            lib_prepare: {
                files: [
                    {// app/lib
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: '<%= libraries %>/**',
                        dest: '<%= tmpdir %>',
                    },
                ],
            },
            // for debug build: *support for "lib" package only.
            lib_debug: {
                files: [
                    {// ts/js.
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: ['<%= libraries %>/<%= scripts %>/**'],
                        dest: '<%= pkgdir %>'
                    },
                    {// css
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: ['<%= libraries %>/<%= stylesheets %>/**', '!**/*.scss', '!**/*.rb'],
                        dest: '<%= pkgdir %>'
                    },
                ],
            },
        },

        // for debug build: lower path in construct modules scripts reference file.
        lower_path_in_html: {
            lib: {
                src: ['<%= pkgdir %>/<%= libraries %>/<%= scripts %>/**/*.<%= lib_module_scripts_ext %>'],
            },
        },

        // custom task: add compass targets task.
        lib_set_compass_target: {
            release: {},
            debug: {},
        },

        // custom task: extract libraries information.
        lib_extract_module_info: {
            scripts: {},
            stylesheets: {},
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: Build typescript libraries.
    grunt.registerTask('lib_set_js_module_info', 'Copy script module info from master.', function () {
        var masterModuleInfo = grunt.config.get('js_modules_info').slice(0);
        var targetModuleInfo = [];
        var kind = grunt.config.get('lib_kind');
        if (grunt.config.get('lib_kind_fileter_enable')) {
            for (var i = 0, n = masterModuleInfo.length; i < n; i++) {
                var info = masterModuleInfo[i];
                if (!info.kind && ('lib' === kind)) { // default
                    targetModuleInfo.push(info);
                } else if (info.kind === kind) {
                    targetModuleInfo.push(info);
                }
            }
        } else {
            targetModuleInfo = masterModuleInfo;
        }
        grunt.config.set('lib_js_modules_info', targetModuleInfo);
    });

    // custom task: Build typescript libraries.
    grunt.registerTask('lib_build_scripts', 'Build typescript libraries.', function () {
        var jsModule = null;
        var jsModuleInfo = grunt.config.get('lib_js_modules_info');
        if (!!jsModuleInfo && 0 < jsModuleInfo.length) {
            jsModule = jsModuleInfo.shift();
            // update variable.
            grunt.config.set('lib_js_modules_info', jsModuleInfo);
            grunt.config.set('lib_module_target', jsModule.name);
            grunt.config.set('lib_module_scripts', jsModule.src);
            // schedule next tasks.
            grunt.task.run(['ts:lib']);
            grunt.task.run(['rename:lib_replace_d_ts']);
            grunt.task.run(['lib_embed_module_imple']);
        }
    });

    // custom task: Append module implementation to module's root file.
    grunt.registerTask('lib_embed_module_imple', "Embed module implementation to module's root file.", function () {
        var target = path.join(grunt.config.get('lib_work_dir_scripts'), grunt.config.get('lib_module_target'));
        // embed "target-all.js" to "target.js".
        grunt.cdp.embedConcatenatedScript(target);
        // schedule next task, check next module.
        grunt.task.run(['lib_build_scripts']);
    });

    // custom task: add compass targets task.
    grunt.registerMultiTask('lib_set_compass_target', 'Add compass targets task.', function () {
        switch (this.target) {
            case 'release':
                grunt.cdp.setCompassTarget(grunt.config.get('lib_kind'), grunt.config.get('lib_work_dir_stylesheets'));
                break;
            case 'debug':
                grunt.cdp.setCompassTarget(grunt.config.get('lib_kind'), path.join(grunt.config.get('orgsrc'), grunt.config.get('libraries'), grunt.config.get('stylesheets')));
                break;
            default:
                throw 'unknown build option: ' + this.target;
        }
    });

    // custom task: Build typescript libraries.
    grunt.registerTask('lib_build_stylesheets', 'Build scss libraries.', function () {
        var kind = grunt.config.get('lib_kind');
        var compass = grunt.config.get('compass');
        if (compass[kind]) {
            grunt.task.run('compass:' + kind);
        }
    });

    // custom task: Extract libraries information.
    grunt.registerMultiTask('lib_extract_module_info', "Extract libraries information.", function () {
        var docDom = jsdom.jsdom(fs.readFileSync(path.join(grunt.config.get("tmpdir"), "index.html")).toString());
        switch (this.target) {
            case 'scripts':
                grunt.cdp.prepareJsModulesInfo(docDom);
                break;
            case 'stylesheets':
                prepareCssModulesInfo(docDom);
                break;
            default:
                throw 'unknown build option: ' + this.target;
        }
    });

    // custom task: mifnify if needed.
    grunt.registerTask('lib_minify', function () {
        if (!grunt.option('no-minify')) {
            grunt.task.run(['uglify:lib', 'cssmin:lib']);
        } else {
            grunt.task.run('copy:lib_instead_of_minify');
        }
    });

    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // Helper API

    //! extract css libraries info.
    function prepareCssModulesInfo(docDom) {
        var cssModule = { name: '' },
            cssModulesInfo = [];
        $(docDom).find('link[rel="stylesheet"]')
            .filter(function () {
                if (grunt.config.get('lib_kind_fileter_enable')) {
                    var type = path.join(grunt.config.get('lib_kind'), grunt.config.get('stylesheets'));
                    var regexp = new RegExp('^' + type + '\/', 'i');
                    return $(this).attr('href').match(regexp) ? true : false;
                } else {
                    return true;
                }
            })
            .each(function () {
                var href = $(this).attr('href');
                var name = href.slice(href.lastIndexOf('/') + 1, href.length).replace(/\.css$/i, '');
                cssModule = {
                    name: name,
                    version: $(this).attr('data-version'),
                };
                cssModulesInfo.push(cssModule);
            });
        // set lib_css_modules_info
        grunt.config.set('lib_css_modules_info', cssModulesInfo);
    }


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // task unit
    grunt.registerTask('lib_update_env',    ['lib_set_compass_target:release', 'lib_set_js_module_info']);
    grunt.registerTask('lib_build_modules', ['lib_build_scripts', 'lib_build_stylesheets']);

    // library build for release build
    grunt.registerTask('lib_build_release', ['lib_update_env', 'lib_build_modules', 'lib_minify', 'copy:lib_release']);
    grunt.registerTask('lib_build_debug',   ['lib_set_compass_target:debug'                                         ]);  // only scheduled compass target. actual build process is "ts:build" and "compass".
};
