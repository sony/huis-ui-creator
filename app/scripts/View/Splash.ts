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
                        let messageBoxOptions = {
                            type: "error",
                            message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_DISCONNECT"),
                            buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                            title: PRODUCT_NAME,
                        }

                        if (Util.MiscUtil.isDarwin()) {
                            electronDialog.showDisconnectedMessageBoxForDarwin(messageBoxOptions,
                                (response) => {
                                    console.log(TAG + " DIALOG_MESSAGE_ALERT_DISCONNECT closed, response: " + response);
                                    isHUISConnected = false;
                                    app.quit();
                                }
                            );
                        } else {
                            electronDialog.showMessageBox(messageBoxOptions);
                            isHUISConnected = false;
                            app.quit();
                        }
                    }
                })();

                //現状アプリのバージョン情報を代入。
                let targetVersionFilePath = null;
                // Garage のファイルのルートパス設定 (%APPDATA%\Garage)
                if (Util.MiscUtil.isWindows()) {
                    targetVersionFilePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/version/windows/version.txt"));
                } else if (Util.MiscUtil.isDarwin()) {
                    targetVersionFilePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/version/mac/version.txt"));
                } else {
                    console.error("Error: unsupported platform");
                }

                try {
                    if (targetVersionFilePath != null) {
                        APP_VERSION = fs.readFileSync(targetVersionFilePath, 'utf8');
                    }
                } catch (err) {
                    console.error(err);
                }

                //ビジネス仕向けの場合、ストレージロックの解除判定をする。
                if (Util.MiscUtil.isBz()) {
                    this.checkStorageLock().then(() => {
                        this._MoveHomeBeforeSync();
                    });
                } else {
                    this._MoveHomeBeforeSync();
                }
            }


            /*
             * 同期処理後、ホームへ移動する。
             */
            private _MoveHomeBeforeSync() {

                sharedInfo = huisFiles.loadSharedInfo();

                //本体のバージョン確認。
                this.checkRcVersionFromDevice();

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
                this.currentWindow_.setMinimumSize(1280, 768); // 最小ウィンドウサイズを指定
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
                            cancelId: 1,
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

            /*
            * commonリモコン用の画像をremoteImagesにコピーする。ただし、huisFilesは初期化されているものとする。
            */
            private syncCommonImages(callback?: Function) {
                let FUNCTION_NAME = TAG + "syncCommonImages : ";

                let src = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/images"));//コピー元：システムファイルのcommonImage
                let dst = HUIS_REMOTEIMAGES_ROOT;//コピー先

                //copyしてcallbackを実行
                let syncTask = new Util.HuisDev.FileSyncTask();
                let syncProgress = syncTask.copyFilesSimply(src, dst, (err) => {
                    if (err) {
                        this.showDialogNotConnectWithHuis(err);
                    } else if (callback) {//同期成功。 
                        callback();
                    }
                });
            }


            /**
             * ストレージロックのチェック
             */
            private checkStorageLock(): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                storageLock = new Util.StorageLock();

                // ダイアログ表示中もスピナーを回転させるための setTimeout
                setTimeout(() => {
                    if (storageLock.isLocked()) {
                        // ロックされていますメッセージダイアログ
                        let res = this.showStorageUnlockDialog();
                        if (res === 0) {
                            // 「解除」選択時
                            let result = storageLock.unlock();
                            if (result) {
                                // 解除しました再起動してくださいダイアログ
                                this.showPleaseRestartDialog();

                            } else {
                                // 解除失敗ダイアログ
                                this.showFailedToUnlockDialog();

                            }
                        }
                        app.exit(0);

                    } else {
                        // ロックされていない場合はすぐ返す
                        df.resolve();
                    }
                }, 100);

                return promise;
            }

            /**
             * ストレージロックを解除するかどうかのダイアログを表示
             *
             * @return {number} ダイアログの入力
             */
            private showStorageUnlockDialog(): number {
                return electronDialog.showMessageBox(
                    {
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_STORAGE_LOCKED"),
                        buttons: [
                            $.i18n.t("dialog.button.STR_DIALOG_BUTTON_STORAGE_UNLOCK"),
                            $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")
                        ],
                        title: PRODUCT_NAME,
                        cancelId: 0,
                    });
            }


            /**
             * ロック解除後の再起動を促すダイアログを表示
             */
            private showPleaseRestartDialog() {
                electronDialog.showMessageBox(
                    {
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SUCCEEDED_STORAGE_UNLOCK"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                        cancelId: 0,
                    });
            }


            /**
             * ロック解除失敗のダイアログを表示
             */
            private showFailedToUnlockDialog() {
                electronDialog.showMessageBox(
                    {
                        type: "error",
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_FAILED_STORAGE_UNLOCK"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                        cancelId: 0,
                    });
            }

            private _isExistAppVersionBtoB() {
                let app_version_btob_path = path.join(HUIS_ROOT_PATH, "appversionBtoB").replace(/\\/g, "/");
                return fs.existsSync(app_version_btob_path);
            }

            private __checkVersion() {
                let rcVersion: Model.VersionString = new Model.VersionString(sharedInfo.version);
                let requiredRcVersion = new Model.VersionString(HUIS_RC_VERSION_REQUIRED)

                let garageVersion: Model.VersionString = new Model.VersionString(APP_VERSION);
                let requiredGarageVersion = new Model.VersionString(sharedInfo.requiredGarageVersion);


                if (rcVersion.isOlderThan(requiredRcVersion)) {
                    this.showHuisRcVersionIsOldDialog();
                } else if (garageVersion.isOlderThan(requiredGarageVersion)) {
                    this.showGarageVersionIsOldDialog();
                }
            }

            private _checkVersionForBz() {
                if (sharedInfo == null) {
                    console.warn("deviceInfo is not found, HUIS may be old.");
                    console.warn("old version is not supported by BtoB UI-Creator");
                    this.showHuisRcVersonIsNotSupported();
                }

                if (!sharedInfo.isBtoB) {
                    console.warn("BtoC HUIS is not supported by BtoB UI-Creator");
                    this.showHuisRcVersonIsNotSupported();
                }

                this.__checkVersion();
            }

            private _checkVersion() {
                if (this._isExistAppVersionBtoB()) {
                    console.warn("BtoB HUIS is not supported by BtoC UI-Creator");
                    this.showHuisRcVersonIsNotSupported();
                }

                if (sharedInfo == null) {
                    console.warn("deviceInfo is not found, HUIS may be old.");
                    this.showHuisRcVersionIsOldDialog();
                }

                this.__checkVersion();
            }

            /**
             * app versionを接続しているHUISから取得する。そして、HUISのバージョンが古いとダイアログをだす。
             */
            private checkRcVersionFromDevice(callback?: Function) {
                if (Util.MiscUtil.isBz()) {
                    this._checkVersionForBz();
                } else {
                    this._checkVersion();
                }
            }

            /**
             * 接続されたHUISのバージョンがサポート外である場合のDialogを表示
             */
            private showHuisRcVersonIsNotSupported() {

                //ダイアログを表示
                let response = electronDialog.showMessageBox(
                    {
                        type: "error",
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ERROR_HUIS_VERSION_IS_NOT_SUPPORTED"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                    }
                );
                app.exit(0);
            }

            /**
             * UI-Creatorのバージョンが古い場合のダイアログを表示
             */
            private showGarageVersionIsOldDialog() {

                //ダイアログを表示
                let response = electronDialog.showMessageBox(
                    {
                        type: "error",
                        message: $.i18n.t("dialog.message.STR_DIALOG_ERROR_GARAGE_VERSION_IS_OLD_1") +
                        $.i18n.t("hp.update.app.url") + $.i18n.t("dialog.message.STR_DIALOG_ERROR_GARAGE_VERSION_IS_OLD_2") +
                        sharedInfo.requiredGarageVersion + $.i18n.t("dialog.message.STR_DIALOG_ERROR_GARAGE_VERSION_IS_OLD_3"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                    }
                );
                app.exit(0);
            }

            /**
             * HUIS本体のバージョンが古い場合のダイアログを表示
             */
            private showHuisRcVersionIsOldDialog() {

                //ダイアログを表示
                let response = electronDialog.showMessageBox(
                    {
                        type: "error",
                        message: $.i18n.t("dialog.message.STR_DIALOG_ERROR_HUIS_VERSION_IS_OLD_1") +
                        $.i18n.t("hp.update.rc.url") + $.i18n.t("dialog.message.STR_DIALOG_ERROR_HUIS_VERSION_IS_OLD_2") +
                        HUIS_RC_VERSION_REQUIRED_FOR_DIALOG + $.i18n.t("dialog.message.STR_DIALOG_ERROR_HUIS_VERSION_IS_OLD_3"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                    }
                );
                app.exit(0);
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
                        this.showDialogNotConnectWithHuis(err);
                    } else {//同期成功。
                        // 同期後に改めて、HUIS ファイルの parse を行う
                        huisFiles.init(HUIS_FILES_ROOT);
                        console.log("Complete!!!");

                        this.syncCommonImages(callback);
                    }
                });
            };


            private showDialogNotConnectWithHuis(err) {
                // エラーダイアログの表示
                // [TODO] エラー内容に応じて表示を変更するべき
                // [TODO] 文言は仮のもの
                electronDialog.showMessageBox({
                    type: "error",
                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_NOT_CONNECT_WITH_HUIS"),
                    title: PRODUCT_NAME,
                });

                app.exit(0);
            }



        }

        var View = new Splash();

    }
}
