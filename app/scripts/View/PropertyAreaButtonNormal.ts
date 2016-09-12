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

                //actinoの現在の値を設定
                this.setInputAction(order, stateId, inputType);

                //functionの現在の値を設定
                this.setFunctionNamePullDownOf(order, functionName);

                return $signalsContainer;

            }





            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
           * アクション設定用のpullldownMenuをgetする
           * @param order{number} 
           * @param stateid{number}
           */
            private getInputAction(order: number, stateId: number) {
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