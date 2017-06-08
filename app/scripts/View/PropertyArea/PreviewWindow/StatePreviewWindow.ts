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

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-state-preview-window";
            export const DOM_ID = "#state-preview-window";
            export const EDIT_BTN_DOM_ID = "#edit-btn";
            export const TARGET_IMAGE_INDEX = 0;
            export const TARGET_TEXT_INDEX = 0;

            //popup
            export const POPUP_DOM_ID = "#edit-popup";
            export const CSS_BOARDER_WIDTH = "border-width";
            export const UNIT_PX = "px";
            export const POPUP_LIST_DOM_CLASS = ".popup-list";
            export const EDIT_IMAGE_BTN_DOM_ID = "command-change-button-image";
            export const EDIT_TEXT_BTN_DOM_ID = "command-change-button-text";
        }

        export class StatePreviewWindow extends PreviewWindow {

            private preview_: Preview;
            private targetStateId_: number;

            constructor(button: Model.ButtonItem, stateId :number) {
                super(button, constValue.DOM_ID, constValue.TEMPLATE_DOM_ID);
                this.targetStateId_ = stateId;
                this.preview_ = this._createPreview();
            }


            events() {
                let events = {};
                events["click " + constValue.EDIT_BTN_DOM_ID] = "_onEditBtnClicked";
                events["click " + constValue.EDIT_IMAGE_BTN_DOM_ID] = "_onEditImageBtnClicked";
                events["click " + constValue.EDIT_TEXT_BTN_DOM_ID] = "_onEditTextBtnClicked";
                return events;
            }


            private _onEditBtnClicked(event: Event) {
                let FUNCTION_NAME = TAG + "_onEditBtnClicked";

                //popのJquery
                // ポップアップのjQuery DOMを取得.JQueryMobileのpopupを利用しているので$(document)からfindする必要がある。
                var $overflow = $(document).find(constValue.POPUP_DOM_ID); 
                var previewBorderWidth: number = +(this.$el.parents(constValue.DOM_ID).css(constValue.CSS_BOARDER_WIDTH).replace(constValue.UNIT_PX, ""));
                var overFlowWidth = $overflow.find(constValue.POPUP_LIST_DOM_CLASS).outerWidth(true);

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


            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_());
                this.$el.find(this.preview_.getDomId()).append(this.preview_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            };

            private _createPreview(): Preview {
                let targetState = this._getModel().getStateByStateId(this.targetStateId_);
                if (Util.MiscUtil.isValidArray(targetState.image)) {
                    return new ImagePreview(targetState.image[constValue.TARGET_IMAGE_INDEX]);
                } else {
                    return new TextPreview(targetState.label[constValue.TARGET_TEXT_INDEX]);
                }
            }

            private _getModel(): Model.ButtonItem {
                return <Model.ButtonItem>this.model;
            }
            
        }
    }
}
