/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/


module Garage {
    export module Util {

        /**
        * @class HuisDev
        * @brief HUIS と    Grage 間でファイルのやりとりをするためのAPIを提供するユーティリティー
        */
        export module HuisDev {
            import Dialog = CDP.UI.Dialog;
            import DialogOptions = CDP.UI.DialogOptions;

            var TAG = "Util.HuisDev";
            const SPINNER_ID_SELECTER = "#common-dialog-center-spinner";
            const SPINNER_DIALOG_CLASS_SELECTER = ".spinner-dialog";

            if (Util.MiscUtil.isWindows()) {
                var usb_dev = require("usb_dev");
            }

            interface IDiffInfo {
                diff: string[];
                dir1Extra: string[];
                dir2Extra: string[];
            }

            export interface IProgress {
                cancel: () => void;
            }

            function getRelPathes(dirPath: string): string[] {
                var dirs = [dirPath];
                var pathes = [];
                //debug
                console.log("getRelPathes: dirPath " + dirPath);
                try {
                    while (dirs.length > 0) {
                        var dir = dirs.pop();
                        var names = fs.readdirSync(dir);

                        var len = names.length;
                        for (var i = 0; i < len; i++) {
                            var filePath = Util.PathManager.join(dir, names[i]);
                            if (fs.lstatSync(filePath).isDirectory()) {
                                dirs.push(filePath);
                            }
                            pathes.push(filePath);
                        }
                    }
                    var re = new RegExp(dirPath + "/*");
                    pathes.forEach((p: string, i: number, pathes: string[]) => {
                        pathes[i] = p.replace(re, "");
                    });
                    return pathes.reverse();
                } catch (err) {
                    throw err;
                }
            }

            function getRegExpResolved(inputString: string): string {
                inputString = inputString.replace(/\$/g, '\\$');
                inputString = inputString.replace(/\./g, '\\.');
                inputString = inputString.replace(/\(/g, '\\(');
                inputString = inputString.replace(/\)/g, '\\)');
                inputString = inputString.replace(/\^/g, '\\^');

                return inputString;
            }

            function getRelPathesAsync(dirPath: string): CDP.IPromise<string[]> {
                let df = $.Deferred<string[]>();
                let promise = CDP.makePromise(df);
                //debug
                console.log("getRelPathesAsync: dirPath " + dirPath);

                let dirs: string[] = [dirPath];
                let pathes: string[] = [];

                let proc = () => {
                    if (dirs.length <= 0) {
                        // 相対パス化
                        // 正規表現の特殊文字をエスケープ
                        let dirPathForRegExp = getRegExpResolved(dirPath);

                        let re = new RegExp(dirPathForRegExp + "/*");
                        pathes.forEach((p: string, i: number, pathes: string[]) => {
                            pathes[i] = p.replace(re, "");
                        });
                        df.resolve(pathes.reverse());
                    } else {
                        try {
                            let dir = dirs.pop();
                            let names = fs.readdirSync(dir);

                            for (let i = 0, l = names.length; i < l; i++) {
                                let filePath = Util.PathManager.join(dir, names[i]);
                                if (fs.lstatSync(filePath).isDirectory()) {
                                    dirs.push(filePath);
                                }
                                pathes.push(filePath);
                            }
                        } catch (err) {
                            console.error("getRelPathes exception: " + err);
                            df.reject(err);
                        }
                    }
                    setTimeout(proc);
                };
                setTimeout(proc);

                return promise;
            }

