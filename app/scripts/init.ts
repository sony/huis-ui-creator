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

		//このアプリのバージョン :　MajorVersion.MinorVersion.BuildNumber.Reversion
		
		APP_VERSION = "";
		try{
			APP_VERSION = fs.readFileSync('version.txt', 'utf8');
		} catch (err) {
			console.error(err);
		}

		RATIO_TEXT_SIZE_HUIS_GARAGE_BUTTON = 0.75;
		RATIO_TEXT_SIZE_HUIS_GARAGE_LABEL = 0.65;
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
		DEVICE_TYPE_CUSOM = "Custom";
		DEVICE_TYPE_FULL_CUSTOM = "fullcustom";
		DEVICE_TYPE_BT = "Bluetooth";

		NON_SUPPORT_DEVICE_TYPE_IN_EDIT = [DEVICE_TYPE_CUSOM, DEVICE_TYPE_FULL_CUSTOM, DEVICE_TYPE_BT];


		GRID_AREA_WIDTH = 464;
		GRID_AREA_HEIGHT = 812;
		BIAS_X_DEFAULT_GRID_LEFT = 8;
		BIAS_X_DEFAULT_GRID_RIGHT = 8;
		DEFAULT_GRID = 29;

		WINDOW_MIN_WIDTH = 768;
		WINDOW_MIN_HEIGHT = 1280;

		// Garage のファイルのルートパス設定 (%APPDATA%\Garage)
		GARAGE_FILES_ROOT = path.join(app.getPath("appData"), "Garage").replace(/\\/g, "/");
		// HUIS File のルートパス設定 (%APPDATA%\Garage\HuisFiles)
		HUIS_FILES_ROOT = path.join(GARAGE_FILES_ROOT, "HuisFiles").replace(/\\/g, "/");
		if (!fs.existsSync(HUIS_FILES_ROOT)) {
			fs.mkdirSync(HUIS_FILES_ROOT);
		}
		// HUIS File ディレクトリーにある画像ディレクトリーのパス設定 (%APPDATA%\Garage\HuisFiles\remoteimages)
		HUIS_REMOTEIMAGES_ROOT = path.join(HUIS_FILES_ROOT, "remoteimages").replace(/\\/g, "/");
		MIN_HEIGHT_PREVIEW = 156;//プレビューの最小の高さ

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
			"garage.util.huisdev",
			"garage.util.miscutil",
			"garage.util.garagefiles",
			"garage.util.jqutils"],
			() => {
				try {
					electronDialog = new Util.ElectronDialog();
					huisFiles = new Util.HuisFiles();
					garageFiles = new Util.GarageFiles();
					miscUtil = new Util.MiscUtil();
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
						try {
							electronDialog = new Util.ElectronDialog();
							huisFiles = new Util.HuisFiles();
							garageFiles = new Util.GarageFiles();
							miscUtil = new Util.MiscUtil();
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

	// 起動時のチェック
	var initCheck = (callback?: Function) => {
		HUIS_ROOT_PATH = null;
		while (!HUIS_ROOT_PATH) {
			HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
            if (HUIS_ROOT_PATH) { // HUISデバイスが接続されている
                let dirs = null;
                while (dirs == null) {
                    try {
                        dirs = fs.readdirSync(HUIS_ROOT_PATH); //HUIS_ROOT_PATHの読み込みにトライ
                    } catch (e) { // 「パソコンと接続」が押されておらずディレクトリが読めなかった
                        console.error("HUIS must change the mode: HUIS_ROOT_PATH=" + HUIS_ROOT_PATH);
                        let response = electronDialog.showMessageBox(
                            {
                                type: "error",
                                message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_CHECK_CONNECT_WITH_HUIS_NOT_SELECT"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
								title: PRODUCT_NAME,
								cancelId:0,
                            });

                        if (response !== 0) {
                            app.exit(0);
                        }
                    }
                }
                isHUISConnected = true; // HUISが接続されている
                callback(); // 次の処理へ

			} else {
				// HUISデバイスが接続されていない場合は、接続を促すダイアログを出す
				let response = electronDialog.showMessageBox(
					{
						type: "error",
						message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_NOT_CONNECT_WITH_HUIS"),
						buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
						title: PRODUCT_NAME,
						cancelId:0,
                    });

				if (response !== 0) {
					app.exit(0);
				}
			}
		}
	};

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
