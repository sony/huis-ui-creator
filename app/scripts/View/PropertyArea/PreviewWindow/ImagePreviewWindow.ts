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

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.ImagePreviewWindow] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-image-preview-window";
            export const DOM_ID = "#image-preview-window";
            export const EDIT_BTN_DOM_ID = "#edit-btn";
        }

        export class ImagePreviewWindow extends ImageHandlePreviewWindow {

            private imagePreview_: ImagePreview;


            constructor(image: Model.ImageItem) {
                super(image, constValue.DOM_ID, constValue.TEMPLATE_DOM_ID);
                this.imagePreview_ = new ImagePreview(image);
            }


            events() {
                let events = {};
                events["click " + constValue.EDIT_BTN_DOM_ID] = "_onEditBtnClicked";
                return events;
            }


            private _onEditBtnClicked(event: Event) {
                let FUNCTION_NAME = TAG + "_onEditBtnClicked";

                this._showImageSelectDialog().done((imageFilePath: string) => {
                    if (imageFilePath == null) {
                        console.warn(FUNCTION_NAME + "imagePath is invalid");
                        return;
                    }
                    this.tmpImageFilePath_ = imageFilePath;
                    this.trigger("uiChange:path");
                });
            }


            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_());
                this.$el.find(this.imagePreview_.getDomId()).append(this.imagePreview_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            };


        }
    }
}
