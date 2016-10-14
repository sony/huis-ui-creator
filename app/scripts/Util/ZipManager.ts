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

                        writer.add(files[index], new zip.BlobReader(fileBlob), () => {
                            index++;

                            if (index < files.length) {
                                next();
                            } else {
                                writer.close((blob) => {
                                    let saveTask = ZipManager.saveBlobToFile(blob, dstFile);
                                    saveTask
                                        .done(() => { df.resolve() })
                                        .fail((err) => { df.reject(err) });
                                });
                            }
                        });
                    }

                    next();
                },
                    () => {
                        alert("create zip errored");
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
                    let result = new Uint8Array(reader.result);
                    let buf = new Buffer(result.length);
                    for (let i = 0; i < result.length; i++) {
                        buf.writeUInt8(result[i], i);
                    }

                    try {
                        fs.writeFileSync(dstFile, buf);
                        console.log("create file: " + dstFile);
                        df.resolve();
                    } catch (e) {
                        console.error("failed to write: " + dstFile);
                        console.error(e);
                        df.reject("failed to write: " + dstFile);
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
                    df.reject("failed to read a zip file: " + zipFile);
                    return promise;
                }

                zip.createReader(new zip.BlobReader(fileBlob), (reader) => {
                    reader.getEntries((entries) => {
                        if (entries.length <= 0) {
                            df.resolve();
                            return;
                        }

                        for (let entry of entries) {
                            entry.getData(new zip.BlobWriter(""), (blob) => {
                                if (!entry.directory) {
                                    let saveTask = ZipManager.saveBlobToFile(blob, path.join(dstDir, entry.filename));
                                    saveTask
                                        .done(() => { df.resolve() })
                                        .fail((err) => { df.reject(err) });
                                    
                                }
                            });
                        }
                    });
                });

                return promise;
            }


        }
    }
}