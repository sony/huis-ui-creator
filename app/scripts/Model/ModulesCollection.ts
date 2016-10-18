/// <reference path="../include/interfaces.d.ts" />
/// <reference path="Module.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.ModulesCollection] ";

		/**
		 * @class ModuleCollection
		 * @brief ModuleItem のコレクションオブジェクト
		 */
		export class ModulesCollection extends Backbone.Collection<Module> {
			// Backbone.Collection に対象の Model の型を与える
			model = Module;
			private facePageWidth: number = 0;
			private facePageHeight: number = 0;

			constructor(models?: Module[], options?: any) {
				super(models, options);
			}

			initialize(models?: Module[], options?: any) {
				if (options && options.facePageHeight) {
					this.facePageHeight = options.facePageHeight;
				}
				var offsetY = 0;
				var pageIndex = 0;
				for (var i = 0, l = models.length; i < l; i++) {
					let model = models[i];
					let height = model.area.h;
					if (0 < this.facePageHeight) {
						if (this.facePageHeight < offsetY + height) {
							offsetY = 0;
							pageIndex++;
						}
					}
					model.set("offsetY", offsetY);
					model.set("pageIndex", pageIndex);

					offsetY += height;
				}
			}

			/**
			 * face のページ数を取得する
			 * 
			 * @return {number} ページ数
			 */
			getPageCount(): number {
				var maxPageIndex = -1;
				for (let i = 0, l = this.models.length; i < l; i++) {
					if (maxPageIndex < this.models[i].pageIndex) {
						maxPageIndex = this.models[i].pageIndex;
					}
				}
				return maxPageIndex + 1;
			}

		}
	}
}