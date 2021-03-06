﻿/*
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

        var TAG = "[Garage.View.PropertyArea.Image.BackgroundImagePropertyArea] ";

        namespace ConstValue {
            export const TEMPLATE_DOM_ID = "#template-background-image-property-area";
            export const INVALID_PATH = "";
        }

        export class BackgroundImagePropertyArea extends PropertyArea {

            constructor(iamge: Model.ImageItem, editingRemoteId: string, commandManager: CommandManager) {
                super(iamge, ConstValue.TEMPLATE_DOM_ID, commandManager);
                this.previewWindow_ = new BackgroundImagePreviewWindow(iamge, editingRemoteId);

                this.listenTo(this.previewWindow_, PropertyAreaEvents.Image.UI_CHANGE_PATH, this._onImageFilePathChanged);
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Image.UI_CHANGE_DELETE, this._onBackgroundImageDeleted);
                this.listenTo(this.getModel(), PropertyAreaEvents.Image.CHANGE_RESIZE_ORIGINAL, this.render);// "change:path"にしてしまうと、resizeOriginalが代入前にイベントが発火してしまう。
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
                        "path": ConstValue.INVALID_PATH,
                        "resizeOriginal": ConstValue.INVALID_PATH
                    });
            }

            private _onImageFilePathChanged(event: Event) {
                let changedImageFilePath: string = (<BackgroundImagePreviewWindow>this.previewWindow_).getTmpImagePath();
                let changedImageFileName = path.basename(changedImageFilePath);
                let changedImageFileRelativePath = path.join(
                    (<BackgroundImagePreviewWindow>this.previewWindow_).getNotDefaultImageDirRelativePath(),
                    changedImageFileName).replace(/\\/g, "/");

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
                super.render()
                this.$el.find((<BackgroundImagePreviewWindow>this.previewWindow_).getDomId()).append((<BackgroundImagePreviewWindow>this.previewWindow_).render().$el);
                this.endProcessOfRender();
                return this;
            }

            /**
             * 保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
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
