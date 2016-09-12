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
                  
                };
            }





            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////


            /*
             *保持しているモデルをプルダウンの内容に合わせてアップデートする。
             */
            updateModel() {
                this.trigger("updateModel");
            }

            /*
            * 保持しているモデルの内容でプルダウンを描画する
            */
            renderView(): JQuery {
                let FUNCTION_NAME = TAG + "renderView";

                

                return

            }
          
           

        }
	}
}