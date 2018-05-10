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
            private _changed: boolean;

            constructor(options?: Backbone.ViewOptions<Model.ScreensaverDialog>) {
                super(options);
                this._changed = false;
            }

            get changed(): boolean {
                return this._changed;
            }

            set changed(value: boolean) {
                this._changed = value;
            }

            events(): any {
                return {
                    "click #dialog-button-ok": "saveClose",
                    "click #dialog-button-cancel": "cancelClicked",
                    "click #dialog-button-change": "changeImage",
                    "click #image-button": "changeImage",
                    "click #dialog-button-default": "setDefaultImage"
                };
            }

            initialize() {
                this.listenTo(this.model, "change:imagePath", this.updatePreview);
                this.model.loadHuisDevData();
                this.render();
            }

            private setHuisBackgroundImagePath() {
                let $huisBackground: JQuery = this.$el.find("#huis-background");

                if (sharedInfo.isWhiteModel()) {
                    if (sharedInfo.isWhiteSetting()) {
                        $huisBackground.addClass("white_on_white");
                        return;
                    }
                    $huisBackground.addClass("black_on_white");
                    return;
                }

                if (sharedInfo.isWhiteSetting()) {
                    $huisBackground.addClass("white_on_black");
                    return;
                }
                $huisBackground.addClass("black_on_black");
            }

            render(): ScreensaverDialog {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = CDP.Tools.Template.getJST("#screensaver-setting-dialog", templateFile);

                let $dialog = $(jst({
                    title: $.i18n.t("dialog.title.STR_DIALOG_TITLE_SCREENSAVER_SETTINGS"),
                    imagePath: this.model.imagePath
                }));

                this.$el.append($dialog);
                this.setHuisBackgroundImagePath();
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
                    if (imageFilePath != null) {
                        this.changed = true;
                    }
                });
            }

            /**
             * デフォルト画像に変更する
             */
            private setDefaultImage(event: Event): void {
                console.log("set default image to screensaver");
                if (!this.model.isDefault()) {
                    this.changed = true;
                }
                this.model.setDefault();
            }

            /**
             * 画像を変更したのに保存せずキャンセルしようとする場合には
             * 保存を促すダイアログを表示する
             */
            showCancelWarning() {
                var response = electronDialog.showMessageBox({
                    type: "warning",
                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SCREENSAVER_CHANGE_CANCEL"),
                    buttons: [
                        $.i18n.t("dialog.button.STR_DIALOG_BUTTON_SAVE"),
                        $.i18n.t("dialog.button.STR_DIALOG_BUTTON_NOT_SAVE"),
                        $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
                    title: PRODUCT_NAME,
                    cancelId: 2,
                });
                switch (response) {
                    case 0:
                        this._saveClose();
                        break;
                    case 1:
                        this._closeDialog();
                        break;
                    case 2:
                    default:
                        // do nothing
                }
            }

            private _closeDialog() {
                this.undelegateEvents();

                let dom = this.$el.find('#screensaver-dialog-area');
                dom.remove();
            }

            private _saveClose() {
                console.log("update screensaver image : " + this.model.imagePath);
                this.model.saveImage();
                this._closeDialog();
            }

            saveClose(event: Event) {
                this._saveClose();
            }

            cancelClicked(event: Event) {
                if (this.changed) {
                    this.showCancelWarning();
                    return;
                }
                console.log("no update screensaver setting");
                this._closeDialog();
            }
        }
    }
}