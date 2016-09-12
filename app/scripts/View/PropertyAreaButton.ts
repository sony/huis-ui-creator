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

        export class PropertyAreaButton extends PropertyAreaBase {

         
			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

          





            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////


            /*
             *保持しているモデルをプルダウンの内容に合わせてアップデートする。
             */
            updateModel() {
                super.updateModel();
                this.trigger("updateModel");
            }

          
           

        }
	}
}