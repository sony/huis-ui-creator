/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyArea] ";

        export class PropertyAreaMacroButton extends Backbone.View<Model.ButtonItem> {

			private templateItemDetailFile_: string;
            private actionsCount : number;
            private defaultStateID: number;

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.actionsCount = 0;
				this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");

			}

		

            events() {
                // Please add events
                return {
                    "click #add-signal-btn": "onPlusBtnClick",
                    "change .interval-input" : "onInvervalPullDownListChanged"
                };
            }


            //remove() {
            //}

            updateModel() {

                //orderをkeyとしたActionのハッシュを作成。
                let tmpActionsWithOrder = {};

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers : JQuery = this.$el.find(".signal-container");

                // 信号のJqueryがない場合、return
                if ($signalContainers.length == 0) {
                    return;
                }

                let tmpInput = this.$el.find(".state-action-input[data-state-id=\"" + this.model.default + "\"]").val();

                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++){
                    
                    let $target:JQuery = $($signalContainers[i])
                    let order = parseInt(JQUtils.data($target, "signalOrder"), 10);

                    //invervalを仮取得
                    let tmpInterval = $target.find("select.interval-input").val();
                    if (tmpInterval == null) {
                        tmpInterval = 0;
                    }

                    //remoteIdを仮取得
                    let tmpRemoteId = $target.find("select.remote-input").val();
                    if (tmpRemoteId == null) {
                        continue;
                    }

                    //functionを仮取得
                    let tmpFunction = $target.find("select.function-input").val();
                    if (tmpFunction == "none") {
                        tmpFunction = null;
                    }

                    let deviceInfo = huisFiles.getDeviceInfo(tmpRemoteId);


                    let tmpAction: IAction = {
                        input: tmpInput,
                    };

                    //codeを入力
                    let tmpCode = null;
                    //deviceInfo.functionCodeHashがある場合、codeを取得
                    if (deviceInfo.functionCodeHash) {
                        tmpCode = deviceInfo.functionCodeHash[tmpFunction];
                    }
                    if (tmpCode != null) {
                        tmpAction.code = tmpCode;
                    }

                    //codeDbを入力
                    let tmpCodeDb: ICodeDB= null;
                    if (deviceInfo.code_db) {
                        tmpCodeDb = deviceInfo.code_db;
                        tmpCodeDb.function = tmpFunction;
                    }
                    if (tmpCodeDb != null) {
                        tmpAction.code_db = tmpCodeDb;
                    }

                    tmpAction.interval = tmpInterval;
                    tmpActionsWithOrder[order] = tmpAction;

                }
                
                //order順に並び変えて配列にいれる。
                let actionsForUpdate: IAction[] = [];
                let keys = Object.keys(tmpActionsWithOrder);
                let keysNumCount: number = 0;;                for (let i = 0; i < MAX_NUM_MACRO_SIGNAL; i++) {

                    //keyに i がある場合、push
                    if (keys.indexOf(i.toString()) != -1) {
                        actionsForUpdate.push(tmpActionsWithOrder[i]);
                        keysNumCount++;
                        //keyすべてに対して 判定をしていたらループを抜ける。
                        if (keysNumCount >= keys.length) {
                            break;
                        }
                    }
                }

                this.model.state[this.model.default].action = actionsForUpdate;
            }

            //
            private onInvervalPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onInvervalPullDownListChanged";

                this.updateModel();
            }

            //+ボタンがクリックされた場合に呼び出される
            private onPlusBtnClick(event: Event) {
                let FUNCTION_NAME = TAG + "onPlusBtnClick";

                let $signalContainer = this.$el.find("#signals-container");
                let signalData: any = {};      
                //ステートは、ボタンのデフォルトとする。
                signalData.id = this.model.default;
                //signalData.order = this._macroButtonModel.state[signalData.id].action.length;
                signalData.order = this.actionsCount;
                signalData.remotes = huisFiles.getSupportedRemoteInfo();

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
				var $buttonDetail = $(templateButton(this.model));
				


				//マクロの基本情報を付与
				// ボタンの state 情報を付加
				var $macroContainer = $buttonDetail.nextAll("#macro-container");
				let macroData: any = {};
				let templateMacro: Tools.JST = Tools.Template.getJST("#template-property-macro-button", this.templateItemDetailFile_);

                let id = this.model.default;
                macroData.id = id;

				let state =  this.model.state[id];
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
                signalData.remotes = huisFiles.getSupportedRemoteInfo();
                //ステートは、ボタンのデフォルトとする。
                signalData.id = this.model.default;
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