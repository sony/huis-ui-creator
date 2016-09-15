/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyAreaButtonBase] ";

        //信号選択用のプルダウンを表示するための情報
        //TODO:余計な情報もある、必要な情報だけに整理したほうがよい。
        interface ISignalDataForDisplayPullDown {
            order: number; //マクロでの信号の順番
            action?: IAction; //表示するAction
            id: number;    // マクロボタンのStateId
            remotesList?: IRemoteInfo[]; //リモコン選択用プルダウンに表示するためのリスト
            functions?: string[]; //Function選択用プルダウンに表示するためのリスト
        }

        export class PropertyAreaButtonBase extends Backbone.View<Model.ButtonItem> {

            //DOMのプルダウンの値ををベースにModelを更新する。
            //DOMを生成・変更 ＞＞ DOMの値をModelに反映 ＞＞ Modelの内容でDOMを再生成の流れでViewを管理する。

            protected templateItemDetailFile_: string;
            protected availableRemotelist: IRemoteInfo[];
            protected DEFAULT_STATE_ID: number; // staeIdが入力されたなかったとき、代入される値

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");
                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInMacro();
                this.DEFAULT_STATE_ID = 0;
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            events() {
                // Please add events
                return {

                };
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




            /////////////////////////////////////////////////////////////////////////////////////////
            ///// protected method
            /////////////////////////////////////////////////////////////////////////////////////////

            //NaNか判定 Number.isNaNが使えないので代用
            protected isNaN(v) {
                return v !== v;
            }

            // 不正な値の場合、falseを返す。
            // 有効な場合、trueを返す。
            protected isValidValue(value): boolean {
                let FUNCTION_NAME = TAG + "isInvalidPullDownValue";

                if (value == null) {
                    return false;
                } else if (value == "none") {
                    return false;
                } else if (value === "") {
                    return false;
                } else if (this.isNaN(value)) {
                    return false;
                } else {
                    return true;
                }
            }

            /*
           * JQuery要素が有効か判定する
           * @param $target{JQuery}判定対象
           * @return {boolean} 有効な場合、true
           */
            protected isValidJQueryElement($target: JQuery): boolean {
                if ($target.length == 0 || $target == null) {
                    return false;
                } else {
                    return true;
                }
            }

          
            /*
           * 入力したJQueryに登録されている order情報(何番目のマクロ信号か.0からはじまる)を取得する。
           * @param $target{JQuery} 対象となるJQuery
           * @return {number} order情報 みつからない場合、undefinedを返す。
           */
            protected getOrderFrom($target: JQuery): number {
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


            /*
             * actionから、remoteIdを取得する
             * @param action {IAction} : remoteIdを取得する情報源となるaction
             * @return {string} : remoteId 見つからない場合、undefinedを返す。
             */
            protected getRemoteIdByAction(action: IAction): string {
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
         * 入力したorderの信号に登録されているremoteIdをpulldownから取得する。
         * 見つからなかった場合、undefinedを返す。
         * @order{number} : remoeIdを取得したい信号の順番
         * @{string} remoteId
         */
            protected getRemoteIdFromPullDownOf(order: number): string {
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
            * 入力したorderのremoteIdのプルダウンのJQuery要素を返す。
            * @param order{number}
            * @return {JQuery}
            */
            protected getPullDownJQueryElement(order : number):JQuery{
                let FUNCTION_NAME = TAG + "getPullDownJQueryElement : ";

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $remoteIdPullDown = $signalContainerElement.find(".remote-input[data-signal-order=\"" + order + "\"]");
                if (!this.isValidJQueryElement($remoteIdPullDown)) {
                    console.warn(FUNCTION_NAME + "$remoteIdPullDown is invalid");
                    return;
                }

                return $remoteIdPullDown;
            }



            /*
          * 入力したorderのremoteプルダウンに、inputの値を代入する。
          * order{number} ： マクロ信号の順番
          * inputRemoteId{string} : プルダウンに設定する値。
          */
            protected setRemoteIdPullDownOf(order: number, inputRemoteId: string) {
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
                if (!this.isValidJQueryElement($remoteIdPullDown)) {
                    console.warn(FUNCTION_NAME + "$remoteIdPullDown is invalid");
                    return;
                }

                $remoteIdPullDown.val(inputRemoteId);

            }

            /*
            * 入力したorder, stateIdのRemoteId設定用のプルダウンメニューを削除する
            * @param order{number}
            */
            protected removeRemoteIdPullDownOf(order: number) {
                let FUNCTION_NAME = TAG + "removeRemoteIdPullDownOf";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                //対象orderのfunctionPullDown用コンテナの子供を削除する
                let $targetSignalContainer: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                let $targetFunctionPulllDownContainer: JQuery = $targetSignalContainer.find("#signal-remote-container");
                $targetFunctionPulllDownContainer.children().remove();
            }

            /*
            * 入力したorderRemoteId用のプルダウンを描画する。
            * @param order{number} 描写するfunctionsプルダウンがどの順番の信号に属しているか
            * @param functionName{string} 描写するfunctionsプルダウンに設定する値。
            */
            protected renderRemoteIdOf(order: number, stateId?: number, inputRemoteId?: string) {
                let FUNCTION_NAME = TAG + "renderFunctionsOf : ";

                if (order == null) {
                    console.warn("order is null");
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

                //FunctionプルダウンのDOMを表示。
                let remoteList : IRemoteInfo[] = this.availableRemotelist;
                if (remoteList != null) {
                    let $remoteContainer = $target.find("#signal-remote-container");
                    let templateRemote: Tools.JST = Tools.Template.getJST("#template-property-button-signal-remote", this.templateItemDetailFile_);

                    if (stateId == null) {
                        stateId = this.DEFAULT_STATE_ID;
                    }

                    let inputSignalData: ISignalDataForDisplayPullDown = {
                        id: stateId,
                        order: order,
                        remotesList: remoteList
                    }

                    let $functionsDetail = $(templateRemote(inputSignalData));
                    $remoteContainer.append($functionsDetail);

                    //inputにmodelがある場合、値を表示
                    if (inputRemoteId != null) {
                        this.setRemoteIdPullDownOf(order, inputRemoteId);
                    }

                    //Functionの文言を和訳
                    $remoteContainer.i18n();

                    //プルダウンにJQueryMobileのスタイルをあてる
                    $remoteContainer.trigger('create');

                }
            }

            /*
             * アクションに設定されているFunctionNameを取得する
             * @param action{IAction} : functionNameを抽出するAction
             * @return {string} : functionName, 見つからない場合、 nullを返す。
             */
            protected getFunctionNameFromAction(action: IAction): string {
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
             * アクションに設定されているリモコン信号がもつFunctionを取得する
             * @param action{IAction} : functionNameを抽出するAction
             * @return {string[]} : functions, 見つからない場合、 nullを返す。
             */
            protected getFunctionsFromAction(action : IAction) {
                let FUNCTION_NAME = TAG + "getFunctionsFromAction : ";

                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }

                let remoteId = this.getRemoteIdByAction(action);
                if (remoteId == null) {
                    return;
                }

                //TODO：huisFilesで取得できない場合の処理(すでに削除されているなど)
                //キャッシュで対応する。
                return huisFiles.getMasterFunctions(remoteId);

            }

            /*
            * 入力したorderのfunctionsプルダウンに、inputの値を代入する。
            * order{number} ： マクロ信号の順番
            * inputFunctionNameId{string} : プルダウンに設定する値。
            */
            protected setFunctionNamePullDownOf(order: number, inputFunctionName: string) {
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
            * 入力してorderの$signal-container-elementを返す。
            * @param order{number} 入手したい$signal-container-elementの順番
            * @return {JQuery} $signal-container-element
            */
            protected getSignalContainerElementOf(order: number): JQuery {
                let FUNCTION_NAME = TAG + "getSignalContainerElementOf";
                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }
                return this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
            }

            /*
            * 入力したorderの信号に登録されているfunctionをpulldownから取得する。
            * 見つからなかった場合、undefinedを返す。
            * @order{number} : functionを取得したい信号の順番
            * @{string} functionName
            */
            protected getFunctionFromlPullDownOf(order: number): string {
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

                let functionName: string = null;
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
         * 入力したorderのFunctionsを描画する。
         * @param order{number} 描写するfunctionsプルダウンがどの順番の信号に属しているか
         * @param functionName{string} 描写するfunctionsプルダウンに設定する値。
         */
            protected renderFunctionsOf(order: number, stateId? : number, functionName?: string) {
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
                    let $functionlContainer = $target.find("#signal-function-container");
                    let templateFunctions: Tools.JST = Tools.Template.getJST("#template-property-button-signal-functions", this.templateItemDetailFile_);

                    if (stateId == null) {
                        stateId = this.DEFAULT_STATE_ID;
                    }

                    let inputSignalData: ISignalDataForDisplayPullDown = {
                        functions: functions,
                        id: stateId,
                        order: order
                    }
                    let $functionsDetail = $(templateFunctions(inputSignalData));
                    $functionlContainer.append($functionsDetail);

                    //inputにmodelがある場合、値を表示
                    if (functionName != null) {
                        this.setFunctionNamePullDownOf(order, functionName);
                    }

                    //Functionの文言を和訳
                    $functionlContainer.i18n();

                    //プルダウンにJQueryMobileのスタイルをあてる
                    $functionlContainer.trigger('create');

                }
            }

           

            /*
            * 設定したOrderのfunction用PullDownを消す。
            * @param order {number}
            */
            protected removeFunctionPullDown(order: number) {
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
           * 入力したorderのリモコンが持てる信号のリストFunctionsを返す。
           * @param order {number} 信号リストを取得したい、マクロ信号の順番
           * @param stateId? {number} 信号リストを取得したい、ボタンのstate
           * @return {string[]} 見つからなかった場合、undefinedを返す。
           */
            protected getFunctionsOf(order: number, stateId? : number) {
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


            // default-valueのpulldownの要素をfocus状態と同じ見た目にする
            protected changeColorDefaultValuePulldown() {
                let customSelects = this.$el.find(".custom-select");
                let $customSelects = $(customSelects);
                for (let i = 0; i < customSelects.length; i++){
                    let value = $(customSelects[i]).find("select").val();
                    if (value == "none") {
                        //$(customSelects[i]).find(".ui-btn").addClass("focus-visual");
                    } else {
                        //$(customSelects[i]).find(".ui-btn").removeClass("focus-visual");
                    }
                }

            }

        }
	}
}