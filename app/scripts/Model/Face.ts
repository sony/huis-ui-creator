/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {

        const TAG: string = "[Garage.Model.Face] ";

        export class Face extends Backbone.Model implements IGFace {

            constructor(remoteId: string, name: string, category: string, modules?: Model.Module[], attributes?: any, options?: any) {
                super(attributes, options);

                this.modules = [];
                if (modules == null) {
                    this.modules == modules;
                }

                this.remoteId = remoteId;
                this.name = name;
                this.category = category;
            }

            get remoteId() {
                return this.get("remoteId");
            }

            set remoteId(val) {
                this.set("remoteId", val);
            }

            get name() {
                return this.get("name");
            }

            set name(val) {
                this.set("name", val);
            }

            get category() {
                return this.get("category");
            }

            set category(val) {
                this.set("category", val);
            }

            get modules() {
                return this.get("modules");
            }

            set modules(val) {
                this.set("modules", val);
            }

            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["remoteId", "name", "category", "modules"];
            }

        }
    }
}