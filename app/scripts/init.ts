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

// Electron patch scope.
var Patch: any;
((root: any, Patch) => {

    var _apply = () => {
        var _require = root.require;
        root.require = (...args: any[]): any => {
            if (0 < args.length && args[0] instanceof Array) {
                return requirejs.apply(root, args);
            } else {
                return _require.apply(root, args);
            }
        };
    };

    Patch.apply = _apply;

})(this, Patch || (Patch = {}));

module Garage {
    var setup = (callback: Function): void => {
        Patch.apply();
        var global = global || window;

        fs = require("fs-extra");
        path = require("path");

        Remote = require("electron").remote;
        app = require("electron").remote.app;
        Menu = require("electron").remote.Menu;
        MenuItem = require("electron").remote.MenuItem;

        node_crypt = Remote.require('crypto');

        //このアプリのバージョン :　MajorVersion.MinorVersion.BuildNumber.Reversion

        APP_VERSION = "";

        DURATION_DIALOG_CLOSE = 3000;

        HUIS_FACE_PAGE_WIDTH = 480;
        HUIS_FACE_PAGE_HEIGHT = 812;
        MAX_HUIS_FILES = 30;
        HUIS_VID = 0x054C;
        HUIS_PID = 0x0B94;

        // 製品名の設定
        PRODUCT_NAME = "HUIS UI CREATOR";

        // デバイスタイプ
        DEVICE_TYPE_TV = "TV";
        DEVICE_TYPE_AC = "Air conditioner";
        DEVICE_TYPE_LIGHT = "Light";
        DEVICE_TYPE_AUDIO = "Audio";
        DEVICE_TYPE_PLAYER = "Player";
        DEVICE_TYPE_RECORDER = "Recorder";
        DEVICE_TYPE_PROJECTOR = "Projector";
        DEVICE_TYPE_STB = "Set top box";
        DEVICE_TYPE_FAN = "Fan";
        DEVICE_TYPE_AIR_CLEANER = "Air cleaner";
        DEVICE_TYPE_CUSTOM = "Custom";
        DEVICE_TYPE_FULL_CUSTOM = "fullcustom";
        DEVICE_TYPE_BT = "Bluetooth";
        DEVICE_TYPE_SPECIAL = "special";
        DEVICE_TYPE_LEARNED = "Device";
        DEVICE_TYPE_AUTO_LAYOUT = "Recommend";
        DEVICE_TYPE_COMMON = "Common";

        FACE_TYPE_FULL_CUSTOM = DEVICE_TYPE_FULL_CUSTOM;
        FACE_TYPE_NOT_FULL_CUSTOM = "not-" + FACE_TYPE_FULL_CUSTOM;

        NON_SUPPORT_DEVICE_TYPE_IN_EDIT = [DEVICE_TYPE_CUSTOM, DEVICE_TYPE_FULL_CUSTOM, DEVICE_TYPE_AUTO_LAYOUT];
        NON_SUPPORT_FACE_CATEGORY = [DEVICE_TYPE_CUSTOM, DEVICE_TYPE_FULL_CUSTOM, DEVICE_TYPE_SPECIAL, DEVICE_TYPE_AUTO_LAYOUT];
        NON_SUPPORT_DEVICE_TYPE_IN_MACRO = [DEVICE_TYPE_CUSTOM, DEVICE_TYPE_FULL_CUSTOM, DEVICE_TYPE_SPECIAL, DEVICE_TYPE_AUTO_LAYOUT];

        GRID_AREA_WIDTH = 464;
        GRID_AREA_HEIGHT = 812;
        BIAS_X_DEFAULT_GRID_LEFT = 8;
        BIAS_X_DEFAULT_GRID_RIGHT = 8;
        DEFAULT_GRID = 29;

        WINDOW_MIN_WIDTH = 768;
        WINDOW_MIN_HEIGHT = 1280;

        MARGIN_MOUSEMOVALBE_TOP = 100;
        MARGIN_MOUSEMOVABLE_LEFT = 50;
        MARGIN_MOUSEMOVABLE_RIGHT = 50;
        MARGIN_MOUSEMOVALBE_BOTTOM = 50;

        TARGET_ALL_STATE = 999;

        DOUBLE_CLICK_TIME_MS = 500;

        MAX_NUM_MACRO_SIGNAL = 63;

        FUNC_NUM_DELIMITER = '#';
        FUNC_CODE_RELEARNED = '#';

        UNKNOWN_REMOTE = "unknown";
        UNKNOWN_REMOTE_TV = "unknown-tv";
        UNKNOWN_REMOTE_AC = "unknown-ac";
        UNKNOWN_REMOTE_LIGHT = "unknown-light";
        UNKNOWN_REMOTE_AUDIO = "unknown-audio";
        UNKNOWN_REMOTE_PLAYER = "unknown-player";
        UNKNOWN_REMOTE_RECORDER = "unknown-recorder";
        UNKNOWN_REMOTE_PROJECTOR = "unknown-projector";
        UNKNOWN_REMOTE_STB = "unknown-stb";
        UNKNOWN_REMOTE_FAN = "unknown-fan";
        UNKNOWN_REMOTE_BT = "unknown-bt";

        ACTION_INPUT_TAP_KEY = "STR_ACTION_INPUT_TAP";
        ACTION_INPUT_LONG_PRESS_KEY = "STR_ACTION_INPUT_LONG_PRESS";
        ACTION_INPUT_LONG_PRESS_KEY_SINGLE = "STR_ACTION_INPUT_LONG_PRESS_SINGLE";
        ACTION_INPUT_FLICK_UP_KEY = "STR_ACTION_INPUT_FLICK_UP";
        ACTION_INPUT_FLICK_RIGHT_KEY = "STR_ACTION_INPUT_FLICK_RIGHT";
        ACTION_INPUT_FLICK_LEFT_KEY = "STR_ACTION_INPUT_FLICK_LEFT";
        ACTION_INPUT_FLICK_DOWN_KEY = "STR_ACTION_INPUT_FLICK_DOWN";


        ACTION_INPUT_TAP_VALUE = "touch";
        ACTION_INPUT_LONG_PRESS_VALUE = "long_press";
        ACTION_INPUT_FLICK_UP_VALUE = "flick_up";
        ACTION_INPUT_FLICK_RIGHT_VALUE = "flick_right";
        ACTION_INPUT_FLICK_LEFT_VALUE = "flick_left";
        ACTION_INPUT_FLICK_DOWN_VALUE = "flick_down";
        ACTION_INPUT_SWIPE_UP_VALUE = "swipe_up";
        ACTION_INPUT_SWIPE_RIGHT_VALUE = "swipe_right";
        ACTION_INPUT_SWIPE_LEFT_VALUE = "swipe_left";
        ACTION_INPUT_SWIPE_DOWN_VALUE = "swipe_down";

        ACTION_INPUTS = [];
        ACTION_INPUTS.push({ key: ACTION_INPUT_TAP_KEY, value: ACTION_INPUT_TAP_VALUE });
        ACTION_INPUTS.push({ key: ACTION_INPUT_LONG_PRESS_KEY, value: ACTION_INPUT_LONG_PRESS_VALUE });
        ACTION_INPUTS.push({ key: ACTION_INPUT_FLICK_UP_KEY, value: ACTION_INPUT_FLICK_UP_VALUE });
        ACTION_INPUTS.push({ key: ACTION_INPUT_FLICK_RIGHT_KEY, value: ACTION_INPUT_FLICK_RIGHT_VALUE });
        ACTION_INPUTS.push({ key: ACTION_INPUT_FLICK_LEFT_KEY, value: ACTION_INPUT_FLICK_LEFT_VALUE });
        ACTION_INPUTS.push({ key: ACTION_INPUT_FLICK_DOWN_KEY, value: ACTION_INPUT_FLICK_DOWN_VALUE });

        //マクロのときに選べるアクション
        ACTION_INPUTS_MACRO = [];
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_TAP_KEY, value: ACTION_INPUT_TAP_VALUE });
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_LONG_PRESS_KEY_SINGLE, value: ACTION_INPUT_LONG_PRESS_VALUE });
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_FLICK_UP_KEY, value: ACTION_INPUT_FLICK_UP_VALUE });
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_FLICK_RIGHT_KEY, value: ACTION_INPUT_FLICK_RIGHT_VALUE });
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_FLICK_LEFT_KEY, value: ACTION_INPUT_FLICK_LEFT_VALUE });
        ACTION_INPUTS_MACRO.push({ key: ACTION_INPUT_FLICK_DOWN_KEY, value: ACTION_INPUT_FLICK_DOWN_VALUE });

        //ジャンプのときに選べるアクション
        ACTION_INPUTS_JUMP = [];
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_TAP_KEY, value: ACTION_INPUT_TAP_VALUE });
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_LONG_PRESS_KEY_SINGLE, value: ACTION_INPUT_LONG_PRESS_VALUE });
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_FLICK_UP_KEY, value: ACTION_INPUT_FLICK_UP_VALUE });
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_FLICK_RIGHT_KEY, value: ACTION_INPUT_FLICK_RIGHT_VALUE });
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_FLICK_LEFT_KEY, value: ACTION_INPUT_FLICK_LEFT_VALUE });
        ACTION_INPUTS_JUMP.push({ key: ACTION_INPUT_FLICK_DOWN_KEY, value: ACTION_INPUT_FLICK_DOWN_VALUE });


        DURATION_ANIMATION_EXCHANGE_MACRO_SIGNAL_ORDER = 500;
        DURATION_ANIMATION_DELTE_SIGNAL_CONTAINER = 500;
        DURATION_ANIMATION_ADD_SIGNAL_CONTAINER = 500;
        DURATION_ANIMATION_SHOW_SIGNAL_CONTAINER_CONTROLL_BUTTONS = 1000;

        //インポート・エクスポート用の拡張子
        EXTENSION_HUIS_IMPORT_EXPORT_REMOTE = "hsrc";
        EXTENSION_HUIS_IMPORT_EXPORT_REMOTE_B2B = "hsrcb";

        DESCRIPTION_EXTENSION_HUIS_IMPORT_EXPORT_REMOTE = "リモコンファイル";

        REMOTE_BACKGROUND_WIDTH = 540;
        REMOTE_BACKGROUND_HEIGHT = 870;

        // ページの背景の起点座標とサイズ
        HUIS_PAGE_BACKGROUND_AREA = {
            x: -30,
            y: -24,
            w: REMOTE_BACKGROUND_WIDTH,
            h: REMOTE_BACKGROUND_HEIGHT
        };

        MAX_IMAGE_FILESIZE = 5000000;

        // 画像追加時の画像編集パラメーター
        IMAGE_EDIT_PARAMS = {
            resize: {
                width: HUIS_FACE_PAGE_WIDTH,
                height: HUIS_FACE_PAGE_HEIGHT
            },
            grayscale: 1,
            imageType: "image/png"
        };
        // 背景画像設定時の画像編集パラメーター
        IMAGE_EDIT_PAGE_BACKGROUND_PARAMS = {
            resize: {
                width: HUIS_PAGE_BACKGROUND_AREA.w,
                height: HUIS_PAGE_BACKGROUND_AREA.h
            },
            grayscale: 1,
            imageType: "image/png"
        };

        HELP_SITE_URL = "http://rd1.sony.net/help/remote/huis_ui_creator/ja/";

        //if (fs.existsSync("debug")) {
        //    DEBUG_MODE = true;
        //    console.warn("DEBUG_MODE enabled");
        //} else {
        //    DEBUG_MODE = false;
        //}

        fs.stat("debug", (err: Error, stats) => {
            if (err) {
                DEBUG_MODE = false;
            } else {
                console.log(err);
                console.warn("DEBUG_MODE enabled");
                DEBUG_MODE = true;
            }
        });

        callback();
    };

    var loadUtils = (callback: Function): void => {
        // Util のロードと初期化
        requirejs(["pixi",
            "garage.model.offscreeneditor",
            "garage.util.huisfiles",
            "garage.util.electrondialog",
            "garage.util.selectremotepagedialog",
            "garage.util.miscutil",
            "garage.util.huisdev",
            "garage.util.jqutils",
            "garage.util.zipmanager",
            "garage.util.itemclipboard",
            "garage.util.phnconfigfile",
            "garage.util.pathmanager"],
            () => {
                initPath();
                try {
                    electronDialog = new Util.ElectronDialog();
                    huisFiles = new Util.HuisFiles();
                } catch (e) {
                    console.error("init.ts loadUtils failed. " + e);
                }
                callback();
            },
            (err: RequireError) => {
                console.error("init.ts loadUtils failed. " + err);
                //load trouble, retry
                requirejs(err.requireModules,
                    () => {
                        initPath();
                        try {
                            electronDialog = new Util.ElectronDialog();
                            huisFiles = new Util.HuisFiles();
                        } catch (e) {
                            console.error("init.ts loadUtils failed. " + e);
                        }
                        callback();
                    },
                    (err: RequireError) => {
                        console.error("retry failed..." + err);
                    }

                );
            }
        );
    };

    var initPath = () => {

        HUIS_RC_VERSION_REQUIRED = "4.1.1";
        HUIS_RC_VERSION_REQUIRED_FOR_DIALOG = "4.2.0";//この値がダイアログで表示される。評価用に実際にチェックする値とは別に値を用意。
        //BZ版と通常版で、必要バージョンを分ける。
        if (Util.MiscUtil.isBz()) {
            HUIS_RC_VERSION_REQUIRED = "8.0.0";
            HUIS_RC_VERSION_REQUIRED_FOR_DIALOG = "8.0.0";
        }

        // Garage のファイルのルートパス設定 (%APPDATA%\Garage)
        if (Util.MiscUtil.isWindows()) {
            GARAGE_FILES_ROOT = Util.PathManager.join(app.getPath("appData"), "Garage");
        } else if (Util.MiscUtil.isDarwin()) {
            GARAGE_FILES_ROOT = Util.PathManager.join(app.getPath("appData"), "Garage");
        } else {
            console.error("Error: unsupported platform");
        }
        if (!fs.existsSync(GARAGE_FILES_ROOT)) {
            fs.mkdirSync(GARAGE_FILES_ROOT);
        }

        // HUIS File のルートパス設定 (%APPDATA%\Garage\HuisFiles). BZ版の場合、(%APPDATA%\Garage\HuisFilesBz)
        HUIS_FILES_ROOT = Util.PathManager.join(GARAGE_FILES_ROOT, "HuisFiles");
        if (Util.MiscUtil.isBz()) {
            HUIS_FILES_ROOT = Util.PathManager.join(GARAGE_FILES_ROOT, "HuisFilesBz");
        }

        if (!fs.existsSync(HUIS_FILES_ROOT)) {
            fs.mkdirSync(HUIS_FILES_ROOT);
        }


        // HUIS File ディレクトリーにある画像ディレクトリーのパス設定 (%APPDATA%\Garage\HuisFiles\remoteimages)
        REMOTE_IMAGES_DIRECTORY_NAME = "remoteimages";
        HUIS_REMOTEIMAGES_ROOT = Util.PathManager.join(HUIS_FILES_ROOT, REMOTE_IMAGES_DIRECTORY_NAME);
        if (!fs.existsSync(HUIS_REMOTEIMAGES_ROOT)) {
            fs.mkdirSync(HUIS_REMOTEIMAGES_ROOT);
        }

    }

    // 起動時のチェック
    var initCheck = (callback?: Function) => {
        HUIS_ROOT_PATH = null;
        while (!HUIS_ROOT_PATH) {
            if (Util.MiscUtil.isWindows()) {
                HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
            } else if (Util.MiscUtil.isDarwin()) {
                HUIS_ROOT_PATH = "/Volumes/HUIS-100RC";
            } else {
                console.error("Error: unsupported platform");
            }

            if (HUIS_ROOT_PATH) { // HUISデバイスが接続されている
                let dirs = null;
                while (dirs == null) {
                    if (fs.existsSync(HUIS_ROOT_PATH)) {
                        dirs = true;
                    } else {
                        console.error("HUIS must change the mode: HUIS_ROOT_PATH=" + HUIS_ROOT_PATH);
                        let response = electronDialog.showMessageBox(
                            {
                                type: "info",
                                message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_CHECK_CONNECT_WITH_HUIS_NOT_SELECT"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                                title: PRODUCT_NAME,
                                cancelId: 0,
                            });

                        if (response !== 0) {
                            app.exit(0);
                        }
                    }
                }
                isHUISConnected = true; // HUISが接続されている

                callback(); // 次の処理へ

            } else {
                showReconnectSuggetDialog();
            }
        }
    };

    /**
     * HUISデバイスが接続されていない場合は、接続を促すダイアログを出す
     */
    function showReconnectSuggetDialog() {
        let response = electronDialog.showMessageBox(
            {
                type: "info",
                message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_NOT_CONNECT_WITH_HUIS"),
                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                title: PRODUCT_NAME,
                cancelId: 0,
            });

        if (response !== 0) {
            app.exit(0);
        }
    }

    setup(() => {
        requirejs(["cdp.framework.jqm"], () => {
            CDP.Framework.initialize().done(() => {
                loadUtils(() => {
                    requirejs(["app"], (app: any) => {
                        initCheck(() => {
                            app.main();
                        });
                    });
                });
            });
        });
    });
}
