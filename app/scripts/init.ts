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

		HUIS_FACE_PAGE_WIDTH = 480;
		HUIS_FACE_PAGE_HEIGHT = 812;
		MAX_HUIS_FILES = 30;
		HUIS_VID = 0x054C;
		HUIS_PID = 0x0B94;
		// Garage のファイルのルートパス設定 (%APPDATA%\Garage)
		GARAGE_FILES_ROOT = path.join(app.getPath("appData"), "Garage").replace(/\\/g, "/");
		// HUIS File のルートパス設定 (%APPDATA%\Garage\HuisFiles)
		HUIS_FILES_ROOT = path.join(GARAGE_FILES_ROOT, "HuisFiles").replace(/\\/g, "/");
		if (!fs.existsSync(HUIS_FILES_ROOT)) {
			fs.mkdirSync(HUIS_FILES_ROOT);
		}
		// HUIS File ディレクトリーにある画像ディレクトリーのパス設定 (%APPDATA%\Garage\HuisFiles\remoteimages)
		HUIS_REMOTEIMAGES_ROOT = path.join(HUIS_FILES_ROOT, "remoteimages").replace(/\\/g, "/");

		// ページの背景の起点座標とサイズ
		HUIS_PAGE_BACKGROUND_AREA = {
			x: -30,
			y: -24,
			w: 540,
			h: 870
		};

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


        //完了時のダイアログのアイコンのパス
        var PATH_IMG_DIALOG_DONE_ICON = 'url("../res/images/icon_done.png")';

        // 同期 (HUIS -> PC) ダイアログのパラメーター 完了文言月(文言は仮のもの)
        DIALOG_PROPS_CREATE_NEW_REMOTE = {
            id: "#common-dialog-spinner",
            options: {
                title: "同期中です。",
                anotherOption: {
                    title: "リモコン登録が完了しました。",
                    src: PATH_IMG_DIALOG_DONE_ICON,
                }
            }
        }

        // 同期 (HUIS -> PC) ダイアログのパラメーター 完了文言(文言は仮のもの)
        DIALOG_PROPS_DELTE_REMOTE = {
            id: "#common-dialog-spinner",
            options: {
                title: "同期中です。",
                anotherOption: {
                    title: "リモコンを削除しました。",
                    src: PATH_IMG_DIALOG_DONE_ICON,
                }
            }
        }

        // 同期 (HUIS -> PC) ダイアログのパラメーター 完了文言(文言は仮のもの)
        DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS_WITH_DONE = {
            id: "#common-dialog-spinner",
            options: {
                title: "同期中です。",
                anotherOption: {
                    title: " HUISとの同期を完了しました。",
                    src: PATH_IMG_DIALOG_DONE_ICON,
                }
            }
        }

		// 同期 (HUIS -> PC) ダイアログのパラメーター (文言は仮のもの)
		DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC = {
			id: "#common-dialog-spinner",
			options: {
				title: "HUIS のファイルと PC のファイルを同期中です。\nHUIS と PC との接続を解除しないでください。",
			}
		};

		// 同期 (PC -> HUIS) ダイアログのパラメーター (文言は仮のもの)
		DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS = {
			id: "#common-dialog-spinner",
			options: {
				"message": "PC のファイルと HUIS のファイルを同期中です。\nHUIS と PC との接続を解除しないでください。"
			}
		};

		// PC と HUIS とのファイル差分チェックダイアログのパラメーター (文言は仮のもの)
		DIALOG_PROPS_CHECK_DIFF = {
			id: "#common-dialog-spinner",
			options: {
                "title": "PC のファイルと HUIS のファイルの差分を確認中です。\nHUIS と PC との接続を解除しないでください。"
			}
        };

        HELP_SITE_URL = "http://rd1.sony.net/help/remote/ui_creator/ja/";

        if (fs.existsSync("debug")) {
            DEBUG_MODE = true;
            console.warn("DEBUG_MODE enabled");
        } else {
            DEBUG_MODE = false;
        }

		callback();
	};

	var loadUtils = (callback: Function): void => {
		// Util のロードと初期化
		requirejs(["garage.model.offscreeneditor", "garage.util.huisfiles", "garage.util.electrondialog", "garage.util.huisdev", "garage.util.miscutil", "garage.util.garagefiles", "garage.util.jqutils"], () => {
			electronDialog = new Util.ElectronDialog();
			huisFiles = new Util.HuisFiles();
			garageFiles = new Util.GarageFiles();
			miscUtil = new Util.MiscUtil();
			callback();
		});
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
                                type: "info",
                                message: "HUIS の画面の「パソコンと接続」をクリックしてください。\n"
                                + "[キャンセル] ボタンを押すとアプリケーションは終了します。",
                                buttons: ["ok", "cancel"]
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
						type: "info",
						message: "HUIS が PC に接続されていません。\n"
						+ "HUIS を PC と接続し「パソコンと接続」をクリックし [OK] ボタンを押してください。\n"
						+ "[キャンセル] ボタンを押すとアプリケーションは終了します。",
						buttons: ["ok", "cancel"]
                    });

				if (response !== 0) {
					app.exit(0);
				}
			}
		}
	};

	// HUIS -> PC の同期を行う
    // Splash.tsに移動したのでいらない
	//var syncWithHUIS = (callback?: Function) => ...

	// HUIS -> PC の同期処理
	var doSync = (callback?: Function) => {
		let syncTask = new Util.HuisDev.FileSyncTask();
		// 同期処理の開始
		let syncProgress = syncTask.exec(HUIS_ROOT_PATH, HUIS_FILES_ROOT, false, null, null, (err) => {
			if (err) {
				// エラーダイアログの表示
				// [TODO] エラー内容に応じて表示を変更するべき
				// [TODO] 文言は仮のもの
				electronDialog.showMessageBox({
					type: "error",
					message: "HUIS との同期に失敗しました"
				});

				app.exit(0);
			} else {
				// 同期後に改めて、HUIS ファイルの parse を行う
				huisFiles.init(HUIS_FILES_ROOT);
				console.log("Complete!!!");
				if (callback) {
					callback();
				}
			}
		});
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
