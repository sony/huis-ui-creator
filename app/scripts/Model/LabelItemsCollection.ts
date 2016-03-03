/// <reference path="../include/interfaces.d.ts" />
/// <reference path="LabelItem.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.LabelItemsCollection] ";

		export class LabelItemsCollection extends Backbone.Collection<LabelItem> {
			
			// Backbone.Collection に対象の Model の型を与える
            model = LabelItem;

            //! constructor
            constructor(model?: any) {
                super(model);
                // モデルが追加されたときに発生する add イベントにハンドラを登録する。
                this.bind("add", this.onAdd, this);
            }

			parse(response) {
			}


            //! model の追加
            private onAdd(item: LabelItem) {
                console.log(TAG + "onAdd()");
            }

            //! destroy ハンドラ。
            private onDestroy(item: LabelItem) {
                console.log(TAG + "onDestroy()");
            }
		}
	}
}