            function diff(dir1: string, dir2: string): IDiffInfo {
                let FUNCTION_NAME = TAG + "diff : ";

                var dir1Files, dir2Files;
                try {
                    dir1Files = getRelPathes(dir1);     //    相対パス
                    dir2Files = getRelPathes(dir2);     //    相対パス

                    var dir1ExtraFiles = [];  // dir1にだけ存在するファイル群
                    var dir2ExtraFiles = [];  // dir2にだけ存在するファイル群
                    var diffFiles = [];     //    名称は同じだが異なるファイル群
                    var temp = [];

                    // dir1にのみ含まれているファイルを算出
                    for (var i = 0; i < dir1Files.length; i++) {
                        if ($.inArray(dir1Files[i], dir2Files) === -1) {
                            dir1ExtraFiles.push(dir1Files[i]);
                        } else {
                            temp.push(dir1Files[i]);
                        }
                    }
                    // dir2にのみ含まれているファイルを算出
                    for (var i = 0; i < dir2Files.length; i++) {
                        if ($.inArray(dir2Files[i], dir1Files) === -1) {
                            dir2ExtraFiles.push(dir2Files[i]);
                        }
                    }
                    // 名称は同じだが異なるファイル群を算出
                    for (var i = 0; i < temp.length; i++) {

                        var dir1Stat = fs.lstatSync(getAbsPath(dir1, temp[i]));
                        var dir2Stat = fs.lstatSync(getAbsPath(dir2, temp[i]));

                        if (!dir1Stat && !dir2Stat) {
                            continue; // TODO エラー処理が必要
                        }
                        if ((dir1Stat.size === dir2Stat.size && dir1Stat.mtime.getTime() === dir2Stat.mtime.getTime()) ||
                            (dir1Stat.isDirectory() && dir2Stat.isDirectory())) {
                            continue;
                        }
                        diffFiles.push(temp[i]);
                    }
                    return { diff: diffFiles, dir1Extra: dir1ExtraFiles, dir2Extra: dir2ExtraFiles };
                } catch (err) {
                    console.error(FUNCTION_NAME + err);
                    throw err;
                }
            }

            function diffAsync(dir1: string, dir2: string, filter?: (path: string) => boolean): CDP.IPromise<IDiffInfo> {
                let FUNCTION_NAME = TAG + "diffAsync : ";

                let df = $.Deferred<IDiffInfo>();
                let promise = CDP.makePromise(df);

                let dir1Files: string[], dir2Files: string[];

                getRelPathesAsync(dir1).then((pathes) => {
                    dir1Files = pathes;
                    return getRelPathesAsync(dir2);
                }, () => {
                    df.reject();
                }).then((pathes) => {
                    dir2Files = pathes;

                    if (filter != null) {
                        dir1Files = dir1Files.filter(filter);
                        dir2Files = dir2Files.filter(filter);
                    }

                    let dir1ExtraFiles = [];  // dir1にだけ存在するファイル群
                    let dir2ExtraFiles = [];  // dir2にだけ存在するファイル群
                    let diffFiles = [];     //    名称は同じだが異なるファイル群
                    let temp = [];

                    // dir1にのみ含まれているファイルを算出
                    for (let i = 0, l = dir1Files.length; i < l; i++) {
                        if ($.inArray(dir1Files[i], dir2Files) === -1) {
                            dir1ExtraFiles.push(dir1Files[i]);
                        } else {
                            temp.push(dir1Files[i]);
                        }
                    }
                    // dir2にのみ含まれているファイルを算出
                    for (let i = 0, l = dir2Files.length; i < l; i++) {
                        if ($.inArray(dir2Files[i], dir1Files) === -1) {
                            dir2ExtraFiles.push(dir2Files[i]);
                        }
                    }

                    // 名称は同じだが異なるファイル群を算出
                    for (let i = 0, l = temp.length; i < l; i++) {
                        try {
                            var dir1Stat = fs.lstatSync(getAbsPath(dir1, temp[i]));
                            var dir2Stat = fs.lstatSync(getAbsPath(dir2, temp[i]));
                        } catch (err) {
                            console.error(FUNCTION_NAME + err);
                            df.reject();
                        }

                        if (!dir1Stat && !dir2Stat) {
                            continue; // TODO エラー処理が必要
                        }
                        // ファイル更新日時が±10秒までは同じファイルとして扱う
                        // 以下の点に注意
                        // 1. 10秒という値は例えば書き込むべきファイル数が膨大だった場合にも有効か
                        // 2. mtime.getTime()の値はWindowsの場合エポック日時からのミリ秒だが他のOSの場合も同じとは限らない
                        if ((dir1Stat.size === dir2Stat.size && Math.abs(dir1Stat.mtime.getTime() - dir2Stat.mtime.getTime()) < 10 * 1000) ||
                            (dir1Stat.isDirectory() && dir2Stat.isDirectory())) {
                            continue;
                        }
                        diffFiles.push(temp[i]);
                    }
                    let diffInfo: IDiffInfo = {
                        diff: diffFiles,
                        dir1Extra: dir1ExtraFiles,
                        dir2Extra: dir2ExtraFiles
                    };
                    df.resolve(diffInfo);
                }, () => {
                    df.reject();
                });

                return promise;
            }


