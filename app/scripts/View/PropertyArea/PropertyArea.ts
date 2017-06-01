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

/// <reference path="../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PropertyArea] ";

        namespace constValue {
            export const TEMPLATE_FILE_PATH: string = CDP.Framework.toUrl("/templates/item-detail.html");
        }

        export abstract class PropertyArea extends Backbone.View<Model.Item> {

            private commandManager_ : CommandManager;

            /**
             * constructor
             */
            constructor(item : Model.Item, $el:JQuery, commandManager:CommandManager, options? : Backbone.ViewOptions<Model.Item>) {
                super(options);
                this.model = item;
                this.$el = $el;
                this.commandManager_ = commandManager;
            }


            events() {
                // Please add events
                return {
                    
                };
            }


            abstract render(option? : any): Backbone.View<Model.Item>;


            /*
            *保持しているモデルを取得する
            * @return {Model.BUttonItem}
            */
            getModel(): Model.Item {
                return this.model;
            }


            /*
             * テンプレート用の.htmlへのファイルパスを返す。
             * @return {string}
             */
            getTemplateFilePath() {
                return constValue.TEMPLATE_FILE_PATH;
            }
        }
    }
}
