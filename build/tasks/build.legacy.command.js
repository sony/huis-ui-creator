/*
 * legacy build command support script
 */

module.exports = function (grunt) {

    var path = require('path');

    grunt.extendConfig({

        legacy_command_platform_target: '',
        legacy_command_pkgdst: '<%= tmpdir %>',

        clean: {
            legacy_command: {
                files: {
                    src: [
                        '<%= legacy_command_pkgdst %>/*', '!<%= legacy_command_pkgdst %>/*.js', '!<%= legacy_command_pkgdst %>/plugins', '!<%= legacy_command_pkgdst %>',
                    ],
                },
            },
            legacy_command_all: {
                files: {
                    src: [
                        'platforms/android/assets/www/*', '!platforms/android/assets/www/*.js', '!platforms/android/assets/www/plugins', '!platforms/android/assets/www',
                        'platforms/*/www/*', '!platforms/*/www/*.js', '!platforms/*/www/plugins', '!platforms/*/www',
                        '<%= pkgdir %>/*', '!<%= pkgdir %>/*.js', '!<%= pkgdir %>/plugins', '!<%= pkgdir %>',
                    ],
                },
            },
        },

        // file copy
        copy: {
            // for cordova copy task emulate
            legacy_command: {
                files: [
                    {// www -> platform/<pkgdst>.
                        expand: true,
                        cwd: '<%= pkgdir %>',
                        src: '**',
                        dest: '<%= legacy_command_pkgdst %>'
                    },
                    {// platform_www -> platform/<pkgdst>.
                        expand: true,
                        cwd: '<%= cordova_platform_www %>',
                        src: '**',
                        dest: '<%= legacy_command_pkgdst %>'
                    },
                ]
            },
            // for dev (release)
            legacy_command_dev_prepare: {
                files: [
                    {// porting -> temp/porting.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>',
                        src: '**',
                        dest: '<%= tmpdir %>/<%= porting %>'
                    },
                ]
            },
            // for dev_debug
            legacy_command_dev_debug: {
                files: [
                    {// porting -> www : scripts.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>',
                        src: ['<%= scripts %>/**'],
                        dest: '<%= legacy_command_pkgdst %>/<%= porting %>'
                    },
                    {// porting -> www : stylesheets.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>',
                        src: ['<%= stylesheets %>/**', '!**/*.scss', '!**/*.rb'],
                        dest: '<%= legacy_command_pkgdst %>/<%= porting %>'
                    },
                    {// porting -> www : templates.
                        expand: true,
                        cwd: '<%= orgsrc %>/<%= porting %>',
                        src: ['<%= templates %>/**'],
                        dest: '<%= legacy_command_pkgdst %>/<%= porting %>'
                    },
                ]
            },
        },

        // html minify
        htmlmin: {
            legacy_command: {
                files: [
                    {//  temp/porting/templates/* 
                        expand: true,
                        cwd: '<%= tmpdir %>/<%= porting %>',
                        src: ['<%= templates %>/**/*.<%= template_ext %>'],
                        dest: '<%= legacy_command_pkgdst %>/<%= porting %>',
                    },
                ],
            },
        },

        // url string lower task
        lower: {
            legacy_command: {
                src: '<%= legacy_command_pkgdst %>/<%= porting %>/**',
            },
        },

        // for html internal paths.
        lower_path_in_html: {
            legacy_command: {
                src: ['<%= legacy_command_pkgdst %>/<%= porting %>/<%= scripts %>/**/*.<%= lib_module_scripts_ext %>'],
            },
        },

        // custom task: set legacy command package destination.
        legacy_command_set_pkgdst: {
            android: {},
            ios: {},
            winrt: {},
            web: {},
            development: {},
        },

        // custom task: clean package destination.
        legacy_command_clean: {
            android: {},
            ios: {},
            winrt: {},
            web: {},
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: set legacy command package destination.
    grunt.registerMultiTask('legacy_command_set_pkgdst', 'set legacy command package destination.', function () {
        var platform = this.target;
        grunt.config.set('legacy_command_platform_target', platform);

        switch (platform) {
            case 'ios':
                grunt.config.set('legacy_command_pkgdst', 'platforms/ios/www');
                break;
            case 'android':
                grunt.config.set('legacy_command_pkgdst', 'platforms/android/assets/www');
                break;
            case 'winrt':
                grunt.config.set('legacy_command_pkgdst', 'platforms/windows8/www');
                break;
            case 'web':
                grunt.config.set('legacy_command_pkgdst', 'platforms/browser/www');
                break;
            case 'development':
                grunt.config.set('legacy_command_pkgdst', grunt.config.get('pkgdir'));
                break;
            default:
                throw 'unknown platform';
        }
    });

    // custom task: clean package destination.
    grunt.registerMultiTask('legacy_command_clean', 'clean package destination.', function () {
        grunt.task.run('legacy_command_set_pkgdst:' + this.target);
        grunt.task.run('clean:legacy_command');
    });

    // custom task: release build for dev/porting.
    grunt.registerTask('legacy_command_build_dev_poritng_release', function () {
        // "lib_kind" to "porting".
        grunt.config.set('lib_kind', 'porting');
        // "lib_root_dir" to "temp/platforms/<platform>/porting".
        grunt.config.set('lib_root_dir', path.join(grunt.config.get('tmpdir'), grunt.config.get('porting')));
        // "lib_target_dir" to "temp/porting_<platform>".
        grunt.config.set('lib_target_dir', path.join(grunt.config.get('legacy_command_pkgdst'), grunt.config.get('porting')));

        // build
        grunt.task.run('lib_extract_module_info:scripts');
        grunt.task.run('lib_build_release');
        grunt.task.run('htmlmin:legacy_command');
    });

    // custom task: set debug build sources.
    grunt.registerTask('legacy_command_set_dev_debug_build_src', function () {
        var portingDir = path.join(grunt.config.get('orgsrc'), grunt.config.get('porting'));
        // .scss target
        grunt.cdp.setCompassTarget('porting', path.join(path.join(portingDir, grunt.config.get('stylesheets'))));
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // task unit
    grunt.registerTask('legacy_command_lower',          ['lower:legacy_command']);
    grunt.registerTask('legacy_command_lower_debug',    ['lower:legacy_command', 'lower_path_in_html:legacy_command']);

    grunt.registerTask('android',       ['legacy_command_clean:android', 'cordova_build_release:android', 'copy:legacy_command']);
    grunt.registerTask('android_debug', ['legacy_command_clean:android', 'cordova_build_debug:android',    'copy:legacy_command']);

    grunt.registerTask('ios',           ['legacy_command_clean:ios', 'cordova_build_release:ios',  'copy:legacy_command']);
    grunt.registerTask('ios_debug',     ['legacy_command_clean:ios', 'cordova_build_debug:ios',    'copy:legacy_command']);

    grunt.registerTask('winrt',         ['legacy_command_clean:winrt', 'cordova_build_release:windows8',   'copy:legacy_command']);
    grunt.registerTask('winrt_debug',   ['legacy_command_clean:winrt', 'cordova_build_debug:windows8',     'copy:legacy_command']);

    grunt.registerTask('web',           ['legacy_command_clean:web', 'cordova_build_release:browser',  'copy:legacy_command']);
    grunt.registerTask('web_debug',     ['legacy_command_clean:web', 'cordova_build_debug:browser',    'copy:legacy_command']);

    grunt.registerTask('development',       ['core_config', 'legacy_command_set_pkgdst:development',                                           'app_release', 'copy:legacy_command_dev_prepare', 'legacy_command_build_dev_poritng_release',   'legacy_command_lower',         'cleanempty:release', 'clean:tmpdir']);
    grunt.registerTask('development_debug', ['core_config', 'legacy_command_set_pkgdst:development', 'legacy_command_set_dev_debug_build_src', 'app_debug',                           'copy:legacy_command_dev_debug',                         'legacy_command_lower_debug'                                        ]);

    grunt.registerTask('dev',       ['development']);
    grunt.registerTask('dev_debug', ['development_debug']);
};
