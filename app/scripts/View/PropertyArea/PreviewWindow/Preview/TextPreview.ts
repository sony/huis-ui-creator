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

/// <reference path="../../../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.Preview.TextPreview] ";

        namespace constValue {
            export const SIZE_PULLDOWM_CLASS: string = ".property-text-size";
            export const TEMPLATE_DOM_ID: string = "#template-text-preview";
            export const DOM_ID : string = "#text-preview";
        }

        export class TextPreview extends Preview {

            /**
             * constructor
             */
            constructor(item: Model.LabelItem) {
                super(item);
                this.template_ = CDP.Tools.Template.getJST(constValue.TEMPLATE_DOM_ID, this._getTemplateFilePath());
                this.domId_ = constValue.DOM_ID;
            }


            events() {
                // Please add events
                return {

                };
            }


            render(option?: any): Backbone.View<Model.Item> {

                this.$el.append(this.template_(this.getModel()));
                var $labelTextSize = this.$el.find(constValue.SIZE_PULLDOWM_CLASS);
                $labelTextSize.val(this.getModel().size.toString());
                this.$el.i18n();//テキストをローカライズ

                return this;
            };


            /*
            *保持しているモデルを取得する
            * @return {Model.LabelItem}
            */
            getModel(): Model.LabelItem {
                return <Model.LabelItem>this.model;
            }


        }
    }
}
