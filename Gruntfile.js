/*
 * CDP grunt build script root.
 */
module.exports = function (grunt) {

    var jsdom = require('jsdom'),
        window = jsdom.jsdom().defaultView,
        $ = require('jquery')(window);

    var targetPlatform = grunt.option("platform");
    if (targetPlatform === "darwin") {
	grunt.log.writeln("Target platform is darwin, so exclude usb_dev");
	var pkgFileName = 'package_darwin.json'
    } else {
	var pkgFileName = 'package_win.json'
    }

    // Project configuration.
    var config = {
        pkgFileName: pkgFileName,
        pkg: grunt.file.readJSON(pkgFileName),

        // config variable entries: root
        orgsrc: 'app',
        tmpdir: 'temp',
        pkgdir: 'www/app',	// working space for electron packager (to package electron app, we prefer to "app" directory)

        // config variable entries: directory
        modules: 'modules',             // 3rd module directory
        resources: 'res',               // resource directory
        templates: 'templates',         // html directory
        scripts: 'scripts',             // js/ts/(coffee) directory
        stylesheets: 'stylesheets',     // css/sass/(less) directory
    };

    // create "custom_tasks" prop to root object if needed.
    grunt.createCustomTaskEntry = function (root, key, def_tasks) {
        root = root || {};
        root.custom_tasks = root.custom_tasks || {};
        if (!root.custom_tasks[key]) {
            root.custom_tasks[key] = def_tasks || { release: [], debug: [] };
        }
        return root;
    };

    // update config from tasks
    grunt.extendConfig = function (additionalConfig) {
        for (var prop in additionalConfig) {
            if (additionalConfig.hasOwnProperty(prop)) {
                if (config[prop]) {
                    config[prop] = $.extend(true, config[prop], additionalConfig[prop]);
                } else {
                    var tmpConfig = {};
                    tmpConfig[prop] = additionalConfig[prop];
                    config = $.extend(true, config, tmpConfig);
                }
            }
        }
    };

    // load cdp build task(s)
    grunt.loadTasks('build/tasks');

    // load project build task(s)
    grunt.loadTasks('build');

    // initialize config
    grunt.initConfig(config);
};
