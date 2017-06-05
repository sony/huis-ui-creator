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


/// <reference path="../include/interfaces.d.ts" />
/// <reference path="ButtonItem.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.ButtonItemsCollection] ";


        /**
         * @class ButtonItemsCollection
         * @brief ButtonItem のコレクションオブジェクト
         */
        export class ButtonItemsCollection extends Backbone.Collection<ButtonItem> {
            // Backbone.Collection に対象の Model の型を与える
            model = ButtonItem;

            constructor(models?: ButtonItem[]) {
                super(models);
            }

            //! destroy ハンドラ。
            private onDestroy(item: ButtonItem) {
                console.log(TAG + "onDestroy()");
            }
        }
    }
}
