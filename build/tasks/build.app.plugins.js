/*
 * build.app.plugins.js
 * app/plugins build script.
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path'),
        jsdom = require('jsdom'),
        window = jsdom.jsdom().defaultView,
        $ = require('jquery')(window);

    grunt.extendConfig({

        // config variable entries: directory
        plugins: 'plugins',                 // app/plugins default directory.
        plugins_www: 'www',                 // app/plugins/{id}/www default directory
        plugins_src: 'src',                 // app/plugins/{id}/src default directory

        // internal variable
        app_plugins_pkgdir: 'plugins',      // cordova original plugins dir name.
        app_plugins_root_dir: '',           // plugin bulid source directory
        app_plugins_mode_release: false,    // flag for release build

        app_plugins_targets_info: [],       // build target info
        app_plugins_work_plugins: [],       // work target queue
        app_plugins_work_scripts_info: [],  // work script files for build
        app_plugins_work_id: '',            // work plugin id
        app_plugins_work_script_name: '',   // work script file name
        app_plugins_work_version: '',       // work plugin version, for banner

        app_plugins_native_src: {},

        // clean for plugin directory
        clean: {
            app_plugins_src: {
                files: {
                    src: [
                        '<%= orgsrc %>/<%= plugins %>/**/*.js',
                        '<%= orgsrc %>/<%= plugins %>/**/*.map',
                    ],
                },
            },
            app_plugins: {
                files: {
                    src: [
                        '<%= app_plugins_pkgdir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/**',
                        '<%= app_plugins_pkgdir %>/<%= app_plugins_work_id %>/<%= plugins_src %>/**',
                        '<%= app_plugins_pkgdir %>/<%= app_plugins_work_id %>/plugin.xml',
                    ],
                },
            },
        },

        // file copy
        copy: {
            // for release build.
            app_plugins_prepare: {
                files: [
                    {// all files copy to temp.
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: ['<%=  plugins %>/**'],
                        dest: '<%= tmpdir %>',
                    },
                ],
            },
            app_plugins_tests: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= app_plugins_root_dir %>',
                        src: ['<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.js'],
                        dest: '<%= app_plugins_pkgdir %>',
                    },
                ],
            },
            // instead of minify copy task
            app_plugins_instead_of_minify: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= app_plugins_root_dir %>',
                        src: ['*/<%= plugins_www %>/*.js'],
                        dest: '<%= app_plugins_pkgdir %>',
                    },
                ],
            },
            app_plugins_package: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= app_plugins_root_dir %>',
                        src: ['*/plugin.xml'],
                        dest: '<%= app_plugins_pkgdir %>',
                    },
                ],
            },
            app_plugins_plugin_package: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= app_plugins_root_dir %>',
                        src: ['*/plugin.xml', '*/*/*.js', '*/*/*.d.ts'],
                        dest: '<%= app_plugins_pkgdir %>',
                    },
                ],
            },
        },

        // typescript building
        ts: {
            app_plugins_release: {
                options: {
                    comments: true,
                    declaration: true,
                    sourceMap: false,
                },
                files: [
                    {
                        '<%= app_plugins_root_dir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.js': '<%= app_plugins_root_dir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.ts',
                    },
                ],
            },
            app_plugins_debug: {
                options: {
                    sourceMap: false,
                },
                files: [
                    {
                        '<%= app_plugins_pkgdir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.js': '<%= app_plugins_root_dir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.ts',
                    },
                ],
            },
            app_plugins_tests: {
                options: {
                    sourceMap: false,
                },
                files: [
                    {
                        '': '<%= app_plugins_root_dir %>/<%= app_plugins_work_id %>/<%= plugins_www %>/<%= app_plugins_work_script_name %>.ts',
                    },
                ],
            },
        },

        // js minify
        uglify: {
            app_plugins: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= app_plugins_root_dir %>',
                        src: ['*/<%= plugins_www %>/*.js'],
                        dest: '<%= app_plugins_pkgdir %>',
                    },
                ],
            },
        },

        // custom task: set plugin root dir.
        app_plugins_set_root_dir: {
            release: {},
            debug: {},
        },

    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: set plugin root dir.
    grunt.registerMultiTask('app_plugins_set_root_dir', function () {
        var root;
        switch (this.target) {
            case 'release':
                root = path.join(grunt.config.get('tmpdir'), grunt.config.get('plugins'));
                grunt.config.set('app_plugins_mode_release', true);
                break;
            case 'debug':
                root = path.join(grunt.config.get('orgsrc'), grunt.config.get('plugins'));
                break;
            default:
                throw 'unknown build option: ' + this.target;
        }
        grunt.config.set('app_plugins_root_dir', root);
    });

    // custom task: set target plugins
    grunt.registerTask('app_plugins_set_targets', function () {
        var targetPlugins = grunt.config.get('app_plugins_targets_info');
        var root = grunt.config.get('app_plugins_root_dir');

        if (fs.existsSync(root)) {
            fs.readdirSync(root).forEach(function (id) {
                var plugin = {};
                var pluginDir = path.join(root, id);
                var srcDir = path.join(pluginDir, grunt.config.get('plugins_www'));
                if (fs.statSync(pluginDir).isDirectory() && fs.statSync(srcDir).isDirectory()) {
                    plugin.id = id;
                    plugin.scripts = queryTargetScripts(srcDir);
                    plugin.version = queryPluginVersion(pluginDir);
                    targetPlugins.push(plugin);
                }
            });
        }

        grunt.config.set('app_plugins_targets_info', targetPlugins);
    });

    // custom task: set work plugins
    grunt.registerTask('app_plugins_set_work_plugins', function () {
        grunt.config.set('app_plugins_work_plugins', grunt.config.get('app_plugins_targets_info').slice(0));
    });

    // custom task: clean package plugin directory
    grunt.registerTask('app_plugins_clean', function () {
        doPluginTask(this, function (plugin) {
            // update variable.
            grunt.config.set('app_plugins_work_id', plugin.id);
            // schedule next tasks.
            grunt.task.run('clean:app_plugins');
        });
    });

    // custom task: build all plugins
    grunt.registerTask('app_plugins_build_plugins', function () {
        doPluginTask(this, function (plugin) {
            // update variable.
            grunt.config.set('app_plugins_work_scripts_info', plugin.scripts.slice(0));
            grunt.config.set('app_plugins_work_id', plugin.id);
            grunt.config.set('app_plugins_work_version', plugin.version);

            // schedule next tasks.
            grunt.task.run('app_plugins_build_scripts');
        });
    });

    // custom task: build all scrips
    grunt.registerTask('app_plugins_build_scripts', function () {
        var scripts = grunt.config.get('app_plugins_work_scripts_info');
        var script;

        // special case: the system assumes auto-test script when plugin's id is finished ".tests".
        var isTests = function () {
            return !!grunt.config.get('app_plugins_work_id').match(/\.tests$/i);
        };

        if (!!scripts && 0 < scripts.length) {
            script = scripts.shift();
            // update variable.
            grunt.config.set('app_plugins_work_scripts_info', scripts);
            grunt.config.set('app_plugins_work_script_name', script);

            // schedule next tasks.
            if (isTests()) {
                grunt.task.run('ts:app_plugins_tests');
                setBanner();
                grunt.task.run('copy:app_plugins_tests');
            } else if (grunt.config.get('app_plugins_mode_release')) {
                grunt.task.run('ts:app_plugins_release');
                setBanner();
            } else {
                grunt.task.run('ts:app_plugins_debug');
            }
            grunt.task.run('app_plugins_build_scripts');
        }
    });

    // custom task: set native source information
    grunt.registerTask('app_plugins_set_native_src', function () {
        doPluginTask(this, function (plugin) {
            var nativeSrc = grunt.config.get('app_plugins_native_src');

            var domConfigXml = jsdom.jsdom(fs.readFileSync('config.xml').toString());
            var appDirName = $(domConfigXml).find('name').text();

            var pluginXml = path.join(grunt.config.get('orgsrc'), grunt.config.get('plugins'), plugin.id, 'plugin.xml');
            var domPluginXml = jsdom.jsdom(fs.readFileSync(pluginXml).toString());

            nativeSrc[plugin.id] = [];

            // for android
            (function () {
                var $android = $(domPluginXml).find('platform[name=android]').find('source-file');
                $android.each(function (index, src) {
                    var pluginSrc = $(src).attr('src');
                    var pluginDst = $(src).attr('target-dir');
                    var pluginFile = path.basename(pluginSrc);
                    nativeSrc[plugin.id].push({
                        packageSrc: path.join('platforms/android', pluginDst, pluginFile),
                        packageDst: path.join(plugin.id, pluginSrc),
                    });
                });
            })();

            // for ios
            (function () {
                var $ios = $(domPluginXml).find('platform[name=ios]').find('source-file, header-file');
                $ios.each(function (index, src) {
                    var pluginSrc = $(src).attr('src');
                    var pluginDst = $(src).attr('target-dir') ? $(src).attr('target-dir') : '';
                    var pluginFile = path.basename(pluginSrc);
                    nativeSrc[plugin.id].push({
                        packageSrc: path.join('platforms/ios', appDirName, 'Plugins', plugin.id, pluginDst, pluginFile),
                        packageDst: path.join(plugin.id, pluginSrc),
                    });
                });
            })();

            grunt.config.set('app_plugins_native_src', nativeSrc);
        });
    });

    // custom task: copy native sources for package plugins.
    grunt.registerTask('app_plugins_copy_native_src', function () {
        var nativeSrc = grunt.config.get('app_plugins_native_src');
        var packageDir = grunt.config.get('app_plugins_pkgdir');

        var safeCopy = function (src, dst) {
            var mkdir = function (dirPath, root) {
                var dirs = dirPath.split(/[\/\\]/),
                    dir = dirs.shift(),
                    root = (root || '') + dir + '/';
                if (!fs.existsSync(root)) {
                    fs.mkdirSync(root);
                }
                return !dirs.length || mkdir(dirs.join('/'), root);
            };

            if (fs.existsSync(src)) {
                mkdir(path.dirname(dst));
                fs.writeFileSync(dst, fs.readFileSync(src));
            }
        };

        (function () {
            for (var key in nativeSrc) {
                if (nativeSrc.hasOwnProperty(key)) {
                    for (var i = 0, n = nativeSrc[key].length; i < n; i++) {
                        var file = nativeSrc[key][i];
                        safeCopy(file.packageSrc, path.join(packageDir, file.packageDst));
                    }
                }
            }
        })();
    });

    // custom task: mifnify if needed.
    grunt.registerTask('app_plugins_minify', function () {
        if (!grunt.option('no-minify')) {
            grunt.task.run('uglify:app_plugins');
        } else {
            grunt.task.run('copy:app_plugins_instead_of_minify');
        }
    });

    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // Helper API

    function doPluginTask(owner, taskCallback) {
        var plugins = grunt.config.get('app_plugins_work_plugins');
        var plugin;
        if (!!plugins && 0 < plugins.length) {
            plugin = plugins.shift();
            // update variable.
            grunt.config.set('app_plugins_work_plugins', plugins);
            taskCallback(plugin);
            grunt.task.run(owner.nameArgs);
        }
    }

    // query build target scripts.
    function queryTargetScripts(targetDir) {
        var scripts = [];
        fs.readdirSync(targetDir).forEach(function (file) {
            if (!path.basename(file).toLowerCase().match(/.d.ts/g) && path.basename(file).toLowerCase().match(/\.ts$/i)) {
                scripts.push(path.basename(file, path.extname(file)));
            }
        });
        return scripts;
    }

    // query plugin version.
    function queryPluginVersion(pluginDir) {
        var pluginXml = path.join(pluginDir, 'plugin.xml');

        var domPluginXml = jsdom.jsdom(fs.readFileSync(pluginXml).toString());
        return $(domPluginXml).find('plugin').attr('version');
    }

    // set banner if needed.
    function setBanner() {
        if (grunt.config.get('app_plugins_mode_release')) {
            var moduleName = grunt.config.get('app_plugins_work_script_name') + '.js';
            var version = grunt.config.get('app_plugins_work_version');
            var src = path.join(
                grunt.config.get('app_plugins_root_dir'),
                grunt.config.get('app_plugins_work_id'),
                grunt.config.get('plugins_www'),
                grunt.config.get('app_plugins_work_script_name') + '.js'
            );

            var info = {
                src: src,
                moduleName: moduleName,
                version: version,
            };

            grunt.config.set('banner_info', info);
            grunt.task.run('banner_setup');
        }
    }

    //__________________________________________________________________________________________________________________________________________________________________________________________//


    grunt.cdp = grunt.createCustomTaskEntry(grunt.cdp, 'app_before_build');
                grunt.createCustomTaskEntry(grunt.cdp, 'cordova_prepare_hook');

    grunt.cdp.custom_tasks['app_before_build'].release.push('app_plugins_release');
    grunt.cdp.custom_tasks['app_before_build'].debug.push('app_plugins_debug');
    grunt.cdp.custom_tasks['cordova_prepare_hook'].release.push('app_plugins_cordova_prepare_release');
    grunt.cdp.custom_tasks['cordova_prepare_hook'].debug.push('app_plugins_cordova_prepare_debug');


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // task unit
    grunt.registerTask('app_plugins_prepare_native_src', ['app_plugins_set_work_plugins', 'app_plugins_set_native_src', 'app_plugins_copy_native_src:prepare']);

    grunt.registerTask('app_plugins_prepare_release',   ['copy:app_plugins_prepare', 'app_plugins_set_root_dir:release', 'app_plugins_set_targets', 'app_plugins_set_work_plugins', 'app_plugins_clean', 'app_plugins_prepare_native_src']);
    grunt.registerTask('app_plugins_prepare_debug',     [                            'app_plugins_set_root_dir:debug',   'app_plugins_set_targets', 'app_plugins_set_work_plugins', 'app_plugins_clean', 'app_plugins_prepare_native_src']);

    grunt.registerTask('app_plugins_build_release',     ['app_plugins_set_work_plugins', 'app_plugins_build_plugins', 'app_plugins_minify']);
    grunt.registerTask('app_plugins_build_debug',       ['app_plugins_set_work_plugins', 'app_plugins_build_plugins'                      ]);

    grunt.registerTask('app_plugins_package_release',   ['copy:app_plugins_package']);
    grunt.registerTask('app_plugins_package_debug',     ['copy:app_plugins_package']);

    grunt.registerTask('app_plugins_release',           ['app_plugins_prepare_release', 'app_plugins_build_release',    'app_plugins_package_release']);
    grunt.registerTask('app_plugins_debug',             ['app_plugins_prepare_debug',   'app_plugins_build_debug',      'app_plugins_package_debug'  ]);

    // for app build entry
    grunt.registerTask('app_plugins_cordova_prepare_release',   ['app_prepare_release', 'app_plugins_release', 'clean:tmpdir']);
    grunt.registerTask('app_plugins_cordova_prepare_debug',     [                       'app_plugins_debug'                  ]);
};