            function getAbsPath(rootDir: string, relPath: string): string {
                return Util.PathManager.join(rootDir, relPath);
            }

            /**
             * @class FileSyncTask
             * @brief HUIS と PC のファイル同期を行う。同期中のキャンセル対応。
             */
            export class FileSyncTask {
                static ERROR_TYPE_CANCELED: string = "canceled";
                private $dialog;

                private _isCanceled: boolean;

                constructor() {
                    this._isCanceled = false;
                }

                private _cancel(): void {
                    this._isCanceled = true;
                }

                private _stopSpinner() {
                    var $spinner = $(SPINNER_ID_SELECTER);
                    $spinner.removeClass("spinner");//アイコンが回転しないようにする。
                }

                private _changeDialog(msg: string, imgPath: string) {
                    if (msg != null) {
                        var $dialog = $(SPINNER_DIALOG_CLASS_SELECTER);
                        $dialog.find("p").html(msg);
                    }
                    if (imgPath != null) {
                        var $spinner = $(SPINNER_ID_SELECTER);
                        $spinner.css("background-image", imgPath);
                    }
                }

                private _getDialog(): JQuery {
                    if (this.$dialog == null) {
                        this.$dialog = $(SPINNER_DIALOG_CLASS_SELECTER);
                    }
                    return this.$dialog;
                }

                private _isOpeningDialog(): boolean {
                    return this._getDialog()[0] != null;
                }

                /**
                 * HUIS と PC のファイル同期を実行する
                 * 
                 * @param srcRootDir {string} 同期元となるディレクトリーパス
                 * @param destRootDir {string} 同期先となるディレクトリーパス
                 * @param useDialog {boolean]
                 * @param dialogProps {DialogProps} 同期中に表示するダイアログのパラメーター
                 * @param actionBeforeCompelte {Fucntion()}
                 * @param callback {Function(err)} 成功または失敗したときに呼び出されるコールバック関数
                 * 
                 * @return {IProgress}
                 */
                exec(srcRootDir: string,
                    destRootDir: string,
                    useDialog: Boolean,
                    dialogProps?: DialogProps,
                    actionBeforeComplete?: () => void,
                    callback?: (err: Error) => void
                ): IProgress {
                    var dialog: Dialog = null;
                    this._isCanceled = false;
                    var errorValue: Error = null;
                    if (useDialog) {
                        if (dialogProps) {
                            let options = dialogProps.options;
                            let dialogTitle: string;
                            if (options && options.title) {
                                dialogTitle = options.title;
                            } else {
                                dialogTitle = "同期中です。";
                            }
                            let dialogSrc = CDP.Framework.toUrl("/templates/dialogs.html");

                            if (this._isOpeningDialog()) {
                                this._changeDialog(dialogTitle, dialogSrc);
                            } else {
                                dialog = new CDP.UI.Dialog(dialogProps.id, {
                                    src: dialogSrc,
                                    title: dialogTitle,
                                });
                                console.log("sync.exec dialog.show()");
                                dialog.show().css("color", "white");
                            }
                        }
                    }

                    setTimeout(() => {
                        this._syncHuisFiles(srcRootDir, destRootDir, (err) => {
                            if (err) {
                                console.error(TAG + "_syncHuisFiles    Error!!!");
                            } else {
                                console.log(TAG + "_syncHuisFiles Complete!!!");
                            }

                            if (useDialog) { //ダイアログを使う際は,完了ダイアログを表示。
                                var DURATION_DIALOG: number = 3000;//完了ダイアログの出現時間

                                // ダイアログが閉じられたら、コールバックを呼び出し終了
                                if (dialogProps.options.anotherOption.title && dialogProps.id === "#common-dialog-spinner") {//スピナーダイアログの場合
                                    //アイコンが回転しないようにする
                                    this._stopSpinner();
                                    //アイコンの見た目、メッセージを変える。
                                    this._changeDialog(dialogProps.options.anotherOption.title, dialogProps.options.anotherOption.src);
                                }

                                setTimeout(() => {
                                    if (actionBeforeComplete) {
                                        actionBeforeComplete();
                                    }
                                });

                                setTimeout(() => {
                                    if (dialog) {
                                        dialog.close();
                                    }
                                    callback(err)
                                }, DURATION_DIALOG);
                            } else {//ダイアログを使わない際は、そのまま終了。
                                if (dialog) {
                                    dialog.close();
                                }
                                callback(err);
                            }
                        });
                    }, 100);
                    return { cancel: this._cancel };
                }

