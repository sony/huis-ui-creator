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
