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

        export abstract class PropertyArea extends PropertyAreaElement {

            private commandManager_: CommandManager;

            constructor(item: Model.Item, templateDomId: string, commandManager: CommandManager, options?: Backbone.ViewOptions<Model.Item>) {
                super(item, templateDomId);
                this.commandManager_ = commandManager;
            }

            events() {
                // Please add events
                return {

                };
            }

            }

            /**
             * CommandManagerにModelの変更を登録する。
             * PropertyArea上の変更はこの関数での変更のみとする。
             * @param {Model.Item} target 変更対象のモデル。
             * @param {Object} previousData 変更前の値。undo時に利用。
             * @param {Object} nextData 変更後の愛。redo時に利用。
             */
            protected _setMementoCommand(target: Model.Item, previousData: Object, nextData: Object) {
                let FUNCTION_NAME = TAG + "_setMementoCommand ";

                //TODO: previousDataとnextDataをクラス化
                var memento: IMemento = {
                    target: target,
                    previousData: previousData,
                    nextData: nextData
                };

                var mementoCommand = new MementoCommand([memento]);
                this.commandManager_.invoke(mementoCommand);
            }

            /**
             * プルダウンにJQueryMobileのスタイルを適応する。
             * JQueryMobileのスタイルは、新たに生成したDOM要素には自動的には適応されないため、
             * プルダウンをレンダリングした後に、この関数を利用する。
             * ただし、重たい処理なので、全てプルダウンをレンダリングした後に1度だけ呼ぶこと。
             * @param {JQuery} $target プルダウンを内包しているDOMのJQuery
             */
            protected _adaptJqueryMobileStyleToPulldown($target: JQuery) {
                let pulldownContainerDomClass = ".custom-select";
                $target.find(pulldownContainerDomClass).trigger('create');
            }

        }
    }
}
