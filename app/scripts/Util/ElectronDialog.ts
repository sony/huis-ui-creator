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

		export class ElectronDialog {
			private _dialogOwner;
			private _dialog;
			constructor() {
				this._resetElectronDialog();
			}

			showOpenFileDialog(options?: ElectronOpenFileDialogOptions, callback?: (fileNames: string[]) => void): void {
				this._resetElectronDialog();
				if (this._dialogOwner && this._dialog) {
					this._dialog.showOpenDialog(this._dialogOwner, options, callback);
				}
			}

			showSaveFileDialog(options?: ElectronSaveFileDialogOptions, callback?: (fileName: string) => void): void {
				this._resetElectronDialog();
				if (this._dialogOwner && this._dialog) {
					this._dialog.showSaveDialog(this._dialogOwner, options, callback);
				}
			}

			showMessageBox(options?: ElectronMessageBoxOptions, callback?: (response: any) => void): number {
				this._resetElectronDialog();
				if (this._dialogOwner && this._dialog) {
					if (callback) {
						return this._dialog.showMessageBox(this._dialogOwner, options, callback);
					} else {
						return this._dialog.showMessageBox(this._dialogOwner, options);
					}
				}
			}

			private _resetElectronDialog() {
				if (!this._dialogOwner) {
					var browserWindow = Remote.require("browser-window");
					this._dialogOwner = browserWindow.getFocusedWindow();
				}
				if (!this._dialog) {
					this._dialog = Remote.require("dialog");
				}
			}
		}
	}
}