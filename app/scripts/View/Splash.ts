/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />

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
        class Splash extends UI.PageView<Backbone.Model> {
            private currentWindow_: any;
            private contextMenu_: any;

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
                    "dblclick header .ui-title": "_onHeaderDblClick",
                    "click #create-new-remote": "_onCreateNewRemote",
                    "click #sync-pc-to-huis": "_onSyncPcToHuisClick",
                    // コンテキストメニュー
                    "contextmenu": "_onContextMenu",
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
                //this.currentWindow_.setClosable(false);
               
                //debugger;
            }


            private _closeWarning() {
                console.log("Do not close");
                let response = electronDialog.showMessageBox(
                    {
                        type: "info",
                        message: "同期中にアプリを終了するとデータが破損する恐れがあります。\n"
                        + "それでも終了しますか？\n",
                        buttons: ["yes", "no"]
                    });
                if (response !== 0) {
                    return null;
                }
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

                //let needSync: boolean = false;
                try {
                    // 既に PC 側に有効な HUIS ファイルが同期済みかチェック
                    if (huisFiles.init(HUIS_FILES_ROOT)) {
                        //debugger;
                        // 現在つながれている HUIS のファイルと PC 側の HUIS ファイルに差分があるかをチェック
                        //Util.HuisDev.hasDiffAsync(HUIS_FILES_ROOT, HUIS_ROOT_PATH, DIALOG_PROPS_CHECK_DIFF, (result: boolean) => {
                        Util.HuisDev.hasDiffAsync(HUIS_FILES_ROOT, HUIS_ROOT_PATH, null, (result: boolean) => {
                            if (result) {
                                // 差分がある場合は、HUIS -> PC で上書き同期をするかを確認する
                                let response = electronDialog.showMessageBox(
                                    {
                                        type: "info",
                                        message: "この PC に以前 HUIS と同期したときのファイルが存在しています。\n"
                                        + "HUIS の内容を PC に同期しますか？\n"
                                        + "同期した場合は、以前同期した HUIS のファイルは上書きされます。",
                                        buttons: ["yes", "no"]
                                    });
                                // yes を選択した場合 (response: 0) は、同期フラグを立てる
                                if (response === 0) {
                                    needSync = true;
                                }
                            }
                            // 同期が必要な場合のみ、同期を実行
                            if (needSync) {
                                this.doSync(callback);
                            } else {
                                if (callback) {
                                    callback();
                                }
                            }
                        });
                    } else {
                        // PC 側に HUIS ファイルが保存されていない場合は、強制的に HUIS -> PC で同期を行う
                        this.doSync(callback);
                    }
                } catch (err) {
                    console.error(err);
                    console.error("error occurred in syncWithHUIS");
                    HUIS_ROOT_PATH = null;
                }
            };

            private doSync(callback?: Function) {
                let syncTask = new Util.HuisDev.FileSyncTask();
                // 同期処理の開始
                let syncProgress = syncTask.exec(HUIS_ROOT_PATH, HUIS_FILES_ROOT, false, DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC, (err) => {
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

        }

        var View = new Splash();

    }
} 