                // 対象のフォルダを中身ごと削除する
                // @param targetDirectoryPath{string} 削除するフォルダ
                // @param callback{(err: Error)=>void} 削除後に実行するコールバック
                public deleteDirectory(targetDirectoryPath: string, callback?: (err: Error) => void) {
                    let emptyDirectory = Util.PathManager.join(GARAGE_FILES_ROOT, "empty");
                    if (!fs.existsSync(emptyDirectory)) {// 存在しない場合フォルダを作成。
                        fs.mkdirSync(emptyDirectory);
                    }

                    let srcRootDir = emptyDirectory;
                    let destRootDir = targetDirectoryPath;

                    this._compDirs(srcRootDir, destRootDir)  // Directory間の差分を取得
                        .then((diffInfo: IDiffInfo) => {
                            // TODO: ディスクの容量チェック

                            var df = $.Deferred();
                            // srcRootDirで追加されたファイルや更新されたファイル群を、destRootDirにコピー
                            var copyTargetFiles = diffInfo.diff;
                            copyTargetFiles = copyTargetFiles.concat(diffInfo.dir1Extra);
                            this._copyFiles(srcRootDir, destRootDir, copyTargetFiles)
                                .then(() => {
                                    df.resolve(diffInfo.dir2Extra);
                                })
                                .fail((err) => {
                                    df.reject(err);
                                });
                            return CDP.makePromise(df);
                        }).then((removeTargetFiles: string[]) => {
                            var df = $.Deferred();
                            // destRootDirの余分なファイルやディレクトリを削除
                            this._removeFiles(destRootDir, removeTargetFiles)
                                .then(() => {
                                    df.resolve();
                                    fs.remove(emptyDirectory);
                                    fs.removeSync(targetDirectoryPath);

                                    if (callback) {
                                        callback(null);
                                    }
                                })
                                .fail((err) => {
                                    df.reject(err);
                                });

                            return CDP.makePromise(df);
                        }).then(() => {
                            if (callback) {
                                callback(null);    // 成功
                            }
                        }).fail((err) => {
                            callback(err);
                        });


                }

                private isSyncTarget(path: string): boolean {
                    return path.match(/\.app($|\/)/) == null
                        && path.match(/\.Trashes/) == null
                        && path.match(/\.Spotlight/) == null;
                }

                /**
                 * デフォルトのRemoteImagesを除去するフィルターを返す
                 * @return {(path: string) => boolean} Default の RemoteImages ファイルを除去するフィルター
                 */
                private getIgnoreRemoteImagesFilter(): (path: string) => boolean {
                    let filter = (path: string): boolean => {
                        let isNeed: boolean = path.match(/remoteimages\/white/) == null
                            && path.match(/remoteimages\/black/) == null
                            && path.match(/remoteimages\/IMG*/) == null;
                        return isNeed;
                    };
                    return filter;
                }

