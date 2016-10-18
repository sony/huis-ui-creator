/*
 * Banner setup utility script
 */

module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path');

    grunt.extendConfig({
        banner_file_name: 'BANNER.txt',
        banner_build_date_time: '<%= grunt.template.today("isoDateTime") %>',

        // internal variable
        banner_info: {
            src: '',
            moduleName: '',
            version: '',
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // custom task: set banner
    grunt.registerTask('banner_setup', function () {
        var info = grunt.config.get('banner_info');
        grunt.cdp.setupBanner(info.src, info.moduleName, info.version);
    });

    // Helper API
    grunt.cdp = grunt.cdp || {};

    // check 'LICENSE-INFO.txt' existence
    grunt.cdp.hasLicenseInfo = function () {
        return fs.existsSync(path.join(process.cwd(), grunt.config.get('banner_file_name')));
    };

    // setup bannar core function
    grunt.cdp.getBannerString = function (moduleName, version) {
        var licenseInfo = path.join(process.cwd(), grunt.config.get('banner_file_name'));
        if (fs.existsSync(licenseInfo)) {
            var banner = fs.readFileSync(licenseInfo).toString()
                .replace('@MODULE_NAME', moduleName)
                .replace('@VERSION', version || '')
                .replace('@DATE', grunt.config.get('banner_build_date_time'))
                .replace(/\r\n/gm, '\n')    // normalize line feed
            ;
            return banner;
        } else {
            return '';
        }
    };

    // setup bannar core function
    grunt.cdp.setupBanner = function (src, moduleName, version) {
        var banner = grunt.cdp.getBannerString(moduleName, version);
        if (banner) {
            var bom = grunt.option('no-bom') ? '' : '\ufeff';
            var format = bom ? 'utf8' : undefined;
            var script = bom + banner + fs.readFileSync(src).toString().replace(/\ufeff/gm, '');
            fs.writeFileSync(src, script, format);
            return true;
        } else {
            return false;
        }
    };
};
