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

module Garage {
    export module Model {

        const TAG: string = "[Garage.Model.Item] ";

        export abstract class Item extends Backbone.Model implements ItemModel {
            public properties: string[];
            public itemType: string;
            private position: Model.Position;

            constructor(attributes?: any, options?: any) {
                super(attributes, options);
            }

            abstract clone();

            /**
             * アイテムが有効かどうか
             */
            get enabled(): boolean {
                return this.get("enabled");
            }

            set enabled(val: boolean) {
                this.set("enabled", val);
            }

            get area(): IArea {
                return this.get("area");
            }

            set area(val: IArea) {
                this.set("area", val);
            }
        }
    }
}