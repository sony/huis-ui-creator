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
    export module Model {
        import Framework = CDP.Framework;

        export class HuisConnectionChecker extends Backbone.Model{
            static instance: HuisConnectionChecker = null;

            private _type: View.Dialog.UnconnectedDialogType;

            static getInstance(): HuisConnectionChecker {
                if (HuisConnectionChecker.instance == null) {
                    HuisConnectionChecker.instance = new HuisConnectionChecker(View.Dialog.UnconnectedDialogType.BOOT);
                }
                return HuisConnectionChecker.instance;
            }

            /**
             * call from only HuisConnectionChecker.getInstance()
             */
            constructor(type: View.Dialog.UnconnectedDialogType, attributes?: any, options?: any) {
                super(attributes, options);
                this._type = type;
            }

            public setUnconnectDialogType(type: View.Dialog.UnconnectedDialogType) {
                this._type = type;
            }

            public monitorHuisConnection() {
                let loop: Function = () => {
                    setTimeout(loop, 5000);
                    if (!this._isConnectedToHuis()) {
                        this.checkConnection(() => {
                            Framework.Router.navigate("#splash");
                        });
                    }
                };
                loop();
            }

            public checkConnection(callback: Function) {
                HUIS_ROOT_PATH = null;
                if (Util.MiscUtil.isDarwin()) {
                    // in Mac, re-call dialog in UnconnectedDialog
                    // Because of don't stop for dialog input
                    this._updateConnection();
                } else {
                    while (!HUIS_ROOT_PATH) {
                        this._updateConnection();
                    }
                }
                if ((!Util.MiscUtil.isDarwin()) && this._isConnectedToHuis()) {
                    // in Mac, go to splash by UnconnectedDialog
                    callback(); // 次の処理へ
                }
            }

            private _updateConnection() {
                HUIS_ROOT_PATH = Util.HuisDev.getHuisRootPath(HUIS_VID, HUIS_PID);
                if (this._isConnectedToHuis()) {
                    return;
                }
                this.showConnectSuggetDialog();
            }

            /**
              * HUISデバイスが接続されていない場合は、接続を促すダイアログを出す
              */
            private showConnectSuggetDialog() {
                let dialog: View.Dialog.UnconnectedDialog = new View.Dialog.UnconnectedDialog(this._type);
                dialog.show();
            }

            private _isConnectedToHuis(): boolean {
                return fs.existsSync(HUIS_ROOT_PATH);
            }
        }
    }
}
