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


/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length */

module Garage {
    export module Model {
        var TAG = "[Garage.Model.ImageItem] ";
        import JQUtils = Util.JQueryUtils;

        export class ImageItem extends Model.Item {

            private resolvedPathDirectory_: string;
            private remoteId_: string;
            private initialArea_: IArea;
            private initialResizeMode_: string;

            // TODO: change constructor
            constructor(attributes?: any) {
                super(attributes, null);
                if (attributes) {
                    if (attributes.remoteId) {
                        this.resolvedPathDirectory_ = path.resolve(path.join(HUIS_FILES_ROOT, "remoteimages")).replace(/\\/g, "/");
                        this.remoteId_ = attributes.remoteId;
                    } else {
                        console.error("remoteId and rootpath is not set properly");
                    }
                }
            }

            /**
             * IImage を Model.ImageItem に変換する。主に garage_extensions を garageExtensions に付け替え。
             *
             * @param images {IImage[]} [in] Model.ImageItem[] に変換する IImage[]
             * @return {Model.ImageItem[]} 変換された Model.ImageItem[]
             */
            setInfoFromIImage(image: IImage): Model.ImageItem {
                this.area = $.extend(true, [], image.area);
                this.path = image.path;

                // Copy IImage.gatage_extensions to ImageItem.garageExtensions
                let garage_extensions: IGarageImageExtensions = image["garage_extensions"];
                if (garage_extensions) {
                    this.garageExtensions = {
                        original: garage_extensions.original,
                        resolvedOriginalPath: "",
                        resizeMode: garage_extensions.resize_mode
                    };
                }
                return this;
            }

            /**
             * ImageItemの複製を生成
             *
             * @return {ImageItem}
             */
            public clone(): ImageItem {
                var newImage = new Model.ImageItem({
                    remoteId: this.remoteId_
                });

                newImage.resolvedPathDirectory_ = this.resolvedPathDirectory_;

                var newArea: IArea = $.extend(true, {}, this.area);
                newImage.area = newArea;
                newImage.path = this.path;
                newImage.resizeOriginal = this.resizeOriginal;

                if (this.version != null) {
                    newImage.version = this.version;
                }
                if (this.garageExtensions) {
                    newImage.garageExtensions = $.extend(true, {}, this.garageExtensions);
                }
                if (this.resizeResolvedOriginalPath) {
                    newImage.resizeResolvedOriginalPath = this.resizeResolvedOriginalPath;
                }
                if (this.resizeResolvedOriginalPathCSS) {
                    newImage.resizeResolvedOriginalPathCSS = this.resizeResolvedOriginalPathCSS;
                }
                if (this.areaRatio) {
                    newImage.areaRatio = $.extend(true, {}, this.areaRatio);
                }

                return newImage;
            }

