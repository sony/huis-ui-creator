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

/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        namespace ConstValue {
            export const TEMPLATE_FILE_PATH: string = CDP.Framework.toUrl("/templates/item-detail.html");
            export const FILE_TYPE_JPG: string = "jpg";
            export const FILE_TYPE_JPEG: string = "jpeg";
            export const FILE_TYPE_PNG: string = "png";
            export const EXT_CHAR: string = ".";
            export const EXT_JPG: string = EXT_CHAR + FILE_TYPE_JPG;
            export const EXT_JPEG: string = EXT_CHAR + FILE_TYPE_JPEG;
            export const EXT_PNG: string = EXT_CHAR + FILE_TYPE_PNG;
            export const DIALOG_TYPE_ERROR: string = "error";
        }

        /**
         * 外部の画像ファイルをエクスプローラー/ファインダーから選択し、
         * 画像パスを取得する。
         * 取得した画像のconvertなどはしない。
         */
        export class ImageFileSelector extends Backbone.View < Backbone.Model > {

            /**
             * エクスプローラー/ファインダーから画像を選択する。
             * @return {CDP.IPromise<string>} 成功時 アプリ用のフォルダへコピー済みの 選択された画像の絶対パスを返す。失敗時 nullを返す。
             */
            public showImageSelectDialog(): CDP.IPromise<string> {
                let FUNCTION_NAME = "_showImageSelectDialog : ";
                let df = $.Deferred<string>();
                let promise = CDP.makePromise(df);

                let options: Util.ElectronOpenFileDialogOptions = {
                    properties: ["openFile"],
                    filters: [
                        { name: "画像", extensions: [ConstValue.FILE_TYPE_PNG, ConstValue.FILE_TYPE_JPG, ConstValue.FILE_TYPE_JPEG] },
                    ],
                    title: PRODUCT_NAME, // Electron uses Appname as the default title
                };

                electronDialog.showOpenFileDialog(
                    options,
                    (imageFiles: string[]) => {
                        if (!imageFiles || !imageFiles.length) {
                            df.reject(null);
                        }
                        //画像ファイルダイアログが表示されると、すべてのフォーカスがはずれてKeydownが働かなくなってしまう。
                        //そのため、直後にフォーカスを設定しなおす。
                        this.$el.focus();
                        let imageFilePath = imageFiles[0];

                        //check errors
                        if (this._showImageFileExtError(imageFilePath)
                            || this._showTooLargeFileSizeError(imageFilePath)
                            || this._showNonSupportJpegError(imageFilePath)
                            || this._showFakeJpegError(imageFilePath)
                            || this._showAnyTroubleError(imageFilePath)) {
                            df.reject(null);
                        }

                        console.log("[ImageFileSelector] selected image path : " + imageFilePath);
                        df.resolve(imageFilePath);
                    }
                );

                return promise;
            }

            /**
             * 画像ファイルの拡張子が対応していない場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showImageFileExtError(imageFilePath: string): boolean {
                let FUNCTION_NAME = "_showImageFileExtError : ";

                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if (!((imageFileExt === ConstValue.EXT_JPG)
                    || (imageFileExt === ConstValue.EXT_JPEG)
                    || (imageFileExt === ConstValue.EXT_PNG))) {
                    // 警告を出す
                    console.warn(FUNCTION_NAME + "ONLY jpg, png, jpeg are supported");
                    let response = electronDialog.showMessageBox({
                        type: ConstValue.DIALOG_TYPE_ERROR,
                        message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_NON_SUPPORTED_FILE"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                        title: PRODUCT_NAME,
                    });
                    return true;
                }
                return false;
            }

            /**
             * 画像ファイルのが大きすぎる場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showTooLargeFileSizeError(imageFilePath: string): boolean {
                let FUNCTION_NAME = "_showTooLargeFileSizeError : ";
                if (Util.MiscUtil.checkFileSize(imageFilePath) === Util.MiscUtil.ERROR_SIZE_TOO_LARGE) {
                    let response = electronDialog.showMessageBox({
                        type: ConstValue.DIALOG_TYPE_ERROR,
                        message: $.i18n.t("dialog.message.STR_DIALOG_ERROR_IMAGE_FILE_TOO_LARGE_1") + (MAX_IMAGE_FILESIZE / 1000000) + $.i18n.t("dialog.message.STR_DIALOG_ERROR_IMAGE_FILE_TOO_LARGE_2"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                        title: PRODUCT_NAME,
                    });
                    console.warn(FUNCTION_NAME + "Image file too large");
                    return true;
                }
                return false;
            }

            /**
             * 画像ファイルサポート外のJpegだった場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showNonSupportJpegError(imageFilePath: string): boolean {
                let FUNCTION_NAME = "_showNonSupportJpegError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === ConstValue.EXT_JPG) || (imageFileExt === ConstValue.EXT_JPEG)) {
                    let result = Util.MiscUtil.checkJPEG(imageFilePath);
                    if ((result === Util.MiscUtil.ERROR_TYPE_JPEG2000) || (result === Util.MiscUtil.ERROR_TYPE_JPEGLOSSLESS)) {
                        // JPEG2000及びJPEG Losslessはサポートしていない警告を出す
                        let response = electronDialog.showMessageBox({
                            type: ConstValue.DIALOG_TYPE_ERROR,
                            message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_JPEG2000_JPEG_LOSSLESS_FILE"),
                            buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                            title: PRODUCT_NAME,
                        });
                        console.warn(FUNCTION_NAME + "JPEG lossless or JPEG2000 are not supported");
                        return true;
                    }
                }
                return false;
            }

            /**
             * 画像ファイルがJpeg形式だが中身がJpegでない場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showFakeJpegError(imageFilePath: string): boolean {
                let FUNCTION_NAME = "_showFakeJpegError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === ConstValue.EXT_JPG) || (imageFileExt === ConstValue.EXT_JPEG)) {
                    let result = Util.MiscUtil.checkJPEG(imageFilePath);
                    if (result === Util.MiscUtil.ERROR_TYPE_NOT_JPEG) { // 拡張子はJPG/JPEGだが中身がJPEGでないものが指定された
                        let response = electronDialog.showMessageBox({
                            type: ConstValue.DIALOG_TYPE_ERROR,
                            message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_BROKEN_FILE"),
                            buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                            title: PRODUCT_NAME,
                        });
                        console.warn("This type of JPEG is not supported");
                        return true;
                    }
                }
                return false;
            }

            /**
             * 何らかのトラブルでファイルが読めない場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showAnyTroubleError(imageFilePath: string): boolean {
                let FUNCTION_NAME = "_showAnyTroubleError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === ConstValue.EXT_JPG) || (imageFileExt === ConstValue.EXT_JPEG)) {
                    let result = Util.MiscUtil.checkJPEG(imageFilePath);
                    if (result === Util.MiscUtil.ERROR_FILE_ACCESS) { // 何らかのトラブルでファイルが読めない                                
                        console.warn("Imega file not found"); // 普通はこないので特にダイアログは出さないで、編集画面にも何も起きない状態に
                        return true;
                    }
                }
                return false;
            }
        }
    }
}
