/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        export class ZipManager {

            /**
             * 指定ファイルをzip圧縮する
             * @param files {string[]} 対象ファイル（srcRootからの相対パス）
             * @param srcRoot {string} filesの基準となるフォルダパス（フルパス）
             * @param dstFile {string} 出力するファイル名（フルパス）
             */
            static compress(files: string[], srcRoot: string, dstFile: string): CDP.IPromise<void> {
                console.log("start zip: " + srcRoot + " -> " + dstFile);
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                zip.createWriter(new zip.BlobWriter(""), (writer) => {
                    if (!files || files.length <= 0) return;
                    let index: number = 0;

                    function next() {
                        let filePath = path.resolve(srcRoot, files[index]);
                        let fileData: NodeBuffer;
                        let fileBlob: Blob;
                        try {
                            fileData = fs.readFileSync(filePath);
                            fileBlob = new Blob([fileData]);
                        } catch (e) {
                            console.error("failed to read a file: " + filePath);
                            console.error(e);
                            df.reject("failed to read a file: " + filePath);
                            return;
                        }

                        writer.add(files[index].replace(/\\/g, "/"), new zip.BlobReader(fileBlob), () => {
                            index++;

                            if (index < files.length) {
                                next();
                            } else {
                                writer.close((blob) => {
                                    ZipManager.saveBlobToFile(blob, dstFile)
                                        .done(() => {
                                            df.resolve()
                                        }).fail((err) => {
                                            df.reject(err)
                                        });
                                });
                            }
                        });
                    }

                    next();
                },
                    () => {
                        alert("create zip errored");
                        df.reject();
                    });

                return promise;
            }

            /**
             * Blobをファイルに出力
             * @param blob {Blob}
             * @param dstFile {string} 出力ファイル名（フルパス）
             */
            private static saveBlobToFile(blob: Blob, dstFile: string): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let dir = path.dirname(dstFile);
                if (!fs.existsSync(dir)) {
                    try {
                        console.log("mkdirs: " + dir);
                        fs.mkdirsSync(dir);
                    } catch (e) {
                        console.error("failed to mkdirs: " + dir);
                        console.error(e);
                        df.reject("failed to mkdirs: " + dir);
                        return promise;
                    }
                }

                let reader = new FileReader();
                reader.onload = function () {
                    try {
                        let result = new Uint8Array(reader.result);
                        let buf = new Buffer(result.length);
                        for (let i = 0; i < result.length; i++) {
                            buf.writeUInt8(result[i], i);
                        }

                        fs.writeFileSync(dstFile, buf);
                        console.log("create file: " + dstFile);
                        df.resolve();
                    } catch (e) {
                        console.error("failed to create file: " + dstFile);
                        df.reject();
                    }
                };
                reader.readAsArrayBuffer(blob);

                return promise;
            }


            /**
             * zipファイルを解凍
             * @param zipFile {string} zipファイル（フルパス）
             * @param dstDir {string} 解凍先フォルダ（フルパス）
             */
            static decompress(zipFile: string, dstDir: string): CDP.IPromise<void> {
                console.log("start unzip: " + zipFile + " -> " + dstDir);
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let fileData: NodeBuffer;
                let fileBlob: Blob;
                try {
                    fileData = fs.readFileSync(zipFile);
                    fileBlob = new Blob([fileData]);
                } catch (e) {
                    console.error("failed to read a zip file: " + zipFile);
                    console.error(e);
                    df.reject(e, ImportManager.createRemoteFileErrorMessage());
                    return promise;
                }

                zip.createReader(new zip.BlobReader(fileBlob), (reader) => {
                    reader.getEntries((entries) => {
                        if (entries.length <= 0) {
                            console.log("nothing to decompress");
                            df.resolve();
                            return;
                        }
                        console.log("find files: " + entries.length);

                        let saveTasks = new Array<JQueryPromise<void>>(entries.length);

                        for (let i = 0; i < entries.length; i++) {
                            let entry = entries[i];

                            saveTasks[i] = ZipManager.decompressOneFile(entry, dstDir);
                        }

                        $.when.apply($, saveTasks)
                            .then(() => {
                                console.log("finish decompress");
                                df.resolve();
                            }).fail((err) => {
                                console.log("failed to decompress: " + err);
                                df.reject(err, ImportManager.createRemoteFileErrorMessage());
                            });
                    });

                }, (error) => {
                    // hsrcファイル読み込み失敗
                    console.error("failed to read the hsrc file" + error);
                    df.reject(error, ImportManager.createRemoteFileErrorMessage());
                });

                return promise;
            }

            /**
             * zipエントリーの1ファイルを出力する
             * @param entry {zip.Entry} 出力するzipエントリー
             * @param dstDir {string} 出力先の基準フォルダ
             */
            private static decompressOneFile(entry: zip.Entry, dstDir: string): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                if (entry.directory) {
                    console.log("skip decompress: " + entry.filename);
                    let df = $.Deferred<void>();
                    let promise = CDP.makePromise(df);

                    df.resolve();
                    return promise;
                }

                entry.getData(new zip.BlobWriter(""), (blob) => {
                    ZipManager.saveBlobToFile(blob, path.join(dstDir, entry.filename))
                        .done(() => {
                            console.log("succeeded to decompress: " + entry.filename);
                            df.resolve();
                        }).fail(() => {
                            console.error("failed to decompress: " + entry.filename);
                            df.reject();
                        });
                });

                return promise;
            }
        }
    }
}