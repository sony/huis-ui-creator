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

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.LabelPreviewWindow] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-label-preview-window";
            export const DOM_ID = "#label-preview-window";
        }

        export class LabelPreviewWindow extends PreviewWindow {

            private textPreview_ : TextPreview;

            /**
             * constructor
             */
            constructor(label : Model.LabelItem) {
                super(label);
                this.textPreview_ = new TextPreview(label);
                this.template_ = CDP.Tools.Template.getJST(constValue.TEMPLATE_DOM_ID, this.getTemplateFilePath());
                this.domId_ = constValue.DOM_ID;
            }


            events() {
                // Please add events
                return {
                    
                };
            }


            render(): Backbone.View<Model.Item> {
                this.$el.append(this.template_());
                this.$el.find(this.textPreview_.getDomId()).append(this.textPreview_.render().$el);
                return this;
            };


        }
    }
}
