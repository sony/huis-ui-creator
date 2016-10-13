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

                 if (!fs.existsSync(this.filePathBeforeCompressionFile)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(this.filePathBeforeCompressionFile);
                 }

                 let targetRemoteIdFolderPath = path.join(this.filePathBeforeCompressionFile, this.targetRemoteId).replace(/\\/g, "/");
                 if (!fs.existsSync(targetRemoteIdFolderPath)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(targetRemoteIdFolderPath);
                 }

                 let targetRemoteIdRemoteimagesFolderPath = path.join(targetRemoteIdFolderPath, "remoteimages").replace(/\\/g, "/");
                 if (!fs.existsSync(targetRemoteIdRemoteimagesFolderPath)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(targetRemoteIdRemoteimagesFolderPath);
                 }
            
                 //コピー元のファイルパス ：展開されたリモコン のremoteImages
                 let src: string = path.join(HUIS_REMOTEIMAGES_ROOT, this.targetRemoteId).replace(/\\/g, "/");
                 //コピー先のファイルパス : HuisFiles以下のremoteImages
                 let dst: string = path.join(this.filePathBeforeCompressionFile, this.targetRemoteId, "remoteimages", this.targetRemoteId).replace(/\\/g, "/");

                 if (!fs.existsSync(dst)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(dst);
                 }

                 //キャッシュファイルをコピー
                 this.copyCache();

                 //画像をコピー
                 let syncTask = new Util.HuisDev.FileSyncTask();
                 try {
                     syncTask._copyCommonImages(src, dst, () => {
                         //現在のfaceを書き出す。
                         huisFiles.updateFace(this.targetRemoteId, faceName, gmodules, null, true, this.filePathBeforeCompressionFile).done(() => {
                             //成功時の処理
                             this.deleteTmpFolder();
                         }).fail(() => {
                             //失敗時の処理
                         });

                     });
                 } catch (err) {
                     console.error(FUNCTION_NAME + err);
                 }               

             }

            /*
            * エクスポートにつかう一時ファイルを削除する。
            */
            deleteTmpFolder() {
                let FUNCTION_NAME = TAG + "deleteTmpFolder : ";
                 
            }

            /*
            * インポート対象のキャッシュを読み込む,HuisFilesのしたに書き出す
            * @return キャッシュファイルがないときnullを変えす。
            */
            private copyCache() {
                let FUNCITON_NAME = TAG + "readCache : ";

                try {
                    //エクスポート対象のキャッシュファイルを読み込み先
                    let cacheReadFilePath = path.join(HUIS_FILES_ROOT, this.targetRemoteId, this.targetRemoteId + "_buttondeviceinfo.cache");

                    //コピー先のファイルパスを作成
                    let outputDirectoryPath: string = path.join(this.filePathBeforeCompressionFile, this.targetRemoteId).replace(/\\/g, "/");
                    if (!fs.existsSync(outputDirectoryPath)) {// 存在しない場合フォルダを作成。
                        fs.mkdirSync(outputDirectoryPath);
                    }
                    let outputFilePath: string = path.join(outputDirectoryPath, this.targetRemoteId + "_buttondeviceinfo.cache");
                    fs.copySync(cacheReadFilePath, outputFilePath);
                } catch (err) {
                    console.error(FUNCITON_NAME + "error occur : " + err);
                    return null;
                }

            }

            

		}
	}
}
