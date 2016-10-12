/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
        let TAG = "[ImportManager]";
        export class ImportManager {

            private remoteId ;
            private filePathDecompressionFile: string; //一時的な作業フォルダのパス
            private face: IGFace;

            /*
            *コンストラクター
            */
            constructor() {

                //新しいremoteIdを取得
                //このとき、huisFilesの管理するリストにも、登録されてるので注意。途中で失敗した場合、削除する必要がある。
                this.remoteId = huisFiles.createNewRemoteId();

                // zipされたファイルは appData/Garage/tmp に展開されると想定
                this.filePathDecompressionFile = path.join(GARAGE_FILES_ROOT, "tmp").replace(/\\/g, "/");

              
            }


            readDecompressedFile() {
                let FUNCTION_NAME = TAG + "readDecompressionFile : ";

                //TODO:展開時に、remoteIdを取得。
                //展開されたファイルのもともとのremoteId
                let targetRemoteId: string = this.getDecompressedRemoteId();

                //読み込み対象のファイルの.faceファイルのパス
                let facePath = path.join(this.filePathDecompressionFile, targetRemoteId, targetRemoteId + ".face").replace(/\\/g, "/");

                //対象のデータをIGFaceとして読み込み
                this.face = huisFiles.parseFace(facePath, targetRemoteId, this.filePathDecompressionFile);
            }
           
            /*
            * インポート対象のファイルを、一時的な作業directoryにコピーする
            * @param targetFilePath{string} インポート対象として指定されたファイルのパス
            */
            copyTargetFiles(targetFilePath: string) {
                let FUNCTION_NAME = TAG + "copyTargetFiles : ";

                if (targetFilePath == null) {
                    console.warn(FUNCTION_NAME + "targetFilePath is invalid");
                    return;
                }

                //TODO:targetFilePathのファイルをすべて、 filePathDecompressionFileにコピー

            }

            /*
             * 展開されたファイルのフォルダ名から、圧縮前のremoteIdを取得する
             * 圧縮前のフォルダ名がremoteIdを表している。
             * @return {string} 展開されたリモコンのremoteIdを返す。みつからない場合nullを返す。
             */
            private getDecompressedRemoteId(): string{
                let FUNCTION_NAME = TAG + "getDecompressedRemoteId : ";

                let remoteId = null;
                let names = fs.readdirSync(this.filePathDecompressionFile);

                //ひとつもファイル・フォルダがみつからない場合
                if (names.length < 0) {
                    console.warn(FUNCTION_NAME + "there is no file in " + this.filePathDecompressionFile);
                    return null;
                }

                //ファイル・フォルダが一つ以上ある場合、(フォーマット的にはremoteIdと同名のフォルダがひとつあるのみなはず)
                if (names.length != 1) {
                    console.warn(FUNCTION_NAME + "there is too many file in " + this.filePathDecompressionFile);
                    return null;
                } else if (names.length == 1) {
                    //フォルダ名から、remoteIdを取得する。
                    remoteId = names[0];
                }

                return remoteId;
            }
          
		}
	}
} 