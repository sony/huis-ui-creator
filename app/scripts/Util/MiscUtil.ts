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
			public static ERROR_TYPE_NOERROR: number = 1;
			public static ERROR_FILE_ACCESS: number = 0;
			public static ERROR_TYPE_JPEG2000: number = -1;
			public static ERROR_TYPE_JPEGLOSSLESS: number = -2;
			public static ERROR_TYPE_NOT_JPEG: number = -3;
			public static ERROR_SIZE_TOO_LARGE: number = -10;


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
				console.log("MiscUtil::getAppropriatePath path=" + path);
				path = decodeURIComponent(path);
				if (path.indexOf('file:///') === 0) {
					path = path.split('file:///')[1];
				}
				if (en) {
					path = path.replace(/\\/g, "/");
				}

				return (path);
			}

			/**
			 * HUISが取り扱えるサイズの画像ファイルならERROR_TYPE_NOERRORを返す
			 * サイズ上限はGarage.MAX_IMAGE_FILESIZEで定義されている。
			 * @param path {string} [in] チェックしたいJPEG/PNGファイル
			 */
			checkFileSize(path: string): number {
				let s: Stats = null;

				try {
					let fd = fs.openSync(path, 'r');
					s = fs.fstatSync(fd);
					fs.closeSync(fd);
				} catch (e) {
					console.error("checkFileSize: " + e);
					return
				}
				// サイズチェック
				if (s.size >= MAX_IMAGE_FILESIZE) return (MiscUtil.ERROR_SIZE_TOO_LARGE);

				return (MiscUtil.ERROR_TYPE_NOERROR);
			}

			/**
			 * JPEGの種別を判定し、HUISが取り扱えるものならERROR_TYPE_NOERRORを返す
			 * @param path {string} [in] チェックしたいJPEGファイル
			 */

			checkJPEG(path: string): number {
				let b = new Buffer(8);

				try {

					let fd = fs.openSync(path, 'r');

					fs.readSync(fd, b, 0, 8, 0);
					fs.closeSync(fd);
				} catch (e) {
					console.error("checkJPEG: " + e);
					return (MiscUtil.ERROR_FILE_ACCESS);
				}
				// JPEG2000か
				if ((b[0] === 0) && (b[1] === 0)) {
					//console.log(b);
					return (MiscUtil.ERROR_TYPE_JPEG2000);
				}
				// JPEGか
				if ((b[0] !== 255) || (b[1] !== 216)) { // JPEGは0xFFD8から始まる。それ以外はJPEGではないのでエラー。
					//console.log(b);
					return (MiscUtil.ERROR_TYPE_NOT_JPEG);
				}  
				// JPEG losslessか
				if (b[3] === 238) {	 // JPEGは4バイトめが0xE0(JFIF)か0xE1(Exif)
					//console.log(b);
					return (MiscUtil.ERROR_TYPE_JPEGLOSSLESS); 
				}

				return (MiscUtil.ERROR_TYPE_NOERROR);
			}

		}
	}
}