                // destRootDirの中身を、srcRootDirの中身と同期させる関数
                // TODO: 作成中にデバイスが抜かれたときなどのケースにおける対応方法は、後で検討予定
                private _syncHuisFiles(srcRootDir: string, destRootDir: string, callback?: (err: Error) => void): void {
                    let FUNCTION_NAME = TAG + "_syncHuisFiles : ";

                    let syncFileFilter = (path: string) => {
                        if (this.isSyncTarget(path)) {
                            return true;
                        } else {
                            console.log("filtered from sync " + path);
                            return false;
                        }
                    }

                    this._compDirs(srcRootDir, destRootDir, syncFileFilter)  // Directory間の差分を取得
                        .then((diffInfo: IDiffInfo) => {
                            // TODO: ディスクの容量チェック

                            var df = $.Deferred();
                            // srcRootDirで追加されたファイルや更新されたファイル群を、destRootDirにコピー
                            var copyTargetFiles = diffInfo.diff;
                            copyTargetFiles = copyTargetFiles.concat(diffInfo.dir1Extra);
                            let filterdTargetFiles: string[] = copyTargetFiles.filter(this.getIgnoreRemoteImagesFilter());
                            this._copyFiles(srcRootDir, destRootDir, filterdTargetFiles)
                                .then(() => {
                                    df.resolve(diffInfo.dir2Extra);
                                })
                                .fail((err) => {
                                    df.reject(err);
                                });
                            return CDP.makePromise(df);
                        }).then((removeTargetFiles: string[]) => {
                            var df = $.Deferred();
                            // destRootDirの余分なファイルやディレクトリを削除
                            this._removeFiles(destRootDir, removeTargetFiles)
                                .done(() => {
                                    callback(null);    // 成功
                                    df.resolve();
                                })
                                .fail((err) => {
                                    df.reject(err);
                                });
                            df.resolve();
                            return CDP.makePromise(df);
                        }).fail((err) => {
                            callback(err);
                        });
                }

                /*
                * srcRootDirのファイルを dstRootDirにコピーする。
                * execと異なり、dialogを表示したり、srcRootDirにない画像を削除しない。
                */
                copyFilesSimply(srcRootDir: string, dstRootDir: string, callback?: (err: Error) => void): CDP.IPromise<Error> {
                    var df = $.Deferred();
                    this._isCanceled = false;
                    var errorValue: Error = null;

                    setTimeout(() => {
                        this._compDirs(srcRootDir, dstRootDir)  // Directory間の差分を取得
                            .then((diffInfo: IDiffInfo) => {
                                // TODO: ディスクの容量チェック

                                var df = $.Deferred();
                                // srcRootDirで追加されたファイルや更新されたファイル群を、destRootDirにコピー
                                var copyTargetFiles = diffInfo.diff;
                                copyTargetFiles = copyTargetFiles.concat(diffInfo.dir1Extra);
                                this._copyFiles(srcRootDir, dstRootDir, copyTargetFiles)
                                    .then(() => {
                                        df.resolve(diffInfo.dir2Extra);
                                    })
                                    .fail((err) => {
                                        df.reject(err);
                                    });
                                return CDP.makePromise(df);
                            }).then(() => {
                                if (callback) {
                                    callback(null);    // 成功
                                } else {
                                    df.resolve();
                                }
                            }).fail((err) => {
                                if (callback) {
                                    callback(err);    // 成功
                                } else {
                                    df.reject(err);
                                }
                            });
                    }, 100);

                    return <CDP.IPromise<Error>>CDP.makePromise(df);
                }


                /**
                 * TODO: make public
                 * src で指定されたディレクトリの targetFiles を dst で指定された先にコピーするメソッド
                 * @param {string} srcRootDir コピー元のディレクトリパス
                 * @param {string} dstRootDir コピー先のディレクトリパス
                 * @param {string[]} targetFiles コピー対象のファイル
                 */
                private _copyFiles(
                    srcRootDir: string,
                    dstRootDir: string,
                    targetFiles: string[]
                ): CDP.IPromise<Error> {
                    let FUNCITON_NAME = TAG + "_copyFiles : ";
                    let df = $.Deferred<Error>();
                    let promise = CDP.makePromise(df);

                    // TODO: remove nop code
                    let files = targetFiles.slice();

                    let proc = () => {
                        let file: string;
                        if (files.length <= 0) {
                            df.resolve();
                        } else {
                            file = files.shift();
                            try {
                                this._checkCancel();
                                let option: CopyOptions = {
                                    preserveTimestamps: true,
                                    // TODO: move filter logic out of this method
                                    // ボタンデバイス情報のキャッシュファイルは本体に送らない
                                    filter: (function (src) { return src.indexOf(Util.FILE_NAME_BUTTON_DEVICE_INFO_CACHE) == -1; })
                                }
                                console.log(FUNCITON_NAME + "copy file (" + file + ")");
                                const srcAbstPath: string = getAbsPath(srcRootDir, file);
                                const dstAbstPath: string = getAbsPath(dstRootDir, file);
                                fs.copySync(srcAbstPath, dstAbstPath, option);
                                setTimeout(proc);
                            } catch (err) {
                                df.reject(err);
                            }
                        }
                    };

                    setTimeout(proc);

                    return promise;
                }

