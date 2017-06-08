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

        var TAG = "[Garage.View.PropertyArea.Label.BackgroundImagePropertyArea] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-background-image-property-area";
            export const INVALID_PATH = "";
        }

        export class BackgroundImagePropertyArea extends PropertyArea {

            private backgroundImagePreviewWindow_: BackgroundImagePreviewWindow;


            constructor(iamge: Model.ImageItem, commandManager: CommandManager) {
                super(iamge, constValue.TEMPLATE_DOM_ID, commandManager);
                this.backgroundImagePreviewWindow_ = new BackgroundImagePreviewWindow(iamge);

                this.listenTo(this.backgroundImagePreviewWindow_, "uiChange:path", this._onImageFilePathChanged);
                this.listenTo(this.backgroundImagePreviewWindow_, "uiChange:delete", this._onBackgroundImageDeleted);
                this.listenTo(this.getModel(), "change:resizeOriginal", this.render);// "change:path"にしてしまうと、resizeOriginalが代入前にイベントが発火してしまう。
            }


            events() {
                // Please add events
                return {

                };
            }

            private _onBackgroundImageDeleted(event: Event) {
                this._setMementoCommand(
                    this.getModel(),
                    {
                        "enabled": this.getModel().enabled,
                        "path": this.getModel().path,
                        "resizeOriginal": this.getModel().resizeOriginal
                    },
                    {
                        "enabled": false,
                        "path": constValue.INVALID_PATH,
                        "resizeOriginal": constValue.INVALID_PATH
                    });
            }


            private _onImageFilePathChanged(event: Event) {
                let changedImageFilePath: string = this.backgroundImagePreviewWindow_.getTmpImagePath();
                let changedImageFileName = path.basename(changedImageFilePath);
                let changedImageFileRelativePath = path.join(this.getModel().getNotDefaultImageDirRelativePath(), changedImageFileName).replace(/\\/g, "/");

                this._setMementoCommand(
                    this.getModel(),
                    {
                        "enabled": this.getModel().enabled,
                        "path": this.getModel().path,
                        "resizeOriginal": this.getModel().resizeOriginal
                    },
                    {
                        "enabled": true,
                        "path": changedImageFileRelativePath,
                        "resizeOriginal": changedImageFileRelativePath
                    });
            }


            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_(this.getModel()));
                this.$el.find(this.backgroundImagePreviewWindow_.getDomId()).append(this.backgroundImagePreviewWindow_.render().$el);
                this.$el.i18n();
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            }


            /*
            *保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
            * @return {Model.LabelItem}
            */
            getModel(): Model.ImageItem {
                //親クラスのthis.modelはModel.Item型という抽象的な型でありModel.LabelItem型に限らない。
                //このクラスとその子供のクラスはthis.modelをModel.ImageItemとして扱ってほしいのでダウンキャストしている。
                return <Model.ImageItem>this.model;
            }


        }
    }
}
