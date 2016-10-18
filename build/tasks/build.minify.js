/*
 * JavaScript / CSS minify tasks: only valid for release build
 */

module.exports = function (grunt) {

    grunt.extendConfig({

        // config variable
        minify_banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */',
        template_ext: 'html',   // template file's extension.

        // js minify
        uglify: {
            options: {
                banner: '<%= minify_banner %>\n',
                mangle: true,
            },
            app: {
                files: [
                    {// "scripts"
                        expand: true,
                        cwd: '<%= tmpdir %>',
                        src: ['<%= scripts %>/*.js'],
                        dest: '<%= pkgdir %>',
                    },
                ],
            },
        },

        // css minify
        cssmin: {
            options: {
                banner: '<%= minify_banner %>'
            },
            app: {
                files: [
                    {// "stylesheets"
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: ['<%= stylesheets %>/*.css'],
                        dest: '<%= pkgdir %>',
                    },
                ],
            },
        },

        // html minify
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true,
            },
            app: {
                files: [
                    {// "index.html"
                        '<%= pkgdir %>/index.html': '<%= pkgdir %>/index.html',
                    },
                    {// "templates"
                        expand: true,
                        cwd: '<%= orgsrc %>',
                        src: ['<%= templates %>/**/*.<%= template_ext %>'],
                        dest: '<%= pkgdir %>',
                    },
                ],
            },
        },
    });


    //__________________________________________________________________________________________________________________________________________________________________________________________//


    // load plugin(s).
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
};
