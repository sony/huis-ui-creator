/// <referecen path="../include/interfaces.d.ts" />

module Garage {
	export module Util {

		var TAGS = {
			MiscUtil: "[Garage.Util.MiscUtil] ",
		};

		/**
		 * @class MiscUtil
		 * @brief その他のユーティリティーを集めたクラス
		 */
		export class MiscUtil {

			constructor() {
				if (!fs) {
					fs = require("fs-extra");
				}
				if (!path) {
					path = require("path");
				}
			}
			
			/**
			 * ファイルパスの file:/// スキームを除去、ファイルパス内のパーセントエンコーディングをデコード、\→/の変換を行う
			 * プログラム内部でパスの解決にURLを使っている箇所で利用される
			 * 
			 * @param path {string} [in] 入力となるパス。
			 * @param en {Boolean} [in] \記号の変換を行うかどうか(trueで行う)。
			 * @return {string} 変換後のパス
			 */

			getAppropriatePath(path: string, en?: Boolean): string {
				path = decodeURIComponent(path);
				if (path.indexOf('file:///') === 0) {
					path = path.split('file:///')[1];
				}
				if (en) {
					path = path.replace(/\\/g, "/");
				}

				return (path);
			}

		}
	}
}