                private _removeFiles(dstRootDir: string, targetFiles: string[]): CDP.IPromise<Error> {
                    console.log("removeFiles");
                    console.log(targetFiles);
                    let df = $.Deferred<Error>();
                    let promise = CDP.makePromise(df);

                    let files = this._filterDeleteCandidates(dstRootDir, targetFiles.slice());

                    let proc = () => {
                        let file: string;
                        if (files.length <= 0) {
                            df.resolve();
                        } else {
                            file = files.shift();
                            try {
                                this._checkCancel();
                                let filePath = getAbsPath(dstRootDir, file);
                                if (fs.existsSync(filePath)) {
                                    let fileStat = fs.lstatSync(filePath);
                                    if (fileStat) {
                                        if (fileStat.isDirectory()) {
                                            console.log("remove: " + file);
                                            fs.removeSync(filePath);
                                        } else {
                                            console.log("unlinkSync: " + file);
                                            fs.unlinkSync(filePath);
                                        }
                                    } else {
                                        console.warn("fileStat is null: " + filePath);
                                    }
                                }

                                setTimeout(proc);
                            } catch (err) {
                                console.error("removeFiles exception: " + err);
                                df.reject(err);
                            }
                        }
                    };

                    setTimeout(proc);

                    return promise;
                }

                private _checkCancel(): void {
                    if (this._isCanceled) {
                        throw (new Error(FileSyncTask.ERROR_TYPE_CANCELED));
                    }
                }

                private _compDirs(dir1: string, dir2: string, filter?: (path: string) => boolean): CDP.IPromise<IDiffInfo> {
                    var df = $.Deferred();
                    var dir1Files, dir2Files;
                    try {
                        this._checkCancel();
                        setTimeout(() => {
                            diffAsync(dir1, dir2, filter).then((diffInfo) => {
                                df.resolve(diffInfo);
                            }, () => {
                                df.reject();
                            });
                        });
                    } catch (err) {
                        df.reject(err);
                    }
                    return <CDP.IPromise<IDiffInfo>>CDP.makePromise(df);
                }

                private _filterDeleteCandidates(dstRootDir: string, files: string[]): string[] {
                    let cacheFilteredFileList = this._filterDeviceInfoCache(dstRootDir, files);
                    let defaultRemoteImagesFiltered = this._filterDefaultRemoteImages(cacheFilteredFileList);
                    return defaultRemoteImagesFiltered;
                }

                private _filterDefaultRemoteImages(files: string[]): string[] {
                    return files.filter(this.getIgnoreRemoteImagesFilter());
                }

                /**
                 * 削除対象のファイルリストから残すべきキャッシュファイルのパスを除外したリストを返す
                 * @param dstRootDir {string} 
                 * @param files {string[]} 削除対象ファイルリスト
                 * @return 
                 */
                private _filterDeviceInfoCache(dstRootDir: string, files: string[]): string[] {
                    // キャッシュファイルのリスト
                    let cacheList = files.filter((file) => {
                        return (file.indexOf(Util.FILE_NAME_BUTTON_DEVICE_INFO_CACHE) != -1)
                    });

                    if (cacheList.length <= 0) {
                        console.log("cache file not found");
                        return files;
                    }
                    console.log("↓↓↓↓ cache list ↓↓↓↓");
                    cacheList.forEach((val) => { console.log(val); });
                    console.log("↑↑↑↑ cache list ↑↑↑↑");

                    // 削除対象外とするキャッシュのリスト
                    let cacheListToBeLeft = cacheList.filter((cache) => {
                        let cachePath = getAbsPath(dstRootDir, cache);

                        // キャッシュの上位フォルダが存在する場合は削除対象
                        return !files.some((file) => {
                            let path = getAbsPath(dstRootDir, file);
                            if (fs.existsSync(path)) {
                                let fileStat = fs.lstatSync(path);
                                if (fileStat &&
                                    fileStat.isDirectory() &&
                                    cachePath.indexOf(path) != -1) {
                                    // キャッシュの上位フォルダの場合はtrue
                                    return true;
                                }
                            }

                            return false;
                        });
                    });

                    if (cacheListToBeLeft.length <= 0) {
                        console.log("↓↓↓↓ left cache not found ↓↓↓↓");
                        files.forEach((val) => { console.log(val); });
                        console.log("↑↑↑↑ left cache not found ↑↑↑↑");
                        return files;
                    }
                    console.log("↓↓↓↓ cache to be left list ↓↓↓↓");
                    cacheListToBeLeft.forEach((val) => { console.log(val); });
                    console.log("↑↑↑↑ cache to be left list ↑↑↑↑");

                    // 削除対象リストから削除対象外キャッシュを除外
                    return files.filter((file) => {
                        return !cacheListToBeLeft.some((leftCache) => {
                            return (leftCache == file);
                        });
                    });
                }
            }

