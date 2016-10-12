/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
        let TAG = "[ImportManager]";
        export class ImportManager {
            
            /*
             * importしたリモコンに割り当てるremoteIdを取得
            * @return {string} importしたリモコンに割り当てるremoteId。見つからない場合、nullを返す。
            */
            getNewRemoteId() : string{
                let FUNCTION_NAME = TAG + "getNewRemoteId : ";

                let newRemoteId: string = null;

                return newRemoteId;
            }



		}
	}
} 