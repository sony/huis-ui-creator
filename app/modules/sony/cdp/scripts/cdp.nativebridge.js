

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define(["cdp.promise"], function () {
            return factory(root.CDP || (root.CDP = {}));
        });
    }
    else {
        // Browser globals
        factory(root.CDP || (root.CDP = {}));
    }
}(this, function (CDP) {
    CDP.NativeBridge = CDP.NativeBridge || {};
    




var CDP;
(function (CDP) {
    var NativeBridge;
    (function (NativeBridge) {
        var TAG = "[CDP.NativeBridge.Utils] ";
        /**
         * @class Utils
         * @brief CDP.NativeBridge が使用するユーティリティクラス
         */
        var Utils = (function () {
            function Utils() {
            }
            ///////////////////////////////////////////////////////////////////////
            // public static methods
            /**
             * plugin の Result Code を CDP.NativeBridge にマップする
             *
             * @param errorCode {String} [in] Result Code 文字列を指定 ex): "SUCCESS_OK"
             */
            Utils.defineResultCode = function (errorCode) {
                Object.defineProperty(NativeBridge, errorCode, {
                    get: function () {
                        if (Utils.s_pluginReady) {
                            return CDP.Plugin.NativeBridge[errorCode];
                        }
                        else {
                            return null;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            };
            /**
             * cordova が 使用可能になるまで待機
             */
            Utils.waitForPluginReady = function () {
                var df = $.Deferred();
                if (Utils.s_pluginReady) {
                    return $.Deferred().resolve();
                }
                try {
                    require(["cordova"], function () {
                        var channel = cordova.require("cordova/channel");
                        channel.onCordovaReady.subscribe(function () {
                            if (null != CDP.Plugin.NativeBridge) {
                                Utils.s_pluginReady = true;
                                df.resolve();
                            }
                            else {
                                console.error(TAG + "'com.sony.cdp.plugin.nativebridge' cordova plugin required.");
                                df.reject();
                            }
                        });
                    });
                }
                catch (error) {
                    console.error(TAG + "cordova required.");
                    df.reject();
                }
                return df.promise();
            };
            /**
             * Promise オブジェクトの作成
             * jQueryDeferred オブジェクトから、NativeBridge.Promise オブジェクトを作成する
             *
             * @param df {JQueryDeferred} [in] jQueryDeferred instance を指定
             * @return   {Promise} NativeBridge.Promise オブジェクト
             */
            Utils.makePromise = function (df) {
                return CDP.makePromise(df, {
                    _bridge: null,
                    _taskId: null,
                    abort: function (info) {
                        var _this = this;
                        var detail = $.extend({ message: "abort" }, info);
                        var cancel = function () {
                            if (null != _this._bridge && null != _this._taskId) {
                                _this._bridge.cancel(_this._taskId, detail);
                            }
                            df.reject(detail);
                        };
                        if (null != this.dependency) {
                            if (this.dependency.abort) {
                                this.dependency.abort(detail);
                            }
                            else {
                                console.error(TAG + "[call] dependency object doesn't have 'abort()' method.");
                            }
                            if (this.callReject && "pending" === this.state()) {
                                cancel();
                            }
                        }
                        else if ("pending" === this.state()) {
                            cancel();
                        }
                    }
                });
            };
            Utils.s_pluginReady = false;
            return Utils;
        })();
        NativeBridge.Utils = Utils;
    })(NativeBridge = CDP.NativeBridge || (CDP.NativeBridge = {}));
})(CDP || (CDP = {}));

var CDP;
(function (CDP) {
    var NativeBridge;
    (function (NativeBridge) {
        var TAG = "[CDP.NativeBridge.Gate] ";
        // Result code
        NativeBridge.SUCCESS_OK;
        NativeBridge.Utils.defineResultCode("SUCCESS_OK");
        NativeBridge.SUCCESS_PROGRESS;
        NativeBridge.Utils.defineResultCode("SUCCESS_PROGRESS");
        NativeBridge.ERROR_FAIL;
        NativeBridge.Utils.defineResultCode("ERROR_FAIL");
        NativeBridge.ERROR_CANCEL;
        NativeBridge.Utils.defineResultCode("ERROR_CANCEL");
        NativeBridge.ERROR_INVALID_ARG;
        NativeBridge.Utils.defineResultCode("ERROR_INVALID_ARG");
        NativeBridge.ERROR_NOT_IMPLEMENT;
        NativeBridge.Utils.defineResultCode("ERROR_NOT_IMPLEMENT");
        NativeBridge.ERROR_NOT_SUPPORT;
        NativeBridge.Utils.defineResultCode("ERROR_NOT_SUPPORT");
        NativeBridge.ERROR_INVALID_OPERATION;
        NativeBridge.Utils.defineResultCode("ERROR_INVALID_OPERATION");
        NativeBridge.ERROR_CLASS_NOT_FOUND;
        NativeBridge.Utils.defineResultCode("ERROR_CLASS_NOT_FOUND");
        NativeBridge.ERROR_METHOD_NOT_FOUND;
        NativeBridge.Utils.defineResultCode("ERROR_METHOD_NOT_FOUND");
        //___________________________________________________________________________________________________________________//
        /**
         * @class Gate
         * @brief NativeBridge と通信するベースクラス
         *        このクラスから任意の Gate クラスを派生して実装可能
         */
        var Gate = (function () {
            /**
             * constructor
             *
             * @param feature {Feature}          [in] 初期化情報を指定
             * @param options {ConstructOptions} [in] オプションを指定
             */
            function Gate(feature, options) {
                var _this = this;
                NativeBridge.Utils.waitForPluginReady().then(function () {
                    _this._bridge = new CDP.Plugin.NativeBridge(feature, options);
                }).fail(function () {
                    throw Error(TAG + "'com.sony.cdp.plugin.nativebridge' required.");
                });
            }
            ///////////////////////////////////////////////////////////////////////
            // override methods
            /**
             * タスクの実行
             * 指定した method 名に対応する Native Class の method を呼び出す。
             *
             * @param method  {String}       [in] Native Class のメソッド名を指定
             * @param args    {Object[]}     [in] 引数を配列で指定
             * @param options {ExecOptions?} [in] 実行オプションを指定
             * @return {Promise} NativeBridge.Promise オブジェクト
             */
            Gate.prototype.exec = function (method, args, options) {
                var _this = this;
                var df = $.Deferred();
                var promise = NativeBridge.Utils.makePromise(df);
                NativeBridge.Utils.waitForPluginReady().then(function () {
                    var taskId = _this._bridge.exec(function (result) {
                        if (NativeBridge.SUCCESS_PROGRESS === result.code) {
                            df.notify(result);
                        }
                        else {
                            df.resolve(result);
                        }
                    }, function (error) {
                        df.reject(error);
                    }, method, args, options);
                    // set internal properties.
                    promise._bridge = _this._bridge;
                    promise._taskId = taskId;
                }).fail(function () {
                    df.reject(_this.makeFatal());
                });
                return promise;
            };
            /**
             * すべてのタスクのキャンセル
             *
             * @param options {ExecOptions?} [in] 実行オプションを指定
             * @return {Promise} NativeBridge.Promise オブジェクト
             */
            Gate.prototype.cancel = function (options) {
                var _this = this;
                var df = $.Deferred();
                NativeBridge.Utils.waitForPluginReady().then(function () {
                    _this._bridge.cancel(null, options, function (result) {
                        df.resolve(result);
                    }, function (error) {
                        df.reject(error);
                    });
                }).fail(function () {
                    df.reject(_this.makeFatal());
                });
                return df.promise();
            };
            /**
             * インスタンスの破棄
             * Native の参照を解除する。以降、exec は無効となる。
             *
             * @param options {ExecOptions?} [in] 実行オプションを指定
             * @return {Promise} NativeBridge.Promise オブジェクト
             */
            Gate.prototype.dispose = function (options) {
                var _this = this;
                var df = $.Deferred();
                NativeBridge.Utils.waitForPluginReady().then(function () {
                    _this._bridge.dispose(options, function (result) {
                        df.resolve(result);
                    }, function (error) {
                        df.reject(error);
                    });
                }).fail(function () {
                    df.reject(_this.makeFatal());
                });
                return df.promise();
            };
            Object.defineProperty(Gate.prototype, "bridge", {
                ///////////////////////////////////////////////////////////////////////
                // protected methods
                /**
                 * Plugin.NativeBridge オブジェクトへのアクセス
                 * 低レベル exec() を使用したい場合に利用可能
                 *
                 * @return {Plugin.NativeBridge}
                 */
                get: function () {
                    return this._bridge;
                },
                enumerable: true,
                configurable: true
            });
            ///////////////////////////////////////////////////////////////////////
            // private methods
            //! Fatal Error オブジェクトの生成
            Gate.prototype.makeFatal = function () {
                var msg = TAG + "fatal error. 'com.sony.cdp.plugin.nativebridge' is not available.";
                console.error(msg);
                return {
                    code: null,
                    name: TAG + "ERROR_FATAL",
                    message: msg,
                };
            };
            return Gate;
        })();
        NativeBridge.Gate = Gate;
    })(NativeBridge = CDP.NativeBridge || (CDP.NativeBridge = {}));
})(CDP || (CDP = {}));
var CDP;
(function (CDP) {
    var NativeBridge;
    (function (__NativeBridge) {
        ///////////////////////////////////////////////////////////////////////
        // closure methods: debug 支援用
        (function (global) {
            if (global.Config.DEBUG && !global.orientation) {
                if (null == CDP.Plugin || null == CDP.Plugin.NativeBridge) {
                    // Utils.waitForPluginReady の差し替え
                    __NativeBridge.Utils.waitForPluginReady = function () {
                        return $.Deferred().resolve();
                    };
                    // stub CDP.Plugin.NativeBridge の設定
                    (function () {
                        var _exec = function (success) {
                            var result = {
                                code: 0x0000,
                                name: "[CDP.NativeBridge.Patch]",
                                message: "[CDP.NativeBridge.Patch] generated by stub object."
                            };
                            if (null != success) {
                                setTimeout(function () {
                                    success(result);
                                });
                            }
                        };
                        var _NativeBridge = (function () {
                            function NativeBridge(feature, options) {
                            }
                            NativeBridge.prototype.exec = function (success, fail, method, args, options) {
                                _exec(success);
                            };
                            NativeBridge.prototype.cancel = function (taskId, options, success, fail) {
                                _exec(success);
                            };
                            NativeBridge.prototype.dispose = function (options, success, fail) {
                                _exec(success);
                            };
                            NativeBridge.SUCCESS_OK = 0x0000;
                            NativeBridge.SUCCESS_PROGRESS = 0x0001;
                            NativeBridge.ERROR_FAIL = 0x0002;
                            NativeBridge.ERROR_CANCEL = 0x0003;
                            NativeBridge.ERROR_INVALID_ARG = 0x0004;
                            NativeBridge.ERROR_NOT_IMPLEMENT = 0x0005;
                            NativeBridge.ERROR_NOT_SUPPORT = 0x0006;
                            NativeBridge.ERROR_INVALID_OPERATION = 0x0007;
                            NativeBridge.ERROR_CLASS_NOT_FOUND = 0x0008;
                            NativeBridge.ERROR_METHOD_NOT_FOUND = 0x0009;
                            return NativeBridge;
                        })();
                        CDP.Plugin = CDP.Plugin || {};
                        CDP.Plugin.NativeBridge = _NativeBridge;
                    })();
                }
            }
        })(window);
    })(NativeBridge = CDP.NativeBridge || (CDP.NativeBridge = {}));
})(CDP || (CDP = {}));

    return CDP.NativeBridge;
}));
