/*
 * Garage tasks
 *
 * You can modify for your application requirement.
 */

module.exports = function (grunt) {

    grunt.extendConfig({
        // config props:
    });

    //__________________________________________________________________________________________________________________________________________________________________________________________//

    grunt.registerTask('build',     ['clean', 'dev_debug']);
    grunt.registerTask('default',   ['clean', 'dev']);
};
