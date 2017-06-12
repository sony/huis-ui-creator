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

        var TAG = "[Garage.View.PropertyArea.Button.TouchPadButtonPropertyArea] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-touch-pad-button-property-area";
        }

        export class TouchPadButtonPropertyArea extends ButtonPropertyArea {

            constructor(button: Model.ButtonItem, commandManager: CommandManager) {
                super(button, constValue.TEMPLATE_DOM_ID, commandManager);
                this.listenTo(this.getModel(), "change:state", this.render);
            }

            render(): Backbone.View<Model.Item> {
                return super.render();
            }
        }
    }
}
