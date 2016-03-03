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
			filters?: string[]
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
			private dialogOwner_;
			private dialog_;
			constructor() {
				this._resetElectronDialog();
			}

			showOpenFileDialog(options?: ElectronOpenFileDialogOptions, callback?: (fileNames: string[]) => void): void {
				this._resetElectronDialog();
				if (this.dialogOwner_ && this.dialog_) {
					this.dialog_.showOpenDialog(this.dialogOwner_, options, callback);
				}
			}

			showSaveFileDialog(options?: ElectronSaveFileDialogOptions, callback?: (fileName: string) => void): void {
				this._resetElectronDialog();
				if (this.dialogOwner_ && this.dialog_) {
					this.dialog_.showSaveDialog(this.dialogOwner_, options, callback);
				}
			}

			showMessageBox(options?: ElectronMessageBoxOptions, callback?: (response: any) => void): number {
				this._resetElectronDialog();
				if (this.dialogOwner_ && this.dialog_) {
					if (callback) {
						return this.dialog_.showMessageBox(this.dialogOwner_, options, callback);
					} else {
						return this.dialog_.showMessageBox(this.dialogOwner_, options);
					}
				}
			}

			private _resetElectronDialog() {
				if (!this.dialogOwner_) {
					var browserWindow = Remote.require("browser-window");
					this.dialogOwner_ = browserWindow.getFocusedWindow();
				}
				if (!this.dialog_) {
					this.dialog_ = Remote.require("dialog");
				}
			}
		}
	}
}