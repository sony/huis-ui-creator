/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyArea] ";

        //信号選択用のプルダウンを表示するための情報
        interface ISignalData {
            order: number; //マクロでの信号の順番
            action: IAction; //表示するAction
            id: number;    // マクロボタンのStateId
            remotesList : IRemoteInfo[] //現在利用可能なリモコンのリスト
        }

        export class PropertyAreaMacroButton extends Backbone.View<Model.ButtonItem> {

			private templateItemDetailFile_: string;
            private actionsCount : number;
            private defaultStateID: number;
            private availableRemotelist: IRemoteInfo[];
            private defaultState : IGState; // マクロボタンDefaultのstate

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");
                this.availableRemotelist = huisFiles.getSupportedRemoteInfo();

                //stateIdはデフォルト値とする。
                this.defaultState = this.model.state[this.model.default];
			}

		

            events() {
                // Please add events
                return {
                    "click #add-signal-btn": "onPlusBtnClick",
                    "change .interval-input": "onInvervalPullDownListChanged",
                    "change .state-action-input" : "onActionPullDownListChanged"
                };
            }


            getModel():Model.ButtonItem {
                return this.model;
            }

            //remove() {
            //}


            updateModel() {
                let FUNCTION_NAME = TAG + "updateModel : ";

                //orderをkeyとしたActionのハッシュを作成。
                let tmpActionsWithOrder = {};

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers : JQuery = this.$el.find(".signal-container-element");

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
                    if (tmpRemoteId == null || tmpRemoteId == "none") {
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
                let keysNumCount: number = 0;;
                for (let i = 0; i < MAX_NUM_MACRO_SIGNAL; i++) {

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

                //マクロボタンのstateは、デフォルト一つとする。
                this.defaultState.action = actionsForUpdate;
                let states: IGState[] = [];
                
                states.push(this.defaultState);

                this.model.state = states;
            }

            //Invervalのプルダウンが変更されたら呼ばれる
            private onInvervalPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onInvervalPullDownListChanged";
                this.updateModel();
            }

            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";
                this.updateModel();
            }

            //+ボタンがクリックされた場合に呼び出される
            private onPlusBtnClick(event: Event) {
                let FUNCTION_NAME = TAG + "onPlusBtnClick : ";

                let $signalContainer = this.$el.find("#signals-container");
                let tmpInput = this.$el.find(".state-action-input[data-state-id=\"" + this.model.default + "\"]").val();

                let empltyAction: IAction = {
                    input: tmpInput,
                    interval: DEFAULT_INTERVAL_MACRO,
                };
                let tmpOrder = this.defaultState.action.length;

                let signalData: ISignalData = {
                    order: tmpOrder,
                    action: empltyAction,
                    id: this.defaultState.id,
                    remotesList: this.availableRemotelist,
                };

                //すでに、同じorderのDOMがない場合には追加
                let $newSignalContainerElement = this.$el.find(".signal-container-element[data-signal-order=\"" + tmpOrder + "\"]");
                if ($newSignalContainerElement.length == 0) {
                    this.renderSignalDetailWithInterval(signalData, $signalContainer);
                } else {
                    console.warn(FUNCTION_NAME + "order : " + tmpOrder + "is already exist. ");
                }

                //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する
                $('.custom-select').trigger('create');

            }


            renderView(): JQuery {
                let FUNCTION_NAME = TAG + ":renderView : ";


				//マクロの基本情報を付与
				// ボタンの state 情報を付加
				var $macroContainer = this.$el.nextAll("#macro-container");
				let macroData: any = {};
				let templateMacro: Tools.JST = Tools.Template.getJST("#template-property-macro-button", this.templateItemDetailFile_);

                let state = this.defaultState;
                let id : number = this.defaultState.id;
                macroData.id = id;

				
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



                let actions:IAction[] = state.action;


				//最初の１シグナル分は特例で、追加する。
                let $signalContainer = $macroContainer.find("#signals-container");
                let signalData: ISignalData = {
                    order: 0,
                    action: actions[0],
                    id: id,
                    remotesList: this.availableRemotelist,
                }
                this.renderSignalDetailWithoutInterval(signalData,$signalContainer);

                for (let i = 1; i < actions.length; i++){
                    signalData.order = i;
                    signalData.action = actions[i];
                    this.renderSignalDetailWithInterval(signalData, $signalContainer);
                }
                


                return $macroContainer;
                
			}


            /*
            * インターバルなしの一回文のシグナルのJQueryを取得する。
            * @param signalData{ISignalData} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithoutInterval(signalData:ISignalData, $signalContainer: JQuery){
                let FUNCTION_NAME: string = TAG + "getSignalDetailWithoutInterval";

                if (signalData == null) {
                    console.warn(FUNCTION_NAME + "signalData is null");
                    return;
                }

                if ($signalContainer == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer is null");
                    return;
                }
   
                let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal", this.templateItemDetailFile_);
                $signalContainer.append( $(templateSignal(signalData)));
            }

            /*
            * インターバルつきの一回文のシグナルのJQueryを取得する。
            * @param signalData{ISignalData} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithInterval(signalData: ISignalData, $signalContainer: JQuery) {
                let FUNCTION_NAME: string = TAG + "getSignalDetailWithoutInterval";

                if (signalData == null) {
                    console.warn(FUNCTION_NAME + "signalData is null");
                    return;
                }

                if ($signalContainer == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer is null");
                    return;
                }

                //interval以外を描写
                this.renderSignalDetailWithoutInterval(signalData, $signalContainer);

                let $targetSignalContainer = $signalContainer.find(".signal-container-element[data-signal-order=\"" + signalData.order + "\"]");
                //インターバル用のテンプレートを読み込み
                let $intervalContainer = $targetSignalContainer.find("#signal-interval-container");
                let templateInterval: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal-interval", this.templateItemDetailFile_);
                let $intervalDetail = $(templateInterval(signalData));
                $intervalContainer.append($intervalDetail);

                //それぞれの表示を変えていく。

                //inverfalの表示を変更
                if (signalData.action.interval) {
                    $targetSignalContainer.find("select.interval-input").val(signalData.action.interval.toString());

                }

                /*
                //リモコンの表示を変更
                if (signalData.action.code_db.a){
                }
                let tmpRemoteId = $target.find("select.remote-input").val();
                if (tmpRemoteId == null) {
                    continue;
                }

                //functionを仮取得
                let tmpFunction = $target.find("select.function-input").val();
                if (tmpFunction == "none") {
                    tmpFunction = null;
                }*/


            }


		}
	}
}