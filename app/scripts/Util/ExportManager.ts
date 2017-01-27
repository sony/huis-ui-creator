/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        let TAG = "[ExportManager]";

        export class ExportManager {

            private filePathBeforeCompressionFile: string; //一時的な作業フォルダのパス
            private targetRemoteId: string;
            private targetFaceName: string;
            private targetModules: Model.Module[];

            /**
             * コンストラクター
             * @param remoteId エクスポート対象のリモコンのremoteId
             * @param faceName エクスポート対象のリモコンのfaceファイル名
             * @param modules エクスポート対象のリモコンのモジュール
             */
             constructor(remoteId :string, faceName: string, modules: Model.Module[]) {
                 this.filePathBeforeCompressionFile = path.join(GARAGE_FILES_ROOT, "export").replace(/\\/g, "/");
                 this.targetRemoteId = remoteId;
                 this.targetFaceName = faceName;
                 this.targetModules = modules;
            }


            /**
             * エクスポートを実行
             * ファイル選択およびプログレスダイアログを表示し、実際のエクスポート処理を呼び出す
             */
             exec() {
                 let FUNCTION_NAME = TAG + "exec : ";
                 let options: Util.ElectronSaveFileDialogOptions = {
                     title: PRODUCT_NAME,
                     filters: [{ name: DESCRIPTION_EXTENSION_HUIS_IMPORT_EXPORT_REMOTE, extensions: [EXTENSION_HUIS_IMPORT_EXPORT_REMOTE] }]
                 };
                 electronDialog.showSaveFileDialog(
                     options,
                     (file) => {
                         if (!file ||
                             file.length == 0) {
                             return;
                         }

                         let dstFile = this.fixExportFileExtension(file);

                         let dialog: CDP.UI.Dialog = new CDP.UI.Dialog("#common-dialog-spinner", {
                             src: CDP.Framework.toUrl("/templates/dialogs.html"),
                             title: $.i18n.t("dialog.message.STR_GARAGE_DIALOG_MESSAGE_IN_EXPORTING")
                         });
                         dialog.show();
                         //console.time("export");
                         this.export(dstFile).then(() => {
                             //console.timeEnd("export");

                             //完了を示すダイアログにする。
                             var $dialog = $(".spinner-dialog");
                             var $spinner = $("#common-dialog-center-spinner");

                             $spinner.removeClass("spinner");//アイコンが回転しないようにする。
                             $spinner.css("background-image", 'url("../res/images/icon_done.png")');
                             $dialog.find("p").html($.i18n.t("dialog.message.STR_GARAGE_DIALOG_MESSAGE_EXPORT_DONE"));

                             setTimeout(() => {
                                 dialog.close();

                             }, DURATION_DIALOG_CLOSE);
                         }).fail((err) => {
                             // 失敗
                             this.showErrorDialog(err, FUNCTION_NAME);
                             dialog.close();
                         });
                     }
                 );
             }

             /**
              * 失敗時のダイアログを表示する。
              * err {Error} エラー内容
              * functionName {string} エラーが発生したfunction名
              */
             private showErrorDialog(err: Error, functionName: string) {

                 console.error(functionName + err);
                 electronDialog.showMessageBox({
                     type: "error",
                     message: $.i18n.t("dialog.message.STR_GARAGE_DIALOG_MESSAGE_EXPORT_FAIL"),
                     buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                     title: PRODUCT_NAME,
                 });

             }

            /**
             * エクスポートファイル名の拡張子がHUISリモコンファイルのものでない場合、
             * HUISリモコンファイルの拡張子を付与したファイル名を返す。
             * 元から正しい拡張子の場合はそのまま返す。
             * @param fileName {string} エクスポートファイル名
             * @return HUISリモコンファイルの拡張子付きファイル名
             */
             private fixExportFileExtension(filePath: string): string {
                 let fileName = path.basename(filePath);

                 if (fileName.length > EXTENSION_HUIS_IMPORT_EXPORT_REMOTE.length + 1 &&
                     fileName.lastIndexOf(EXTENSION_HUIS_IMPORT_EXPORT_REMOTE) == fileName.length - EXTENSION_HUIS_IMPORT_EXPORT_REMOTE.length) {
                     return filePath;
                 }

                 return filePath + "." + EXTENSION_HUIS_IMPORT_EXPORT_REMOTE;
             }

            /**
             * エクスポート処理
             * @param dstFile {string} エクスポートファイルの出力先（フルパス）
             */
             private export(dstFile: string): CDP.IPromise<void> {
                 let df = $.Deferred<void>();
                 let promise = CDP.makePromise(df);

                 this.deleteTmpFolerAsync()
                     .then(() => {
                         return this.outputTemporaryFolder(this.targetFaceName, this.targetModules);
                     }).then(() => {
                         return this.compress(dstFile);
                     }).then(() => {
                         this.deleteTmpFolder();
                         df.resolve();
                     }).fail(() => {
                         this.deleteTmpFolder();
                         df.reject();
                     });

                 return promise;
             }

            /*
             * エクスポートするファイルをzip化する前に一時フォルダに書き出しておく
             * @param faceName{string}:リモコン名
             * @param gmodules{IGModules} :書き出すリモコンにあるModule
             */
             private outputTemporaryFolder(faceName: string, gmodules: Model.Module[]): CDP.IPromise<void> {
                 let FUNCTION_NAME = TAG + "outputTemporaryFolder : ";
                 console.log("create temporary files: " + faceName);

                 let df = $.Deferred<void>();
                 let promise = CDP.makePromise(df);

                 if (!fs.existsSync(this.filePathBeforeCompressionFile)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(this.filePathBeforeCompressionFile);
                 }

                 let targetRemoteIdFolderPath = path.join(this.filePathBeforeCompressionFile, this.targetRemoteId).replace(/\\/g, "/");
                 if (!fs.existsSync(targetRemoteIdFolderPath)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(targetRemoteIdFolderPath);
                 }

                 let targetRemoteIdRemoteimagesFolderPath = path.join(targetRemoteIdFolderPath, REMOTE_IMAGES_DIRRECOTORY_NAME).replace(/\\/g, "/");
                 if (!fs.existsSync(targetRemoteIdRemoteimagesFolderPath)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(targetRemoteIdRemoteimagesFolderPath);
                 }

                 //コピー元のファイルパス ：展開されたリモコン のremoteImages
                 let src: string = path.join(HUIS_REMOTEIMAGES_ROOT, this.targetRemoteId).replace(/\\/g, "/");
                 //コピー先のファイルパス : HuisFiles以下のremoteImages
                 let dst: string = path.join(this.filePathBeforeCompressionFile, this.targetRemoteId, REMOTE_IMAGES_DIRRECOTORY_NAME, this.targetRemoteId).replace(/\\/g, "/");

                 if (!fs.existsSync(dst)) {// 存在しない場合フォルダを作成。
                     fs.mkdirSync(dst);
                 }

                 try {
                     
                     //画像をコピー
                     let syncTask = new Util.HuisDev.FileSyncTask();
                     syncTask.copyFilesSimply(src, dst, () => {

                         let cache = new Util.ButtonDeviceInfoCache(this.filePathBeforeCompressionFile, this.targetRemoteId );
                         // moduleが必要なのでキャンバスのレンダリング後にキャッシュ読み込み

                         //現在のfaceを書き出す。
                         huisFiles.updateFace(this.targetRemoteId, faceName, gmodules, cache, true, this.filePathBeforeCompressionFile)
                             .done(() => {

                                 //キャッシュファイルをコピー
                                 this.copyCache(targetRemoteIdFolderPath);

                                 console.log("succeeded to updateFace: " + this.targetRemoteId + ", " + faceName);
                                 df.resolve();
                             }).fail(() => {
                                 console.log("failed to updateFace: " + this.targetRemoteId + ", " + faceName);
                                 df.reject();
                             });

                     });
                 } catch (err) {
                     console.error(FUNCTION_NAME + err);
                     df.reject();
                 }

                 return promise;
             }

            /**
             * 圧縮対象のファイル一覧を作成
             */
             private findCompressTargetFiles(): string[] {
                 console.log("search target for compress] " + this.filePathBeforeCompressionFile);
                 if (!fs.existsSync(this.filePathBeforeCompressionFile)) {
                     return [];
                 }

                 let files = this.getFiles(this.filePathBeforeCompressionFile);

                 for (let i = 0; i < files.length; i++) {
                     files[i] = path.relative(this.filePathBeforeCompressionFile, files[i]);
                 }

                 return files;
             }

            /**
             * 対象のパス以下のファイル一覧を取得
             * @param targetPath {string} 対象パス
             */
             private getFiles(targetPath: string): string[] {
                 let stat = fs.lstatSync(targetPath);
                 if (!stat.isDirectory()) {
                     return [targetPath];
                 }

                 let tmpPath: string[] = [];
                 let children: string[] = fs.readdirSync(targetPath);
                 for (let child of children) {
                     tmpPath = tmpPath.concat(this.getFiles(path.join(targetPath, child)));
                 }

                 return tmpPath;
             }


            /**
             * 圧縮処理
             * @param dstFile {string} 出力ファイル名（フルパス）
             */
             private compress(dstFile: string): CDP.IPromise<void> {
                 console.log("compress: " + dstFile);
                 let df = $.Deferred<void>();
                 let promise = CDP.makePromise(df);

                 let files: string[];
                 try {
                     files = this.findCompressTargetFiles();
                 } catch (e) {
                     console.error("failed to find temporary files for compress: " + e);
                     df.reject();
                     return promise;
                 }

                 ZipManager.compress(files, this.filePathBeforeCompressionFile, dstFile)
                     .done(() => { df.resolve(); })
                     .fail(() => { df.reject(); });

                 return promise;
             }



            /*
            * エクスポートにつかう一時ファイルを削除する。
            */
             private deleteTmpFolder() {
                 console.log("delete temporary files");
                let FUNCTION_NAME = TAG + "deleteTmpFolder : ";
                let syncTask = new Util.HuisDev.FileSyncTask();
                syncTask.deleteDirectory(this.filePathBeforeCompressionFile);
             }


            /**
             * エクスポートに使う一時ファイルを非同期に削除する。
             */
             private deleteTmpFolerAsync(): CDP.IPromise<void> {
                 let df = $.Deferred<void>();
                 let promise = CDP.makePromise(df);

                 let syncTask = new Util.HuisDev.FileSyncTask();
                 if (fs.existsSync(this.filePathBeforeCompressionFile)) {
                     syncTask.deleteDirectory(this.filePathBeforeCompressionFile, (err) => {
                         if (err) {
                             df.reject();
                         } else {
                             df.resolve();
                         }
                     });
                 } else {
                     df.resolve();
                 }

                 return promise;
             }

            /*
            * エクスポート対象のキャッシュを一時フォルダにコピーする。
            * @param コピー先のフォルダ
            * @return キャッシュファイルがないときnullを変えす。
            */
            private copyCache(filePath : string) {
                let FUNCITON_NAME = TAG + "copyCache : ";

                try {
                    //エクスポート対象のキャッシュファイルを読み込み先
                    let cacheReadFilePath = path.join(HUIS_FILES_ROOT, this.targetRemoteId, this.targetRemoteId + "_buttondeviceinfo.cache");
                    if (!fs.existsSync(cacheReadFilePath)) {
                        return null;
                    }

                    //コピー先に書き出す作成
                    let outputDirectoryPath: string = filePath;
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
