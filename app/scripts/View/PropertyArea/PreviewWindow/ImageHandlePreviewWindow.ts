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

/// <reference path="../../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.ImageHandlePreviewWindow] ";

        namespace constValue {
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

        export abstract class ImageHandlePreviewWindow extends PreviewWindow {

            protected tmpImageFilePath_: string;//変更後の画像パス。モデル適応する前に親クラスが取得するために保持。
            protected editingRemoteId_: string;
            private isBackgroundImge_: boolean;

            /**
             * @param {Model.Item} Model.ButtonItemあるいは Model.ImageItem
             * @param {string} editingRemoteId 編集中のリモコンのremoteId
             * @param {string} domId 自身を指す DOMのID
             * @param {string} templateDomId 自身のテンプレートのDOMのID
             * @param {Backbone.ViewOptions<Model.Item>} options? Backbone.Viewのオプション
             */
            constructor(item: Model.Item, editingRemoteId: string, domId: string, templateDomId: string, options?: Backbone.ViewOptions<Model.Item>) {
                super(item, domId, templateDomId, options);
                this.tmpImageFilePath_ = null;
                this.editingRemoteId_ = editingRemoteId;
                this.isBackgroundImge_ = item instanceof Model.ImageItem ? item.isBackgroundImage : false;
            }


            events() {
                // Please add events
                return {

                };
            }

            abstract render(option?: any): Backbone.View<Model.Item>;

            /**
             * @return {string} DOM全体を示すIDを返す。
             */
            getDomId(): string {
                return this.domId_;
            }

            /**
             * @return {string} 一時的なファイルパスを返す。
             */
            getTmpImagePath(): string {
                return this.tmpImageFilePath_;
            }

            /**
             * @return {string} HUIS本体で使われていない画像が格納されるディレクトリの絶対パスを返す。
             */
            getNotDefaultImageDirFullPath(): string {
                return path.resolve(
                    path.join(
                        HUIS_FILES_ROOT,
                        REMOTE_IMAGES_DIRECTORY_NAME,
                        this.getNotDefaultImageDirRelativePath()
                    )).replace(/\\/g, "/");
            }

            /**
             * @return {string} HUIS本体で使われていない画像が格納されるディレクトリの相対パス(remoteImagesより先)を返す。
             */
            getNotDefaultImageDirRelativePath(): string {
                return path.join(this.editingRemoteId_).replace(/\\/g, "/");
            }


            /**
             * エクスプローラー/ファインダーから画像を選択する。
             * @return {CDP.IPromise<string>} 成功時 アプリ用のフォルダへコピー済みの 選択された画像の絶対パスを返す。失敗時 nullを返す。
             */
            protected _showImageSelectDialog(): CDP.IPromise<string> {
                let FUNCTION_NAME = TAG + "_showImageSelectDialog : ";
                let df = $.Deferred<string>();
                let promise = CDP.makePromise(df);

                let options: Util.ElectronOpenFileDialogOptions = {
                    properties: ["openFile"],
                    filters: [
                        { name: "画像", extensions: [constValue.FILE_TYPE_PNG, constValue.FILE_TYPE_JPG, constValue.FILE_TYPE_JPEG] },
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

                        this._convertImage(imageFilePath).done((renderedImagePath: string) => {
                            let img = new Image();
                            img.src = renderedImagePath;
                            img.onload = () => {
                                df.resolve(renderedImagePath);
                            };
                        }).fail((err) => {
                            console.error(FUNCTION_NAME + "_convertImage calling failed : err : " + err);
                            df.reject(null);
                        });

                    }
                );

                return promise;
            }



            /**
             * @param {string} レンダリング元の画像パス
             * @return {CDP.IPromise<string>} 成功時 コンバート後の絶対画像パスを返す。失敗時 nullを返す。
             */
            private _convertImage(imageFilePath: string): CDP.IPromise<string> {
                let FUNCTION_NAME = TAG + "_convertImage" + "_convertImage ";
                if (!Util.JQueryUtils.isValidValue(imageFilePath)) {
                    console.warn(FUNCTION_NAME + "imageFilePath is invalid");
                    return null;
                }

                let df = $.Deferred<string>();
                let promise = CDP.makePromise(df);

                let imageName = path.basename(imageFilePath);
                let dirPath = this.getNotDefaultImageDirFullPath();
                let outputImagePath = path.join(dirPath, imageName).replace(/\\/g, "/");

                //TODO: move const variables difinition from init.ts to more specific place
                let params = this.isBackgroundImge_ ? IMAGE_EDIT_PAGE_BACKGROUND_PARAMS : IMAGE_EDIT_PARAMS;

                Model.OffscreenEditor.editImage(imageFilePath, params, outputImagePath)
                    .done((editedImage) => {
                        df.resolve(editedImage.path);
                    }).fail((err) => {
                        console.error(FUNCTION_NAME + "editImage calling failed : err : " + err);
                        df.reject(null);
                    });

                return promise;
            }


            /**
             * 画像ファイルの拡張子が対応していない場合、エラーダイアログを表示する。
             * @param {string} imageFilePath 画像ファイルのパス
             * @return {boolean} エラーダイアログが出力された場合trueを返す。そうでない場合falseを返す。
             */
            private _showImageFileExtError(imageFilePath: string): boolean {
                let FUNCTION_NAME = TAG + "_showImageFileExtError : ";

                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if (!((imageFileExt === constValue.EXT_JPG)
                    || (imageFileExt === constValue.EXT_JPEG)
                    || (imageFileExt === constValue.EXT_PNG))) {
                    // 警告を出す
                    console.warn(FUNCTION_NAME + "ONLY jpg, png, jpeg are supported");
                    let response = electronDialog.showMessageBox({
                        type: constValue.DIALOG_TYPE_ERROR,
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
                let FUNCTION_NAME = TAG + "_showTooLargeFileSizeError : ";
                if (Util.MiscUtil.checkFileSize(imageFilePath) === Util.MiscUtil.ERROR_SIZE_TOO_LARGE) {
                    let response = electronDialog.showMessageBox({
                        type: constValue.DIALOG_TYPE_ERROR,
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
                let FUNCTION_NAME = TAG + "_showNonSupportJpegError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === constValue.EXT_JPG) || (imageFileExt === constValue.EXT_JPEG)) {
                    let result = Util.MiscUtil.checkJPEG(imageFilePath);
                    if ((result === Util.MiscUtil.ERROR_TYPE_JPEG2000) || (result === Util.MiscUtil.ERROR_TYPE_JPEGLOSSLESS)) {
                        // JPEG2000及びJPEG Losslessはサポートしていない警告を出す
                        let response = electronDialog.showMessageBox({
                            type: constValue.DIALOG_TYPE_ERROR,
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
                let FUNCTION_NAME = TAG + "_showFakeJpegError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === constValue.EXT_JPG) || (imageFileExt === constValue.EXT_JPEG)) {
                    let result = Util.MiscUtil.checkJPEG(imageFilePath);
                    if (result === Util.MiscUtil.ERROR_TYPE_NOT_JPEG) { // 拡張子はJPG/JPEGだが中身がJPEGでないものが指定された
                        let response = electronDialog.showMessageBox({
                            type: constValue.DIALOG_TYPE_ERROR,
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
                let FUNCTION_NAME = TAG + "_showAnyTroubleError : ";
                let imageFileExt = path.extname(imageFilePath).toLowerCase();
                if ((imageFileExt === constValue.EXT_JPG) || (imageFileExt === constValue.EXT_JPEG)) {
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
