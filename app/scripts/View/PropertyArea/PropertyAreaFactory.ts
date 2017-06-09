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

        var TAG = "[Garage.View.PropertyArea.PropertyAreaFactory] ";

        export class PropertyAreaFactory {

            constructor() {
            }

            /**
             * 入力されたアイテムから判断して、表示すべきPropertyAreaを返す。
             * @param {Model.Item} item PropertyAreaに表示させるアイテム。
             * @param {CommandManager} commandManager PropertyAreaで利用するCommandManager。
             * @return {PrjopertyArea} アイテムに応じたPropertyArea。適したPropertyAreaがない場合、nullを返す。
             */
            create(item: Model.Item, commandManager: CommandManager): PropertyArea {
                if (item instanceof Model.ButtonItem) {
                    if (item.isMacroButton()) {
                        return new MacroButtonPropertyArea(item, commandManager);
                    }else if (item.isAirconButton()) {
                        return new AcButtonPropertyArea(item, commandManager);
                    } else if (item.isTouchPatButton()) {
                        return new TouchPadButtonPropertyArea(item, commandManager);
                    } else {
                        return new NormalButtonPropertyArea(item, commandManager);
                    }
                } else if (item instanceof Model.ImageItem) {
                    if (item.isBackgroundImage()) {
                        return new BackgroundImagePropertyArea(item, commandManager);
                    } else {
                        return new ImagePropertyArea(item, commandManager);
                    }
                } else if (item instanceof Model.LabelItem) {
                    return new LabelPropertyArea(item, commandManager);
                }
                return null;
            }

        }
    }
}
