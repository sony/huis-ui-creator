/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyAreaButtonMacro] ";

        //プルダウンに入力できる情報
        interface ISignalInputs {
            interval: number;
            remoteId: string;
            functionName : string;
        }

        export class PropertyAreaButtonMacro extends PropertyAreaButtonBase {

            //DOMのプルダウンの値ををベースにModelを更新する。
            //DOMを生成・変更 ＞＞ DOMの値をModelに反映 ＞＞ Modelの内容でDOMを再生成の流れでViewを管理する。
            private defaultState: IGState; // マクロボタンDefaultのstate

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);

                //stateIdはデフォルト値とする。
                this.defaultState = this.model.state[this.model.default];
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            events() {
                // Please add events
                return {
                    "click #add-signal-btn": "onPlusBtnClick",
                    "change .interval-input": "onInvervalPullDownListChanged",
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .function-input": "onFunctionPulllDownListChanged",
                    "change select": "onAnyPulllDownChanged",
                    "click .delete-signal": "onDeleteButtonClick",
                    "click .sort-up-btn": "onMoveUpOrderButtonClick",
                    "click .sort-down-btn": "onMoveDownOrderButtonClick",
                    "mouseover .signal-container-element": "onSignalControllAreaMouseOn",
                    "mouseout .signal-container-element": "onSignalControllAreaMouseOut"
                };
            }


      

            //並び替え上ボタンが押されたときに呼ばれる
            private onMoveUpOrderButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onMoveUpOrderButtonClick : ";

                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //一番上のボタンの場合、無視する
                if (order <= 0) {
                    console.warn(FUNCTION_NAME + "up buttonn of first order signal is ignored");
                    return;
                }


                //sort先（一つ上の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextAboveSignalContainer: JQuery = this.getSignalContainerElementOf(order - 1);

                if (this.isValidJQueryElement($nextAboveSignalContainer)) {
                    this.exchangeSignalValueSignals($thisOrderSignalContainer, $nextAboveSignalContainer);
                    //情報を更新し、再描画
                    this.updateModel();
                    this.renderSignalContainers();
                }

            }

            //並び替え下ボタンが押されたときに呼ばれる
            private onMoveDownOrderButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onMoveDownOrderButtonClick : ";
                
                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }
                //一番下のボタンの場合、無視する
                if (order >= this.defaultState.action.length - 1) {
                    console.warn(FUNCTION_NAME + "down buttonn of last order signal is ignored");
                    return;
                }

                //sort先（一つ下の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextBelowSignalContainer: JQuery = this.getSignalContainerElementOf(order + 1);
                if (this.isValidJQueryElement($nextBelowSignalContainer)) {
                    this.exchangeSignalValueSignals($thisOrderSignalContainer, $nextBelowSignalContainer);
                    //情報を更新し、再描画
                    this.updateModel();
                    this.renderSignalContainers();
                }
                

            }

            //deleteボタンが押されたときに呼ばれる
            private onDeleteButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onDeleteButtonClick";
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.deleteSignal(order);

            }

            //プルダウンのいずれかが変更されたときに呼ばれる
            private onAnyPulllDownChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onAnyPulllDownChanged";

                

                this.controlPlusButtonEnable();
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

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //Function選択用のPullダウンにFunctionを設定する。
                this.renderFunctionsOf(order, this.defaultState.id);

                this.updateModel();

                //noneのoptionをもっていたとき,noneの選択肢を消すため表示を更新する。
                if ($target.find(".default-value").length != 0) {
                    this.renderSignalContainers();
                }

            }

            //機能選択用のプルダウンが変更されたときに呼び出される
            private onFunctionPulllDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onFunctionPulllDownListChanged";
                this.updateModel();

                let $target = $(event.currentTarget);
                //noneのoptionをもっていたとき,noneの選択肢を消すため表示を更新する。
                if ($target.find(".default-value").length != 0) {
                    this.renderSignalContainers();
                }
            }

            //+ボタンがクリックされた場合に呼び出される
            private onPlusBtnClick(event: Event) {
                let FUNCTION_NAME = TAG + "onPlusBtnClick : ";

                let $target = $(event.currentTarget);
                if ($target.hasClass("disabled")) {
                    return;
                }

                let $signalContainer = this.$el.find("#signals-container");
                let tmpInput = this.$el.find(".state-action-input[data-state-id=\"" + this.model.default + "\"]").val();

                let empltyAction: IAction = {
                    input: tmpInput,
                    interval: DEFAULT_INTERVAL_MACRO,
                };
                let tmpOrder = this.defaultState.action.length;

                if (!this.isValidOrder(tmpOrder)) {
                    console.warn(FUNCTION_NAME + "tmpOrder is invalid");
                    return;
                }

                //すでに、同じorderのDOMがない場合には追加
                let $newSignalContainerElement = this.$el.find(".signal-container-element[data-signal-order=\"" + tmpOrder + "\"]");
                if ($newSignalContainerElement.length == 0) {
                    this.renderSignalDetailWithInterval(tmpOrder, empltyAction, $signalContainer);
                } else {
                    console.warn(FUNCTION_NAME + "order : " + tmpOrder + "is already exist. ");
                }

                //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する
                $('.custom-select').trigger('create');

                this.controlPlusButtonEnable();
                this.updateModel();



            }





            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            *保持しているモデルを取得する
            * @return {Model.BUttonItem}
            */
            getModel(): Model.ButtonItem {
                return this.model;
            }


            /*
            * 保持しているモデルの内容でプルダウンを描画する
            */
            renderView(): JQuery {
                let FUNCTION_NAME = TAG + ":renderView : ";


                //マクロの基本情報を付与
                // ボタンの state 情報を付加
                var $macroContainer = this.$el.nextAll("#macro-container");
                let macroData: any = {};
                let templateMacro: Tools.JST = Tools.Template.getJST("#template-property-macro-button", this.templateItemDetailFile_);

                let state = this.defaultState;
                let id: number = this.defaultState.id;
                macroData.id = id;


                let resizeMode: string;

                if (state.image) {
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

                macroData.actionList = ACTION_INPUTS;

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

                this.renderSignalContainers();
                

                return $macroContainer;

            }





            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
             *保持しているモデルをプルダウンの内容に合わせてアップデートする。
             */
            private updateModel() {
                let FUNCTION_NAME = TAG + "updateModel : ";

                //orderをkeyとしたActionのハッシュを作成。
                let tmpActionsWithOrder = {};

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                // 信号のJqueryがない場合、return
                if ($signalContainers.length == 0) {
                    return;
                }

                let tmpInput = this.$el.find(".state-action-input[data-state-id=\"" + this.model.default + "\"]").val();

                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++) {

                    //Actionの順番を取得。取得できない場合は次のループへ
                    let $target: JQuery = $($signalContainers[i]);
                    let order = this.getOrderFrom($target);

                    if (!this.isValidOrder(order)) {
                        console.warn(FUNCTION_NAME + "order is invalid");
                        continue;
                    }

                    //invervalを仮取得
                    let tmpInterval: number = this.getInvervalFromPullDownOf(order);
                    if (!this.isValidValue(tmpInterval)) {
                        tmpInterval = 0;
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

                    let deviceInfo = null;
                    if (tmpRemoteId != null) {
                        deviceInfo = huisFiles.getDeviceInfo(tmpRemoteId);
                    }


                    let tmpAction: IAction = {
                        input: tmpInput,
                    };


                    if (deviceInfo != null) {
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
                        let tmpBluetoothData = null;
                        if (deviceInfo.bluetooth_data != null) {
                            tmpBluetoothData = deviceInfo.bluetooth_data;
                        }
                        if (tmpBluetoothData != null) {
                            tmpAction.bluetooth_data = tmpBluetoothData;
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

                //一番最初の信号のinvervalは必ず0に
                if (actionsForUpdate.length > 0) {
                    actionsForUpdate[0].interval = 0;
                }

                //マクロボタンのstateは、デフォルト一つとする。
                this.defaultState.action = actionsForUpdate;
                let states: IGState[] = [];

                states.push(this.defaultState);

                this.model.state = states;
                this.trigger("updateModel");
            }


            /*
            * シグナル設定用のpulldownたちをすべてレンダリングする。
            */
            private renderSignalContainers() {
                let FUNCTION_NAME = TAG + "renderSignalContainers";

                let actions: IAction[] = this.defaultState.action;

                //最初の１シグナル分は特例で、追加する。
                let $signalContainer = this.$el.find("#signals-container");

                //一度、すべて消してから、すべての信号を描画しなおす。
                $signalContainer.children().remove();
                for (let i = 0; i < actions.length; i++) {
                    let order = i;
                    let action = actions[i];
                    this.renderSignalDetailWithInterval(order, action, $signalContainer);
                }


                this.controlPlusButtonEnable();
            }
            
            /*
            * 入力されたorderに設定されている信号を削除する
            * @param order{number}: それぞれの信号に設定されている順番
            */
            private deleteSignal(order: number) {
                let FUNCTION_NAME = TAG + "deleteSignal";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $target = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                $target.remove();

                //消えた後のプルダウンの値に合わせてアップデート
                this.updateModel();

                //アップデートされたモデルに合わせてプルダウン部をレンダリング
                this.renderSignalContainers();

            }

            /*
            * インターバルなしの一回文のシグナルのJQueryを取得する。
            * @param order{nuber} 表示する信号のorder
            * @param action{IAction} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithoutInterval(order : number, action : IAction, $signalContainer: JQuery) {
                let FUNCTION_NAME: string = TAG + "getSignalDetailWithoutInterval";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }

                if ($signalContainer == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer is null");
                    return;
                }

                let inputDataForRender: any = {
                    order : order
                }

                //ベースとなるDOM描写する
                let templateSignal: Tools.JST = Tools.Template.getJST("#template-property-button-signal-macro", this.templateItemDetailFile_);
                $signalContainer.append($(templateSignal(inputDataForRender)));

                
                let remoteId: string = this.getRemoteIdByAction(action);
                this.renderRemoteIdOf(order, this.DEFAULT_STATE_ID, remoteId);

                //Functions用のプルダウンを描画できるときは描画
                let functionName = this.getFunctionNameFromAction(action);
                this.renderFunctionsOf(order, this.defaultState.id, functionName);

                //言語対応
                $signalContainer.i18n();
                $signalContainer.trigger('create');
            }



            /*
            * インターバルつきの一回分のシグナルを描画する。
            * @param order{nuber} 表示する信号のorder
            * @param action{IAction} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithInterval(order : number, action: IAction, $signalContainer: JQuery) {
                let FUNCTION_NAME: string = TAG + "getSignalDetailWithoutInterval";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }


                if ($signalContainer == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer is null");
                    return;
                }

                //interval以外を描写
                this.renderSignalDetailWithoutInterval(order, action , $signalContainer);

                //intervalを描写
                this.renderIntervalOf(order, action.interval);
                

            }


            /*
            * 指定したorderのIntervalをレンダリングする。
            * @param order{number} マクロ信号の順番
            * @param inputInterval?{number} プルダウンに代入する値 
            */
            private renderIntervalOf(order: number, inputInterval ?: number) {
                let FUNCTION_NAME = TAG + "renderIntervalOf : ";
                
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //inputIntervalがない場合、0として扱う
                if (inputInterval == null) {
                    inputInterval = 0;
                }

                
                let $targetSignalContainer = this.getSignalContainerElementOf(order);

               

                //インターバル用のテンプレートを読み込み
                let $intervalContainer = $targetSignalContainer.find("#signal-interval-container");

                //すでに存在した場合、一度削除する
                $intervalContainer.children().remove();

                //intervalのプルダウンを表示するには、orderとstateIdが必要
                let signalData = {
                    order: order,
                    id : this.defaultState.id
                }

                let templateInterval: Tools.JST = Tools.Template.getJST("#template-property-button-signal-interval", this.templateItemDetailFile_);
                let $intervalDetail = $(templateInterval(signalData));
                $intervalContainer.append($intervalDetail);

                //inverfalの表示を変更 値がundefinedのとき0を代入する
                if (!this.isValidValue(inputInterval)) {
                    inputInterval = 0;
                }
                this.setIntervalPullDownOf(order, inputInterval);

                $targetSignalContainer.i18n();
                $targetSignalContainer.trigger('create');
            }


            /*
            * 入力したorderの信号に登録されているinvervalをpulldownから取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : numberを取得したい信号の順番
            * @{number} inverval
            */
            private getInvervalFromPullDownOf(order: number): number {
                let FUNCTION_NAME = TAG + "getInvervalPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let inverval: number = null;
                let $invervalPullDown = $signalContainerElement.find(".interval-input[data-signal-order=\"" + order + "\"]");
                if ($invervalPullDown == null || $invervalPullDown.length == 0) {
                    return;
                }

                inverval = parseFloat($invervalPullDown.val());
                if (!this.isValidValue(inverval)) {
                    return undefined;
                }

                return inverval;
            }


            /*
            * 入力したorderのInvervalプルダウンに、inputの値を代入する。
            * order{number} ： マクロ信号の順番
            * inputInterval{number} : プルダウンに設定する値。
            */
            private setIntervalPullDownOf(order : number, inputInterval : number) {
                let FUNCTION_NAME = TAG + "setIntervalPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                if (inputInterval == null) {
                    console.warn(FUNCTION_NAME + "inputInterval is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    return;
                }

                let $invervalPullDown = $signalContainerElement.find(".interval-input[data-signal-order=\"" + order + "\"]");
                if ($invervalPullDown == null || $invervalPullDown.length == 0) {
                    return;
                }

                $invervalPullDown.val(inputInterval.toString());

            }


            /*
            * 表示されているすべての信号登録用pulldownに情報が埋まっているか否かを返す。
            */
            private isAllSignalPullDownSelected() {
                let FUNCTION_NAME = TAG + "isAllPullDownSelected";

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                // 信号のJqueryがない場合、すべてが埋まっていると扱う
                if ($signalContainers.length == 0) {
                    return true;
                }


                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++) {
                    let $target: JQuery = $($signalContainers[i]);

                    //それぞれのプルダウンが存在し、利用不能な値が代入されている場合、false;

                    //inverval
                    let $intervalPulllDown = $target.find("select.interval-input");
                    if ($intervalPulllDown.length != 0) {
                        let value = $intervalPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }

                    //remoteId
                    let $remoteIdlPulllDown = $target.find("select.remote-input");
                    if ($remoteIdlPulllDown.length != 0) {
                        let value = $remoteIdlPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }

                    //function
                    let $functionlPulllDown = $target.find("select.function-input");
                    if ($functionlPulllDown.length != 0) {
                        let value = $functionlPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }
                }

                //一回も無効な数値が判定されない ＝ すべて有効な値。としてtrue;
                return true;

            }


            // +ボタンのenable disableを判定・コントロールする。
            private controlPlusButtonEnable() {
                let FUNCTINO_NAME = TAG + "controlPlusButtonEnable";
                let $target = this.$el.find("#add-signal-btn");

                //すべてのpullDownがうまっているとき、+をenableに、それ以外はdisable
                if (this.isAllSignalPullDownSelected()) {
                    $target.removeClass("disabled");
                } else {
                    $target.addClass("disabled");
                }

                //設定できるマクロ最大数だった場合もdisable
                if (this.defaultState.action.length >= MAX_NUM_MACRO_SIGNAL) {
                    $target.addClass("disabled");
                }

            }

           

            /*
            * 指定された二つのsignalContainerのinterval, remoteId, functionを入れ替える。
            * @param $signalContainer1{JQuery} 値を交換する信号コンテナのJQuery1
            * @param $signalContainer2{JQuery} 値を交換する信号コンテナのJQuery1
            */
            private exchangeSignalValueSignals($signalContainer1: JQuery, $signalContainer2: JQuery) {
                let FUNCTION_NAME = TAG + "exchangeSignalValueSignals : ";
                if ($signalContainer1 == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer1 is null");
                    return;
                }

                if ($signalContainer2 == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer2 is null");
                    return;
                }

                //情報の交換に必要な情報を取得
                let order1 = this.getOrderFrom($signalContainer1);

                if (!this.isValidOrder(order1)) {
                    console.warn(FUNCTION_NAME + "order1 is invalid");
                    return;
                }

                let signalInputs1 : ISignalInputs = this.getSignalnput(order1);
                if (signalInputs1 == null) {
                    console.warn(FUNCTION_NAME + "signalInputs1 is null");
                    return;
                }

                let order2 = this.getOrderFrom($signalContainer2);

                if (!this.isValidOrder(order2)) {
                    console.warn(FUNCTION_NAME + "order2 is invalid");
                    return;
                }

                let signalInputs2: ISignalInputs = this.getSignalnput(order2);
                if (signalInputs2 == null) {
                    console.warn(FUNCTION_NAME + "signalInputs2 is null");
                    return;
                }

                //order1にorder2の情報を
                this.setSignalInputsToPullDownOf(order1, signalInputs2);

                //order2に、order1の情報を
                this.setSignalInputsToPullDownOf(order2, signalInputs1);
            }


            /*
            * 指定したorderのプルダウンに入力されている情報を取得する。
            * @param order{number} 入力されている情報を取得した信号の順番
            * @return {ISignalInput} 入力されている情報、有効な値でない場合各値にundefinedがはいる
            */
            private getSignalnput(order: number): ISignalInputs{
                let FUNCTION_NAME = TAG + "getSignalnput";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                // invervalは見つからない場合、0として扱う。
                let interval = this.getInvervalFromPullDownOf(order);
                if (!this.isValidValue(interval)) {
                    interval = 0;
                }

                let remoteId = this.getRemoteIdFromPullDownOf(order);
                if (!this.isValidValue(remoteId)) {
                    remoteId = undefined;
                }

                let functionName = this.getFunctionFromlPullDownOf(order);
                if (!this.isValidValue(functionName)) {
                    functionName = undefined;
                }

                let result: ISignalInputs = {
                    interval : interval,
                    remoteId: remoteId,
                    functionName: functionName,
                }

                return result; 
            }

            /*
            * 入力したOrderのプルダウンの値を変更する。
            * @param order{number} マクロ信号を順番で指定する。
            * @param signalInputs{ISignalInputs}マクロ信号に設定する信号
            */
            private setSignalInputsToPullDownOf(order: number, signalInputs: ISignalInputs) {
                let FUNCTION_NAME = TAG + "setSignalInputsToPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                if (signalInputs == null) {
                    console.warn(FUNCTION_NAME + "signalInputs is null");
                    return;
                }

                this.renderIntervalOf(order, signalInputs.interval);

                this.setRemoteIdPullDownOf(order, signalInputs.remoteId);

                //Function選択用のPullダウンを更新。
                this.renderFunctionsOf(order,this.defaultState.id, signalInputs.functionName);

            }

            /*
            * 何も設定されていない、マクロを表示する際、プルダウンをアクセント表示
            */
            focusFirstPulldown() {
                let FUNCTION_NAME = TAG + "focusFirstPulldown";

                //Actionが1つしかない、かつ remoteIdもfunctionも初期値の場合、
                //remoteId設定用プルダウンをフォーカスする。
                let ActionNum = this.model.state[this.DEFAULT_STATE_ID].action.length;

                let remoteIdOrder0 = this.getRemoteIdFromPullDownOf(0);

                let functionOrder0 = this.getFunctionFromlPullDownOf(0);

               
                if (ActionNum <= 1 && !this.isValidValue(remoteIdOrder0) && !this.isValidValue(functionOrder0)) {
                    this.$el.find("#select-remote-input-0").focus();
                }

               
            }

           

        }
	}
}