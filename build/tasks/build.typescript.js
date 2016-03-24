/*
 * build.typescript.js
 */


module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path');

    grunt.extendConfig({

        // config variable: tasks
        typescript_debug_src: ['<%= orgsrc %>/**/*.ts', '!<%= orgsrc %>/<%= modules %>/**/*.ts'],

        // clean
        clean: {
            ts: {
                files: [
                    {// root/.tscache.
                        src: ['.tscache'],
                    },
                ],
            },
        },

        // typescript building
        ts: {
            options: {
                target: 'es5', // or es3/es6
                comments: true,
                sourceMap: false,
            },
            release: {
                files: [
                    {// singularly loaded
                        '': ['<%= tmpdir %>/<%= scripts %>/*.ts'],
                    },
                    {// loaded with lazy and concatenated
                        '<%= tmpdir %>/<%= scripts %>/app<%= app_js_suffix %>.js': '<%= app_scripts %>',
                    },
                ],
            },
            debug: {
                options: {
                    sourceMap: true,
                },
                files: [
                    {
                        '': '<%= typescript_debug_src %>',
                    },
                ],
            },
        },

        // custom task: typescript app build
        typescript_app: {
            release: {},
            debug: {},
        },

    });

    // load plugin(s).
    grunt.loadNpmTasks('grunt-ts');


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: Build typescript libraries.
    grunt.registerTask('update_module_general_ignore_type', "Update module general copy task's ignore list.", function () {
        var list = grunt.config.get('module_general_target');
        list.push('!**/*.d.ts');
        grunt.config.set('module_general_target', list);
    });

    // custom task: embed app-all.js.
    grunt.registerTask('app_embed_all_scripts', " Embed app-all.js. to app.js.", function () {
        grunt.cdp.embedConcatenatedScript(path.join(grunt.config.get('tmpdir'), grunt.config.get('scripts'), 'app'));
    });

    // custom task: typescript app build.
    grunt.registerMultiTask('typescript_app', 'Build Typescript for app task.', function () {
        switch (this.target) {
            case 'release':
                grunt.task.run('ts:release');
                if (!!grunt.config.get('app_js_suffix')) {
                    grunt.task.run('app_embed_all_scripts');
                }
                break;
            case 'debug':
                grunt.task.run('ts:debug');
                break;
            default:
                throw 'unknown build option: ' + this.target;
        }
    });

    // embed "target-all.js" to "target.js" special comment block.
    grunt.cdp.embedConcatenatedScript = function (target) {
        var root = grunt.file.read(target + '.js');
        var imple = grunt.file.read(target + '-all.js');
        // replace "//<<" *** "//>>" to -all.js text.
        var jsModule = root.replace(/\/\/<<[\s\S]*?\/\/>>/, imple);

        fs.writeFileSync(target + '.js', jsModule);
        //grunt.file.delete(target + '-all.js');
        fs.renameSync(target + '-all.js', target + '-all.js.txt');
    };
};