            /**
             * Image データから module 化に不要な物を間引いて、
             * HUIS出力用のデータ形式に変換する。
             * また、リモコン編集時に画像のリサイズが発生している場合は、
             * image.path に image.garage_extensions.original をリサイズした画像のパスにする。
             * リサイズ処理自体はここでは行わない。
             *
             * @param {string} remoteId このButtonStateが所属するremoteId
             * @param {string} ourputDirPath faceファイルの出力先のディレクトリ
             * @return {IImage} 変換されたデータ
             */
            convertToHuisData(remoteId: string, outputDirPath?: string): IImage {

                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {
                    if (!garageExtensions.original) {
                        garageExtensions.original = this.path;
                    }
                } else {
                    garageExtensions = {
                        resizeMode: "contain",
                        original: this.path,
                        resolvedOriginalPath: this.resolvedPath
                    };
                }

                let convertedImage: IImage;

                // リサイズ後のファイル名を作る。
                // "this.png" の場合、"image_w<width>_h<height>_<resizeMode>.png" となる。
                // 例) "image_w200_h150_stretch.png"
                let originalPath = garageExtensions.original;
                let resolvedOriginalPath = garageExtensions.resolvedOriginalPath;
                if (!resolvedOriginalPath) {
                    resolvedOriginalPath = path.join(HUIS_REMOTEIMAGES_ROOT, originalPath).replace(/\\/g, "/");
                    garageExtensions.resolvedOriginalPath = resolvedOriginalPath;
                }
                let parsedPath = path.parse(resolvedOriginalPath);
                let newFileName = Model.OffscreenEditor.getEncodedPath(parsedPath.name + "_w" + this.area.w + "_h" + this.area.h + "_" + garageExtensions.resizeMode + parsedPath.ext) + parsedPath.ext;
                // ファイル名のをSHA1エンコードして文字コードの非互換性を解消する

                let newFileFullPath: string;

                let newDirPath = parsedPath.dir;
                if (outputDirPath != null) {
                    newDirPath = path.join(outputDirPath, remoteId, REMOTE_IMAGES_DIRECTORY_NAME).replace(/\\/g, "/");;
                }

                // original の画像が remoteimages 直下にある場合は、リサイズ後のファイルの保存先を各モジュールのディレクトリーにする
                // outputDirPathmがある場合は、remoteimages/[remoteid]のしたにコピーする
                if (originalPath.indexOf("/") === -1 || outputDirPath != null) {
                    newFileFullPath = path.join(newDirPath, remoteId, newFileName).replace(/\\/g, "/");
                } else {
                    newFileFullPath = path.join(newDirPath, newFileName).replace(/\\/g, "/");
                }
                // editImage 内でパスが補正されることがあるので、補正後のパスをあらかじめ取得。
                // 補正は拡張子の付け替え。
                newFileFullPath = Model.OffscreenEditor.getEditResultPath(newFileFullPath, "image/png");

                convertedImage = {
                    area: this.area,
                    path: path.relative(HUIS_REMOTEIMAGES_ROOT, newFileFullPath).replace(/\\/g, "/")
                };

                // リサイズ待機リストに追加
                huisFiles.addWaitingResizeImageList({
                    src: garageExtensions.resolvedOriginalPath,
                    dst: newFileFullPath,
                    params: {
                        width: this.area.w,
                        height: this.area.h,
                        mode: garageExtensions.resizeMode,
                        force: true,
                        padding: true
                    }
                });

                convertedImage.garage_extensions = {
                    original: garageExtensions.original,
                    resize_mode: garageExtensions.resizeMode
                };

                return convertedImage;
            }

            /**
             * getters and setters
             */
            get area(): IArea {
                return this.get("area");
            }

            set area(val: IArea) {
                if (!this.initialArea_) {
                    this.initialArea_ = $.extend(true, {}, val);
                }
                this.set("area", val);
            }

            get version(): string {
                return this.get("version");
            }

            set version(val : string){
                this.set("version", val);
            }

            get path(): string {
                return this.get("path");
            }

            set path(val: string) {
                this.set("path", val);
                // resolvedPath (PC上のフルパス) を設定する
                if (!path) {
                    // path が指定されていない場合は、resolvedPath も指定しない
                    this.resolvedPath = "";

                } else if (this.resolvedPathDirectory_) {
                    this.resolvedPath = path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/");
                }
            }

            get resolvedPath(): string {
                return this.get("resolvedPath");
            }

            set resolvedPath(val: string) {

                this.resolvedPathCSS = JQUtils.enccodeUriValidInCSS(val);

                this.set("resolvedPath", val);
            }

            get resolvedPathCSS(): string {
                return this.get("resolvedPathCSS");
            }

            set resolvedPathCSS(val: string) {
                this.set("resolvedPathCSS", val);
            }

            get properties(): string[]{
                return ["enabled", "area", "path", "resizeMode"];
            }

            get itemType(): string {
                return "image";
            }

            get pageBackground(): boolean {
                return this.get("pageBackground");
            }

            set pageBackground(val: boolean) {
                this.set("pageBackground", val);
            }

