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
            private actionsCount : number;
            private defaultStateID: number;
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
                this.actionsCount = 0;
				this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");

			}

		

            events() {
                // Please add events
                return {
                    "click": "onPlusBtnClick",
                };
            }



            private onPlusBtnClick(event: Event) {
                let $signalContainer = this.$el.find("#signals-container");
                let signalData: any = {};      
                //ステートは、ボタンのデフォルトとする。
                signalData.id = this._macroButtonModel.default;
                //signalData.order = this._macroButtonModel.state[signalData.id].action.length;
                signalData.order = this.actionsCount;
                let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal", this.templateItemDetailFile_);
                let $signalDetail = $(templateSignal(signalData));
                $signalContainer.append($signalDetail);
                let $targetSignalContainer = $signalContainer.find(".signal-container[data-signal-order=\"" + signalData.order + "\"]");

                //インターバル用のテンプレートを読み込み
                let $intervalContainer = $targetSignalContainer.find("#signal-interval-container");
                let templateInterval: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal-interval", this.templateItemDetailFile_);
                let $intervalDetail = $(templateInterval(signalData));
                $intervalContainer.append($intervalDetail);

                //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する
                $('.custom-select').trigger('create');
                this.actionsCount++;

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
                //ステートは、ボタンのデフォルトとする。
                signalData.id = this._macroButtonModel.default;
				let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal", this.templateItemDetailFile_);
				let $signalDetail = $(templateSignal(signalData));
				$signalContainer.append($signalDetail);

				this.$el.append($buttonDetail);
                this.actionsCount++;
				return this;
			}

		}
	}
}