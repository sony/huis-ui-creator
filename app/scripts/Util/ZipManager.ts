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
                        let fileData: NodeBuffer = fs.readFileSync(filePath);
                        let fileBlob = new Blob([fileData]);

                        writer.add(files[index], new zip.BlobReader(fileBlob), () => {
                            index++;

                            if (index < files.length) {
                                next();
                            } else {
                                writer.close((blob) => {
                                    let saveTask = ZipManager.saveBlobToFile(blob, dstFile);
                                    saveTask.done(() => { df.resolve() });
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
                    console.log("mkdirs: " + dir);
                    fs.mkdirsSync(dir);
                }

                let reader = new FileReader();
                reader.onload = function () {
                    let result = new Uint8Array(reader.result);
                    let buf = new Buffer(result.length);
                    for (let i = 0; i < result.length; i++) {
                        buf.writeUInt8(result[i], i);
                    }

                    fs.writeFileSync(dstFile, buf);
                    console.log("create file: " + dstFile);
                    df.resolve();
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

                let fileData: NodeBuffer = fs.readFileSync(zipFile);
                let fileBlob = new Blob([fileData]);

                zip.createReader(new zip.BlobReader(fileBlob), (reader) => {
                    reader.getEntries((entries) => {
                        for (let entry of entries) {
                            entry.getData(new zip.BlobWriter(""), (blob) => {
                                if (!entry.directory) {
                                    let saveTask = ZipManager.saveBlobToFile(blob, path.join(dstDir, entry.filename));
                                    saveTask.done(() => { df.resolve() });
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