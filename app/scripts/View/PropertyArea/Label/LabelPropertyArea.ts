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

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-label-property-area";
        } 

        export class LabelPropertyArea extends PropertyArea {

            private labelPreviewWindow_ : LabelPreviewWindow;

            /**
             * constructor
             */
            constructor(label:Model.LabelItem, commandManager:CommandManager) {
                super(label, constValue.TEMPLATE_DOM_ID, commandManager);
                this.labelPreviewWindow_ = new LabelPreviewWindow(label);

                //labelPreviewWindowsが持つ、previewのUIが変更された用のイベントをバインド
                this.listenTo(this.labelPreviewWindow_, "uiChange:size", this._onTextSizePulldownChanged);
                this.listenTo(this.labelPreviewWindow_, "uiChange:text", this._onTextFieldChanged);

                this.listenTo(this.getModel(), "change:size change:text", this.render);
            }

            }


            events() {
                // Please add events
                return {
                    
                };
            }


            private _onTextSizePulldownChanged(event: Event) {
                let changedSize = this.labelPreviewWindow_.getTextSize();
                this._setMementCommand(this.getModel(), { "size" : this.getModel().size }, { "size" : changedSize })
            }


            private _onTextFieldChanged(event: Event) {
                let changedText = this.labelPreviewWindow_.getText();
                this._setMementCommand(this.getModel(), { "text": this.getModel().text }, { "text": changedText})
            }


            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : "; 

                this.$el.children().remove();
                this.$el.append(this.template_(this.getModel()));
                this.$el.find(this.labelPreviewWindow_.getDomId()).append(this.labelPreviewWindow_.render().$el);
                this._adaptJqueryMobileStyleToPulldown(this.$el);
                return this;
            }


            /*
            *保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
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