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

        export class LabelPropertyArea extends PropertyArea {

            /**
             * constructor
             */
            constructor(commandManager:CommandManager, options: Backbone.ViewOptions<Model.LabelItem>) {
                super(commandManager,options);
            }


            events() {
                // Please add events
                return {
                    
                };
            }


            render(): Backbone.View<Model.Item> {
              
                let templateLabel = CDP.Tools.Template.getJST("#template-label-detail", this.getTemplateFilePath());
                let $labelDetail = $(templateLabel(this.getModel()));               
                this.$el.append($labelDetail);
                var $labelTextSize = $labelDetail.find(".property-text-size");
                $labelTextSize.val(this.getModel().size.toString());
                this.$el.i18n();
     
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