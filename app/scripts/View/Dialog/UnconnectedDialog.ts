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

/// <reference path="../../include/interfaces.d.ts" />

module Garage {
    export module View {
        export module Dialog {
            import Framework = CDP.Framework;

            export enum UnconnectedDialogType {
                BOOT,
                NON_EDIT,
                EDIT
            }

            export class UnconnectedDialog {
                private _type: UnconnectedDialogType;

                constructor(type: UnconnectedDialogType) {
                    this._type = type;
                }

                private getText(type: UnconnectedDialogType): string {
                    switch (type) {
                        case UnconnectedDialogType.NON_EDIT:
                            return "dialog.message.STR_DIALOG_MESSAGE_DISCONNECT_WITH_HUIS";
                        case UnconnectedDialogType.EDIT:
                            return "dialog.message.STR_DIALOG_MESSAGE_DISCONNECT_WITH_HUIS_DISCARD_EDIT";
                        case UnconnectedDialogType.BOOT:
                        default:
                            return "dialog.message.STR_DIALOG_MESSAGE_NOT_CONNECT_WITH_HUIS";
                    }
                }

                public show() {
                    let text: string = this.getText(this._type);
                    let option = {
                        type: "info",
                        message: $.i18n.t(text),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_RETRY"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CLOSE_APP")],
                        title: PRODUCT_NAME,
                        cancelId: 0,
                    };
                    let response = null;
                    if (Util.MiscUtil.isDarwin()) {
                        response = electronDialog.showDisconnectedMessageBoxForDarwin(option,
                                                                                      (res) => {
				                                                          this._responseAction(res);
                                                                                      });
		    } else {
                        response = electronDialog.showMessageBox(option);
                        this._responseAction(response);
                    }
                }

                private _responseAction(response: number) {
                    if (response == 0) {
                        if (Util.MiscUtil.isDarwin()) {
                            this._retry();
                        }
                        return;
                    }
                    app.exit(0);
                }

                private _retry() {
                    HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
                    if (!HUIS_ROOT_PATH) {
                        let dialog: View.Dialog.UnconnectedDialog = new View.Dialog.UnconnectedDialog(this._type);
                        dialog.show();
                    } else {
                        Framework.Router.navigate("#splash");
                    }
                }
            }
        }
    }
}
