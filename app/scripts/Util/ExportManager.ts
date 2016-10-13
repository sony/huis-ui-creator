/// <referecen path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
        let TAG = "[ExportManager]";
		
        export class ExportManager {

            private filePathBeforeCompressionFile: string; //一時的な作業フォルダのパス

            /*
             * コンストラクター
             */
             constructor() {
                 // zipされたファイルは一時的に appData/ Garage / export / 00XX に展開されると想定
                 this.filePathBeforeCompressionFile = path.join(GARAGE_FILES_ROOT, "export").replace(/\\/g, "/");
            }

            /*
             * エクスポートするファイルをzip化する前に一時フォルダに書き出しておく
             * 
             */
             outputTemporaryFolder(fromEdit : boolean) {
                 let FUNCTION_NAME = TAG + "outputTemporaryFolder : ";

                 //現在のfaceを読み込む。

                 //現在のfaceを書き出す。

                 //remoteimagesを変換する。

                 //remoteimagesをコピーする。

                 //cacheをコピーする
             }

		}
	}
}