            /**
             * 指定したふたつのディレクトリーに差分があるかチェックする
             * 
             * @param dir1 {string} 差分チェックするディレクトリー
             * @param dir2 {string} 差分チェックの対象となるディレクトリー
             * @dialogProps {DialogProps} 差分比較中に表示するダイアログのパラメーター
             * @callback {Function} 差分比較完了後に呼び出されるコールバック関数
             */
            export function hasDiffAsync(dir1: string, dir2: string, dialogProps?: DialogProps, callback?: Function) {
                let dialog: Dialog = null;
                let result = false;

                if (dialogProps) {
                    let id = dialogProps.id;
                    let options = dialogProps.options;
                    let dialogTitle: string;
                    if (options && options.title) {
                        dialogTitle = options.title;
                    } else {
                        dialogTitle = "同期中です。";
                    }
                    dialog = new CDP.UI.Dialog(dialogProps.id, {
                        src: CDP.Framework.toUrl("/templates/dialogs.html"),
                        title: dialogTitle,
                    });
                    dialog.show().css("color", "white")
                        .on("popupafterclose", (event: JQueryEventObject) => {
                            // ダイアログが閉じられたら、コールバックを呼び出し終了
                            if (callback) {
                                callback(result);
                            }
                        });
                }
                setTimeout(() => {
                    diffAsync(dir1, dir2)
                        .then((diffInfo) => {
                            if (diffInfo) {
                                // 取得した差分情報から、差分があるかチェック
                                if (diffInfo.diff.length === 0 && diffInfo.dir1Extra.length === 0 && diffInfo.dir2Extra.length === 0) {
                                    result = false;
                                } else {
                                    result = true;
                                }
                            } else {
                                result = false;
                            }
                            if (dialog) {
                                // ダイアログを表示している場合は、ダイアログを閉じる。
                                // ダイアログの "popupafterclose" イベントを受け取ったら、コールバック関数を呼び出す
                                console.log("hasDiff dialog.close()");
                                dialog.close();
                            } else {
                                // ダイアログを表示していない場合は、このままコールバック関数を呼び出す
                                if (callback) {
                                    callback(result);
                                }
                            }
                        });
                });
            }



            /**
             * ふたつのディレクトリーに差分があるかチェック
             * 
             * @param dir1 {string} 差分チェックするディレクトリー
             * @param dir2 {string} 差分チェックの対象となるディレクトリー
             * 
             * @return {boolean} 差分があれば true, 差分がなければ false
             */
            export function hasDiff(dir1: string, dir2: string): boolean {
                try {
                    var info: IDiffInfo = diff(dir1, dir2);
                    if (!info) {
                        return false;
                    }
                    return !(info.diff.length === 0 && info.dir1Extra.length === 0 && info.dir2Extra.length === 0);
                } catch (err) {
                    throw err;
                }
            }


            /**
             * 指定したベンダーID, プロダクトIDのデバイスのルートパスを返す
             * 
             * @param vendorId {number} ベンダーID
             * @param productId {number} プロダクトID
             * 
             * @return {string} vendorId, productId となるデバイするのルートパスを返す。見つからない場合は null
             */
            export function getHuisRootPath(vendorId: number, productId: number): string {
                if (Util.MiscUtil.isWindows()) {
                    const rootPath: string = usb_dev.getPath(vendorId, productId);
                    if (rootPath === "") {
                        return null;
                    }
                    return rootPath;
                } else if (Util.MiscUtil.isDarwin()) {
                    return "/Volumes/HUIS-100RC";
                }

                console.error("Error: unsupported platform");
                return null;
            }
        }
    }
}
