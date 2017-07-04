/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/// <reference path="../../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

        var TAG = "[Garage.View.PropertyArea.Button.ButtonPropertyArea] ";

        namespace ConstValue {
            export const DEFAULT_TEXT = "TEXT BUTTON";
            export const DEFAULT_TEXT_SIZE = 30;
            export const BUTTON_FONT_WEIGHT = "bold";

            //action pulldown
            export const TEMPLATE_ACTION_PULLDOWN = "#template-non-order-action-pulldown";
            export const ACTION_PULLDOWN_DOM_ID = "#action-pulldown";
            export const ACTION_PULLDOWN_DOM_CLASS = ".action-input";
            export const JQUERY_STRING_TARGET_STATE_ID_OPEN = "[data-state-id=\"";
            export const JQUERY_STRING_TARGET_STATE_ID_CLOSE = "\"]";
        }

        export abstract class ButtonPropertyArea extends PropertyArea {

            //DOMのプルダウンの値ををベースにModelを更新する。
            //DOMを生成・変更 ＞＞ DOMの値をModelに反映 ＞＞ Modelの内容でDOMを再生成の流れでViewを管理する。
            protected availableRemotelist: IRemoteInfo[];

            // TODO: replace with Model.Face
            /**
             * 編集中リモコンのremote_id
             */
            protected remoteId: string;

            /**
             * 編集中リモコン名
             */
            protected faceName: string;

            /**
             * 編集中リモコンのmodules
             */
            protected modules: Model.Module[];

            constructor(button: Model.ButtonItem, editingRemoteId: string, templateDomId: string, commandManager: CommandManager) {
                super(button, templateDomId, commandManager);
                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInMacro();
                this.previewWindow_ = new StatePreviewWindow(button, button.getDefaultStateId(), editingRemoteId);
                this._setDeviceInfo();

                //labelPreviewWindowsが持つ、previewのUIが変更された用のイベントをバインド
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Label.UI_CHANGE_SIZE, this._onTextSizePulldownChanged);
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Label.UI_CHANGE_TEXT, this._onTextFieldChanged);

                this.listenTo(this.previewWindow_, PropertyAreaEvents.Button.UI_CHANGE_EDIT_TEXT_BUTTON, this._onChangeToTextBtn);
                this.listenTo(this.previewWindow_, PropertyAreaEvents.Button.UI_CHANGE_EDIT_IMAGE_BUTTON, this._onChangeToImageBtn);
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            private _onChangeToImageBtn(event: Event) {
                let changedImageFilePath = (<StatePreviewWindow>this.previewWindow_).getTmpImagePath();
                let changedImageFileName = path.basename(changedImageFilePath);
                let changedImageFileRelativePath = path.join(
                    (<StatePreviewWindow>this.previewWindow_).getNotDefaultImageDirRelativePath(),
                    changedImageFileName).replace(/\\/g, "/");

                let targetStates: Model.ButtonState[] = this.getModel().cloneStates();
                let targetState: Model.ButtonState = targetStates[this.getModel().getDefaultStateIndex()];

                this._initLabelAndImage(targetState);
                this._setDefaultImageToState(targetState, changedImageFileRelativePath);

                this._setStateMementoCommand(targetStates);
            }

            private _setDefaultImageToState(state: Model.ButtonState, path: string) {
                let buttonArea = this.getModel().area;
                let defaultImageArea: IArea = {
                    x: 0,
                    y: 0,
                    w: buttonArea.w,
                    h: buttonArea.h
                }
                let defaultImage = new Model.ImageItem({
                    area: defaultImageArea,
                    path: path
                }, this.getModel().remoteId);
                state.setDefaultImage(defaultImage);
            }

            private _onTextSizePulldownChanged(event: Event) {
                let changedSize = (<StatePreviewWindow>this.previewWindow_).getTextSize();

                let targetStates: Model.ButtonState[] = this.getModel().cloneStates();
                let targetState: Model.ButtonState = targetStates[this.getModel().getDefaultStateIndex()];
                targetState.getDefaultLabel().size = changedSize;

                this._setStateMementoCommand(targetStates);
            }

            private _onTextFieldChanged(event: Event) {
                let changedText = (<StatePreviewWindow>this.previewWindow_).getText();

                let targetStates: Model.ButtonState[] = this.getModel().cloneStates();
                let targetState: Model.ButtonState = targetStates[this.getModel().getDefaultStateIndex()];
                targetState.getDefaultLabel().text = changedText;

                this._setStateMementoCommand(targetStates);
            }

            private _onChangeToTextBtn(event: Event) {
                let targetStates: Model.ButtonState[] = this.getModel().cloneStates();
                let targetState: Model.ButtonState = targetStates[this.getModel().getDefaultStateIndex()];
                this._initLabelItem(targetState);

                this._setStateMementoCommand(targetStates);
            }

            events() {
                // Please add events
                return {

                };
            }

            protected _setStateMementoCommand(changedStates: Model.ButtonState[]) {
                this._setMementoCommand(
                    this.getModel(),
                    {
                        "state": this.getModel().state
                    },
                    {
                        "state": changedStates
                    });
            }

            //signalContainerがマウスオーバーされたときに呼び出される
            protected onHoverInSignalContainer(event: Event) {
                let FUNCTION_NAME = TAG + "onHoverInSignalContainer";

                let $target = $(event.currentTarget).find(".signal-control-button");
                if (Util.JQueryUtils.isValidJQueryElement($target)) {
                    $target.css("opacity", "1");
                }
            }

            //signalContainerがマウスオーバーが外されたときに呼び出される
            protected onHoverOutSignalContainer(event: Event) {
                let FUNCTION_NAME = TAG + "onHoverOutSignalContainer";

                let $target = $(event.currentTarget).find(".signal-control-button");
                if (Util.JQueryUtils.isValidJQueryElement($target)) {
                    $target.css("opacity", "0");
                }
            }



            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////

            /**
             * 保持しているモデルを取得する。型が異なるため、this.modelを直接参照しないこと。
             * @return {Model.ButtonItem}
             */
            public getModel(): Model.ButtonItem {
                //親クラスのthis.modelはModel.Item型という抽象的な型でありModel.ButtonItem型に限らない。
                //このクラスとその子供のクラスはthis.modelをModel.ButtonItemとして扱ってほしいのでダウンキャストしている。
                return <Model.ButtonItem>this.model;
            }


            /**
             * このクラス内のbuttonモデルのstateを、入力されたものに更新する
             * @param inputStates{Model.ButtonState[]}
             */
            public setStates(inputStates: Model.ButtonState[]) {
                let FUNCTION_NAME = "setState";

                if (inputStates == null) {
                    console.warn(FUNCTION_NAME + "inputStates is null");
                    return;
                }

                this.getModel().state = inputStates;
            }


            /////////////////////////////////////////////////////////////////////////////////////////
            ///// protected method
            /////////////////////////////////////////////////////////////////////////////////////////

            /**
             * state情報からテンプレート生成に必要なstateDataを生成する
             * @param state {Model.ButtonState}
             */
            protected createStateData(state: Model.ButtonState): any {
                let stateData: any = {};

                stateData.stateId = state.stateId;

                if (state.image) {
                    stateData.image = state.image[0];
                }

                if (state.label) {
                    stateData.label = state.label[0];
                }

                if (state.action &&
                    state.action[0] &&
                    state.action[0].deviceInfo &&
                    state.action[0].deviceInfo.functions) {
                    stateData.functions = state.action[0].deviceInfo.functions;
                }

                return stateData;
            }


            /**
             * 入力したJQueryに登録されている order情報(何番目のマクロ信号か.0からはじまる)を取得する。
             * @param $target {JQuery} 対象となるJQuery
             * @return {number} order情報 みつからない場合、undefinedを返す。
             */
            protected getOrderFrom($target: JQuery): number {
                let FUNCTION_NAME = TAG + "getOrderFrom";

                if ($target == null) {
                    console.warn(FUNCTION_NAME + "$target is null");
                    return;
                }

                let result: number = parseInt(JQUtils.data($target, "signalOrder"), 10);

                if (!this.isValidOrder(result)) {
                    console.warn(FUNCTION_NAME + "result is invalid");
                    return undefined;
                }

                if (result != null) {
                    return result;
                } else {
                    return undefined;
                }
            }

            /**
             * 入力したJQueryに登録されている order情報(何番目のマクロ信号か.0からはじまる)を取得する。
             * @param $target{JQuery} 対象となるJQuery
             * @return {number} stateID みつからない場合、undefinedを返す。
             */
            protected getStateIdFrom($target: JQuery): number {
                let FUNCTION_NAME = TAG + "getStateIdFrom";

                if ($target == null) {
                    console.warn(FUNCTION_NAME + "$target is null");
                    return;
                }

                let result: number = parseInt(JQUtils.data($target, "stateId"), 10);

                if (result != null) {
                    return result;
                } else {
                    return undefined;
                }
            }


            /**
             * 入力したorderの信号に登録されているremoteIdをpulldownから取得する。
             * 見つからなかった場合、undefinedを返す。
             * @order{number} : remoeIdを取得したい信号の順番
             * @{string} remoteId
             */
            protected getRemoteIdFromPullDownOf(order: number): string {
                let FUNCTION_NAME = TAG + "getRemoteIdOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
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
                if (!Util.JQueryUtils.isValidValue(remoteId)) {
                    return undefined;
                }

                return remoteId;

            }

            /**
             * 入力したorderのremoteIdのプルダウンのJQuery要素を返す。
             * @param {number} order
             * @return {JQuery}
             */
            protected getRemoteIdPullDownJQueryElement(order: number): JQuery {
                let FUNCTION_NAME = TAG + "getPullDownJQueryElement : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $remoteIdPullDown = $signalContainerElement.find(".remote-input[data-signal-order=\"" + order + "\"]");
                if (!Util.JQueryUtils.isValidJQueryElement($remoteIdPullDown)) {
                    console.warn(FUNCTION_NAME + "$remoteIdPullDown is invalid");
                    return;
                }

                return $remoteIdPullDown;
            }


            private _getRemoteNameOfUnknownRemote(unknownRcType: string) {
                let remoteId: string;
                switch (unknownRcType) {
                    case UNKNOWN_REMOTE_TV:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_TV");
                        break;
                    case UNKNOWN_REMOTE_AC:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_AC");
                        break;
                    case UNKNOWN_REMOTE_LIGHT:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_LIGHT");
                        break;
                    case UNKNOWN_REMOTE_AUDIO:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_AUDIO");
                        break;
                    case UNKNOWN_REMOTE_PLAYER:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_PLAYER");
                        break;
                    case UNKNOWN_REMOTE_RECORDER:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_RECORDER");
                        break;
                    case UNKNOWN_REMOTE_PROJECTOR:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_PROJECTOR");
                        break;
                    case UNKNOWN_REMOTE_STB:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_STB");
                        break;
                    case UNKNOWN_REMOTE_FAN:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_FAN");
                        break;
                    case UNKNOWN_REMOTE_BT:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE_BT");
                        break;
                    default:
                        remoteId = $.i18n.t("remote.STR_UNKNOWN_REMOTE");
                        break;
                }
                return remoteId;
            }



            /**
             * 入力したorderのremoteプルダウンに、inputの値を代入する。
             * @param {number} order マクロ信号の順番
             * @param {string} inputRemoteId プルダウンに設定する値。
             */
            protected setRemoteIdPullDownOf(order: number, inputRemoteId: string, unknownRcId?: string) {
                let FUNCTION_NAME = TAG + "setIntervalPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
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
                if (!Util.JQueryUtils.isValidJQueryElement($remoteIdPullDown)) {
                    console.warn(FUNCTION_NAME + "$remoteIdPullDown is invalid");
                    return;
                }

                let remoteName = null;
                if (unknownRcId != null && unknownRcId.indexOf(UNKNOWN_REMOTE) == 0) {
                    remoteName = this._getRemoteNameOfUnknownRemote(unknownRcId);
                } else {
                    let cachedDeviceInfo = this.getDeviceInfoByRemoteId(inputRemoteId);
                    if (Util.JQueryUtils.isValidValue(cachedDeviceInfo)) {
                        remoteName = cachedDeviceInfo.remoteName;
                    }
                }

                if (remoteName != null) {
                    let additionalRemoteTemplrate: Tools.JST = Tools.Template.getJST("#template-property-button-signal-remote-additional-option", this._getTemplateFilePath());
                    let inputSignalData = {
                        remoteId: inputRemoteId,
                        name: remoteName
                    }

                    let $additionalRemote = $(additionalRemoteTemplrate(inputSignalData));
                    $remoteIdPullDown.prepend($additionalRemote);

                }


                $remoteIdPullDown.val(inputRemoteId);
            }


            /**
             * 入力したorder, stateIdのRemoteId設定用のプルダウンメニューを削除する
             * @param {number} order
             */
            protected removeRemoteIdPullDownOf(order: number) {
                let FUNCTION_NAME = TAG + "removeRemoteIdPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //対象orderのfunctionPullDown用コンテナの子供を削除する
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                let $targetFunctionPullDownContainer: JQuery = $targetSignalContainer.find("#signal-remote-container");
                $targetFunctionPullDownContainer.children().remove();
            }


            /**
             * 入力したorderのremoteId用プルダウンに表示されている文字列を取得する
             * @param {number} order
             * @return {string} プルダウンに表示されている文字列
             */
            protected getTextInRemoteIdOf(order: number): string {
                let FUNCTION_NAME = TAG + "getTextInRemoteIdOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //対象orderのremoteIdPullDown用のテキストを返す。
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                return $targetSignalContainer.find("#signal-remote-container option:selected").text();

            }

            /**
             * 入力したorderのremoteId用プルダウンに入力されているのが「不明なリモコン」か判定する
             * @param {number} order
             * @return {boolean}
             */
            protected isUnknownRemoteTypeInPulldownOf(order: number): boolean {
                let FUNCTION_NAME = TAG + "getTextInRemoteIdOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let pulldownText = this.getTextInRemoteIdOf(order);

                switch (pulldownText) {
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_TV"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_AC"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_LIGHT"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_AUDIO"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_PLAYER"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_RECORDER"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_PROJECTOR"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_STB"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_FAN"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE_BT"):
                    case $.i18n.t("remote.STR_UNKNOWN_REMOTE"):
                        return true;
                    default: return false;

                }

            }


            /**
             * 入力したorderRemoteId用のプルダウンを描画する。
             * @param {number} order 描写するfunctionsプルダウンがどの順番の信号に属しているか
             * @param {string} inputRemoteId 表示するリモコンのID
             * @param {number} stateId 描画するステート。指定しない場合デフォルト値になる。
             * @param {string} 描写するfunctionsプルダウンに設定する値。
             */
            protected renderRemoteIdOf(order: number, inputRemoteId: string, stateId: number = this.getModel().getDefaultStateId(), unknownRcId?: string) {
                let FUNCTION_NAME = TAG + "renderRemoteIdOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //すでに、function選択用PullDownがある場合、削除する。
                this.removeRemoteIdPullDownOf(order);

                //targetとなるJQueryを取得
                let $target: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return;
                }

                //RemoteIdプルダウンのDOMを表示。
                let remoteList: IRemoteInfo[] = this.availableRemotelist.concat();  //加工する可能性があるのでコピーを生成
                if (remoteList != null) {
                    let $remoteContainer = $target.find("#signal-remote-container");
                    let templateRemote: Tools.JST = Tools.Template.getJST("#template-property-button-signal-remote", this._getTemplateFilePath());

                    let inputSignalData = {
                        id: stateId,
                        order: order,
                        remotesList: remoteList
                    }

                    let $functionsDetail = $(templateRemote(inputSignalData));
                    $remoteContainer.append($functionsDetail);

                    if (Util.JQueryUtils.isValidValue(inputRemoteId)) {
                        //inputにmodelがある場合、値を表示
                        this.setRemoteIdPullDownOf(order, inputRemoteId, unknownRcId);
                    } else {
                        //まだ、値がない場合、リストの一番上に、noneの値のDOMを追加。
                        let noneOption: Tools.JST = Tools.Template.getJST("#template-property-button-signal-remote-none-option", this._getTemplateFilePath());
                        $remoteContainer.find("select").prepend(noneOption);
                        this.setRemoteIdPullDownOf(order, "none", unknownRcId);
                    }

                }
            }


            /**
             * アクションに設定されているFunctionNameを取得する
             * @param {IAction} action functionNameを抽出するAction
             * @return {string} functionName 見つからない場合、 nullを返す。
             */
            protected getFunctionNameFromAction(action: IAction): string {
                let FUNCTION_NAME = TAG + "getFunctionNameFromAction : ";

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return null;
                }

                let result: string = null;

                if (action.code != null) {
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


            /**
             * アクションに設定されているリモコン信号がもつFunctionを取得する
             * @param {IAction} action functionNameを抽出するAction
             * @return {string[]} functions, 見つからない場合、 nullを返す。
             */
            protected getFunctionsFromAction(action: IAction) {
                let FUNCTION_NAME = TAG + "getFunctionsFromAction : ";

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }

                let remoteId = huisFiles.getRemoteIdByAction(action);
                if (remoteId == null) {
                    return;
                }

                if (action.deviceInfo.functions == null ||
                    action.deviceInfo.functions.length == 0) {
                    // functionsが無い場合はHuisFilesから検索
                    let functions: string[] = huisFiles.getMasterFunctions(remoteId);
                    action.deviceInfo.functions = functions;
                }

                return action.deviceInfo.functions;

            }

            /**
             * 入力したorderのfunctionsプルダウンに、inputの値を代入する。
             * @param {number} order マクロ信号の順番
             * @param {string} inputFunctionNameId プルダウンに設定する値。
             */
            protected setFunctionNamePullDownOf(order: number, inputFunctionName: string) {
                let FUNCTION_NAME = TAG + "setFunctionNamePullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
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

            /**
             * 入力してorderの$signal-container-elementを返す。
             * @param {number} order 入手したい$signal-container-elementの順番
             * @return {JQuery} $signal-container-element
             */
            protected getSignalContainerElementOf(order: number): JQuery {
                let FUNCTION_NAME = TAG + "getSignalContainerElementOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                return this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
            }

            /**
             * 入力したorderの信号に登録されているfunctionをpulldownから取得する。
             * 見つからなかった場合、undefinedを返す。
             * @param {number} @order functionを取得したい信号の順番
             * @return {string} functionName
             */
            protected getFunctionFromlPullDownOf(order: number): string {
                let FUNCTION_NAME = TAG + "getFunctionFromlPullDownOf : ";
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let functionName: string = null;
                let $functionPullDown = $signalContainerElement.find(".function-input[data-signal-order=\"" + order + "\"]");
                if ($functionPullDown == null || $functionPullDown.length == 0) {
                    //正常系でも、functionPulldownがない場合はあり得る。
                    //console.warn(FUNCTION_NAME + "$functionPullDown is invalid");
                    return;
                }

                functionName = $functionPullDown.val();

                if (!Util.JQueryUtils.isValidValue(functionName)) {
                    return undefined;
                }

                return functionName;
            }



            /**
             * 入力したorderのFunctionsを描画する。
             * @param {number} order 描写するfunctionsプルダウンがどの順番の信号に属しているか.
             * @param {string} functionName 描写するfunctionsプルダウンに設定する値。nullでも
             * @param {number} stateId 描画するステートのID。指定しない場合、デフォルト値になる。
             * @param {string} unknownRcId 不明なリモコンIDを表示する場合、その種類を入力。
             */
            protected renderFunctionsOf(order: number, functionName: string = null, stateId: number = this.getModel().getDefaultStateId(), unknownRcId?: string) {
                let FUNCTION_NAME = TAG + "renderFunctionsOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
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

                let functions: string[];
                let remoteId: string = this.getRemoteIdFromPullDownOf(order);

                if (unknownRcId != null && unknownRcId.indexOf(UNKNOWN_REMOTE) == 0) {
                    if (functionName == null) {
                        functions = null;
                    } else {
                        functions = $.extend(true, [], [functionName]);
                    }
                } else {

                    //ここでshallow copyしてしまうと、モデルの中の情報まで更新されてしまう。
                    functions = $.extend(true, [], this.getFunctionsOf(order));

                }

                if (functions != null && functions.length != 0) {
                    // functionsに自分のキーが存在しない場合は追加
                    if (Util.JQueryUtils.isValidValue(functionName) &&
                        functions.indexOf(functionName) < 0) {
                        functions.unshift(functionName);
                    }

                    let $functionlContainer = $target.find("#signal-function-container");
                    let templateFunctions: Tools.JST = Tools.Template.getJST("#template-property-button-signal-functions", this._getTemplateFilePath());

                    //functionsが0個の場合のエラーケース対応
                    let inputFunctions = [];
                    if (!(functions.length == 1 && functions[0] == null)) {
                        inputFunctions = Util.HuisFiles.translateFunctions(functions);
                    }

                    let inputSignalData = {
                        functions: inputFunctions,
                        id: stateId,
                        order: order
                    }
                    let $functionsDetail = $(templateFunctions(inputSignalData));
                    $functionlContainer.append($functionsDetail);

                    //inputにmodelがある場合、値を表示
                    if (Util.JQueryUtils.isValidValue(functionName)) {
                        this.setFunctionNamePullDownOf(order, functionName);
                    } else {
                        //値がない場合、初期値をrender
                        let noneOption: Tools.JST = Tools.Template.getJST("#template-property-button-signal-functions-none-option", this._getTemplateFilePath());
                        $functionlContainer.find("select").prepend(noneOption);
                        this.setFunctionNamePullDownOf(order, "none");
                    }
                }
            }

            /**
             * IButtonDeviceInfoをディープコピーする.
             * @param {IButtonDeviceInfo} src コピー元のIButtonDeviceInfo
             * @return {IButtonDeviceInfo} ディープコピーされたIButtonDeviceInfo
             */
            protected cloneDeviceInfo(src: IButtonDeviceInfo): IButtonDeviceInfo {
                let FUNCTION_NAME = TAG + "cloneDeviceInfo";

                if (!Util.JQueryUtils.isValidValue(src)) {
                    console.warn(FUNCTION_NAME + "src is invalid");
                    return;
                }

                //deviceInfoを値渡しにすると、前後のorderに値が参照されてしまう。
                let result: IButtonDeviceInfo = {
                    id: src.id,
                    remoteName: (src.remoteName) ? src.remoteName : undefined,
                    functions: $.extend(true, [], src.functions),
                    code_db: $.extend(true, {}, src.code_db),
                    bluetooth_data: (src.bluetooth_data) ? $.extend(true, {}, src.bluetooth_data) : undefined,
                    functionCodeHash: (src.functionCodeHash) ? $.extend(true, [], src.functionCodeHash) : undefined
                }

                return result;
            }

            /**
             * 入力した信号名が 再学習用の##つきなのか判定する。 危険多様しないこと。
             * @param {string} functionName
             * @return {boolean} ##付きのfunctionの場合true,それ以外はfalse
             */
            protected isRelearnedFunctionName(functionName: string): boolean {
                let FUNCTION_NAME = TAG + "isRelearnedFunctionName ";
                if (!Util.JQueryUtils.isValidValue(functionName)) {
                    return false;
                }
                //## を含んでいるとき、trueを返す。
                if (functionName.indexOf(FUNC_NUM_DELIMITER + FUNC_CODE_RELEARNED) != -1) {
                    return true;
                } else {
                    return false;
                }

            }

            /**
             * 設定したOrderのfunction用PullDownを消す。
             * @param {number} order
             */
            protected removeFunctionPullDown(order: number) {
                let FUNCTION_NAME = TAG + "removeFunctionPullDown";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                //対象orderのfunctionPullDown用コンテナの子供を削除する
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                let $targetFunctionPulllDownContainer: JQuery = $targetSignalContainer.find("#signal-function-container");
                $targetFunctionPulllDownContainer.children().remove();
            }



            /**
             * 入力したorderのリモコンが持てる信号のリストFunctionsを返す。
             * @param {number} order 信号リストを取得したい、マクロ信号の順番
             * @param {number} stateId? 信号リストを取得したい、ボタンのstate
             * @return {string[]} 見つからなかった場合、undefinedを返す。
             */
            protected getFunctionsOf(order: number, stateId?: number) {
                let FUNCTION_NAME = TAG + "getFunctionsOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }


                let remoteId: string = this.getRemoteIdFromPullDownOf(order);
                if (remoteId == null) {
                    return;
                }

                let functions = huisFiles.getAllFunctions(remoteId);

                if (functions == null || functions.length <= 0) {
                    try {
                        // HuisFilesに存在しない場合はキャッシュから表示
                        return this.getDeviceInfoByRemoteId(remoteId).functions;
                    } catch (e) {
                        // キャッシュもない場合
                        return;
                    }
                }

                return functions;
            }


            /**
             * ページプルダウンをレンダリング
             *
             * @param {number} order
             * @param {number} stateId
             * @param {number} page
             */
            protected renderPagesOf(order: number, stateId: number, page: number) {
                let FUNCTION_NAME = TAG + "renderPagesOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $pulldown = this.appendPagesPullDown(order, stateId);

                let maxPage = this.getPageNumOf(order, stateId);
                if (maxPage <= 0) {
                    // リモコン未選択時/リモコンが存在しないはプルダウン自体を非表示
                    $pulldown.hide();
                } else {
                    $pulldown.show();
                    if (page >= maxPage) {
                        // リモコンはあるがページが無い場合: 1ページ目を表示
                        page = 0;
                    }

                    this.controlHiddennessOfPagesPullDown($pulldown, maxPage, page);

                    this.setPagePullDownOf(order, page);
                }
            }


            /**
             * ページ選択用プルダウンのDOMを追加し、そのJQueryオブジェクトを返す。
             * 既に存在する場合は追加せずに対象のJQueryオブジェクトを返す。
             *
             * @param {number} order
             * @param {number} stateId
             */
            private appendPagesPullDown(order: number, stateId: number = this.getModel().getDefaultStateId()): JQuery {
                //targetとなるJQueryを取得
                let $target: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return null;
                }

                let $pages: JQuery = $target.find('.signal-page-container-element');
                if ($pages.length > 0) {
                    return $pages.eq(0);
                }


                let $container = $target.find("#signal-page-container");
                let template: Tools.JST = Tools.Template.getJST("#template-property-button-signal-pages", this._getTemplateFilePath());

                let inputData = {
                    order: order,
                    id: stateId
                }
                let $pulldown = $(template(inputData));
                $container.append($pulldown);

                let $appendedElement = $container.children('.signal-page-container-element');
                if ($appendedElement.length > 0) {
                    return $appendedElement.eq(0);
                } else {
                    return null;
                }
            }

            /**
             * orderに設定されているリモコンのページ数を取得
             */
            private getPageNumOf(order: number, stateId: number = this.getModel().getDefaultStateId()): number {
                let FUNCTION_NAME = TAG + "getPageNumOf : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return 0;
                }

                let remoteId: string = this.getRemoteIdFromPullDownOf(order);
                if (remoteId == null) {
                    // 未選択 or 存在しないリモコン
                    return 0;
                }

                let total: number;
                if (remoteId == this.remoteId) {
                    // 編集中ページを跳び先としている場合
                    total = this.modules.length;

                } else {
                    let face = huisFiles.getFace(remoteId);
                    if (face) {
                        total = face.getTotalPageNum();
                    } else {
                        total = 0;
                    }
                }
                return total;
            }


            /**
             * ページプルダウン各項目の表示/非表示を切り替える
             *
             * @param {JQuery} $pulldown
             * @param {number} maxPage 対象リモコンのページ数
             * @param {number} defaultPageValue 初期選択状態にするページのvalue（ページ番号ではない）
             */
            private controlHiddennessOfPagesPullDown($pulldown: JQuery, maxPage: number, defaultPageValue: number) {
                let $pageOption = $pulldown.find('option');

                $pageOption.each((index, elem) => {
                    let self = $(elem);

                    let val = Number(self.val());
                    if (val < maxPage &&
                        !(val < 0 && defaultPageValue >= 0)) {  //「ページを選択」は初期ページ設定がある場合には表示しない
                        self.prop('disabled', false)
                    } else {
                        self.prop('disabled', true);
                    }

                });
            }


            /**
             * ページプルダウンの選択項目を設定
             *
             * @param {number} order
             * @param {number} page 設定する項目の値（ページ番号ではない）
             */
            protected setPagePullDownOf(order: number, page: number) {
                let FUNCTION_NAME = TAG + "setPagePullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $pagePullDown = $signalContainerElement.find(".page-input[data-signal-order=\"" + order + "\"]");
                if ($pagePullDown == null || $pagePullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$pagePullDown is invalid");
                    return;
                }

                let remoteVal = this.getRemoteIdFromPullDownOf(order);
                if (remoteVal == null) {
                    // リモコンが存在しない場合は強制的に「ページを選択」
                    $pagePullDown.val('-1');
                } else {
                    $pagePullDown.val('' + page);
                }
            }

            /**
             * 入力したorderの信号に登録されているpageをpulldownから取得する。
             * 見つからなかった場合、undefinedを返す。
             * @param {number} order remoeIdを取得したい信号の順番
             */
            protected getPageFromPullDownOf(order: number): number {
                let FUNCTION_NAME = TAG + "getPageFromPullDownOf";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $pagePullDown = $signalContainerElement.find(".page-input[data-signal-order=\"" + order + "\"]");
                if ($pagePullDown == null || $pagePullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$pagePullDown is invalid");
                    return;
                }
                return $pagePullDown.val();
            }

            /**
             * 新規作成されたリモコン選択プルダウンにスタイルを適用する
             *
             * @param {number} order
             */
            protected triggerCreateRemoteSelect(order: number) {
                let $container = this.getSignalContainerElementOf(order);
                let $target = $container.find("#signal-remote-container");
                this._adaptJqueryMobileStyleToPulldown($target);
            }

            /**
             * リモコン選択プルダウンの変更を表示に反映する
             *
             * @param {number} order
             */
            protected refreshRemoteSelect(order: number) {
                let $container = this.getSignalContainerElementOf(order);
                $container.find('#signal-remote-container .custom-select select').selectmenu('refresh');
            }

            /**
             * ページ選択プルダウンの変更を表示に反映する
             *
             * @param {number} order
             */
            protected refreshPageSelect(order: number) {
                let $container = this.getSignalContainerElementOf(order);
                $container.find('#signal-page-container .custom-select select').selectmenu('refresh', true);
            }

            /**
             * ＋ボタンを押下する際のアニメーション. 
             * @param {number} order 出現するdom のorder
             * @param {number} duration アニメーションのduration
             */
            protected animateAddButton(order: number, duration: number, callback?: Function) {
                let FUNCTINO_NAME = TAG + "animateAddButton : ";


                if (!Util.JQueryUtils.isValidValue(order)) {
                    console.warn(FUNCTINO_NAME + "order is invalid");
                    return;
                }

                let $target = this.getSignalContainerElementOf(order);

                //アニメがうまくいかないので、この位置でaddClass
                $target.addClass("before-add-animation");

                $target.find(".delete-signal-area").addClass("show");
                $target.find(".sort-button-area").addClass("show");
                //並び替え下ボタンは、非表示
                $target.find(".sort-button-area").addClass("last-order");

                //addボタン押下後、下から上に移動しながらフィードイン
                let tmpSignalContainerDuration = $target.css("transition-duration");
                this.setAnimationDuration($target, duration / 1000);
                $target.removeClass("before-add-animation");


                setTimeout(
                    () => {
                        $target.find(".delete-signal-area").removeClass("show");
                        $target.find(".sort-button-area").removeClass("show");
                    }
                    , DURATION_ANIMATION_SHOW_SIGNAL_CONTAINER_CONTROLL_BUTTONS
                );

                setTimeout(
                    () => {
                        $target.css("transition-duration", tmpSignalContainerDuration);

                        if (callback) {
                            callback();
                        }

                    }
                    , duration
                );
            }

            /**
             * deleteボタンを押した際のアニメーション
             * @param order{number} 削除するdom のorder
             * duration{number} アニメーションにかかる時間[ms]
             * callback{Function} アニメーション後に実行する処理
             */
            protected animateDeleteSignalContainer(order: number, duration: number, callback?: Function) {
                let FUNCTION_NAME = TAG + "animateDeleteSignalContainer : ";

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                let $target = this.getSignalContainerElementOf(order);
                if (!Util.JQueryUtils.isValidJQueryElement($target)) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                //orderが0のとき order1のintervalのプルダウンと境界線も非表示にする
                if (order == 0) {
                    let targetOrder = 1;
                    if (this.isValidOrder(targetOrder)) {
                        let $orderOneSignalContainer = this.getSignalContainerElementOf(targetOrder);
                        let tmpDuration = $orderOneSignalContainer.css("transition-duration");
                        this.setAnimationDuration($orderOneSignalContainer, duration / 1000);

                        //境界線を非表示
                        $orderOneSignalContainer.find(".separate-line").css("opacity", "0");

                    }
                }


                //durationを設定,対象を透明に
                let tmpTargetDuration = $target.css("transition-duration");
                let tmpTargetMarginBottom = parseInt($target.css("transition-duration").replace("px", ""), 10);
                this.setAnimationDuration($target, duration / 1000);
                $target.css("opacity", "0");
                $target.css("margin-bottom", tmpTargetMarginBottom - $target.outerHeight(true) + "px");

                setTimeout(() => {
                    //durationを元に戻す。
                    $target.css("transition-duration", tmpTargetDuration);

                    if (callback) {
                        callback();
                    }

                }, duration);
            }

            /**
             * アニメーションのdurationを設定する。
             * @param {JQuery} $target アニメーションを設定する対象
             * @param {number} duration アニメーションにかかる時間[ms]
             */
            protected setAnimationDuration($target: JQuery, duration: number) {
                let FUNCTION_NAME = TAG + "setAnimationDuration : ";

                if (!Util.JQueryUtils.isValidJQueryElement($target)) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                if (!Util.JQueryUtils.isValidValue(duration)) {
                    console.warn(FUNCTION_NAME + "duration is invalid");
                    return;
                }

                $target.css("transition-duration", duration + "s");

            }

            /**
             * 対象のJQueryのoffset座標系でのpositionを取得する
             * @parm {JQuery} $target 対象のJQuery
             */
            protected getPosition($target: JQuery): IPosition {
                let FUNCTION_NAME = TAG + "getPosition : ";

                if (!Util.JQueryUtils.isValidJQueryElement($target) || $target.offset() == null) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                let resultPosition: IPosition =
                    {
                        x: $target.offset().left,
                        y: $target.offset().top
                    }

                return resultPosition
            }

            /**
             * 対象のdomの位置を入れ替えるアニメーションをする。
             * @param {JQuery} $target1
             * @param {JQuery} $target2
             * @param {number} duration  アニメーションの期間 [ms]
             */
            protected exchangeJQueryPositionAnimation($target1: JQuery, $target2: JQuery, duration: number) {
                let FUNCTION_NAME = TAG + "exchangeJQueryPositionAnimation : ";


                if (!Util.JQueryUtils.isValidJQueryElement($target1)) {
                    console.warn(FUNCTION_NAME + "$target1 is invalid");
                    return;
                }

                if (!Util.JQueryUtils.isValidJQueryElement($target2)) {
                    console.warn(FUNCTION_NAME + "$target2 is invalid");
                    return;
                }

                let target1Position: IPosition = this.getPosition($target1);
                let target2Position: IPosition = this.getPosition($target2);

                let tmpTarget1Duration = $target1.css("transition-duration");
                let tmpTarget2Duration = $target2.css("transition-duration");

                //durationをセット。
                this.setAnimationDuration($target1, duration / 1000);
                this.setAnimationDuration($target2, duration / 1000);


                //移動
                $target1.css("transform", "translateX(" + (target2Position.x - target1Position.x) + "px)");
                $target2.css("transform", "translateX(" + (target1Position.x - target2Position.x) + "px)");
                $target1.css("transform", "translateY(" + (target2Position.y - target1Position.y) + "px)");
                $target2.css("transform", "translateY(" + (target1Position.y - target2Position.y) + "px)");

                setTimeout(() => {
                    //durationをセット。
                    $target1.css("transition-duration", tmpTarget1Duration);
                    $target2.css("transition-duration", tmpTarget2Duration);
                }, duration);
            }

            /**
             * orderの違反をチェックする。
             * @param {number} order チェックするorder情報
             * @return {boolean} true:orderとして有効、false:orderとして利用不可。
             */
            protected isValidOrder(order: number): boolean {
                let FUNCTION_NAME = TAG + "isValidOrder : ";

                //値として利用できるかチェック
                if (!Util.JQueryUtils.isValidValue(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return false;
                }

                //0未満の値は不正
                if (order < 0) {
                    console.warn(FUNCTION_NAME + "order is negative");
                    return false;
                }

                //最大値より多いと不正
                if (order > MAX_NUM_MACRO_SIGNAL) {
                    console.warn(FUNCTION_NAME + "order is over maxium value");
                    return false;
                }

                return true;
            }

            /**
             * 入力したremoteIdが、キャッシュされたものだった場合、deviceInfoを取得する
             * @param {string} remoteId deviceInfoを取得したいremoteId
             * @return {IButtonDeviceInfo} 見つからなかった場合nullを返す。
             */
            protected getDeviceInfoByRemoteId(remoteId: string): IButtonDeviceInfo {
                let FUNCTION_NAME = TAG + "isCachedMenberRemoteId : ";

                if (!Util.JQueryUtils.isValidValue(remoteId)) {
                    console.warn(FUNCTION_NAME + "remoteId is invalid");
                    return null;
                }

                //modelのアクション中のdeviceInfo
                for (let action of this.getModel().getDefaultState().action) {
                    let deviceInfo: IButtonDeviceInfo = action.deviceInfo;
                    if (deviceInfo != null && deviceInfo.id == remoteId) {
                        return deviceInfo;
                    }
                }

                return null;
            }

            /**
             * ボタンに、入力したデバイスタイプの信号がはいっているかチェックする。
             * @param {Model.ButtonItem} button 判定対象のボタン
             * @param {string} category 特定したいデバイスタイプ
             * @return {boolean} ボタンの信号に入力したデバイスタイプがひとつでもある場合 true, ひとつもない場合false, エラーが発生した場合undefined
             */
            protected isIncludeSpecificDeviceType(button: Model.ButtonItem, category: string): boolean {
                let FUNCTION_NAME = TAG + "isIncludeSpecificDeviceType : ";

                if (!Util.JQueryUtils.isValidValue(button)) {
                    console.warn(FUNCTION_NAME + "button is invalid");
                    return;
                }

                if (!Util.JQueryUtils.isValidValue(category)) {
                    console.warn(FUNCTION_NAME + "category is invalid");
                    return;
                }

                for (let state of button.state) {
                    if (!state.action) continue;

                    for (let action of state.action) {
                        if (!action.deviceInfo || !action.deviceInfo.code_db || !action.deviceInfo.code_db.device_type) continue;

                        if (action.deviceInfo.code_db.device_type == category) {
                            return true;
                        }
                    }
                }

                return false;
            }

            /**
             * ボタンの中のコード(学習して登録した際の信号)をすべて返す
             * @param {Model.ButtonItem} button コードを取得したいボタン
             * @return {string[]} ボタン中のコードを格納した配列
             */
            private _getCodesFrom(button: Model.ButtonItem): string[] {
                let FUNCTION_NAME: string = TAG + "getCodesFrom";

                if (button == undefined) {
                    console.warn(FUNCTION_NAME + "button is undefined");
                    return;
                }

                let result: string[] = [];
                for (let state of button.state) {
                    for (let action of state.action) {
                        if (action.code != undefined) {
                            result.push(action.code);
                        }
                    }
                }

                if (result.length == 0) {
                    return null;
                }

                return result;
            }

            private _setDeviceInfo() {
                let button: Model.ButtonItem = this.getModel();
                let codes: string[] = this._getCodesFrom(button);
                let remoteId: string = button.remoteId;
                // masterFunctions が未取得の場合は取得する
                for (let state of this.getModel().state) {
                    if (!state.action) continue;
                    for (let action of state.action) {
                        if (!action.deviceInfo) continue;
                        let deviceInfo: IButtonDeviceInfo = action.deviceInfo;
                        if (!deviceInfo.functions || deviceInfo.functions.length < 1) {
                            let codeDb = deviceInfo.code_db;
                            if (codeDb.brand != " " && codeDb.brand != undefined &&
                                codeDb.device_type != " " && codeDb.device_type != undefined &&
                                codeDb.model_number != " " && codeDb.device_type != undefined) {
                                //codeDbの情報がそろっている場合、codeDbからfunctionsを代入
                                let remoteId = huisFiles.getRemoteIdByCodeDbElements(codeDb.brand, codeDb.device_type, codeDb.model_number);

                                let face = huisFiles.getFace(remoteId);
                                if (face != null) {
                                    deviceInfo.remoteName = face.name;
                                } else {
                                    deviceInfo.remoteName = null;
                                }
                                deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);
                            } else if (codes != null) {
                                //codeDbの情報がそろっていない、かつcode情報がある場合、codeからfunctionsを代入
                                let remoteId = huisFiles.getRemoteIdByCode(codes[0]);
                                if (remoteId != null) {
                                    let face = huisFiles.getFace(remoteId);
                                    if (face != null) {
                                        deviceInfo.remoteName = face.name;
                                    } else {
                                        deviceInfo.remoteName = null;
                                    }
                                    deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);
                                    deviceInfo.functionCodeHash = huisFiles.getAllFunctionCodeMap(remoteId);
                                }
                            } else if (deviceInfo.bluetooth_data != null) {
                                //Bluetooth情報しかない場合
                                if (remoteId != null) {
                                    deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);
                                    deviceInfo.bluetooth_data = huisFiles.getMasterBluetoothData(remoteId);
                                }
                            }

                            action.deviceInfo = deviceInfo;
                        }
                    }
                }
            }

            private _initLabelItem(state: Model.ButtonState) {
                this._initLabelAndImage(state);

                let buttonArea = this.getModel().area;
                let defaultLabelArea: IArea = {
                    x: buttonArea.x,
                    y: buttonArea.y,
                    w: 0,
                    h: 0
                }

                let tmpLabel: Model.LabelItem = new Model.LabelItem({
                    text: ConstValue.DEFAULT_TEXT,
                    size: ConstValue.DEFAULT_TEXT_SIZE,
                    font_weight: ConstValue.BUTTON_FONT_WEIGHT,
                    area: defaultLabelArea,
                    color: Model.FontColor.SETTING
                })
                let tmpLabels: Model.LabelItem[] = [];
                tmpLabels.push(tmpLabel);
                state.label = tmpLabels;
            }

            private _initLabelAndImage(state: Model.ButtonState) {
                state.image = [];
                state.label = [];
            }

            protected _getActionPulldownJquery(stateId: number): JQuery {
                return this.$el.find(
                    ConstValue.ACTION_PULLDOWN_DOM_CLASS +
                    ConstValue.JQUERY_STRING_TARGET_STATE_ID_OPEN +
                    stateId +
                    ConstValue.JQUERY_STRING_TARGET_STATE_ID_CLOSE
                );
            }

            /**
             * オーダー情報のないプルダウンをレンダリングする
             * @param {number} stateId ターゲットとするstateId
             * @param {IStringKeyValue[]} actionList プルダウンで選択可能なアクション
             */
            protected _renderNonOrderActionPulldown(stateId: number, actionList: IStringKeyValue[]) {
                let inputDate = {
                    actionList: actionList,
                    stateId: stateId
                }
                let templateActionPulldown: CDP.Tools.JST = CDP.Tools.Template.getJST(ConstValue.TEMPLATE_ACTION_PULLDOWN, this._getTemplateFilePath());
                this.$el.find(ConstValue.ACTION_PULLDOWN_DOM_ID).append(templateActionPulldown(inputDate));
            }

        }
    }
}
