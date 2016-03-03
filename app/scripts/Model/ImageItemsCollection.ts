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
                // モデルが追加されたときに発生する add イベントにハンドラを登録する。
                this.bind("add", this.onAdd, this);
            }

			parse(response) {
			}

            //! model の追加
            private onAdd(item: ImageItem) {
                console.log(TAG + "onAdd()");
            }

            //! destroy ハンドラ。
            private onDestroy(item: ImageItem) {
                console.log(TAG + "onDestroy()");
            }
		}
	}
}