module Garage {
	export module Util {

		/**
		* @class HuisDev
		* @brief HUIS と	Grage 間でファイルのやりとりをするためのAPIを提供するユーティリティー
		*/
		export module HuisDev {
			import Dialog = CDP.UI.Dialog;
			import DialogOptions = CDP.UI.DialogOptions;

			var TAG = "Util.HuisDev";

			var usb_dev = require("usb_dev");

			interface IDiffInfo	{
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
							var filePath = path.join(dir, names[i]).replace(/\\/g, "/");
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
						let re = new RegExp(dirPath + "/*");
						pathes.forEach((p: string, i: number, pathes: string[]) => {
							pathes[i] = p.replace(re, "");
						});
						df.resolve(pathes.reverse());
					} else {
						try {
							let dir = dirs.pop();
							let names = fs.readdirSync(dir);

							for (let i = 0, l = names.length; i < l; i++) {
								let filePath = path.join(dir, names[i]).replace(/\\/g, "/");
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
				var dir1Files, dir2Files;
				try {
					dir1Files = getRelPathes(dir1);	 //	相対パス
					dir2Files = getRelPathes(dir2);	 //	相対パス

					var dir1ExtraFiles = [];  // dir1にだけ存在するファイル群
					var dir2ExtraFiles = [];  // dir2にだけ存在するファイル群
					var diffFiles = [];	 //	名称は同じだが異なるファイル群
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
					throw err;
				}
			}

            function diffAsync(dir1: string, dir2: string): CDP.IPromise<IDiffInfo> {

				let df = $.Deferred<IDiffInfo>();
				let promise = CDP.makePromise(df);

				let dir1Files: string[], dir2Files: string[];

				getRelPathesAsync(dir1).then((pathes) => {
					dir1Files = pathes;
					return getRelPathesAsync(dir2);
				}).then((pathes) => {
					dir2Files = pathes;

					let dir1ExtraFiles = [];  // dir1にだけ存在するファイル群
					let dir2ExtraFiles = [];  // dir2にだけ存在するファイル群
					let diffFiles = [];	 //	名称は同じだが異なるファイル群
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
						var dir1Stat = fs.lstatSync(getAbsPath(dir1, temp[i]));
						var dir2Stat = fs.lstatSync(getAbsPath(dir2, temp[i]));
						if (!dir1Stat && !dir2Stat) {
							continue; // TODO エラー処理が必要
						}
						// ファイル更新日時が±10秒までは同じファイルとして扱う
						// 以下の点に注意
						// 1. 10秒という値は例えば書き込むべきファイル数が膨大だった場合にも有効か
						// 2. mtime.getTime()の値はWindowsの場合エポック日時からのミリ秒だが他のOSの場合も同じとは限らない
						if ((dir1Stat.size === dir2Stat.size && Math.abs(dir1Stat.mtime.getTime() - dir2Stat.mtime.getTime()) < 10*1000 ) ||
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
				});

				return promise;
			}


			function getAbsPath(rootDir: string, relPath: string): string {
				return path.join(rootDir, relPath).replace(/\\/g, "/");
			}

			/**
			 * @class FileSyncTask
			 * @brief HUIS と PC のファイル同期を行う。同期中のキャンセル対応。
			 */
			export class FileSyncTask {
				static ERROR_TYPE_CANCELED: string = "canceled";

				private _isCanceled: boolean;

				constructor() {
					this._isCanceled = false;
				}

				private _cancel(): void {
					this._isCanceled = true;
				}

				/**
				 * HUIS と PC のファイル同期を実行する
				 * 
				 * @param srcRootDir {string} 同期元となるディレクトリーパス
				 * @param destRootDir {string} 同期先となるディレクトリーパス
				 * @param dialogProps {DialogProps} 同期中に表示するダイアログのパラメーター
				 * @param callback {Function(err)} 成功または失敗したときに呼び出されるコールバック関数
				 * 
				 * @return {IProgress}
				 */
                exec(srcRootDir: string, destRootDir: string, useDialog: Boolean, dialogProps?: DialogProps, actionBeforeComplete?: () => void, callback?: (err: Error) => void): IProgress {
					var dialog: Dialog = null;
					this._isCanceled = false;
                    var errorValue: Error= null; 
                    if (useDialog) {
                        if (dialogProps) {
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
                            console.log("sync.exec dialog.show()");
                            dialog.show().css("color", "white");

                        }
                    }


					setTimeout(() => {
						this._syncHuisFiles(srcRootDir, destRootDir, (err) => {
							if (err) {
								console.error(TAG + "_syncHuisFiles	Error!!!");
							} else {
								console.log(TAG + "_syncHuisFiles Complete!!!");
                            }

                            if (useDialog) { //ダイアログを使う際は,完了ダイアログを表示。
                                var DURATION_DIALOG: number = 3000;//完了ダイアログの出現時間

                                // ダイアログが閉じられたら、コールバックを呼び出し終了
                                if (dialogProps.options.anotherOption.title && dialogProps.id === "#common-dialog-spinner") {//スピナーダイアログの場合
                                    var $dialog = $(".spinner-dialog");
                                    var $spinner = $("#common-dialog-center-spinner");
                        
                                    $spinner.removeClass("spinner");//アイコンが回転しないようにする。
                                    if (dialogProps.options.anotherOption.src) {//アイコンの見た目を変える。
                                        $spinner.css("background-image", dialogProps.options.anotherOption.src);
                                    }
                                    if (dialogProps.options.anotherOption.title) {//メッセージを変える
                                        $dialog.find("p").html(dialogProps.options.anotherOption.title);
                                    }
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

          


				// destRootDirの中身を、srcRootDirの中身と同期させる関数
				// TODO: 作成中にデバイスが抜かれたときなどのケースにおける対応方法は、後で検討予定
				private _syncHuisFiles(srcRootDir: string, destRootDir: string, callback?: (err: Error) => void): void {
					this._compDirs(srcRootDir, destRootDir)  // Directory間の差分を取得
					.then((diffInfo: IDiffInfo)	=> {
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
						var	df = $.Deferred();
						// destRootDirの余分なファイルやディレクトリを削除
						this._removeFiles(destRootDir, removeTargetFiles)
							.then(() => {
								df.resolve();
							})
							.fail((err) => {
								df.reject(err);
							});
							df.resolve();
						return CDP.makePromise(df);
					}).then(() => {
							callback(null);	// 成功
					}).fail((err) => {
						callback(err);
					});
				}

				private _copyFiles(srcRootDir: string, dstRootDir: string, targetFiles: string[]): CDP.IPromise<Error> {
					let df = $.Deferred<Error>();
					let promise = CDP.makePromise(df);

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
                                    filter: (function (src) { return src.indexOf("_buttondeviceinfo.cache") == -1; })
                                }
								fs.copySync(getAbsPath(srcRootDir, file), getAbsPath(dstRootDir, file), option);
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

					let files = targetFiles.slice();

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
											fs.rmdirSync(filePath);
											console.log("rmdirSync: " + file);
										} else {
											fs.unlinkSync(filePath);
											console.log("unlinkSync: " + file);
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

                private _compDirs(dir1: string, dir2: string): CDP.IPromise<IDiffInfo> {
					var df = $.Deferred();
					var dir1Files, dir2Files;
					try {
						this._checkCancel();
						setTimeout(() => {
							diffAsync(dir1, dir2).then((diffInfo) => {
								df.resolve(diffInfo);
							});
						});
					} catch (err) {
						df.reject(err);
					}
					return CDP.makePromise(df);
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
			export function	getHuisRootPath(vendorId: number, productId: number): string {
				var	rootPath = usb_dev.getPath(vendorId, productId);
				if (rootPath === "") {
					return null;
				}
				return rootPath;
			}
		}
	}
}