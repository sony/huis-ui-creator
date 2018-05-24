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
        export class ScreensaverDialog extends BaseDialog<Model.ScreensaverDialog> {
            private changed_: boolean;
            static indexToAvoidCache: number = 0;

            constructor(options?: Backbone.ViewOptions<Model.ScreensaverDialog>) {
                super(options);
                this.changed = false;
            }

            getCloseTarget(): string {
                return '#screensaver-dialog-area';
            }

            get changed(): boolean {
                return this.changed_;
            }

            set changed(value: boolean) {
                this.changed_ = value;
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
                super.initialize();
                this.listenTo(this.model, "change:imagePath", this.updatePreview);
                this.model.loadHuisDevData();
                this.render();
            }

            /**
             * HUISのモデルカラーや色設定から、ダイアログ上のHUIS画像のパスを設定する
             */
            private setHuisImage() {
                this.setHuisBackgroundImagePath();
                this.setHuisOverImagePath();
            }

            /**
             * 背景となるHUISの画像を、モデルカラーと色設定から選択する
             */
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

            /**
             * 角丸実現のためのHUISの画像を、モデルカラーから選択する
             */
            private setHuisOverImagePath() {
                let $huisOverImage: JQuery = this.$el.find("#huis-over");

                if (sharedInfo.isWhiteModel()) {
                    $huisOverImage.addClass("over_white");
                    return;
                }
                $huisOverImage.addClass("over_black");
            }

            render(): ScreensaverDialog {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = CDP.Tools.Template.getJST("#screensaver-setting-dialog", templateFile);

                let $dialog = $(jst({
                    title: $.i18n.t("dialog.title.STR_DIALOG_TITLE_SCREENSAVER_SETTINGS")
                }));

                this.$el.append($dialog);
                this.setHuisImage();
                this.updatePreview();
                return this;
            }

            /**
             * プレビュー画像を更新する
             */
            private updatePreview() {
                let $image: JQuery = this.$el.find("#preview");
                let defaultImageClass: string = "default-image";
                if (this.model.isDefault()) {
                    $image.attr("style", ""); // remove background-image style
                    $image.addClass(defaultImageClass);
                } else {
                    let avoidCache: string = "?" + String(ScreensaverDialog.indexToAvoidCache++); // avoid cache problem which a picture don't change
                    $image.attr("style", "background-image:url(\"" + this.model.getEncodedImagePath() + avoidCache + "\")");
                    $image.removeClass(defaultImageClass);
                }
            }

            /**
             * Modelの画像パスを変更する。
             * 実際にファイルを保存するのはOKボタン押下時のみ。
             */
            private changeImage(): void {
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
             * 変更後を保存する場合には、変更した旨を伝えるダイアログを表示する
             */
            private showImageChangedMessage() {
                var response = electronDialog.showMessageBox({
                    type: "info",
                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SCREENSAVER_CHANGED_CONFIRMATION"),
                    buttons: [
                        $.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                    title: PRODUCT_NAME
                });
            }

            /**
             * 画像を変更したのに保存せずキャンセルしようとする場合には
             * 保存を促すダイアログを表示する
             */
            private showCancelWarning() {
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
                        this.closeDialog();
                        break;
                    case 2:
                    default:
                        // do nothing
                }
            }

            /**
             * 変更があった場合は画像を保存し、ダイアログで通知する。
             */
            private _saveClose() {
                console.log("update screensaver image : " + this.model.imagePath);
                this.model.saveImage();
                if (this.changed) {
                    this.showImageChangedMessage();
                }
                this.closeDialog();
            }

            /**
             * @param {Event} event
             */
            private saveClose(event: Event) {
                this._saveClose();
            }

            /**
             * 変更があった場合は保存するか確認するダイアログを表示する。
             *
             * @param {Event} event
             */
            private cancelClicked(event: Event) {
                if (this.changed) {
                    this.showCancelWarning();
                    return;
                }
                console.log("no update screensaver setting");
                this.closeDialog();
            }
        }
    }
}