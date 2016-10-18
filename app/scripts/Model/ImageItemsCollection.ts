/// <reference path="../include/interfaces.d.ts" />
/// <reference path="ImageItem.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.ImageItemsCollection] ";

		export class ImageItemsCollection extends Backbone.Collection<ImageItem> {

			// Backbone.Collection に対象の Model の型を与える
            model = ImageItem;

            //! constructor
            constructor(models?: Model.ImageItem[]) {
                super(models);
            }

            //! destroy ハンドラ。
            private onDestroy(item: ImageItem) {
                console.log(TAG + "onDestroy()");
            }
		}
	}
}