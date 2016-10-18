Build Commands
=========

The build system consists of build task scripts of [grunt](http://gruntjs.com/).

This system also supports to execution Grunt from [Cordova Hooks](../hooks).

# Supported Commands

## Cordova CLI collaboration

The grunt build scripts are called from [Cordova CLI](http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-Line%20Interface).

Supported `cordova` commands are follows, and all build tasks are executed by timing of `before_prepare`.

    cordova build
    cordova emulate
    cordova run
    cordova prepare

An example of only Android client build:

    cordova build android

An example of iOS client build for release:

    cordova build ios --release

grunt tasks called by `cordova` are below. (implemented in `build.cordova.js`)

| command                                         | description                              |
|:------------------------------------------------|:-----------------------------------------|
| `grunt cordova_register_platform:<platform>`    | Set `<platform>` to build target         |
| `grunt cordova_build_debug`                     | Execute debug build                      |
| `grunt cordova_build_release`                   | Execute release build                    |
| `grunt cordova_prepare`                         | Build app/plugins scripts                |


## Grunt build commands

The build commands for Web View layer scripts are below. (These does not depend on Cordova)

| command                  | description                                                                      |
|:-------------------------|:---------------------------------------------------------------------------------|
| `grunt android`          | Release build for Android platform. (target: `platforms/android/assets/www`)     |
| `grunt android_debug`    | Debug build for Android platform. (Same as above)                                |
| `grunt ios`              | Release build for iOS platform. (target: `platforms/ios/www`)                    |
| `grunt ios_debug`        | Debug build for iOS platform. (Same as above)                                    |
| `grunt winrt`            | Release build for Windows Store App platform.  (target: `platforms/windows8/www` |
| `grunt winrt_debug`      | Debug build for Windows Store App platform. (Same as above)                      |
| `grunt web`              | Release build for PC browser environment.  (target: `platforms/browser/www`)     |
| `grunt web_debug`        | Debug build for PC browser environment.  (Same as above)                         |
| `grunt dev`              | Release build for PC development environment. (target] `www`)                    |
| `grunt dev_debug`        | Debug build for PC development environment. (Same as above)                      |
| `grunt`                  | Default. Same as `grunt dev`                                                     |
| `grunt build`            | Same as `grunt dev_debug`                                                        |


## Common command line options

Common command line options are below.
[grunt](http://gruntjs.com/)command line spec are [here](http://gruntjs.com/api/grunt.option).

| command line                      | description                            |
|:----------------------------------|:---------------------------------------|
| `--no-minify`                     | Skip minify task in a release build.   |



## Package command

The command which is used to generate a package for release. (It's output below the `temp/_pkgroot`.)

| command           | description                                                                                                                                                                |
|:------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `grunt plugin`    | Build `app/plugins` scripts and setup the structure for cordova plugin installation ready. Native sources are collected from `platforms/<platform>` below.                 |
| `grunt module`    | Build as single module file under `app/lib` scripts. You can set the options `--no-bom` and `--no-srcmap` if you want. This command is upper compatible of `grunt plugin`. |


# Expansion of a task

## Main script

`build/grunt-garage.js` is main task script for this project.

You can add any tasks to this file.


## Other scripts

You can write other task script to other file in CDP development environment.

If you prepare the original task script and set to `build` directory, the system load all the script files by `grunt.loadTasks('build')` when grunt launch.


## How to add the grunt custom task

For using custom task script, you need to implement the grunt configuration by `grunt.extendConfig()` method.

(origina grunt API is `grunt.initConfig()`.)

- The system merges and initialize the parameters defined by `extendConfig` in `Gruntfile.js`.

The other things, You need not to worry about it. You can write with original [grunt](http://gruntjs.com/) guide line.

An example of custom task script is below.

```javascript
module.exports = function (grunt) {

    grunt.extendConfig({
        clean: {
            special_resources: {
                files: {
                    src: [
                        '<%= pkgdir %>/special_resources'
                    ],
                },
            },
        },

        copy: {
            special_resources: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= orgsrc %>',
                        src: ['special_resources/**'],
                        dest: '<%= pkgdir %>'
                    },
                ],
            },
        },
    });


    //____________________________________________________________________________________________________//


    // task unit
    grunt.registerTask('special_resources', ['clean:special_resources', 'copy:special_resources']);
};
```
