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

module Garage {
    export module Util {
        import Framework = CDP.Framework;
        export class HuisConnectionChecker {

            public monitorHuisConnection() {
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
                                    console.log("DIALOG_MESSAGE_ALERT_DISCONNECT closed, response: " + response);
                                    isHUISConnected = false;
                                    app.quit();
                                }
                            );
                        } else {
                            isHUISConnected = false;
                            let connectionChecker: Util.HuisConnectionChecker = new Util.HuisConnectionChecker();
                            connectionChecker.checkConnection(() => {
                                Framework.Router.navigate("#splash");
                            });
                        }
                    }
                })();
            }

            public checkConnection(callback?: Function) {
                HUIS_ROOT_PATH = null;
                while (!HUIS_ROOT_PATH) {
                    HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
                    if (!HUIS_ROOT_PATH) {
                        // HUISデバイスが接続されていない
                        this.showConnectSuggetDialog();
                        continue;
                    }
                    this.updateHuisConnectionSatus();
                    callback(); // 次の処理へ
                }
            }

            /**
              * HUISデバイスが接続されていない場合は、接続を促すダイアログを出す
              */
            private showConnectSuggetDialog() {
                let dialog: View.Dialog.UnconnectedDialog = new View.Dialog.UnconnectedDialog();
                dialog.show();
            }

            /**
              * HUISの接続状況を更新する
              */
            private updateHuisConnectionSatus() {
                while (true) {
                    if (fs.existsSync(HUIS_ROOT_PATH)) {
                        break;
                    }
                    console.error("HUIS must change the mode: HUIS_ROOT_PATH=" + HUIS_ROOT_PATH);

                    let response: number = this.showPressButtonToConnectSuggetDialog();
                    const retryResponse: number = 0;
                    if (response !== retryResponse) {
                        app.exit(0);
                    }
                }
                isHUISConnected = true; // HUISが接続されている
            }

            private showPressButtonToConnectSuggetDialog(): number {
                return electronDialog.showMessageBox(
                    {
                        type: "info",
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_CHECK_CONNECT_WITH_HUIS_NOT_SELECT"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                        cancelId: 0,
                    });
            }
        }
    }
}
