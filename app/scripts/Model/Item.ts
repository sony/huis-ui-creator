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