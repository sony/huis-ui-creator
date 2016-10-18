/*
 * lower path converting task
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path'),
        jsdom = require('jsdom'),
        window = jsdom.jsdom().defaultView,
        $ = require('jquery')(window);

    grunt.extendConfig({

        // config variable
        lower_enable: false,
        lower_delay_time: 100,      // wait for lower kick time.

        // url string lower task
        lower: {
            app: {
                src: '<%= pkgdir %>/**',
            },
        },

        // for html internal paths.
        lower_path_in_html: {
            app: {
                src: ['<%= pkgdir %>/index.html'],
            },
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: To lower case strings of files and directories name.
    grunt.registerMultiTask('lower', 'To lower case strings of files and directories name.', function () {
        if (grunt.config.get('lower_enable')) {
            var done = this.async();
            setTimeout(function () {
                var path = require('path');
                this.filesSrc.sort(function (lhs, rhs) {
                    return (lhs.toLowerCase() < rhs.toLowerCase()) ? 1 : -1;
                }).filter(function (filepath) {
                    var stat = fs.statSync(filepath);
                    if (stat.isDirectory()) {
                        return true;
                    }

                    // [2014-04-03 18:23:09+09:00] kan.k: Sometimes, rename
                    // error occurs caused by file lock on Windows based
                    // environment. So separating phases to rename files and
                    // directories is to avoid this lock issue.
                    var lowerfilepath = path.join(path.dirname(filepath), path.basename(filepath).toLowerCase());
                    // console.log("renaming in filter: from %s to ", filepath, lowerdir);
                    fs.renameSync(filepath, lowerfilepath);

                    // [2014-04-03 18:50:10+09:00] kan.k: above path.join()
                    // supports file name only path(e.g. "brabra.js"), too.

                    return false;
                }).forEach(function (dirpath) {
                    var lowerdir = path.join(path.dirname(dirpath), path.basename(dirpath).toLowerCase());
                    // console.log("renaming in forEach: from %s to ", dirpath, lowerdir);
                    fs.renameSync(dirpath, lowerdir);
                });
                done(true);
            }.bind(this), grunt.config.get('lower_delay_time'));
        }
    });

    // custom task: To lower case source paths in html.
    grunt.registerMultiTask('lower_path_in_html', 'To lower case source paths in html.', function () {
        if (grunt.config.get('lower_enable')) {
            this.filesSrc.forEach(function (file) {
                fs.writeFileSync(file, jsdom.serializeDocument(getConvetedDom(file)));
            });
        }
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // Helper API

    function getConvetedDom(filePath) {
        var dom = jsdom.jsdom(fs.readFileSync(filePath).toString());
        lowerScriptsInfo(dom);
        lowerCSSInfo(dom);
        return dom;
    }

    // lower src of scripts .
    function lowerScriptsInfo(docDom) {
        // read index file, and getting target ts files.
        var $scripts = $(docDom).find('script[src]');
        $scripts.each(function () {
            $(this).attr('src', function (idx, path) {
                return path.toLowerCase();
            });
        });
    }

    // lower href of CSS .
    function lowerCSSInfo(docDom) {
        // read index file, and getting target ts files.
        var $scripts = $(docDom).find('link[rel="stylesheet"][href]');
        $scripts.each(function () {
            $(this).attr('href', function (idx, path) {
                return path.toLowerCase();
            });
        });
    }
};
