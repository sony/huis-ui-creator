/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyArea] ";

        //信号選択用のプルダウンを表示するための情報
        //TODO:余計な情報もある、必要な情報だけに整理したほうがよい。
        interface ISignalDataForDisplayPullDown {
            order: number; //マクロでの信号の順番
            action?: IAction; //表示するAction
            id: number;    // マクロボタンのStateId
            remotesList?: IRemoteInfo[]; //リモコン選択用プルダウンに表示するためのリスト
            functions?: string[]; //Function選択用プルダウンに表示するためのリスト
        }

        //プルダウンに入力できる情報
        interface ISignalInputs {
            interval: number;
            remoteId: string;
            functionName : string;
        }

        export class PropertyAreaMacroButton extends Backbone.View<Model.ButtonItem> {

            //DOMのプルダウンの値ををベースにModelを更新する。
            //DOMを生成・変更 ＞＞ DOMの値をModelに反映 ＞＞ Modelの内容でDOMを再生成の流れでViewを管理する。

            private templateItemDetailFile_: string;
            private actionsCount: number;
            private availableRemotelist: IRemoteInfo[];
            private defaultState: IGState; // マクロボタンDefaultのstate

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");
                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInMacro();

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
                    "change .state-action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .function-input": "onFunctionPulllDownListChanged",
                    "change select": "onAnyPulllDownChanged",
                    "click #delete-signal-area .delete-signal": "onDeleteButtonClick",
                    "click #sort-button-area .sort-up-btn": "onSortUpButtonClick",
                    "click #sort-button-area .sort-down-btn": "onSortDownButtonClick"
                };
            }

            //並び替え上ボタンが押されたときに呼ばれる
            private onSortUpButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onSortUpButtonClick : ";

                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                //一番上のボタンの場合、無視する
                if (order <= 0) {
                    console.warn(FUNCTION_NAME + "up buttonn of first order signal is ignored");
                    return;
                }


                //sort先（一つ上の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextTopSignalContainer: JQuery = this.getSignalContainerElementOf(order - 1);

                if (this.isValidJQueryElement($nextTopSignalContainer)) {
                    this.exchangeSignalValueSignals($thisOrderSignalContainer, $nextTopSignalContainer);
                    //情報を更新し、再描画
                    this.updateModel();
                    this.renderSignalContainers();
                }

            }

            //並び替え下ボタンが押されたときに呼ばれる
            private onSortDownButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onSortDownButtonClick : ";
                
                //ボタンが所属する信号の順番を取得
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                //一番下のボタンの場合、無視する
                if (order >= this.defaultState.action.length - 1) {
                    console.warn(FUNCTION_NAME + "down buttonn of last order signal is ignored");
                    return;
                }

                //sort先（一つ下の順番）のJqueryを取得.値を入れ替える。
                let $thisOrderSignalContainer: JQuery = this.getSignalContainerElementOf(order);
                let $nextTopSignalContainer: JQuery = this.getSignalContainerElementOf(order + 1);
                if (this.isValidJQueryElement($nextTopSignalContainer)) {
                    this.exchangeSignalValueSignals($thisOrderSignalContainer, $nextTopSignalContainer);
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

                this.deleteSignal(order);

            }

            //プルダウンのいずれかが変更されたときに呼ばれる
            private onAnyPulllDownChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onAnyPulllDownChanged";
                this.controlPlusButtonEnableDisable();
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

            //機能選択用のプルダウンが変更されたときに呼び出される
            private onFunctionPulllDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onFunctionPulllDownListChanged";
                this.updateModel();
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

                let signalData: ISignalDataForDisplayPullDown = {
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

                this.controlPlusButtonEnableDisable();

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
             *保持しているモデルをプルダウンの内容に合わせてアップデートする。
             */
            updateModel() {
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
                    if (order == null) {
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

                //一番最初の信号のinvervalは必ず0に
                if (actionsForUpdate.length > 0) {
                    actionsForUpdate[0].interval = 0;
                }

                //マクロボタンのstateは、デフォルト一つとする。
                this.defaultState.action = actionsForUpdate;
                let states: IGState[] = [];

                states.push(this.defaultState);

                this.model.state = states;
            }

            /*
            * 保持しているモデルの内容でプルダウンを描画する
            */
            renderView(): JQuery {
                let FUNCTION_NAME = TAG + ":renderView : ";


                //マクロの基本情報を付与
                // ボタンの state 情報を付加
                var $macroContainer = this.$el.find("#macro-container");
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
            * シグナル設定用のpulldownたちをすべてレンダリングする。
            */
            private renderSignalContainers() {
                let FUNCTION_NAME = TAG + "renderSignalContainers";

                let actions: IAction[] = this.defaultState.action;

                //最初の１シグナル分は特例で、追加する。
                let $signalContainer = this.$el.find("#signals-container");

                //一度、すべて消す。
                $signalContainer.children().remove();

                let signalData: ISignalDataForDisplayPullDown = {
                    order: 0,
                    action: actions[0],
                    id: this.defaultState.id,
                    remotesList: this.availableRemotelist,
                }
                this.renderSignalDetailWithoutInterval(signalData, $signalContainer);

                for (let i = 1; i < actions.length; i++) {
                    signalData.order = i;
                    signalData.action = actions[i];
                    this.renderSignalDetailWithInterval(signalData, $signalContainer);
                }


                this.controlPlusButtonEnableDisable();
            }
            
            /*
            * 入力されたorderに設定されている信号を削除する
            * @param order{number}: それぞれの信号に設定されている順番
            */
            private deleteSignal(order: number) {
                let FUNCTION_NAME = TAG + "deleteSignal";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
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
            * @param signalData{ISignalData} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithoutInterval(signalData: ISignalDataForDisplayPullDown, $signalContainer: JQuery) {
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


                //リモコンの表示を変更
                //このorderの信号に登録されているremoteIdを取得し、表示
                let action = signalData.action;
                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }

                let remoteId: string = this.getRemoteIdByAction(signalData.action);
                if (remoteId != null) {
                    this.setRemoteIdPullDownOf(signalData.order, remoteId);
                }
               

                //Functions用のプルダウンを描画できるときは描画
                let order = signalData.order;
                let functionName = this.getFunctionNameFromAction(action);
                if (order != null) {
                    this.renderFunctionsOf(order, functionName);
                }

                //言語対応
                $signalContainer.i18n();
                $signalContainer.trigger('create');
            }

            /*
            * アクションに設定されているFunctionNameを取得する
            * @param action{IAction} : functionNameを抽出するAction
            * @return {string} : functionName, 見つからない場合、 nullを返す。
            */
            private getFunctionNameFromAction(action: IAction): string {
                let FUNCTION_NAME = TAG + "getFunctionNameFromAction : ";

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return null;
                }

                let result: string = null;

                if (action.code != null) {
                    //TODO:学習の場合care,hashMapがないので、ここでエラーになる。
                    result = action.code_db.function;
                } else if (action.bluetooth_data != null) {
                    result = action.bluetooth_data.bluetooth_data_content;
                } else if (action.code_db != null) {
                    result = action.code_db.function;
                } else {
                    //functionが取得できない
                }

                return result;
            }


            /*
            * インターバルつきの一回文のシグナルのJQueryを取得する。
            * @param signalData{ISignalData} 表示する内容のアクション
            * @param $signalContainer{JQuery} 描画する先のJQuery
            * @return {JQuery}appendして描画するためのJQuery
            */
            private renderSignalDetailWithInterval(signalData: ISignalDataForDisplayPullDown, $signalContainer: JQuery) {
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

                //intervalを描写
                this.renderIntervalOf(signalData.order, signalData.action.interval);
                

            }


            /*
            * 指定したorderのIntervalをレンダリングする。
            * @param order{number} マクロ信号の順番
            * @param inputInterval?{number} プルダウンに代入する値 
            */
            private renderIntervalOf(order: number, inputInterval ?: number) {
                let FUNCTION_NAME = TAG + "renderIntervalOf : ";
                
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
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

                let templateInterval: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal-interval", this.templateItemDetailFile_);
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
            * 入力したorderのFunctionsを描画する。
            * @param order{number} 描写するfunctionsプルダウンがどの順番の信号に属しているか
            * @param functionName{string} 描写するfunctionsプルダウンに設定する値。
            */
            private renderFunctionsOf(order : number, functionName? : string) {
                let FUNCTION_NAME = TAG + "renderFunctionsOf : ";
                
                if (order == null) {
                    console.warn("order is null");
                    return;
                }

                //すでに、function選択用PullDownがある場合、削除する。
                this.removeFunctionPullDown(order);

                //targetとなるJQueryを取得
                let $target: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return;
                }

                //FunctionプルダウンのDOMを表示。
                let functions: string[] = this.getFunctionsOf(order);
                if (functions != null) {
                    //インターバル用のテンプレートを読み込み
                    let $functionlContainer = $target.find("#signal-function-container");
                    let templateFunctions: Tools.JST = Tools.Template.getJST("#template-property-macro-button-signal-functions", this.templateItemDetailFile_);

                    let inputSignalData: ISignalDataForDisplayPullDown = {
                        functions: functions,
                        id: this.defaultState.id,
                        order: order
                    }
                    let $functionsDetail = $(templateFunctions(inputSignalData));
                    $functionlContainer.append($functionsDetail);

                    //inputにmodelがある場合、値を表示
                    if (functionName != null) {
                        this.setFunctionNamePullDownOf(order,functionName);
                    }

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

                let result: number = parseInt(JQUtils.data($target, "signalOrder"), 10);

                if (result != null) {
                    return result;
                } else {
                    return undefined;
                }
            }

            /*
            * 入力したorderの信号に登録されているremoteIdをpulldownから取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : remoeIdを取得したい信号の順番
            * @{string} remoteId
            */
            private getRemoteIdFromPullDownOf(order: number): string {
                let FUNCTION_NAME = TAG + "getRemoteIdOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let remoteId: string = null;
                let $remotePullDown = $signalContainerElement.find(".remote-input[data-signal-order=\"" + order + "\"]");
                if ($remotePullDown == null || $remotePullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$remotePullDown is invalid");
                    return;
                }
                remoteId = $remotePullDown.val();

                //"none"も見つからない扱いとする。
                if (!this.isValidValue(remoteId)) {
                    return undefined;
                }

                return remoteId;

            }

            /*
            * 入力したorderの信号に登録されているinvervalをpulldownから取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : numberを取得したい信号の順番
            * @{number} inverval
            */
            private getInvervalFromPullDownOf(order: number): number {
                let FUNCTION_NAME = TAG + "getInvervalPullDownOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
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
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
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
             * 入力したorderのfunctionsプルダウンに、inputの値を代入する。
             * order{number} ： マクロ信号の順番
             * inputFunctionNameId{string} : プルダウンに設定する値。
             */
            private setFunctionNamePullDownOf(order: number, inputFunctionName: string) {
                let FUNCTION_NAME = TAG + "setFunctionNamePullDownOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (inputFunctionName == null) {
                    console.warn(FUNCTION_NAME + "setFunctionNamePullDownOf is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $functionNamePullDown = $signalContainerElement.find(".function-input[data-signal-order=\"" + order + "\"]");
                if ($functionNamePullDown == null || $functionNamePullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$functionNamePullDown is invalid");
                    return;
                }

                $functionNamePullDown.val(inputFunctionName);
            }


            /*
             * 入力したorderのremoteプルダウンに、inputの値を代入する。
             * order{number} ： マクロ信号の順番
             * inputRemoteId{string} : プルダウンに設定する値。
             */
            private setRemoteIdPullDownOf(order: number, inputRemoteId: string) {
                let FUNCTION_NAME = TAG + "setIntervalPullDownOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (inputRemoteId == null) {
                    console.warn(FUNCTION_NAME + "inputRemoteId is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $remoteIdPullDown = $signalContainerElement.find(".remote-input[data-signal-order=\"" + order + "\"]");
                if ($remoteIdPullDown == null || $remoteIdPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$remoteIdPullDown is invalid");
                    return;
                }

                $remoteIdPullDown.val(inputRemoteId);

            }


            /*
            * 入力したorderの信号に登録されているfunctionをpulldownから取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : functionを取得したい信号の順番
            * @{string} functionName
            */
            private getFunctionFromlPullDownOf(order: number): string {
                let FUNCTION_NAME = TAG + "getFunctionFromlPullDownOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let functionName : string = null;
                let $functionPullDown = $signalContainerElement.find(".function-input[data-signal-order=\"" + order + "\"]");
                if ($functionPullDown == null || $functionPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$functionPullDown is invalid");
                    return;
                }

                functionName = $functionPullDown.val();

                if (!this.isValidValue(functionName)) {
                    return undefined;
                }

                return functionName;
            }


            /*
            * 入力したorderのリモコンが持てる信号のリストFunctionsを返す。
            * @param order {number} 信号リストを取得したい、マクロ信号の順番
            * @return {string[]} 見つからなかった場合、undefinedを返す。
            */
            private getFunctionsOf(order: number) {
                let FUNCTION_NAME = TAG + "getRemoteIdOf";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                }

                let remoteId: string = this.getRemoteIdFromPullDownOf(order);
                if (remoteId == null) {
                    return;
                }

                //TODO：huisFilesで取得できない場合の処理(すでに削除されているなど)
                //キャッシュで対応する。
                return huisFiles.getMasterFunctions(remoteId);
            }

            /*
             * actionから、remoteIdを取得する
             * @param action {IAction} : remoteIdを取得する情報源となるaction
             * @return {string} : remoteId 見つからない場合、undefinedを返す。
             */
            private getRemoteIdByAction(action: IAction): string {
                let FUNCTION_NAME = TAG + "getRemoteIdByAction";
                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }
                let remoteId: string = undefined;

                if (action != null) {
                    let code = action.code;
                    if (code != null) {
                        remoteId = huisFiles.getRemoteIdByCode(code);
                    }

                    if (remoteId == null) {
                        //codeでは取得できない場合、brand,
                        let codeDb = action.code_db;
                        if (codeDb != null) {
                            let brand = codeDb.brand;
                            let deviceType = codeDb.device_type;
                            let modelNumber = codeDb.model_number

                            remoteId = huisFiles.getRemoteIdByCodeDbElements(brand, deviceType, modelNumber);
                        }
                    }
                }

                return remoteId;

            }


            /*
            * 設定したOrderのfunction用PullDownを消す。
            * @param order {number}
            */
            private removeFunctionPullDown(order: number) {
                let FUNCTION_NAME = TAG + "removeFunctionPullDown";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                //対象orderのfunctionPullDown用コンテナの子供を削除する
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                let $targetFunctionPulllDownContainer: JQuery = $targetSignalContainer.find("#signal-function-container");
                $targetFunctionPulllDownContainer.children().remove();
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

            // 不正な値の場合、falseを返す。
            // 有効な場合、trueを返す。
            private isValidValue(value): boolean {
                let FUNCTION_NAME = TAG + "isInvalidPullDownValue";
                
                if (value == null) {
                    return false;
                } else if (value == "none") {
                    return false;
                } else if (value === "") {
                    return false;
                } else if (this.isNaN(value)) {
                    return false;
                }else {
                    return true;
                }
            }

            //NaNか判定 Number.isNaNが使えないので代用
            private isNaN(v) {
                return v !== v;
            }

             /*
            * JQuery要素が有効か判定する
            * @param $target{JQuery}判定対象
            * @return {boolean} 有効な場合、true
            */
            private isValidJQueryElement($target: JQuery): boolean{
                if ($target.length == 0 || $target == null) {
                    return false;
                } else {
                    return true;
                }
            }


            // +ボタンのenable disableを判定・コントロールする。
            private controlPlusButtonEnableDisable() {
                let FUNCTINO_NAME = TAG + "controlPlusButtonEnableDisable";
                let $target = this.$el.find("#add-signal-btn");

                //すべてのpullDownがうまっているとき、+をenableに、それ以外はdisable
                if (this.isAllSignalPullDownSelected()) {
                    $target.removeClass("disabled");
                } else {
                    $target.addClass("disabled");
                }

                //設定できるマクロ最大数だった場合もdisable
                if (this.defaultState.action.length >= MAX_NUM_MACRO_SIGNAL) {
                    $target.removeClass("disabled");
                }

            }

            /*
             * 入力してorderの$signal-container-elementを返す。
             * @param order{number} 入手したい$signal-container-elementの順番
             * @return {JQuery} $signal-container-element
             */ 
            private getSignalContainerElementOf(order: number) :JQuery{
                let FUNCTION_NAME= TAG + "getSignalContainerElementOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }
                return this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
            }

            /*
            * 指定された二つのsignalContainerのinterval, remoteId, functionを入れ替える。
            * @param $signalContainer1{JQuery} 値を交換する信号コンテナのJQuery1
            * @param $signalContainer2{JQuery} 値を交換する信号コンテナのJQuery1
            */
            private exchangeSignalValueSignals($signalContainer1: JQuery, $signalContainer2: JQuery) {
                let FUNCTIONNAME = TAG + "exchangeSignalValueSignals : ";
                if ($signalContainer1 == null) {
                    console.warn(FUNCTIONNAME + "$signalContainer1 is null");
                    return;
                }

                if ($signalContainer2 == null) {
                    console.warn(FUNCTIONNAME + "$signalContainer2 is null");
                    return;
                }

                //情報の交換に必要な情報を取得
                let order1 = this.getOrderFrom($signalContainer1);
                if (order1 == null) {
                    console.warn(FUNCTIONNAME + "order1 is null");
                    return;
                }
                let signalInputs1 : ISignalInputs = this.getSignalnput(order1);
                if (signalInputs1 == null) {
                    console.warn(FUNCTIONNAME + "signalInputs1 is null");
                    return;
                }

                let order2 = this.getOrderFrom($signalContainer2);
                if (order2 == null) {
                    console.warn(FUNCTIONNAME + "order2 is null");
                    return;
                }
                let signalInputs2: ISignalInputs = this.getSignalnput(order2);
                if (signalInputs2 == null) {
                    console.warn(FUNCTIONNAME + "signalInputs2 is null");
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
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
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

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (signalInputs == null) {
                    console.warn(FUNCTION_NAME + "signalInputs is null");
                    return;
                }

                this.renderIntervalOf(order, signalInputs.interval);

                this.setRemoteIdPullDownOf(order, signalInputs.remoteId);

                //Function選択用のPullダウンを更新。
                this.renderFunctionsOf(order, signalInputs.functionName);

            }

           

        }
	}
}