            get areaRatio(): IGAreaRatio {
                let areaRatio: IGAreaRatio = this.get("areaRatio");
                if (!areaRatio) {
                    // 未指定の場合は、親要素の全体の領域として返す
                    areaRatio = {
                        x: 0,
                        y: 0,
                        w: 1,
                        h: 1
                    };
                }
                return areaRatio;
            }

            set areaRatio(val: IGAreaRatio) {
                this.set("areaRatio", val);
            }

            get garageExtensions(): IGGarageImageExtensions {
                return this.get("garageExtensions");
            }

            set garageExtensions(val: IGGarageImageExtensions) {
                this.set("garageExtensions", val);
            }

            get resizeMode(): string {
                let garageExtensions = this.garageExtensions;
                let resizeMode = "contain";
                if (garageExtensions) {
                    if (garageExtensions.resizeMode) {
                        resizeMode = garageExtensions.resizeMode;
                    }
                }
                return resizeMode;
            }

            set resizeMode(val: string) {
                let garageExtensions: IGGarageImageExtensions = this.garageExtensions;
                if (garageExtensions) {
                    garageExtensions.resizeMode = val;
                } else {
                    garageExtensions = {
                        original: "",
                        resolvedOriginalPath: "",
                        resizeMode: val
                    };
                }
                this.garageExtensions = garageExtensions;
            }

            get resizeOriginal(): string {
                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {
                    return garageExtensions.original;
                }
                return "";
            }

            set resizeOriginal(val: string) {
                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {
                    garageExtensions.original = val;
                    if (this.remoteId_ === "common") {
                        // common フェイスはアプリの res 内にあるが、デバッグ版とパッケージ版でパスが変わるので、CDP.Framework.toUrl() で絶対パスを得る。
                        // file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す。
                        let resolvedOriginalPath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/images/"+val), true);
                        garageExtensions.resolvedOriginalPath = resolvedOriginalPath;
                    } else {
                        garageExtensions.resolvedOriginalPath = path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/");
                    }
                } else {
                    if (this.remoteId_ === "common") {
                        // common フェイスはアプリの res 内にあるが、デバッグ版とパッケージ版でパスが変わるので、CDP.Framework.toUrl() で絶対パスを得る。
                        // file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す。
                        let resolvedOriginalPath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/images/" + val), true);
                        garageExtensions = {
                            original: val,
                            resizeMode: "contain",
                            resolvedOriginalPath: resolvedOriginalPath
                        };
                    } else {
                        garageExtensions = {
                            original: val,
                            resolvedOriginalPath: path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/"),
                            resizeMode: "contain"
                        };
                    }
                }
                this.garageExtensions = garageExtensions;
            }

            get resizeResolvedOriginalPath(): string {
                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {

                    if (garageExtensions.resolvedOriginalPath) {
                        return garageExtensions.resolvedOriginalPath;
                    } else {
                        garageExtensions.resolvedOriginalPath = path.resolve(path.join(this.resolvedPathDirectory_, garageExtensions.original)).replace(/\\/g, "/");
                        this.garageExtensions = garageExtensions;
                        return garageExtensions.resolvedOriginalPath;
                    }
                }
                return "";
            }

            set resizeResolvedOriginalPath(val: string) {
                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {
                    garageExtensions.resolvedOriginalPath = val;
                    this.garageExtensions = garageExtensions;
                }

                this.set("resizeResolvedOriginalPath", val);
            }

            get resizeResolvedOriginalPathCSS(): string {
                //resizeResolvedOriginalPathCSSは、Windows用のパスを、CSSが読み取れるようにエンコードされた形。
                return JQUtils.enccodeUriValidInCSS(this.resizeResolvedOriginalPath);
            }

            set resizeResolvedOriginalPathCSS(val: string) {
                this.set("resizeResolvedOriginalPathCSS", val);
            }

            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {

                var image = {
                    "enabled": true,
                    "area": { "x": 0, "y": 0, "w": 100, "h": 100 },
                    "path": "",
                    "resolvedPath": "",
                    "resized": false
                };

                return image;
            }
        }
    }
}