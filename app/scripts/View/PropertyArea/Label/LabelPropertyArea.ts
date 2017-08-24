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

        var TAG = "[Garage.View.PropertyArea.Label.LabelPropertyArea] ";

        namespace ConstValue {
            export const TEMPLATE_DOM_ID = "#template-label-property-area";
        }

        export class LabelPropertyArea extends PropertyArea {

            constructor(label: Model.LabelItem, commandManager: CommandManager) {
                super(label, ConstValue.TEMPLATE_DOM_ID, commandManager);
                this.previewWindow_ = new LabelPreviewWindow(label);

                //labelPreviewWindowsが持つ、previewのUIが変更された用のイベントをバインド
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Label.UI_CHANGE_SIZE, this._onTextSizePulldownChanged);
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Label.UI_CHANGE_COLOR, this._onTextColorPulldownChanged);
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Label.UI_CHANGE_TEXT, this._onTextFieldChanged);

                this.listenTo(this.getModel(),
                    PropertyAreaEvents.Label.CHANGE_SIZE + Events.DIVIDER + PropertyAreaEvents.Label.CHANGE_TEXT,
                    this.render);
            }

            events() {
                // Please add events
                return {

                };
            }

            private _onTextSizePulldownChanged(event: Event) {
                let changedSize = (<LabelPreviewWindow>this.previewWindow_).getTextSize();
                this._setMementoCommand(this.getModel(), { "size": this.getModel().size }, { "size": changedSize })
            }

            private _onTextColorPulldownChanged(event: Event) {
                let changedColor = (<LabelPreviewWindow>this.previewWindow_).getTextColor();
                this._setMementoCommand(this.getModel(), { "color": this.getModel().color }, { "color": changedColor })
            }

            private _onTextFieldChanged(event: Event) {
                let changedText = (<LabelPreviewWindow>this.previewWindow_).getText();
                this._setMementoCommand(this.getModel(), { "text": this.getModel().text }, { "text": changedText })
            }

            /**
             * 保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
             * @return {Model.LabelItem}
             */
            getModel(): Model.LabelItem {
                //親クラスのthis.modelはModel.Item型という抽象的な型でありModel.LabelItem型に限らない。
                //このクラスとその子供のクラスはthis.modelをModel.LabelItemとして扱ってほしいのでダウンキャストしている。
                return <Model.LabelItem>this.model;
            }

        }
    }
}
