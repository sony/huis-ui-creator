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
            export const TEMPLATE_DOM_ID = "#template-ac-state-preview-window";
            export const DOM_ID = "#ac-state-preview-window";

            //preview
            export const PREVIEW_DOM_ID = "#preview";
            export const IMAGE_PREVIEW_DOM_CLASS_NAME = "image-preview";
            export const TEXT_PREVIEW_DOM_CLASS_NAME = "text-preview";
        }

        export class AcStatePreviewWindow extends ImageHandlePreviewWindow {

            private preview_: Preview;
            private targetStateId_: number;

            constructor(button: Model.ButtonItem, stateId: number) {
                super(button, constValue.DOM_ID, constValue.TEMPLATE_DOM_ID);
                this.targetStateId_ = stateId;
                this._initPreview();
            }

            events() {
                let events = {};
                return events;
            }

            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_());
                this._initPreview();
                this.$el.find(this.preview_.getDomId()).append(this.preview_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            };

            private _createPreview(): Preview {
                let targetState = this._getModel().getStateByStateId(this.targetStateId_);
                if (Util.MiscUtil.isValidArray(targetState.image)) {
                    return new ImagePreview(targetState.getDefaultImage());
                } else {
                    return new TextPreview(targetState.getDefaultLabel());
                }
            }

            private _initPreview() {
                this.preview_ = null;
                this.preview_ = this._createPreview();

                //domのクラスをTextPreview用とImagePrevie用に切り替える
                let $preview = this.$el.find(constValue.PREVIEW_DOM_ID);
                $preview.removeClass(constValue.IMAGE_PREVIEW_DOM_CLASS_NAME);
                $preview.removeClass(constValue.TEXT_PREVIEW_DOM_CLASS_NAME);

                if (this.preview_ instanceof ImagePreview) {
                    $preview.addClass(constValue.IMAGE_PREVIEW_DOM_CLASS_NAME);
                } else if (this.preview_ instanceof TextPreview) {
                    $preview.addClass(constValue.TEXT_PREVIEW_DOM_CLASS_NAME);
                }
            }

            private _getModel(): Model.ButtonItem {
                return <Model.ButtonItem>this.model;
            }

        }
    }
}
