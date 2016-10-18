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