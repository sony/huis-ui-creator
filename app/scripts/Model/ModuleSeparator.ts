/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.LabelItem] ";

        export class ModuleSeparator extends Backbone.Model {

            constructor(attributes?: any) {
                super(attributes, null);
            }

            /**
             * getters and setters
             */
            get text(): string {
                return this.get("text");
            }

            set text(val: string) {
                this.set("text", val);
            }


            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["text"];
            }

            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {
                return {
                    text: "",
                };
            }

        }
    }
}
