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

        var TAG = "[Garage.View.PropertyArea.Button.AcButtonPropertyArea] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-ac-button-property-area";
        }

        export class AcButtonPropertyArea extends PropertyArea {

            private acStatePreviewWindow_: AcStatePreviewWindow;

            constructor(button: Model.ButtonItem, commandManager: CommandManager) {
                super(button, constValue.TEMPLATE_DOM_ID, commandManager);
                this.acStatePreviewWindow_ = new AcStatePreviewWindow(button, button.getDefaultState().stateId);
            }

            events() {
                // Please add events
                return {

                };
            }

            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_(this.getModel()));
                this.$el.find(this.acStatePreviewWindow_.getDomId()).append(this.acStatePreviewWindow_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            }

            /**
             * 保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
             * @return {Model.ButtonItem}
             */
            getModel(): Model.ButtonItem {
                //親クラスのthis.modelはModel.Item型という抽象的な型でありModel.LabelItem型に限らない。
                //このクラスとその子供のクラスはthis.modelをModel.ButtonItemとして扱ってほしいのでダウンキャストしている。
                return <Model.ButtonItem>this.model;
            }

        }
    }
}
