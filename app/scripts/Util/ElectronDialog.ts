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

        export interface ElectronOpenFileDialogOptions {
            title?: string;
            defaultPath?: string;
            filters?: {
                name: string;
                extensions: string[];
            }[];
            [x: string]: any;
        }

        export interface ElectronSaveFileDialogOptions {
            title?: string;
            defaultPath?: string;
            filters?: {
                name: string;
                extensions: string[];
            }[];
        }

        export interface ElectronMessageBoxOptions {
            /**
             * Can be "none", "info" or "warning".
             */
            type?: string;
            /**
             * Texts for buttons.
             */
            buttons?: string[];
            /**
             * Title of the message box (some platforms will not show it).
             */
            title?: string;
            /**
             * Contents of the message box.
             */
            message?: string;
            /**
             * Extra information of the message.
             */
            detail?: string;
            /*
             * return velue when no button cliecked but thr dialog window closed
             */
            cancelId?: number;
            icon?: any;
        }

        /**
         * @class ElectronDialog
         * @brief Electron のダイアログを扱うための wrapper クラス
         */
        export class ElectronDialog {
            private _dialogOwner;
            private _dialog;
            private _enabled = true;
            constructor() {
                this._resetElectronDialog();
            }

            /**
             * ファイルオープンダイアログを開く
             * 
             * @param options {ElectronOpenFileDialogOptions} ファイルオープンダイアログのオプション
             * @param callback {Function} ダイアログを開いた後に呼び出されるコールバック関数
             */
            showOpenFileDialog(options?: ElectronOpenFileDialogOptions, callback?: (fileNames: string[]) => void): void {
                if (!this._enabled) {
                    return;
                }
                this._resetElectronDialog();
                if (!this._dialogOwner) { // Focusがこのアプリ以外にある場合→第1引数なしで呼び出し
                    if (this._dialog) {
                        this._dialog.showOpenDialog(options, callback);
                    }
                } else { // Focusがこのアプリにある場合→第1引数つきで呼び出し
                    if (this._dialog) {
                        this._dialog.showOpenDialog(this._dialogOwner, options, callback);
                    }
                }
            }

            /**
             * ファイル保存ダイアログを開く
             * 
             * @param options {ElectronSaveFileDialogOptions} ファイル保存ダイアログのオプション
             * @param callback {Function} ダイアログを開いた後に呼び出されるコールバック関数
             */
            showSaveFileDialog(options?: ElectronSaveFileDialogOptions, callback?: (fileName: string) => void): void {
                if (!this._enabled) {
                    return;
                }
                this._resetElectronDialog();
                if (!this._dialogOwner) { // Focusがこのアプリ以外にある場合→第1引数なしで呼び出し
                    if (this._dialog) {
                        this._dialog.showSaveDialog(options, callback);
                    }
                } else { // Focusがこのアプリにある場合→第1引数つきで呼び出し
                    if (this._dialog) {
                        this._dialog.showSaveDialog(this._dialogOwner, options, callback);
                    }
                }
            }

            /**
             * メッセージダイアログを開く
             * 
             * @param options {ElectronSaveFileDialogOptions} ファイル保存ダイアログのオプション
             * @param callback {Function} ダイアログを開いた後に呼び出されるコールバック関数
             * @return {number} クリックされたボタンのindex。
             *     callbackが指定されている時、もしくはDialogがDisableされている時にはundefinedを返す。
             */
            showMessageBox(options?: ElectronMessageBoxOptions, callback?: (response: any) => void): number {
                if (!this._enabled) {
                    return undefined;
                }
                //debugger;
                this._resetElectronDialog();
                if (!this._dialogOwner) { // Focusがこのアプリ以外にある場合→第1引数なしで呼び出し
                    if (this._dialog) {
                        if (callback) {
                            return this._dialog.showMessageBox(options, callback);
                        } else {
                            return this._dialog.showMessageBox(options);
                        }
                    }
                } else { // Focusがこのアプリにある場合→第1引数つきで呼び出し
                    if (this._dialog) { 
                        if (callback) {
                            return this._dialog.showMessageBox(this._dialogOwner, options, callback);
                        } else {
                            return this._dialog.showMessageBox(this._dialogOwner, options);
                        }
                    }
                } 
            }

            /**
             * Darwin環境において、HUISと切断された際のメッセージダイアログを開く。
             * このメソッドはそれ以外のメッセージ表示の際には使わない事。
             *
             * Darwin環境におけるElectronのダイアログは以下の点でWindows環境と異なる。
             * そのWorkaroundとして本メソッドは存在する。
             * ・非同期Dialogの表示中に同期Dialogを表示しようとした場合、非同期ダイアログのコールバックが呼ばれない
             * ・非同期Dialogの表示中に非同期Dialogを表示しようとした場合、2回目以降の呼び出しが正常に処理されない
             * そのため、Splashクラスにおける切断検知関数中で、非同期ダイアログの表示中にも本メソッドを表示されるまで繰り返し呼ぶことで
             * 切断ダイアログを表示させる事にしている。（そして切断ダイアログ表示中に更に呼び出された切断ダイアログは、無視される。）
             * 例えば、リモコンファイルのImport中にHUISが切断された場合などに本Workaroundが有効に働く。
             *
             * @param options {ElectronMessageDialogOptions} ファイル保存ダイアログのオプション
             * @param callback {Function} ダイアログを開いた後に呼び出されるコールバック関数
             */
            showDisconnectedMessageBoxForDarwin(options?: ElectronMessageBoxOptions, callback?: (response: any) => void): number {
                this._disableDialog();
                // This method does NOT check enabled, because this method is called repeatedly when other dialog is displayed.
                this._resetElectronDialog();
                if (this._dialog) {
                    if (callback) {
                        return this._dialog.showMessageBox(Remote.getCurrentWindow(), options, callback);
                    } else {
                        return this._dialog.showMessageBox(Remote.getCurrentWindow(), options);
                    }
                }
            }
            /**
             * Electron のダイアログを使用するための初期設定
             */
            private _resetElectronDialog() {
                if (!this._dialogOwner) {
                    var browserWindow = Remote.BrowserWindow;
                    this._dialogOwner = browserWindow.getFocusedWindow(); // focusが他のアプリやDebuggerにあるとnullが返る
                }
                if (!this._dialog) {
                    this._dialog = Remote.dialog; // Remote.Dialogだとクラスを返すので正しく動作しない。
                }
            }

            private _disableDialog () {
                this._enabled = false;
            }
        }
    }
}