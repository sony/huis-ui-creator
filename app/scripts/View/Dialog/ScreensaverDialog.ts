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
        export class ScreensaverDialog extends Backbone.View<Model.ScreensaverDialog> {

            constructor(options?: Backbone.ViewOptions<Model.ScreensaverDialog>) {
                super(options);
            }

            events(): any {
                return {
                    "click #dialog-button-ok": "saveClose",
                    "click #dialog-button-cancel": "close",
                    "click #dialog-button-change": "changeImage",
                    "click #dialog-button-default": "setDefaultImage"
                };
            }

            initialize() {
                this.render();
            }

            render(): ScreensaverDialog {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = CDP.Tools.Template.getJST("#screensaver-setting-dialog", templateFile);

                let $dialog = $(jst({
                    title: $.i18n.t("dialog.title.STR_DIALOG_TITLE_SCREENSAVER_SETTINGS")
                }));

                this.$el.append($dialog);
                return this;
            }

            /**
             * Modelの画像パスを変更する。
             * 実際にファイルを保存するのはOKボタン押下時のみ。
             */
            changeImage(): void {
                let imageFileSelector: Util.ImageFileSelector = new Util.ImageFileSelector();
                imageFileSelector.showImageSelectDialog().done((imageFilePath: string) => {
                    this.model.imagePath = imageFilePath;
                });
            }

            /**
             * @param {string} レンダリング元の画像パス
             * @return {CDP.IPromise<string>} 成功時 コンバート後の絶対画像パスを返す。失敗時 nullを返す。
             */
            private _convertImage(imageFilePath: string): CDP.IPromise<string> {
                /*let FUNCTION_NAME = "_convertImage" + "_convertImage ";
                if (!Util.JQueryUtils.isValidValue(imageFilePath)) {
                    console.warn(FUNCTION_NAME + "imageFilePath is invalid");
                    return null;
                }

                let df = $.Deferred<string>();
                let promise = CDP.makePromise(df);

                let imageName = path.basename(imageFilePath);
                let dirPath = this.getNotDefaultImageDirFullPath();
                let outputImagePath = Util.PathManager.join(dirPath, imageName);

                //TODO: move const variables difinition from init.ts to more specific place
                let params = this.isBackgroundImage_ ? IMAGE_EDIT_PAGE_BACKGROUND_PARAMS : IMAGE_EDIT_PARAMS;

                Model.OffscreenEditor.editImage(imageFilePath, params, outputImagePath)
                    .done((editedImage) => {
                        df.resolve(editedImage.path);
                    }).fail((err) => {
                        console.error(FUNCTION_NAME + "editImage calling failed : err : " + err);
                        df.reject(null);
                    });

                return promise;
                */
                // TODO
                let df = $.Deferred<string>();
                return CDP.makePromise(df);
            }

            /**
             * デフォルト画像に変更する
             */
            private setDefaultImage(event: Event): void {
                console.log("set default image to screensaver");
                // TODO: set default image
            }

            private _closeDialog() {
                this.undelegateEvents();

                let dom = this.$el.find('#screensaver-dialog-area');
                dom.remove();
            }

            saveClose(event: Event) {
                console.log("update screensaver image : " + this.model.imagePath);
                // TODO: save image
                this._closeDialog();
            }

            close(event: Event) {
                console.log("no update screensaver setting");
                this._closeDialog();
            }
        }
    }
}