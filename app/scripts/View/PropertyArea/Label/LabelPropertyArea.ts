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

        var TAG = "[Garage.View.PropertyArea.Button.LabelPropertyArea] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-label-property-area";
        } 

        export class LabelPropertyArea extends PropertyArea {

            private labelPreviewWindow_ : LabelPreviewWindow;

            /**
             * constructor
             */
            constructor(label:Model.LabelItem, $el:JQuery, commandManager:CommandManager) {
                super(label, $el, commandManager);
                this.template_ = CDP.Tools.Template.getJST(constValue.TEMPLATE_DOM_ID, this._getTemplateFilePath());                
                this.labelPreviewWindow_ = new LabelPreviewWindow(label);
            }


            events() {
                // Please add events
                return {
                    
                };
            }


            render(): Backbone.View<Model.Item> {
                this.$el.append(this.template_(this.getModel()));
                this.$el.find(this.labelPreviewWindow_.getDomId()).append(this.labelPreviewWindow_.render().$el);
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