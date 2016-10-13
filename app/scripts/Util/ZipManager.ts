/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        export class ZipManager {

            static compress(files: string[], srcRoot: string, dstFile: string) {
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
                                    ZipManager.saveBlobToFile(blob, dstFile);
                                });
                            }
                        });
                    }

                    next();
                },
                    () => {
                        alert("create zip errored");
                    });
            }

            /**
             * Blobをファイルに出力
             * @param blob {Blob}
             * @param dstFile {string} 出力ファイル名（フルパス）
             */
            private static saveBlobToFile(blob: Blob, dstFile: string) {
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
                    alert("create file: " + dstFile);//★★
                };
                reader.readAsArrayBuffer(blob);
            }


            /**
             * zipファイルを解凍
             * @param zipFile {string} zipファイル（フルパス）
             * @param dstDir {string} 解凍先フォルダ（フルパス）
             */
            static decompress(zipFile: string, dstDir: string) {
                let fileData: NodeBuffer = fs.readFileSync(zipFile);
                let fileBlob = new Blob([fileData]);

                zip.createReader(new zip.BlobReader(fileBlob), (reader) => {
                    reader.getEntries((entries) => {
                        for (let entry of entries) {
                            entry.getData(new zip.BlobWriter(""), (blob) => {
                                if (!entry.directory) {
                                    ZipManager.saveBlobToFile(blob, path.join(dstDir, entry.filename));
                                }
                            });
                        }
                    });
                });
            }


        }
    }
}