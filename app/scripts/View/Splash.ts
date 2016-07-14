/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />
/// <reference path="BasePage.ts" />

module Garage {
    export module View {

        import Framework = CDP.Framework;
        import Tools = CDP.Tools;
        import UI = CDP.UI;

        var TAG: string = "[Garage.View.Splash]";

        /**
         * @class Splash
         * @brief Splash screen class
         */
        class Splash extends BasePage {          
			/**
			 * construnctor
			 */
            constructor() {
                super("/templates/splash.html", "page-splash", { route: "splash" });
            }

            ///////////////////////////////////////////////////////////////////////
            // Override: UI.PageView

            //! page initialization event
            onInitialize(event: JQueryEventObject): void {
               super.onInitialize(event);
            }

            //! page show event
            onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
                super.onPageShow(event, data);
                this._initializeSplashView();
                (function loop() {
                    setTimeout(loop, 5000);
                    if (!fs.existsSync(HUIS_ROOT_PATH) && isHUISConnected) {
                        electronDialog.showMessageBox({
                            type: "error",
                            message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_DISCONNECT"),
                            buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
							title: PRODUCT_NAME,
                        });
                        isHUISConnected = false;
                        app.quit();
                    }
                })();
                this.syncWithHUIS(() => {
                    Framework.Router.navigate("#home");
                }); // 同期が完了したらHomeに遷移する
            }
            
            //! page before hide event
            onPageBeforeHide(event: JQueryEventObject, data?: Framework.HideEventData) {
                $(window).off("resize", this._pageLayout);
                $(window).off("beforeunload", this._closeWarning);

                super.onPageBeforeHide(event, data);
            }

            //! events binding
            events(): any {
                return {
                };
            }

            render(): Splash {
                return this;
            }

			/**
			 * Splash 画面の初期化
			 */
            private _initializeSplashView() {

                this._pageLayout();
                this.render();

                $(window).on("resize", this._pageLayout);
                $(window).on("beforeunload", this._closeWarning);

                this.currentWindow_ = Remote.getCurrentWindow();
                this.currentWindow_.setMenuBarVisibility(false);

				$("#splash-message").find("p").html($.i18n.t("splash.STR_SPLASH_MESSAGE"));
            }


            private _closeWarning() {
                if (isHUISConnected) { // HUISが抜かれてない場合
                    console.log("Do not close");
                    let response = electronDialog.showMessageBox(
                        {
                            type: "info",
                            message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_END_GARAGE_IN_SYNC"),
                            buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
							title: PRODUCT_NAME,
                        }
					);
                    if (response !== 0) {
                        return null;
                    }
                }
				isHUISConnected = false;
            }

            private _pageLayout() {
                var windowWidth = innerWidth;
                var windowHeight = innerHeight;
            }


            private syncWithHUIS(callback?: Function) {
                if (!HUIS_ROOT_PATH) {
                    console.warn("HUIS may not be connected.");
                    return;
                }
                let needSync: boolean = false; // [TODO]デバッグ用に強制 sync

                try {
                    // 既に PC 側に有効な HUIS ファイルが同期済みかチェック
                    if (huisFiles.init(HUIS_FILES_ROOT)) {
                        // 現在つながれている HUIS のファイルと PC 側の HUIS ファイルに差分があるかをチェック
                        Util.HuisDev.hasDiffAsync(HUIS_FILES_ROOT, HUIS_ROOT_PATH, null, (result: boolean) => {
                            // 同期を実行  (差分がある場合は常に(ダイアログ等での確認なしに)HUIS->PCへの上書きを行う)                            
                            this.doSync(true, callback);                          
                        });
                    } else {
                        // PC 側に HUIS ファイルが保存されていない場合は HUIS -> PC で同期を行う
                        this.doSync(true, callback);
                    }
                } catch (err) {
                    console.error(err);
                    console.error("error occurred in syncWithHUIS");
                    HUIS_ROOT_PATH = null;
                }
            };

            private doSync(direction: Boolean, callback?: Function) {
                let syncTask = new Util.HuisDev.FileSyncTask();
                // 同期処理の開始
				// 実際は一方向の上書きである
				// direction === true -> HUIS->PC
				// direction === false -> PC->HUIS
				let src = (direction) ? HUIS_ROOT_PATH : HUIS_FILES_ROOT; // HUIS_ROOT_PATH: HUISデバイスのルート, HUIS_FILES_ROOT: PC上の設定ファイルのルート
				let dst = (direction) ? HUIS_FILES_ROOT : HUIS_ROOT_PATH;

                let syncProgress = syncTask.exec(src, dst, false, DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC, null, (err) => {
                    if (err) {
                        // エラーダイアログの表示
                        // [TODO] エラー内容に応じて表示を変更するべき
                        // [TODO] 文言は仮のもの
                        electronDialog.showMessageBox({
                            type: "error",
                            message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_NOT_CONNECT_WITH_HUIS"),
							title: PRODUCT_NAME,
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

        }

        var View = new Splash();

    }
} 