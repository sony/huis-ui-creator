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
            
            export const TEMPLATE_DOM_ID: string = "#template-text-preview";
            export const DOM_ID: string = "#text-preview";

            //text size pulldown
            export const SIZE_PULLDOWM_DOM_ID : string = "#text-size-pulldown";
            export const TEMPLATE_SIZE_PULLDOWN_DOM_ID: string = "#template-text-size-pullldown";
            export const SIZE_PULLLDOWN_VALUES: number[] = [
                12, 14, 16, 18, 20, 23, 28, 30, 32, 36, 
                40, 44, 48, 54, 60, 72, 80, 88, 96
            ];
        }

        export class TextPreview extends Preview {

            /**
             * constructor
             */
            constructor(item: Model.LabelItem) {
                super(item, constValue.DOM_ID, constValue.TEMPLATE_DOM_ID);
            }


            events() {
                // Please add events
                return {

                };
            }


            render(option?: any): Backbone.View<Model.Item> {

                this.$el.append(this.template_(this.getModel()));

                //render size pulldown
                let templateTextSizePulldown = CDP.Tools.Template.getJST(constValue.TEMPLATE_SIZE_PULLDOWN_DOM_ID, this._getTemplateFilePath());
                let dataSizePulldownRender = {
                    sizeValues: constValue.SIZE_PULLLDOWN_VALUES
                }
                this.$el.find(constValue.SIZE_PULLDOWM_DOM_ID).append(templateTextSizePulldown(dataSizePulldownRender));

                //set initial value of size pulldown
                let size = this.getModel().size;
                if (Util.JQueryUtils.isValidValue(size)) {
                    this.$el.find(constValue.SIZE_PULLDOWM_DOM_ID).val(size.toString());
                }

                this.$el.i18n();//localize text

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
