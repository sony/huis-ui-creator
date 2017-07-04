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

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.StatePreviewWindow] ";

        namespace ConstValue {
            export const TEMPLATE_DOM_ID = "#template-state-preview-window";
            export const DOM_ID = "#state-preview-window";
            export const EDIT_BTN_DOM_ID = "#edit-btn";

            //popup
            export const POPUP_DOM_ID = "#edit-popup";
            export const CSS_BORDER_WIDTH = "border-width";
            export const UNIT_PX = "px";
            export const POPUP_LIST_DOM_CLASS = ".popup-list";
            export const EDIT_IMAGE_BTN_DOM_ID = "#command-change-button-image";
            export const EDIT_TEXT_BTN_DOM_ID = "#command-change-button-text";

            //preview
            export const PREVIEW_DOM_ID = "#preview";
            export const IMAGE_PREVIEW_DOM_CLASS_NAME = "image-preview";
            export const TEXT_PREVIEW_DOM_CLASS_NAME = "text-preview";
        }

        export class StatePreviewWindow extends ImageHandlePreviewWindow {

            private targetStateId_: number;

            constructor(button: Model.ButtonItem, stateId: number, editingRemoteId: string) {
                super(button, editingRemoteId, ConstValue.DOM_ID, ConstValue.TEMPLATE_DOM_ID);
                this.targetStateId_ = stateId;
                this._initPreview();
            }

            private _onEditImageBtnClicked(event: Event) {
                let FUNCTION_NAME = TAG + "_onEditBtnClicked";

                this._showImageSelectDialog().done((imageFilePath: string) => {
                    if (imageFilePath == null) {
                        console.warn(FUNCTION_NAME + "imagePath is invalid");
                        return;
                    }
                    this.tmpImageFilePath_ = imageFilePath;
                    this.trigger(PropertyAreaEvents.Button.UI_CHANGE_EDIT_IMAGE_BUTTON);
                });
                this._closePopup();
                event.stopPropagation();
            }

            private _onTextSizePulldownChanged(event: Event) {
                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_SIZE);//uiChange:textを親クラスであるPropertyAreaクラスに伝播させる
            }

            private _onTextColorPulldownChanged(event: Event) {
                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_COLOR);//uiChange:colorを親クラスであるPropertyAreaクラスに伝播させる
            }

            private _onTextFieldChanged(event: Event) {
                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_TEXT);//uiChange:textを親クラスであるPropertyAreaクラスに伝播させる
            }

            events() {
                let events = {};
                events[Events.CLICK_WITH_DIVIDER + ConstValue.EDIT_BTN_DOM_ID] = "_onEditBtnClicked";
                return events;
            }

            private _onEditTextBtnClicked(event: Event) {
                this._closePopup();
                this.trigger(PropertyAreaEvents.Button.UI_CHANGE_EDIT_TEXT_BUTTON);
                event.stopPropagation();
            }

            private _onEditBtnClicked(event: Event) {
                let FUNCTION_NAME = TAG + "_onEditBtnClicked";
                //popupを表示する。

                //popのJquery
                // ポップアップのjQuery DOMを取得.JQueryMobileのpopupを利用しているので$(document)からfindする必要がある。
                var $overflow = $(document).find(ConstValue.POPUP_DOM_ID);
                var previewBorderWidth: number = +(this.$el.parents(ConstValue.DOM_ID).css(ConstValue.CSS_BORDER_WIDTH).replace(ConstValue.UNIT_PX, ""));
                var overFlowWidth = $overflow.find(ConstValue.POPUP_LIST_DOM_CLASS).outerWidth(true);

                //押下されたボタンのJquery
                var $target = $(event.currentTarget);
                var popupY = $target.offset().top + $target.height();
                var popupX = $target.offset().left - overFlowWidth + $target.outerWidth() + previewBorderWidth;
                var options: PopupOptions = {
                    x: 0,
                    y: 0,
                    tolerance: popupY + ",0,0," + popupX,
                    corners: false,
                    afterclose: (event, ui) => { this.$el.focus(); }
                };

                $overflow.popup(options).popup("open").on("vclick", () => {
                    $overflow.popup("close");
                });

                this.$el.i18n();
            }

            /**
             * @return {number} previewが所持しているtext sizeを返す。ない場合0を返す。
             */
            getTextSize(): number {
                if (this.preview_ instanceof TextPreview) {
                    let tmpTextPreview: TextPreview = <TextPreview>this.preview_;
                    return tmpTextPreview.getTextSize();
                }
                return 0;
            }

            /**
             * @return {string} previewが所持しているtext colorを返す。
             */
            getTextColor(): string {
                let preview = this.preview_;
                if (preview instanceof TextPreview) {
                    return preview.getTextColor();
                }
            }

            /**
             * @return {number} previewが所持しているtextを返す。ない場合nullを返す。
             */
            getText(): string {
                if (this.preview_ instanceof TextPreview) {
                    let tmpTextPreview: TextPreview = <TextPreview>this.preview_;
                    return tmpTextPreview.getText();
                }
                return null;
            }

            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_());
                this._bindPopupButtonEvent();
                this._initPreview();
                this.$el.find(this.preview_.getDomId()).append(this.preview_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            };

            private _createPreview(): Preview {
                let targetState = this._getModel().getStateByStateId(this.targetStateId_);
                if (targetState.hasValidImage()) {
                    return new ImagePreview(targetState.getDefaultImage());
                } else {
                    return new TextPreview(targetState.getDefaultLabel());
                }
            }

            private _initPreview() {
                this.preview_ = this._createPreview();

                //domのクラスをTextPreview用とImagePrevie用に切り替える
                let $preview = this.$el.find(ConstValue.PREVIEW_DOM_ID);
                $preview.removeClass(ConstValue.IMAGE_PREVIEW_DOM_CLASS_NAME);
                $preview.removeClass(ConstValue.TEXT_PREVIEW_DOM_CLASS_NAME);

                if (this.preview_ instanceof ImagePreview) {
                    $preview.addClass(ConstValue.IMAGE_PREVIEW_DOM_CLASS_NAME);
                } else if (this.preview_ instanceof TextPreview) {
                    $preview.addClass(ConstValue.TEXT_PREVIEW_DOM_CLASS_NAME);
                }
                this.listenTo(this.preview_, PropertyAreaEvents.Label.UI_CHANGE_SIZE, this._onTextSizePulldownChanged);
                this.listenTo(this.preview_, PropertyAreaEvents.Label.UI_CHANGE_COLOR, this._onTextColorPulldownChanged);
                this.listenTo(this.preview_, PropertyAreaEvents.Label.UI_CHANGE_TEXT, this._onTextFieldChanged);
            }

            private _getModel(): Model.ButtonItem {
                return <Model.ButtonItem>this.model;
            }

            private _closePopup() {
                var $overflow = $(document).find(ConstValue.POPUP_DOM_ID);
                $overflow.popup("close");
            }

            private _bindPopupButtonEvent() {
                //JQueryModileのPopup UI要素を利用しているため、BackboneではなくJQueryのeventバインドを利用。
                //PopupされたUIは articleの下に生成されるため、このViewからは参照できない。
                //$.proxyを利用しないと、イベント遷移先でthisが変わってしまう。
                let $editImageBtn: JQuery = $(document).find(ConstValue.EDIT_IMAGE_BTN_DOM_ID);
                let $editTextBtn: JQuery = $(document).find(ConstValue.EDIT_TEXT_BTN_DOM_ID);

                //2重発火防止のため、最初にoffする。
                $editImageBtn.off(Events.CLICK, $.proxy(this._onEditImageBtnClicked, this));
                $editTextBtn.off(Events.CLICK, $.proxy(this._onEditTextBtnClicked, this));
                $editImageBtn.on(Events.CLICK, $.proxy(this._onEditImageBtnClicked, this));
                $editTextBtn.on(Events.CLICK, $.proxy(this._onEditTextBtnClicked, this));
            }

        }
    }
}
