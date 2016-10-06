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
            order: number;
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
                    "mouseenter .signal-container-element": "onHoverInSignalContainer",
                    "mouseleave .signal-container-element": "onHoverOutSignalContainer"
                };
            }





            //並び替え上ボタンが押されたときに呼ばれる
            private onMoveUpOrderButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onMoveUpOrderButtonClick : ";

                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                //二重発火を防止用。actingの場合はこの段階で無視。
                if ($target.hasClass("acting")) {
                    return;
                }

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //一番上のボタンの場合、無視する
                if (order <= 0) {
                    console.warn(FUNCTION_NAME + "up buttonn of first order signal is ignored");
                    return;
                }

                let targetOrder = order - 1;


                //sort先（一つ上の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextAboveSignalContainer: JQuery = this.getSignalContainerElementOf(order - 1);

                if (this.isValidJQueryElement($nextAboveSignalContainer)) {

                    //二重発火を防止用。
                    $target.addClass("acting");

                    //もし、$nextTopSignalContainerが一番上のプルダウンなら、
                    //プルダウンを一度追加して、 自身のintervalを消してからアニメ
                    if ((targetOrder) == 0) {
                        //レイアウト崩れを防ぐため、高さは維持する。
                        let tmpHeightThis = $thisOrderSignalContainer.find(".signals").outerHeight();
                        let tmpHeightNext = $nextAboveSignalContainer.find(".signals").outerHeight();

                        this.renderIntervalOf(0);
                        this.setIntervalPullDownOf(0, 0);

                        this.removeIntervalPullDown(order);

                        $thisOrderSignalContainer.find(".signals").outerHeight(tmpHeightThis);
                        $nextAboveSignalContainer.find(".signals").outerHeight(tmpHeightNext);
                    }

                    //もし、remoteIdのプルダウンが未入力の場合
                    //funtionのプルダウンを表示してから、アニメ。初期入力値は、remoteInfoList[0]とする。
                    if (!this.isValidValue(this.getRemoteIdFromPullDownOf(order))) {
                        if (this.availableRemotelist[0] != null) {
                            this.setRemoteIdPullDownOf(order, this.availableRemotelist[0].remoteId);
                            this.renderFunctionsOf(order);
                            $thisOrderSignalContainer.trigger('create');
                        }
                    }



                    let duration: number = DURATION_ANIMATION_EXCHANGE_MACRO_SIGNAL_ORDER;
                    this.exchangeJQueryPositionAnimation($thisOrderSignalContainer.find(".pulldowns"), $nextAboveSignalContainer.find(".pulldowns"), duration);

                    setTimeout(() => {
                        this.exchangeSignalValues($thisOrderSignalContainer, $nextAboveSignalContainer);
                        //情報を更新し、再描画
                        this.updateModel();
                        this.renderSignalContainers();

                    }, duration);
                }

            }

            //並び替え下ボタンが押されたときに呼ばれる
            private onMoveDownOrderButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onMoveDownOrderButtonClick : ";
                
                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                //二重発火を防止用。actingの場合はこの段階で無視。
                if ($target.hasClass("acting")) {
                    return;
                }

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }
                //一番下のボタンの場合、無視する
                if (order >= this.defaultState.action.length - 1) {
                    console.warn(FUNCTION_NAME + "down buttonn of last order signal is ignored");
                    return;
                }

                let targetOrder = order + 1;

                //sort先（一つ下の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextBelowSignalContainer: JQuery = this.getSignalContainerElementOf(targetOrder);
                if (this.isValidJQueryElement($nextBelowSignalContainer)) {

                    //二重発火を防止用。
                    $target.addClass("acting");

                    //もし、$thisOrderSignalContainerが一番上のプルダウンなら、
                    //プルダウンを一度追加して$nextTopSignalContainerのintervalを消してからアニメ。
                    if (order == 0) {
                        //レイアウト崩れを防ぐため、高さは維持する。
                        let tmpHeightThis = $thisOrderSignalContainer.find(".signals").outerHeight();
                        let tmpHeightNext = $nextBelowSignalContainer.find(".signals").outerHeight();
                        
                        this.renderIntervalOf(0);
                        this.setIntervalPullDownOf(0, 0);

                        this.removeIntervalPullDown(targetOrder);
                        $thisOrderSignalContainer.find(".signals").outerHeight(tmpHeightThis);
                        $nextBelowSignalContainer.find(".signals").outerHeight(tmpHeightNext);
                    }

                    //もし、入れ替え対象のremoteIdのプルダウンが未入力の場合
                    //functionpulldownを表示してから、アニメ。初期入力値は、remoteInfoList[0]とする。
                    if (!this.isValidValue(this.getRemoteIdFromPullDownOf(targetOrder))) {
                        if (this.availableRemotelist[0] != null) {
                            this.setRemoteIdPullDownOf(targetOrder, this.availableRemotelist[0].remoteId);
                            this.renderFunctionsOf(targetOrder);
                        }
                    }


                    let duration: number = DURATION_ANIMATION_EXCHANGE_MACRO_SIGNAL_ORDER;
                    this.exchangeJQueryPositionAnimation($thisOrderSignalContainer.find(".pulldowns"), $nextBelowSignalContainer.find(".pulldowns"), duration);
                    setTimeout(() => {
                        this.exchangeSignalValues($thisOrderSignalContainer, $nextBelowSignalContainer);
                        //情報を更新し、再描画
                        this.updateModel();
                        this.renderSignalContainers();

                    }, duration);
 
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
                let tmpInput = this.$el.find(".action-input[data-state-id=\"" + this.model.default + "\"]").val();

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
                    this.updateModel();
                    this.renderSignalContainers();

                    //削除とソートボタンをちら見する。
                    this.animateAddButton(tmpOrder);   
                    
                } else {
                    console.warn(FUNCTION_NAME + "order : " + tmpOrder + "is already exist. ");
                }

                this.controlPlusButtonEnable();

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
                if (state.label != null && state.label.length != 0) {
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
                var $actionPullDown: JQuery = this.$el.find(".action-input[data-state-id=\"" + state.id + "\"]");
                if ($actionPullDown && actions[TARGET_ACTION] && actions[TARGET_ACTION].input) {
                    $actionPullDown.val(actions[TARGET_ACTION].input);
                }
                //一度、ここで、jQueryMoblieのレイアウトをあてる。
                $macroContainer.i18n();
                $macroContainer.find('.custom-select').trigger('create');
               

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

                let tmpInput = this.$el.find(".action-input[data-state-id=\"" + this.model.default + "\"]").val();

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
                        if (!deviceInfo) {
                            try {
                                // HuisFilesに存在しない場合はキャッシュを使用
                                deviceInfo = this.model.state[0].action[order].deviceInfo;
                            } catch (e) {
                                // キャッシュもなかった場合
                                console.warn(FUNCTION_NAME + "deviceInfo not found");
                            }
                        }
                    }


                    let tmpAction: IAction = {
                        input: tmpInput,
                    };


                    if (deviceInfo != null) {
                        //deviceInfo.functionCodeHashがある場合、codeを取
                        //codeを入力
                        let tmpCode = null;

                        tmpAction.deviceInfo = deviceInfo;

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

                //一番最初の信号は、intervalは描画しない。
                let firstOrder: number = 0;
                let firstAction: IAction = actions[0];
                this.renderSignalDetailWithoutInterval(firstOrder, firstAction, $signalContainer);

                for (let i = 1; i < actions.length; i++) {
                    let order = i;
                    let action = actions[i];
                    this.renderSignalDetailWithInterval(order, action, $signalContainer);

                    //最後のorderのとき、並び替えしたボタンを非表示にする。
                    if (i == actions.length - 1) {
                        let sortAreaLastOrder : JQuery = this.$el.find("#sort-button-area-" + i);
                        if (this.isValidJQueryElement(sortAreaLastOrder)) {
                            sortAreaLastOrder.addClass("last-order");
                        }
                    }
                }
                
                this.renderSpecialElementDependingSignalNum();

                this.controlPlusButtonEnable();
            }


            /*
            * 信号が1つしかない場合、signalの要素を削除する。2つ以上あるとき、どっとラインを描画する。
            */
            private renderSpecialElementDependingSignalNum() {
                let FUNCTION_NAME = TAG + "renderSpecialElementDependingSignalNum:";

                let signalLength: number = this.model.state[this.DEFAULT_STATE_ID].action.length;

                //actionが1つしかない場合、削除ボタンと、並び替えボタンと、番号の前のdotを削除。
                if (signalLength <= 1) {
                    //ドットを削除
                    this.$el.find("#order-indicator-dot-0").remove();

                    //削除エリアを削除
                    this.$el.find("#delete-signal-area-0").remove();

                    //並び替えボタンエリアを削除
                    this.$el.find("#sort-button-area-0").remove();                    
                    
                } else {//２つ以上ある場合、dot線を描画。
                    this.renderDotLine();
                }

            }

            /*
            * 信号間を横断するドット線をレンダリングする。
            */
            private renderDotLine() {
                let FUNCTION_NAME = TAG + "renderDotLine()";

                //order0のドットの位置を取得
                let $dotFirstOrder = this.$el.find("#order-indicator-dot-0");
                let firstOrderY: number = null;
                let firstOrderBottom: number = null;
                if (this.isValidJQueryElement($dotFirstOrder)) {
                    firstOrderY = $dotFirstOrder.offset().top;
                    firstOrderBottom = firstOrderY + $dotFirstOrder.outerHeight(true);
                }

                let signalLength: number = this.model.state[this.DEFAULT_STATE_ID].action.length;

                //orderMaxのどったの位置を取得
                let $dotLastOrder = this.$el.find("#order-indicator-dot-" + (signalLength - 1));
                let lastOrderY = null;
                if (this.isValidJQueryElement($dotLastOrder)) {
                    lastOrderY = $dotLastOrder.offset().top;
                }

                //その差分をdot線の長さとする
                if (this.isValidValue(firstOrderY) && this.isValidValue(firstOrderBottom) && this.isValidValue(lastOrderY)) {
                    
                    //templateからdomを読み込み,domを描写
                    let templateDotLine: Tools.JST = Tools.Template.getJST("#template-macro-signal-dot-line", this.templateItemDetailFile_);
                    let $signalsContainer = this.$el.find("#signals-container");
                    $signalsContainer.append($(templateDotLine()));

                    let dotLineLength = lastOrderY - firstOrderY;
                    let $dotLine = this.$el.find(".dot-line");
                    if (this.isValidJQueryElement($dotLine)) {
                        $dotLine.height(dotLineLength);

                        //order0のドットの開始点に合わせる。
                        let dotLineOffsetLeft = $dotLine.offset().left;
                        $dotLine.offset({
                            top: firstOrderBottom,
                            left: dotLineOffsetLeft
                        });
                    }
                }



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


                let zeroPaddingNum = ('0' + (order + 1)).slice(-2);
                let inputDataForRender: any = {
                    order: order,
                    order_plus_one: zeroPaddingNum
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

                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                //設定できるマクロ最大数だった場合、表示すらしない。
                if (this.isValidJQueryElement($signalContainers) && $signalContainers.length >= MAX_NUM_MACRO_SIGNAL) {
                    $target.addClass("gone");
                } else {
                    $target.removeClass("gone");
                }

            }

           

            /*
            * 指定された二つのsignalContainerのinterval, remoteId, functionを入れ替える。
            * @param $signalContainer1{JQuery} 値を交換する信号コンテナのJQuery1
            * @param $signalContainer2{JQuery} 値を交換する信号コンテナのJQuery1
            */
            private exchangeSignalValues($signalContainer1: JQuery, $signalContainer2: JQuery) {
                let FUNCTION_NAME = TAG + "exchangeSignalValues : ";

                if ($signalContainer1 == null) {
                    console.warn(FUNCTION_NAME + "$signalContainer1 is null");
                    return;
                }


                let signalInputs1 = this.getSignalInputs($signalContainer1);
                let signalInputs2 = this.getSignalInputs($signalContainer2);

                //order1にorder2の情報を
                this.setSignalInputsToPullDownOf(signalInputs1.order, signalInputs2);

                //order2に、order1の情報を
                this.setSignalInputsToPullDownOf(signalInputs2.order, signalInputs1);
            }


            /*
            *  $signalContainerを入力して、その中に格納されているプルダウンの値を取得する。
            *  @param $signalContainer{JQuery} プルダウンの値を取得したいコンテナのJQuery
            *  @return {ISignalInputs}プルダウンに入ってる値。
            */
            private getSignalInputs($signalContainer: JQuery): ISignalInputs {
                let FUNCTION_NAME = TAG + "getSignalInputs : ";

                //情報の交換に必要な情報を取得
                let order = this.getOrderFrom($signalContainer);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order1 is invalid");
                    return;
                }

                let signalInputs: ISignalInputs = this.getSignalnput(order);
                if (signalInputs == null) {
                    console.warn(FUNCTION_NAME + "signalInputs is null");
                    return;
                }

                return signalInputs;
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
                    order : order,
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

            /*
            * 設定したOrderのinverfal用PullDownを消す。
            * @param order {number}
            */
            private removeIntervalPullDown(order: number) {
                let FUNCTION_NAME = TAG + "removeIntervalPullDown";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                //対象orderのfunctionPullDown用コンテナの子供を削除する
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                let $targetFunctionPulllDownContainer: JQuery = $targetSignalContainer.find("#signal-interval-container");
                $targetFunctionPulllDownContainer.children().remove();
            }



        }
	}
}