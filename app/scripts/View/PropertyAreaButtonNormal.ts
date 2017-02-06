/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

        var TAG = "[Garage.View.PropertyAreaNormal] ";


        //アクションpulldownの選択肢をコントロールするためにつかうModelクラス。
        //すでに登録されているアクションは、pulldownに表示できないようにするため
        //すでに登録されているアクションを記憶する。
        class ActionSelecctor {
            private all: IStringKeyValue[];
            private array: IStringKeyValue[];
            private TAG = "[ActionSelecctor]";

            constructor(inputActionKeys: string[]) {
                this.array = [];
                this.all = $.extend(true,[],ACTION_INPUTS);
                for (let i = 0; i < inputActionKeys.length; i++){
                    for (let j = 0; j < this.all.length; j++){
                        if (this.all[j].value == inputActionKeys[i]) {
                            this.array.push({ key: this.all[j].key, value: this.all[j].value });
                        }
                    }
                }
            }

            get(): IStringKeyValue[]{
                return this.array;
            }

            deleteByValue(inputValue: string) {
                let FUNCTION_NAME = TAG + "deleteByValue : ";
                if (inputValue == null) {
                    console.warn(FUNCTION_NAME + "inputValue is null");
                    return;
                }
                let result = this.array.filter((value, index: number) => {
                    return value.value != inputValue;
                });
                this.array = result;
            }

            deleteByKey(inputKey: string) {
                let FUNCTION_NAME = TAG + "deleteByKey : ";
                if (inputKey == null) {
                    console.warn(FUNCTION_NAME + "inputKey is null");
                    return;
                }
                let result = this.array.filter((value , index: number) => {
                    return value.key != inputKey;
                });
                this.array = result;
            }

            push(input: IStringKeyValue) {
                this.array.push(input);
            }

            /*
            * 現在保持しているactionInput配列が入ってない ACTION_INPUTSを返す。
            */
            getNotSelected(): IStringKeyValue[] {
                let tmpResult: IStringKeyValue[] = $.extend(true, [], this.all);
                for (let i = 0; i < this.array.length; i++) {
                    tmpResult = tmpResult.filter((value, index: number) => {
                        return value.value != this.array[i].value;
                    });
                }
                return tmpResult;
            }


        }


        export class PropertyAreaButtonNormal extends PropertyAreaButtonBase {

            private assignedInputActions: string[];

         
            /**
             * constructor
             */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.assignedInputActions = [];
                
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            events() {
                // Please add events
                return {
                    "click #add-signal-btn": "onPlusBtnClick",
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .function-input": "onFunctionPulllDownListChanged",
                    "click .delete-signal": "onDeleteButtonClick",
                    "change select": "onAnyPulllDownChanged",
                    "mouseenter .signal-container-element": "onHoverInSignalContainer",
                    "mouseleave .signal-container-element": "onHoverOutSignalContainer"
                };
            }

            //プルダウンのいずれかが変更されたときに呼ばれる
            private onAnyPulllDownChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onAnyPulllDownChanged";
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

            //+ボタンがクリックされた場合に呼び出される
            private onPlusBtnClick(event: Event) {
                let FUNCTION_NAME = TAG + "onPlusBtnClick : ";

                let $target = $(event.currentTarget);
                if ($target.hasClass("disabled")) {
                    return;
                }
              
                let order = this.model.state[this.DEFAULT_STATE_ID].action.length;

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let stateId = this.getStateIdFrom($target);
              
                //すでに、同じorderのDOMがない場合には追加
                let $newSignalContainerElement = this.getSignalContainerElementOf(order);
                if ($newSignalContainerElement.length == 0) {
                    this.renderSignalContainerMin(order, stateId);
                    //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する

                    //一個と同じ remoteIdを入力
                    let prevOrder = order - 1;
                    if (this.isValidOrder(prevOrder)) {
                        let prevRemoteId = this.getRemoteIdFromPullDownOf(prevOrder);

                        if (this.isValidValue(prevRemoteId)) {
                            this.renderRemoteIdOf(order, this.DEFAULT_STATE_ID,prevRemoteId);
                            this.renderFunctionsOf(order);
                        }
                    }

                  
                    this.updateModel(this.DEFAULT_STATE_ID);
                    this.controlPlusButtonEnable();
                    this.$el.i18n();
                    $('.custom-select').trigger('create');

                    //削除をちら見する。
                    this.animateAddButton(order, DURATION_ANIMATION_ADD_SIGNAL_CONTAINER, () => {
                        this.renderSignals(this.DEFAULT_STATE_ID);
                    });
                } else {
                    console.warn(FUNCTION_NAME + "order : " + order + "is already exist. ");
                }

                
                
            }

            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";

                let $target = $(event.currentTarget);
                if (!this.isValidJQueryElement($target)) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                this.updateModel(this.DEFAULT_STATE_ID);
                this.renderSignals(this.DEFAULT_STATE_ID);

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

                if ($("#select-remote-input-0 option").val().match(/[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+/)
                    || $("#select-remote-input-0 option").val().match(UNKNOWN_REMOTE)) {
                    $('#select-remote-input-0-menu li:first-child').remove();
                }

                // プルダウンに設定されている Actionの順番を取得
                let order = this.getOrderFrom($target);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //Function選択用のPullダウンにFunctionを設定する。
                this.renderFunctionsOf(order, this.DEFAULT_STATE_ID);
                this.updateModel(this.DEFAULT_STATE_ID);

                //jQueryのスタイルをあてる。
                let $targetSignalContainer = this.getSignalContainerElementOf(order);
                $targetSignalContainer.i18n();
                $targetSignalContainer.find('.custom-select').trigger('create');

                //noneのoptionをもっていたとき,noneの選択肢を消す。
                if ($target.find(".default-value").length != 0) {
                    this.renderSignals(this.DEFAULT_STATE_ID);
                }
            }

            //機能選択用のプルダウンが変更されたときに呼び出される
            private onFunctionPulllDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onFunctionPulllDownListChanged";
                this.updateModel(this.DEFAULT_STATE_ID);

                let $target = $(event.currentTarget);
                //noneのoptionをもっていたとき,noneの選択肢を消す。
                if ($target.find(".default-value").length != 0) {
                    this.renderSignals(this.DEFAULT_STATE_ID);
                }
            }




            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            * 保持しているモデルうち、指定したRemoteIdの内容でプルダウンを描画する
            */
            renderViewState(stateId : number): JQuery {
                let FUNCTION_NAME = TAG + "renderViewState";

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }


                if (this.model.isAirconButton() ||
                    this.isIncludeSpecificActionType(this.model, ACTION_INPUT_SWIPE_UP_VALUE) ||
                    this.isIncludeSpecificActionType(this.model, ACTION_INPUT_SWIPE_RIGHT_VALUE) ||
                    this.isIncludeSpecificActionType(this.model, ACTION_INPUT_SWIPE_LEFT_VALUE) ||
                    this.isIncludeSpecificActionType(this.model, ACTION_INPUT_SWIPE_DOWN_VALUE)
                ) {
                    //スワイプ系のアクションを含むモジュールの場合、プルダウンを描画しない。
                    //エアコンの場合、プルダウンを描画しない

                    //＋ボタンも表示しない
                    this.$el.find(".add-btn-container").remove();

                    return this.$el;
                } else {
                    this.updateAssiendInputActionsFromModel(stateId);
                    return this.renderSignals(stateId);
                }
                
            }

            



            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            private updateModel(stateId: number) {
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

                    if (!this.isValidOrder(order)) {
                        console.warn(FUNCTION_NAME + "order is invalid");
                        continue;
                    }

                    let tmpInput = this.getInputAction(order);
                    if (!this.isValidValue(tmpInput)) {
                        tmpInput = null;
                    }

                    //remoteIdを仮取得
                    let tmpRemoteId: string = this.getRemoteIdFromPullDownOf(order);
                    if (!this.isValidValue(tmpRemoteId) || tmpRemoteId.indexOf(UNKNOWN_REMOTE) == 0) {
                        tmpRemoteId = null;
                    }

                    //functionを仮取得
                    let tmpFunction: string = this.getFunctionFromlPullDownOf(order);
                    if (!this.isValidValue(tmpFunction)) {
                        tmpFunction = null;
                    }

                    let tmpDeviceInfo = huisFiles.getDeviceInfo(tmpRemoteId);
                   
                    if (!tmpDeviceInfo) {
                        try {
                            // HuisFilesに存在しない場合はキャッシュを使用
                            tmpDeviceInfo = this.getDeviceInfoByRemoteId(tmpRemoteId);
                        } catch (e) {
                            // キャッシュもなかった場合
                            console.warn(FUNCTION_NAME + "deviceInfo not found");
                        }
                    }



                    //deviceInfoを値渡しにすると、前後のorderに値が参照されてしまう。
                    let deviceInfo: IButtonDeviceInfo = this.cloneDeviceInfo(tmpDeviceInfo);


                    let tmpAction: IAction = {
                        input: tmpInput,
                    };


                    if (deviceInfo) {
                        //deviceInfo.functionCodeHashがある場合、codeを取
                        //codeを入力
                        let tmpCode = null;

                        tmpAction.deviceInfo = deviceInfo;

                        if (deviceInfo.functionCodeHash) {
                            tmpCode = deviceInfo.functionCodeHash[tmpFunction];
                            if (!this.isValidValue(tmpCode) &&
                                (this.isRelearnedFunctionName(tmpFunction) ||
                                this.isRelearnedIDFunctionName(tmpFunction))) {
                                //functionCodeHashではcodeがみつからず
                                //functionNameに #IDがついていた場合、
                                //functionNameに##がついていた場合、再学習なのでmodelからcodeを検索
                                tmpCode = this.getCodeFromThisModel(tmpFunction);
                            }
                            
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
                        if (deviceInfo.bluetooth_data != null) {
                            tmpBluetoothData = deviceInfo.bluetooth_data;
                        }
                        if (tmpBluetoothData != null) {
                            tmpBluetoothData.bluetooth_data_content = tmpFunction;
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

                let tmpState = this.model.state[stateId];

                let newState: IGState = {
                    id: tmpState.id,
                    image: (tmpState && tmpState.image) ? tmpState.image : undefined,
                    label: (tmpState && tmpState.label) ? tmpState.label : undefined,
                    action: actionsForUpdate && 0 < actionsForUpdate.length ? actionsForUpdate : undefined,
                    translate: tmpState.translate && 0 < tmpState.translate.length ? tmpState.translate : undefined
                };

                let states: IGState[] = [];
                //全stateを更新。
                for (let i = 0; i < this.model.state.length; i++) {
                    if (i == stateId) {
                        states.push(newState);
                    } else {
                        states.push(this.model.state[i]);
                    }
                }



                this.model.state = states;

                //更新後の値で、+ボタンの有効・無効判定を行う。
                this.controlPlusButtonEnable();
                this.updateAssiendInputActionsFromModel(stateId);
                this.trigger("updateModel");


            }

            /*
            * 現在のモデルから、入力したファンクション名のcodeを検索。容易につかわないこと
            * @param functionName {string} ファンクション名の後ろにIDがついているに限り、現在のmodelからコードを検索する。
            * @return {string} モデルの中に同じファンクション名の信号があったら、codeを取得する。みつからない場合nullを返す。
            */
            private getCodeFromThisModel(functionNameWithID: string): string {
                let FUNCTION_NAME: string = TAG + "getSgetCodeFromThisModeltateId : ";

                if (!this.isValidValue(functionNameWithID)) {
                    console.warn(FUNCTION_NAME + "functionNameWithID is invalid");
                    return;
                }

                for (let targetState of this.model.state) {

                    if (targetState.action != null) {
                        for (let targetAction of targetState.action) {
                            if (targetAction.code_db !== null &&
                                targetAction.code_db.function != null &&
                                targetAction.code_db.function == functionNameWithID &&
                                targetAction.code != null
                            ) {
                                return targetAction.code;
                            }
                        }

                    }
                }

                return null;

            }


            /*
            * 現在、表示されているStateIdを取得する
            */
            private getStateId(): number {
                let FUNCTION_NAME: string = TAG + "getStateId : ";

                //+ボタンをstateIdを取得できるソースととる
                let $sorce = this.$el.find("#add-signal-btn");

                if (!this.isValidJQueryElement($sorce)) {
                    console.warn(FUNCTION_NAME + "$source is invalid");
                }

                return parseInt(JQUtils.data($sorce, "stateId"), 10);
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

                //アニメーション
                this.animateDeleteSignalContainer(order, DURATION_ANIMATION_DELTE_SIGNAL_CONTAINER,
                    () => {
                        let $target = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                        $target.remove();

                        let targetStateId = this.getStateId();

                        //消えた後のプルダウンの値に合わせてアップデート
                        this.updateModel(targetStateId);

                        //アップデートされたモデルに合わせてプルダウン部をレンダリング
                        this.renderSignals(targetStateId);

                    });

            }

            private _getRemoteIdOfUnknownRemote(action: IAction) {
                let deviceType = action.code_db.device_type;
                let remoteId: string;
                switch (deviceType) {
                    case DEVICE_TYPE_TV:
                        remoteId = UNKNOWN_REMOTE_TV;
                        break;
                    case DEVICE_TYPE_AC:
                        remoteId = UNKNOWN_REMOTE_AC;
                        break;
                    case DEVICE_TYPE_LIGHT:
                        remoteId = UNKNOWN_REMOTE_LIGHT;
                        break;
                    case DEVICE_TYPE_AUDIO:
                        remoteId = UNKNOWN_REMOTE_AUDIO;
                        break;
                    case DEVICE_TYPE_PLAYER:
                        remoteId = UNKNOWN_REMOTE_PLAYER;
                        break;
                    case DEVICE_TYPE_RECORDER:
                        remoteId = UNKNOWN_REMOTE_RECORDER;
                        break;
                    case DEVICE_TYPE_PROJECTOR:
                        remoteId = UNKNOWN_REMOTE_PROJECTOR;
                        break;
                    case DEVICE_TYPE_STB:
                        remoteId = UNKNOWN_REMOTE_STB;
                        break;
                    case DEVICE_TYPE_FAN:
                        remoteId = UNKNOWN_REMOTE_FAN;
                        break;
                    default:
                        if (action.bluetooth_data != null) {
                            remoteId = UNKNOWN_REMOTE_BT;
                        } else {
                            remoteId = UNKNOWN_REMOTE;
                        }
                        break;
                }
                return remoteId;
            }

            /*
            * 信号プルダウンメニューたちをレンダリングする
            * @param stateId{number} ターゲットとなるstateId
            * @param $signalsContainer{JQuery} ベースとなるJQuery要素
            */
            private renderSignals(stateId: number){
                let FUNCTION_NAME: string = TAG + "renderSignals : ";

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }

                let actions: IAction[] = this.model.state[stateId].action;

                if (actions == null || actions.length == 0) {
                    console.warn(FUNCTION_NAME + "actions is invalid");
                    return;
                }

                //一度、全部削除する
                this.$el.find("#signals-container").children().remove();

                for (let i = 0; i < actions.length; i++) {
                    let targetAction = actions[i];
                    if (targetAction == null) {
                        continue;
                    }

                    let actionInput: string = targetAction.input;
                    let remoteId = huisFiles.getRemoteIdByAction(targetAction);
                    let functionName = this.getFunctionNameFromAction(targetAction);

                    //remoteIDがみつからない場合、
                    //あるいは、remoteIdがキャッシュよりみつかるが、リモコン名がない場合
                    //UNKNOWNに
                    if (
                        (!this.isValidValue(remoteId) && targetAction.code_db != null) ||
                        (targetAction.deviceInfo != null && targetAction.deviceInfo.remoteName == null) && (this.isValidValue(remoteId)) ) {
                        remoteId = this._getRemoteIdOfUnknownRemote(targetAction);
                    }
                    this.renderSignalContainerMin(i, stateId, actionInput, remoteId);

                    //function設定用pulldownをレンダリング
                    this.renderFunctionsOf(i, stateId, functionName);
                }

                
                this.controlPlusButtonEnable();

                

                this.$el.i18n();
                this.$el.find('.custom-select').trigger('create');

                //レイアウト崩れ防止のため、trigger('create');の後に呼ぶ。
                this.renderSpecialElementDependingSignalNum();

                return this.$el;

            }

            /*
           * 信号が1つしかない場合、signalの要素を削除する
           */
            private renderSomeElementIfOneSignalOnlyExist() {
                let FUNCTION_NAME = TAG + "renderSomeElementIfOneSignalOnlyExist:";

                let signalLength: number = this.model.state[this.DEFAULT_STATE_ID].action.length;

                //actionが1つしかない場合、削除ボタンと、並び替えボタンと、番号の前のdotを削除。
                if (signalLength <= 1) {
                    //削除エリアを削除
                    this.$el.find("#sort-button-area-0").remove();
                }
            }

            /*
            * 信号のベースと必須のアクション選択プルダウン分をレンダリングする
            * @param order{number}
            * @param stateId{number}
            * @param $signalContainer{JQuery} 信号をレンダリングするベースとなりJQuery要素
            * @param inputAction{string}
            * @param remoteId?{string}
            */
            private renderSignalContainerMin(order: number, stateId: number, inputAction? : string, remoteId?:string) {
                let FUNCTION_NAME: string = TAG + "renderSignalContainer";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;;
                }

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }


                let $signalsContainer: JQuery = this.$el.find("#signals-container");

                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is invalid");
                    return;
                }

                this.renderSignalContainerBase(order);
                //action設定用のpulldownをレンダリング
                this.renderActionPulllDownOf(order, stateId, inputAction);
                //remoteId設定用のpulldownをレンダリング
                this.renderRemoteIdOf(order, stateId, remoteId);
            }

            /*
            *  信号を描画するベースとなる部分をレンダリングする。
            *  @param order{number}
            *  @param $signalContainer{JQuery} 信号をレンダリングするベースとなりJQuery要素
            */
            private renderSignalContainerBase(order: number) {
                let FUNCTION_NAME = TAG + "renderSignalContainerBase : ";

                let $signalsContainer: JQuery = this.$el.find("#signals-container");
                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is invalid");
                    return;
                }

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;;
                }

                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is null");
                    return;
                }

                //SignalContainerのベースをレンダリング
                let templateSignal = Tools.Template.getJST("#template-property-button-signal-normal", this.templateItemDetailFile_);

                let inputData = {
                    order: order,
                    order_plus_one:order+1
                };

                let $signalDetail = $(templateSignal(inputData));
                $signalsContainer.append($signalDetail);

                $signalsContainer.i18n();

            }

            /*
            * アクション設定用のpullldownMenuをレンダリングする
            * @param order{number} 上から何番目の信号か
            * @param stateid{number} 
            * @param inputAction? {string} プルダウンの初期値 
            */
            private renderActionPulllDownOf(order: number,stateId:number, inputAction? : string) {
                let FUNCTION_NAME: string = TAG + "renderActionPulllDownOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;;
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

                //ActionプルダウンのDOMを表示。
                let $actionContainer = $target.find("#signal-action-container");
                let templateAction: Tools.JST = Tools.Template.getJST("#template-property-button-signal-action", this.templateItemDetailFile_);

                //すでに入力されているinputは、表示しない。
                let actionSelector: ActionSelecctor = new ActionSelecctor(this.assignedInputActions);
                actionSelector.deleteByValue(inputAction);
                let displayActionInputs: IStringKeyValue[] = actionSelector.getNotSelected();

                let inputData = {
                    id: stateId,
                    order: order,
                    remotesList: this.availableRemotelist,
                    actionList: displayActionInputs
                }

                let $actionDetail = $(templateAction(inputData));
                $actionContainer.append($actionDetail);

                //inputActionを入力していた場合、値を表示
                if (this.isValidValue(inputAction)) {
                    this.setInputAction(order, stateId, inputAction);
                } else {
                    //値が入力されていない場合、初期状態を描画
                    let noneOption: Tools.JST = Tools.Template.getJST("#template-property-button-signal-action-none-option", this.templateItemDetailFile_);
                    $actionContainer.find("select").prepend(noneOption);
                    this.setInputAction(order, stateId, "none");
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

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;;
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

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;;
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

                if (inputType != null) {
                    $actionPullDown.val(inputType);
                }

                

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

                    //action
                    let $actionPulllDown = $target.find("select.action-input");
                    if ($actionPulllDown.length != 0) {
                        let value = $actionPulllDown.val();
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

                //設定できるアクションの最大数だった場合、表示すらしない。
                if (this.isValidJQueryElement($signalContainers) &&  $signalContainers.length >= Object.keys(ACTION_INPUTS).length) {
                    $target.addClass("gone");
                } else {
                    $target.removeClass("gone");
                }

            }

            /*
            * 現在、入力されているinputActionを更新する
            * this.assignedInputActionsを更新する。
            * 描画より前に必要なため、Modelから取得する
            */
            private updateAssiendInputActionsFromModel(stateId : number) {
                let FUNCTION_NAME = TAG + "updateAssiendInputActions : ";

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }

                //初期化
                this.assignedInputActions = [];

                //現状表示されている 各信号のJquery値を取得
                let targetActions = this.model.state[stateId].action;

                if (targetActions == null || targetActions.length ==0) {
                    return;
                }

                for (let i = 0; i<targetActions.length; i++){
                    this.assignedInputActions.push(targetActions[i].input);
                }

            }


            /*
           * 信号が1つしかない場合、signalのある要素を削除する
           */
            private renderSpecialElementDependingSignalNum() {
                let FUNCTION_NAME = TAG + "renderSpecialElementDependingSignalNum:";

                let signalLength: number = this.model.state[this.DEFAULT_STATE_ID].action.length;

                //actionが1つしかない場合、削除ボタンtを削除。
                if (signalLength <= 1) {

                    //削除エリアを削除
                    this.$el.find("#delete-signal-area-0").remove();
                }

            }



        }
    }
}