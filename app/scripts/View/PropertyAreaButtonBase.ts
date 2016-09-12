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

			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
                this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");
                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInMacro();
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



            /*
             *保持しているモデルをプルダウンの内容に合わせてアップデートする。
             */
            updateModel() {

                this.trigger("updateModel");
            }







            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

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
                }else {
                    return true;
                }
            }

            //NaNか判定 Number.isNaNが使えないので代用
            protected isNaN(v) {
                return v !== v;
            }

             /*
            * JQuery要素が有効か判定する
            * @param $target{JQuery}判定対象
            * @return {boolean} 有効な場合、true
            */
            protected isValidJQueryElement($target: JQuery): boolean{
                if ($target.length == 0 || $target == null) {
                    return false;
                } else {
                    return true;
                }
            }


         

           

        }
	}
}