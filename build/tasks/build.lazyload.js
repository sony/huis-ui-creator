/*
 * index.html revise task
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path'),
        jsdom = require('jsdom'),
        window = jsdom.jsdom().defaultView,
        $ = require('jquery')(window);

    grunt.extendConfig({
        // internal variable. do not configurate.
        app_js_suffix: '',
        app_scripts: [],
        js_modules_info: [],
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // custom task: Prepare lazy scripts info from index.html file.
    grunt.registerTask('prepare_lazy_scripts_info', 'prepare lazy scripts info from index.html file.', function () {
        var docDom = getDocDom();
        // extract [type=lazy-module-*] for lib modules
        grunt.cdp.prepareJsModulesInfo(docDom);
        // extract [type=lazy] for app scripts.
        prepareAppScriptsInfo(docDom);
    });

    // custom task: Remove lazy scripts info from index.html file.
    grunt.registerTask('remove_lazy_scripts_info', 'remove lazy scripts info from index.html file.', function () {
        var docDom = getDocDom();

        // [type=lazy-module-*] for lib modules
        (function (dom) {
            var $modules = $(docDom).find('script[type*="lazy-module-"]');
            // piece js are removed except "app.js."
            $modules.remove();
        }(docDom));

        // [type=lazy] for app scripts.
        (function (dom) {
            var $appScripts = $(dom)
                .find('script[type="lazy"]')
                .filter(function () {
                    // piece js are removed except "app.js."
                    return (null == $(this).attr('src').match(/app.js$/i));
                });
            $appScripts.remove();
        }(docDom));

        fs.writeFileSync(path.join(grunt.config.get('pkgdir'), 'index.html'), jsdom.serializeDocument(docDom));
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//

    // Helper API
    grunt.cdp = grunt.cdp || {};

    // extract [type=lazy-module-*] for lib modules
    grunt.cdp.prepareJsModulesInfo = function (docDom, target) {
        var jsModule = { name: '' },
            jsModulesInfo = [],
            expr = (null == target) ? 'script[type*="lazy-module-"]'
                                    : 'script[type="lazy-module-' + target + '"]';

        (function (dom) {
            var $modules = $(dom).find(expr);
            $modules.each(function () {
                var $el = $(this);
                var name = $el.attr('type').replace('lazy-module-', '');
                var kind = $el.attr('data-kind');
                var version = $el.attr('data-version');
                var $scripts = getScriptElements($el);
                $scripts.each(function () {
                    var src = $(this).attr('src');
                    if (name !== jsModule.name) {
                        jsModule = {
                            name: name,
                            src: [],
                            kind: kind,
                            version: version
                        };
                        jsModulesInfo.push(jsModule);
                    }
                    jsModule.src.push(path.join(grunt.config.get('tmpdir'), src).replace(/\.js$/i, '.ts'));
                });
            });
        }(docDom));

        // set js_modules_info
        grunt.config.set('js_modules_info', jsModulesInfo);
    };

    //! get doc dom from index.html.
    function getDocDom() {
        return jsdom.jsdom(fs.readFileSync(path.join(grunt.config.get('tmpdir'), 'index.html')).toString());
    }

    //! get file extension.
    function getExtension(file) {
        var ret;
        if (file) {
            var fileTypes = file.split('.');
            var len = fileTypes.length;
            if (0 === len) {
                return ret;
            }
            ret = fileTypes[len - 1];
            return ret;
        }
    }

    //! get script element.
    function getScriptElements($typeLazy) {
        var scripts;
        var src = $typeLazy.attr("src");
        if ("js" === getExtension(src).toLowerCase()) {
            return $typeLazy;
        } else {
            src = path.join(grunt.config.get('tmpdir'), src);
            if (fs.existsSync(src)) {
                scripts = jsdom.jsdom(fs.readFileSync(src).toString());
                return $(scripts).find("script");
            } else {
                return $();
            }
        }
    }

    //! extract app scripts and reset app.js script tag.
    function prepareAppScriptsInfo(docDom) {
        // read index file, and getting target ts files.
        var appScripts = [];
        var $appScripts = $(docDom).find('script[type="lazy"]');
        var findAppJs = false;

        $appScripts.each(function () {
            var $scripts = getScriptElements($(this));
            $scripts.each(function () {
                var src = $(this).attr('src');
                if (src.match(/app.js$/i)) {
                    findAppJs = true;
                }
                appScripts.push(path.join(grunt.config.get('tmpdir'), src).replace(/\.js$/i, '.ts'));
            });
        });

        if (!findAppJs) {
            grunt.config.set('app_js_suffix', '-all');
        }

        // set app_scripts
        grunt.config.set('app_scripts', appScripts);
    }
};
