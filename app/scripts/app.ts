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

/// <reference path="include/interfaces.d.ts" />

module Garage {

    import global = CDP.global;

    /**
     * Application start function.
     *  The function expects all necessary .js scripts are loaded before the function is called.
     */
    function onStart(): void {
        var router = CDP.Framework.Router;
        // set first page.
        router.register("", "/templates/splash.html", true);//pageName=Home
        /* <ATELIERMARKUP type="router" /> */
        // start Router.
        router.start();
    }

    define("app", [
        "hogan",
        "zip",
        "modernizr",
        "cdp.nativebridge",
        "cdp.ui.jqm",
    ], () => {
        // set global namespace reference for typescript compiled source.
        var Garage = global.Garage;

        //<<
        // lazy load for application scripts. 
        CDP.lazyLoad("lazy");
        //>>

        return { main: onStart };
    });
}
