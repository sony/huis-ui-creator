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
                this.listenTo(this.model, "change:imagePath", this.updatePreview);
                this.model.loadHuisDevData();
                this.render();
            }

            render(): ScreensaverDialog {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = CDP.Tools.Template.getJST("#screensaver-setting-dialog", templateFile);

                let $dialog = $(jst({
                    title: $.i18n.t("dialog.title.STR_DIALOG_TITLE_SCREENSAVER_SETTINGS"),
                    imagePath: this.model.imagePath
                }));

                this.$el.append($dialog);
                return this;
            }

            /**
             * プレビュー画像を更新する
             */
            private updatePreview() {
                let $image: JQuery = this.$el.find("#preview");
                $image.attr("src", this.model.imagePath);
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
                this.model.saveImage();
                this._closeDialog();
            }

            close(event: Event) {
                console.log("no update screensaver setting");
                this._closeDialog();
            }
        }
    }
}