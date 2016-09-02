/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
		import Framework = CDP.Framework;
		var TAG = "[Garage.View.PropertyArea] ";

        export class PropertyAreaMacroButton extends Backbone.View<Model.ButtonItem> {

			private _macroButtonModel: Model.ButtonItem;
			private templateItemDetailFile_: string;
            private _actionsList: IAction[];

			/**
			 * constructor
			 */
            constructor(options: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
				if (options && options.attributes) {
					if (options.attributes["button"]) {
						this._macroButtonModel = options.attributes["button"];
					}
				}

				this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");

			}

		

			events() {
				// Please add events
				return {
				};
			}

			render(): PropertyAreaMacroButton {

				// ボタン情報の外枠部分をレンダリング
				var templateButton = Tools.Template.getJST("#template-macro-button-detail", this.templateItemDetailFile_);
				//var $buttonDetail = $(templateButton(this._macroButtonModel));
				var $buttonDetail = $(templateButton(this._macroButtonModel));
				


				//マクロの基本情報を付与
				// ボタンの state 情報を付加
				var $macroContainer = $buttonDetail.nextAll("#macro-container");
				let macroData: any = {};
				let templateMacro: Tools.JST = Tools.Template.getJST("#template-property-macro-button", this.templateItemDetailFile_);

				let state =  this._macroButtonModel.state[0];
				let resizeMode: string;

				if(state.image) {
					macroData.image = state.image[0];
					let garageImageExtensions = state.image[0].garageExtensions;
					if (garageImageExtensions) {
						resizeMode = garageImageExtensions.resizeMode;
					}
				}

				if (state.label) {
					macroData.label = state.label[0];
				}

				let $macroDetail = $(templateMacro(macroData));
				$macroContainer.append($macroDetail);



				//１シグナル分追加する。
				let $signalContainer = $macroContainer.find("#signals-container");
				let signalData: any = {};
				signalData.order = 0;
				signalData.id = 0;
				let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal", this.templateItemDetailFile_);
				let $signalDetail = $(templateSignal(signalData));
				$signalContainer.append($signalDetail);

				this.$el.append($buttonDetail);

				return this;
			}

		}
	}
}