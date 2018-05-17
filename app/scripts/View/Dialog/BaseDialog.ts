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

module Garage {
    export module View {

        /**
         * 自作デザインのダイアログのベースとなるクラス。
         * 共通処理をまとめる。
         * OSのダイアログを使用する場合は electronDialog.showMessageBox などを使用する。
         */
        export abstract class BaseDialog<TModel extends Backbone.Model> extends Backbone.View<TModel> {

            /**
             * ダイアログを閉じる際に削除するdom要素を指定する
             */
            abstract getCloseTarget(): string;

            /**
             * サブクラスの initialize で呼ぶこと
             */
            initialize() {
                this.listenTo(Model.HuisConnectionChecker.instance, Model.ConstValue.HUIS_DISCONNECT_TRIGGER, this.closeDialog);
            }

            closeDialog() {
                this.undelegateEvents();

                let dom = this.$el.find(this.getCloseTarget());
                dom.remove();
            }
        }
    }
}
