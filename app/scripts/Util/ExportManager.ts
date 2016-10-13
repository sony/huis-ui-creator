/// <referecen path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
        let TAG = "[ExportManager]";
		
        export class ExportManager {

            private filePathBeforeCompressionFile: string; //一時的な作業フォルダのパス
            private targetRemoteId: string;

            /*
             * コンストラクター
             * @param エクスポート対象のリモコンのremoteId
             */
             constructor(remoteId :string) {
                 // zipされたファイルは一時的に appData/ Garage / export / 00XX に展開されると想定
                 this.filePathBeforeCompressionFile = path.join(GARAGE_FILES_ROOT, "export").replace(/\\/g, "/");
                 this.targetRemoteId = remoteId;
            }

            /*
             * エクスポートするファイルをzip化する前に一時フォルダに書き出しておく
             * @param faceName{string}:リモコン名
             * @param gmodules{IGModules} :書き出すリモコンにあるModule
             */
             outputTemporaryFolder(faceName:string, gmodules : IGModule[]) {
                 let FUNCTION_NAME = TAG + "outputTemporaryFolder : ";                 



                 //現在のfaceを書き出す。
                 huisFiles.updateFace(this.targetRemoteId, faceName, gmodules, null, this.filePathBeforeCompressionFile).done(() => {
                     //成功時の処理

                 }).fail(() => {
                    //失敗時の処理
                 });

                 //remoteimagesを変換する。

                 //remoteimagesをコピーする。

                 //cacheをコピーする
             }

		}
	}
}
