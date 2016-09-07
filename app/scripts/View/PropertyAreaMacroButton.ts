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
            action?: IAction; //表示するAction
            id: number;    // マクロボタンのStateId
            remotesList?: IRemoteInfo[]; //リモコン選択用プルダウンに表示するためのリスト
            functions?: string[]; //Function選択用プルダウンに表示するためのリスト
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
                    "change .state-action-input": "onActionPullDownListChanged",
                    "change .remote-input":"onRemotePullDownListChanged"
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

                    //Actionの順番を取得。取得できない場合は次のループへ
                    let $target: JQuery = $($signalContainers[i]);
                    let order = this.getOrderFrom($target);
                    if (order == null) {
                        continue;
                    }

                    //invervalを仮取得
                    let tmpInterval = $target.find("select.interval-input").val();
                    if (tmpInterval == null) {
                        tmpInterval = 0;
                    }

                    //remoteIdを仮取得
                    let tmpRemoteId = $target.find("select.remote-input").val();
                    if (tmpRemoteId == null || tmpRemoteId == "none") {
                        tmpRemoteId = null;
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

                  
                    if (deviceInfo) {
                        //deviceInfo.functionCodeHashがある場合、codeを取
                        //codeを入力
                        let tmpCode = null;

                        if (deviceInfo.functionCodeHash) {
                            tmpCode = deviceInfo.functionCodeHash[tmpFunction];
                        }
                        if (tmpCode != null) {
                            tmpAction.code = tmpCode;
                        }

                        //codeDbを入力
                        let tmpCodeDb: ICodeDB = null;
                        if (deviceInfo.code_db) {
                            tmpCodeDb = deviceInfo.code_db;
                            tmpCodeDb.function = tmpFunction;
                        }
                        if (tmpCodeDb != null) {
                            tmpAction.code_db = tmpCodeDb;
                        }
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

            //リモコン選択用のプルダウンが変更されたときに呼ばれる
            private onRemotePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onRemotePullDownListChanged";
                let $target = $(event.currentTarget);
                let remoteId = $target.val();

                //remoteIdがない場合、処理を終了する。
                if (remoteId == "none" || remoteId == null) {
                    return;
                }

                // プルダウンに設定されている Actionの順番を取得
                let order = this.getOrderFrom($target);
                if (order == null) {
                    return;
                }

                //Function選択用のPullダウンにFunctionを設定する。
                this.renderFunctionsOf(order);

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

                let labelSize: number = null;
                if (state.label) {
                    let label: IGLabel = state.label[0];
                    macroData.label = label;
                    labelSize = label.size;
				}

				let $macroDetail = $(templateMacro(macroData));
				$macroContainer.append($macroDetail);

                
                //テキストラベルのpullDownを変更する。
                var $textSizePullDown = this.$el.find(".property-state-text-size[data-state-id=\"" + state.id + "\"]");
                if (labelSize != null) {
                    $textSizePullDown.val(labelSize.toString());
                }

                let actions: IAction[] = state.action;                
                if (actions == null || actions.length == 0) {
                    console.warn(FUNCTION_NAME + "acctions is null");
                    return;
                }

                //ActionのPullDownを変更する。

                //inputを読み取るアクションのIDは0とする。
                //マクロは複数の異なるアクションを設定できないためどのアクションを選択しても変わらない。
                let TARGET_ACTION = 0;
                var $actionPullDown: JQuery = this.$el.find(".state-action-input[data-state-id=\"" + state.id + "\"]");
                if ($actionPullDown && actions[TARGET_ACTION]) {
                    $actionPullDown.val(actions[TARGET_ACTION].input);
                }


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
   
                //ベースとなるDOM描写する
                let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal", this.templateItemDetailFile_);
                $signalContainer.append($(templateSignal(signalData)));
               
                //Functions用のプルダウンを描画できるときは描画
                let order = signalData.order;
                if (order != null) {
                    this.renderFunctionsOf(order);
                }

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

            /*
            * 入力したorderのFunctionsを描画する。
            */
            private renderFunctionsOf(order : number) {
                let FUNCTION_NAME = TAG + "renderFunctionsOf : ";
                if (order == null) {
                    console.warn("order is null");
                    return;
                }

                //targetとなるJQueryを取得
                let $target : JQuery= this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return;
                }

                //Functionが存在してる場合にFunctionを表示。
                let functions: string[] = this.getFunctionsOf(order);
                if (functions != null) {
                    //インターバル用のテンプレートを読み込み
                    let $functionlContainer = $target.find("#signal-function-container");
                    let templateFunctions: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal-functions", this.templateItemDetailFile_);
                    let signalData: ISignalData = {
                        functions: functions,
                        id: this.defaultState.id,
                        order: order
                    }
                    let $functionsDetail = $(templateFunctions(signalData));
                    $functionlContainer.append($functionsDetail);

                    //Functionの文言を和訳
                    $functionlContainer.i18n();

                    //プルダウンにJQueryMobileのスタイルをあてる
                    $functionlContainer.trigger('create');
                    
                }
            }

            /*
            * 入力したJQueryに登録されている order情報(何番目のマクロ信号か.0からはじまる)を取得する。
            * @param $target{JQuery} 対象となるJQuery
            * @return {number} order情報 みつからない場合、undefinedを返す。
            */
            private getOrderFrom($target: JQuery): number {
                let FUNCTION_NAME = TAG + "getOrderFrom";

                if ($target == null) {
                    console.warn(FUNCTION_NAME + "$target is null");
                    return;
                }

                let result : number= parseInt(JQUtils.data($target, "signalOrder"), 10);

                if (result != null) {
                    return result;
                } else {
                    return undefined;
                }
            }

            /*
            * 入力したorderの信号に登録されているremoteIdを取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : remoeIdを取得したい信号の順番
            * @{string} remoteId
            */
            private getRemoteIdOf(order: number): string{
                let FUNCTION_NAME = TAG + "getRemoteIdOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let remoteId: string = null;
                let $remotePullDown = this.$el.find(".remote-input[data-signal-order=\"" + order + "\"]");
                if ($remotePullDown != null) {
                    remoteId = $remotePullDown.val();
                }

                //"none"も見つからない扱いとする。
                if (remoteId == null || remoteId == "none"){
                    return undefined;
                }

                return remoteId;

            }

            /*
            * 入力したorderのリモコンが持てる信号のリストFunctionsを返す。
            * @param order {number} 信号リストを取得したい、マクロ信号の順番
            * @return {string[]} 見つからなかった場合、undefinedを返す。
            */
            private getFunctionsOf(order : number) {
                let FUNCTION_NAME = TAG + "getRemoteIdOf";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                }

                let remoteId :string = this.getRemoteIdOf(order);
                if (remoteId == null) {
                    return;
                }

                //TODO：huisFilesで取得できない場合の処理(すでに削除されているなど)
                //キャッシュで対応する。
                return huisFiles.getMasterFunctions(remoteId);
            }



		}
	}
}