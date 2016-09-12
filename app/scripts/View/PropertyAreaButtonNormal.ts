/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyAreaNormal] ";

      
        export class PropertyAreaButtonNormal extends PropertyAreaButtonBase {

         
			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            events() {
                // Please add events
                return {
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .function-input": "onFunctionPulllDownListChanged"
                };
            }

            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";

                let $target = $(event.currentTarget);
                if (!this.isValidJQueryElement($target)) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                // プルダウンに設定されている Actionの順番を取得
                let order = this.getOrderFrom($target);
                if (order == null) {
                    return;
                }

                let inputAction = $target.val();
                this.removeFunctionPullDown(order);
                this.renderRemoteIdOf(order, this.DEFAULT_STATE_ID);
                this.updateModel(this.DEFAULT_STATE_ID);

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
                this.renderFunctionsOf(order, this.DEFAULT_STATE_ID);
                this.updateModel(this.DEFAULT_STATE_ID);
            }

            //機能選択用のプルダウンが変更されたときに呼び出される
            private onFunctionPulllDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onFunctionPulllDownListChanged";
                this.updateModel(this.DEFAULT_STATE_ID);
            }




            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            * 保持しているモデルうち、指定したRemoteIdの内容でプルダウンを描画する
            */
            renderViewState(stateId : number): JQuery {
                let FUNCTION_NAME = TAG + "renderViewState";

                let $signalsContainer: JQuery = this.$el.find("#signals-container");
                let templateSignal = Tools.Template.getJST("#template-property-button-signal-normal", this.templateItemDetailFile_);

                let targetState :IState = this.model.state[stateId];

                //TODO適切なactionIdを指定
                let actionId : number = 0;
                let targetAction: IAction = targetState.action[actionId];
                let inputType = targetAction.input;
                let functions = this.getFunctionsFromAction(targetAction);
                let functionName = this.getFunctionNameFromAction(targetAction);
                let remoteId = this.getRemoteIdByAction(targetAction);

                //TODO適切なorderを指定
                let order: number = 0;
                let inputData = {
                    id: stateId,
                    order: order,
                    input: inputType,
                    functions: functions
                };

                let $signalDetail = $(templateSignal(inputData));
                $signalsContainer.append($signalDetail);
                
                //actino設定用のpulldownをレンダリング
                this.renderActionPulllDownOf(order, stateId, inputType);

                //remoteId設定用のpulldownをレンダリング
                this.renderRemoteIdOf(order, stateId, remoteId);

                //function設定用pulldownをレンダリング
                this.renderFunctionsOf(order, stateId, functionName);

                return $signalsContainer;

            }

            updateModel(stateId : number) {
                let FUNCTION_NAME = TAG + "updateModel : ";


                //orderをkeyとしたActionのハッシュを作成。
                let tmpActionsWithOrder = {};

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                // 信号のJqueryがない場合、return
                if (!this.isValidJQueryElement($signalContainers)) {
                    return;
                }

                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++) {

                    //Actionの順番を取得。取得できない場合は次のループへ
                    let $target: JQuery = $($signalContainers[i]);
                    let order = this.getOrderFrom($target);
                    if (order == null) {
                        continue;
                    }

                    let tmpInput = this.getInputAction(order);
                    if (!this.isValidValue(tmpInput)) {
                        tmpInput = null;
                    }
                   
                    //remoteIdを仮取得
                    let tmpRemoteId: string = this.getRemoteIdFromPullDownOf(order);
                    if (!this.isValidValue(tmpRemoteId)) {
                        tmpRemoteId = null;
                    }

                    //functionを仮取得
                    let tmpFunction: string = this.getFunctionFromlPullDownOf(order);
                    if (!this.isValidValue(tmpFunction)) {
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

                        //bluetooth_dataを入力
                        let tmpBluetoothData = null
                        if (deviceInfo.bluetooth_data != null){
                            tmpBluetoothData = deviceInfo.bluetooth_data;
                        }
                        if (tmpBluetoothData != null) {
                            tmpAction.bluetooth_data = tmpBluetoothData;
                        }
                        
                    }

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

                let tmpState: IGState = this.model.state[stateId];

                //マクロボタンのstateは、デフォルト一つとする。
                tmpState.action = actionsForUpdate;
                let states: IGState[] = [];

                states.push(tmpState);

                this.model.state = states;
                this.trigger("updateModel");
            }



            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            * アクション設定用のpullldownMenuをレンダリングする
            * @param order{number} 上から何番目の信号か
            * @param stateid{number} 
            * @param inputAction? {string} プルダウンの初期値 
            */
            private renderActionPulllDownOf(order: number,stateId:number, inputAction? : string) {
                let FUNCTION_NAME: string = TAG + "renderActionPulllDownOf : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "staeId is null");
                    return;
                }

                //targetとなるJQueryを取得
                let $target: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return;
                }

                //FunctionプルダウンのDOMを表示。
                let $actionContainer = $target.find("#signal-action-container");
                let templateAction: Tools.JST = Tools.Template.getJST("#template-property-button-signal-action", this.templateItemDetailFile_);

                

                let inputData = {
                    id: stateId,
                    order: order,
                    remotesList: this.availableRemotelist
                }

                let $actionDetail = $(templateAction(inputData));
                $actionContainer.append($actionDetail);

                //inputActionを入力していた場合、値を表示
                if (inputAction != null) {
                    this.setInputAction(order, stateId, inputAction);
                }

                //Functionの文言を和訳
                $actionContainer.i18n();

                //プルダウンにJQueryMobileのスタイルをあてる
                $actionContainer.trigger('create');

            }
            
            /*
           * アクション設定用のpullldownMenuをgetする
           * @param order{number} 
           */
            private getInputAction(order: number) {
                let FUNCTION_NAME = TAG + "getInputAction : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $actionPullDown = $signalContainerElement.find(".action-input[data-signal-order=\"" + order + "\"]");
                if ($actionPullDown == null || $actionPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$actionPullDown is invalid");
                    return;
                }

                let inputType : string = $actionPullDown.val();

                //"none"も見つからない扱いとする。
                if (!this.isValidValue(inputType)) {
                    return;
                }

                return inputType;
            }


            /*
             * inputするアクションをセットする
             * @param order{number} 
             * @param stateid{number}
             */
            private setInputAction(order: number, stateId: number, inputType: string) {
                let FUNCTION_NAME = TAG + "setInputAction : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

               
                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $actionPullDown = $signalContainerElement.find(".action-input[data-signal-order=\"" + order + "\"]");
                if ($actionPullDown == null || $actionPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$actionPullDown is invalid");
                    return;
                }

                //"none"も見つからない扱いとする。
                if (this.isValidValue(inputType)) {
                    $actionPullDown.val(inputType);
                }

                

            }
           

        }
	}
}