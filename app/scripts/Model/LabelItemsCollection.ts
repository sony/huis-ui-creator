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
            }

            //! destroy ハンドラ。
            private onDestroy(item: LabelItem) {
                console.log(TAG + "onDestroy()");
            }
		}
	}
}