/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Util {
        let TAG = "[ImportManager]";
        import IPromise = CDP.IPromise;

        export class ImportManager {

            private filePathDecompressionFile: string; //一時的な作業フォルダのパス
            private decompressedRemoteId: string; //解答されたインポート対象のリモコンのID

            /*
            *コンストラクター
            */
            constructor() {
                

                // zipされたファイルは appData/Garage/tmp に展開されると想定
                this.filePathDecompressionFile = path.join(GARAGE_FILES_ROOT, "import").replace(/\\/g, "/");
                this.decompressedRemoteId = this.getDecompressedRemoteId(); 
            }


            /*
            * ファイルを読み込むダイアログを表示する。
            */
            showSelectFileDialog(callback? : Function) {
                var options: Util.ElectronOpenFileDialogOptions = {
                    properties: ["openFile"],
                    filters: [
                        { name: DESCRIPTION_EXTENSION_HUIS_IMPORT_EXPORT_REMOTE, extensions: [EXTENSION_HUIS_IMPORT_EXPORT_REMOTE] },
                    ],
                    title: PRODUCT_NAME, // Electron uses Appname as the default title
                };

                // 画像ファイルを開く
                electronDialog.showOpenFileDialog(
                    options,
                    (fileName: string[]) => {
                        //TODO:tmpへのコピーが完了してから、covert
                        this.copyTargetFiles(fileName[0]);
                        this.convertByNewRemoteIdInfo();
                        
                    }
                );
            }

            /*
            * インポートを実行する
            * @param callback{Function}インポート実行後に処理されるcallback
            */
            exec(callback?: Function) {

               
               
                let dialog: CDP.UI.Dialog = new CDP.UI.Dialog("#common-dialog-spinner", {
                    src: CDP.Framework.toUrl("/templates/dialogs.html"),
                    title: $.i18n.t("dialog.message.STR_GARAGE_DIALOG_MESSAGE_IN_IMPORTING")
                });
                dialog.show();
          

                this.convertByNewRemoteIdInfo().done(() => {
                    this.syncToHuis().done(() => {

                        if (callback) {
                            callback();
                        }

                        // ダイアログが閉じられたら、コールバックを呼び出し終了
                        var $dialog = $(".spinner-dialog");
                        var $spinner = $("#common-dialog-center-spinner");

                        $spinner.removeClass("spinner");//アイコンが回転しないようにする。
                        $spinner.css("background-image", 'url("../res/images/icon_done.png")');
                        $dialog.find("p").html($.i18n.t("dialog.message.STR_GARAGE_DIALOG_MESSAGE_IMPORT_DONE"));

                        setTimeout(() => {
                          

                            if (dialog) {
                                dialog.close();
                            }
                        },DURATION_DIALOG_CLOSE);
                            
                    });
                });
               
            }


            /*
            * HUISと同期する。
            */
            syncToHuis(): IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                if (HUIS_ROOT_PATH) {
                    let syncTask = new Util.HuisDev.FileSyncTask();
                    syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, false, null, null, (err) => {
                        
                        if (err) {
                            // [TODO] エラー値のハンドリング
                            electronDialog.showMessageBox({
                                type: "error",
                                message: $.i18n.t("dialog.message.STR_DIALOG_INIT_SYNC_WITH_HUIS_ERROR"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                title: PRODUCT_NAME,
                            });
                            df.fail();
                        } else {
                            df.resolve();
                        }
                    });
                }

                return promise;

            }



            /*
             * 展開されたインポートファイルから、face情報を読み取る。
             * @return {IGFace} インポートされたリモコンのface情報
             */
            private readDecompressedFile() :IGFace{
                let FUNCTION_NAME = TAG + "readDecompressionFile : ";

                //展開されたファイルのもともとのremoteId
                let targetRemoteId: string = this.decompressedRemoteId;

                //読み込み対象のファイルの.faceファイルのパス
                let facePath = path.join(this.filePathDecompressionFile, targetRemoteId, targetRemoteId + ".face").replace(/\\/g, "/");

                //対象のデータをIGFaceとして読み込み
                return huisFiles.parseFace(facePath, targetRemoteId, this.filePathDecompressionFile);
            }


            /*
             * インポート対象のキャッシュを読み込む,HuisFilesのしたに書き出す
             * @param newRemoteId{string} 書き出し時のremoteId
             * @return キャッシュファイルがないときnullを変えす。
             */
            private copyCache(newRemoteId:string) {
                let FUNCITON_NAME = TAG + "readCache : ";

                if (newRemoteId == null) {
                    console.warn(FUNCITON_NAME + "newRemoteId is invalid");
                    return null;
                }

                try {
                    //インポート対象のキャッシュファイルを読み込み先
                    let cacheReadFilePath = path.join(this.filePathDecompressionFile,this.decompressedRemoteId, this.decompressedRemoteId + "_buttondeviceinfo.cache");
              
                    //コピー先のファイルパスを作成
                    let outputDirectoryPath: string = path.join(HUIS_FILES_ROOT, newRemoteId).replace(/\\/g, "/");
                    if (!fs.existsSync(outputDirectoryPath)) {// 存在しない場合フォルダを作成。
                        fs.mkdirSync(outputDirectoryPath);
                    }
                    let outputFilePath: string = path.join(outputDirectoryPath, newRemoteId + "_buttondeviceinfo.cache");

                    

                    fs.copySync(cacheReadFilePath, outputFilePath);
                } catch (err) {
                    console.error(FUNCITON_NAME + "error occur : " + err);
                    return null;
                }
                
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


            /*
             * ファイル・フォルダ・モジュールのうち、ふるいremoteIdが書かれた箇所を新しいremoteIdに書き換える。
             */
            private convertByNewRemoteIdInfo(): IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let FUNCTION_NAME = TAG + "convertByNewRemoteIdInfo : ";

                //新しいremoteIdを取得
                //このとき、huisFilesの管理するリストにも、登録されてるので注意。途中で失敗した場合、削除する必要がある。
                let newRemoteId = huisFiles.createNewRemoteId();

                let face: IGFace = this.readDecompressedFile();
                let convertedFace: IGFace = $.extend(true, {}, face);

                //face名を変更
                convertedFace.remoteId = newRemoteId;

                //module内の情報を更新
                for (let i = 0; i < convertedFace.modules.length; i++){

                    //module内のremoteIdを更新
                    convertedFace.modules[i].remoteId = newRemoteId;

                    //module名を変更。
                    let newModuleName: string = null;
                    let moduleNameSeparate: string[] = face.modules[i].name.split("_");
                    let oldRemoteId: string = moduleNameSeparate[0];
                    let stringPage: string = moduleNameSeparate[1];
                    let pageNum: string = moduleNameSeparate[2];
                    newModuleName = newRemoteId + "_" + stringPage + "_" + pageNum;
                    convertedFace.modules[i].name = newModuleName;

                    //module内のbuttonのimageのfilePathを変更。
                    convertedFace.modules[i].button = this.convertButtonsFilePath(convertedFace.modules[i].button, newRemoteId);

                    //module内のimageのfilePathを変更。
                    convertedFace.modules[i].image = this.convertImagesFilePath(convertedFace.modules[i].image, newRemoteId);

                }

                //コピー元のファイルパス ：展開されたリモコン のremoteImages
                let oldRemoteId: string = this.decompressedRemoteId;
                let src: string = path.join(this.filePathDecompressionFile, oldRemoteId, "remoteimages", oldRemoteId).replace(/\\/g, "/");
                //コピー先のファイルパス : HuisFiles以下のremoteImages
                let dst: string = path.join(HUIS_REMOTEIMAGES_ROOT, newRemoteId).replace(/\\/g, "/");
                if (!fs.existsSync(dst)) {// 存在しない場合フォルダを作成。
                    fs.mkdirSync(dst);
                }

                //キャッシュファイルをコピー
                this.copyCache(newRemoteId);

                //画像をコピー
                let syncTask = new Util.HuisDev.FileSyncTask();
                try{
                    syncTask.copyFilesSimply(src, dst, () => {
                        huisFiles.updateFace(convertedFace.remoteId, convertedFace.name, convertedFace.modules, null, true).done(() => {
                            df.resolve();
                        }).fail(() => {
                            df.fail();
                        });
                       
                    });
                } catch (err) {
                    console.error(FUNCTION_NAME + err);
                    df.fail();
                }
                

                return promise;
                
            }



            /*
             * IGImage内のpathをを新しいremoteIdのものに変更する。
             * @param gimages{IGImage[]} pathを変更する対象
             * @param newRemoteId{string} 変更後のpathに入力するremoteId
             * @return {IGImages[]} pathを変更した後のIGImages
             */
            private convertImagesFilePath(gimages : IGImage[], newRemoteId : string):IGImage[]{
                let FUNCTION_NAME: string = TAG + "convertImageFilePath : ";

                if (gimages == null || gimages.length == 0) {
                    console.warn(FUNCTION_NAME + "gimages is invalid");
                    return;
                }

                if (newRemoteId == null) {
                    console.warn(FUNCTION_NAME + "newRemoteId is invalid");
                    return;
                }

                let result: IGImage[] = $.extend(true, [], gimages);;

                for (let i = 0; i < result.length; i++){
                    result[i].path = this.converFilePath(result[i].path, newRemoteId);
                    let extensions = result[i].garageExtensions;
                    if (extensions != null) {
                        extensions.original = this.converFilePath(extensions.original, newRemoteId);;
                        extensions.resolvedOriginalPath = this.converFilePath(extensions.resolvedOriginalPath, newRemoteId);
                        result[i].garageExtensions = extensions;
                    }
                }

                return result;
            }



            /*
             * IGButton内のIGImageのpathを新しいremoteIdのものに変更する。
             * @param gbuttons{IGButton[]} pathを変更する対象
             * @param newRemoteId{string} 変更後のpathに入力するremoteId
             * @return {IGImages[]} pathを変更した後のIGImages
             */
            private convertButtonsFilePath(gbuttons: IGButton[], newRemoteId: string): IGButton[] {
                let FUNCTION_NAME: string = TAG + "convertButtonFilePath : ";

                if (gbuttons == null || gbuttons.length == 0) {
                    console.warn(FUNCTION_NAME + "gbuttons is invalid");
                    return;
                }

                if (newRemoteId == null) {
                    console.warn(FUNCTION_NAME + "newRemoteId is invalid");
                    return;
                }


                let result: IGButton[] = $.extend(true, [], gbuttons);
                for (let i = 0; i < result.length; i++){
                    if (result[i].state != null && result[i].state.length >  0){
                        for (let j = 0; j < result[i].state.length; j++) {
                            result[i].state[j].image = this.convertImagesFilePath(result[i].state[j].image, newRemoteId);
                        }
                    }
                }
                
                return result;
            }

            /*
             * pathを新しいremoteIdのものに変更する。親のフォルダの名前を古いremoteIdから新しいremoteIdにする。
             * @param inputPath{string} もともとのパス
             * @param newRemoteId{string} 変更後のpathに入力するremoteId
             * @return {string} 変更後のpath.失敗したとき、nullを返す。変換する親のフォルダがないときそのまま返す。
             */
            private converFilePath(inputPath: string, newRemoteId: string): string{
                let FUNCTION_NAME: string = TAG + "convertImageFilePath : ";

                if (inputPath == null ) {
                    console.warn(FUNCTION_NAME + "inputPath is invalid");
                    return null;
                }

                if (newRemoteId == null) {
                    console.warn(FUNCTION_NAME + "newRemoteId is invalid");
                    return null;
                }

                let basename = path.basename(inputPath);
                let extname = path.extname(inputPath);
                let dirname = path.dirname(inputPath);

                let result: string = null;
                //親のフォルダがない場合、そのまま返す。
                // 親のフォルダがない場合、dirnameが"."となる
                if (dirname == null || dirname == ".") {
                    result = inputPath;
                } else if (dirname != null) {//親のフォルダがある場合、親フォルダ名をnewRemoteIdに
                    result = newRemoteId + "/" + basename;
                }

                return result ;

            }

		}
	}
} 