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
			filters?: string[];
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
			icon?: any;
		}

		/**
		 * @class ElectronDialog
		 * @brief Electron のダイアログを扱うための wrapper クラス
		 */
		export class ElectronDialog {
			private _dialogOwner;
			private _dialog;
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
				this._resetElectronDialog();
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
			 */
            showMessageBox(options?: ElectronMessageBoxOptions, callback?: (response: any) => void): number {
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
			 * Electron のダイアログを使用するための初期設定
			 */
            private _resetElectronDialog() {
                //debugger;
				if (!this._dialogOwner) {
                    var browserWindow = Remote.BrowserWindow;
                    this._dialogOwner = browserWindow.getFocusedWindow(); // focusが他のアプリやDebuggerにあるとnullが返る
				}
				if (!this._dialog) {
					this._dialog = Remote.dialog; // Remote.Dialogだとクラスを返すので正しく動作しない。
				}
			}
		}
	}
}