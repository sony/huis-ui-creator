/*!
 * cdp.core.js 1.1.2
 *
 * Date: 2015-11-10T21:16:00
 */
/*
 * cdp.core.js
 */

((function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define(["jquery", "backbone"], function ($, Backbone) {
            return factory(root, $, root.CDP || (root.CDP = {}));
        });
    } else {
        // Browser globals
        factory(root, root.jQuery || root.$, root.CDP || (root.CDP = {}));
    }
})(((this || 0).self || global), function (root, $, CDP) {

    /**
     * \~english
     * @class Patch
     * @brief This class applies patch codes to 3rd party libraries for they works good with the others.
     *
     * \~japanese
     * @class Patch
     * @brief 外部ライブラリに Patch を当てるクラス
     */
    var Patch = (function () {
        function Patch() {
        }

        /**
         * \~english
         * Apply patch.
         *
         * \~japanese
         * パッチの適用
         */
        function _apply() {
            if (null == root.console || null == root.console.error) {
                _consolePatch();
            }

            if (typeof MSApp === "object") {
                _nodePatch();
            }
        }

        function _consolePatch() {
            root.console = {
                count: function () {
                },
                groupEnd: function () {
                },
                time: function () {
                },
                timeEnd: function () {
                },
                trace: function () {
                },
                group: function () {
                },
                dirxml: function () {
                },
                debug: function () {
                },
                groupCollapsed: function () {
                },
                select: function () {
                },
                info: function () {
                },
                profile: function () {
                },
                assert: function () {
                },
                msIsIndependentlyComposed: function () {
                },
                clear: function () {
                },
                dir: function () {
                },
                warn: function () {
                },
                error: function () {
                },
                log: function () {
                },
                profileEnd: function () {
                }
            };
        }

        function _nodePatch() {
            var originalAppendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function (node) {
                var _this = this;
                return MSApp.execUnsafeLocalFunction(function () {
                    return originalAppendChild.call(_this, node);
                });
            };

            var originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (newElement, referenceElement) {
                var _this = this;
                return MSApp.execUnsafeLocalFunction(function () {
                    return originalInsertBefore.call(_this, newElement, referenceElement);
                });
            };
        }

        Patch.apply = _apply;

        return Patch;
    })();

    /**
     * \~english
     * Get web root.
     *
     * \~japanese
     * web root を取得
     */
    var _webRoot = (function () {
        var dir = /.+\/(.+)\/[^/]*#[^/]+/.exec(location.href);
        if (!dir) {
            dir = /.+\/(.+)\//.exec(location.href);
        }
		// [2015.11.10 modified] Electron での起動問題への暫定修正
    	//return dir[1];
        return dir[0];
    })();

    /**
     * \~english
     * Initialization function of environment.
     *
     * \~japanese
     * Framework の初期化関数
     *
     * @param options {Object} [in] TBD.
     */
    function _init(options) {
        var df = $.Deferred();
        Patch.apply();
        return df.resolve();
    }

    CDP.global = root;
    CDP.initialize = _init;
    CDP.webRoot = _webRoot;

    return CDP;
}));
