/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

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
