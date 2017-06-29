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

        export namespace ImageResizeMode {
            export const CONTAIN: string = "contain";
            export const DEFAULT: string = CONTAIN;

            // COVER and STRETCH mode is not used now
            export const COVER: string = "cover";
            export const STRETCH: string = "stretch";
        }

        export class ImageItem extends Model.Item {

            private initialArea_: IArea;
            private initialResizeMode_: string;

            constructor(image: IImage, attributes?: any) {
                super(attributes, null);

                this.area = $.extend(true, {}, image.area);
                this.path = image.path;

                // Copy IImage.gatage_extensions to ImageItem.garageExtensions
                let garage_extensions: IGarageImageExtensions = image["garage_extensions"];
                if (garage_extensions != null) {
                    this.garageExtensions = {
                        original: garage_extensions.original,
                        resolvedOriginalPath: "",
                        resizeMode: garage_extensions.resize_mode
                    };
                } else {
                    this.garageExtensions = {
                        original: image.path,
                        resolvedOriginalPath: "",
                        resizeMode: ImageResizeMode.DEFAULT
                    }
                }
                return this;
            }

            /**
             * ImageItemの複製を生成
             *
             * @return {Model.ImageItem}
             */
            public clone(): Model.ImageItem {
                var newImage = new Model.ImageItem(this);

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

                return newImage;
            }

            reserveResizeImageFile(remoteId: string, outputDirPath?: string) {

                let convertedImage: IImage;

                // garageExtensionsにoriginal画像のパスを設定した上で、
                // 要素に合うサイズへのリサイズ処理を予約する。
                // この時のリサイズ処理後のファイル名は、
                // originalのファイル名に時間を追加してハッシュ化したものになる。
                let originalPath = this.garageExtensions.original;
                let resolvedOriginalPath = this.garageExtensions.resolvedOriginalPath;
                if (!resolvedOriginalPath) {
                    resolvedOriginalPath = Util.PathManager.resolveImagePath(originalPath);
                    this.garageExtensions.resolvedOriginalPath = resolvedOriginalPath;
                }
                let parsedPath = path.parse(resolvedOriginalPath);
                let newFileName = Model.OffscreenEditor.getEncodedPath(parsedPath.name + "_w" + this.area.w + "_h" + this.area.h + "_" + this.garageExtensions.resizeMode + parsedPath.ext) + parsedPath.ext;
                // ファイル名をSHA1エンコードして文字コードの非互換性を解消する

                let newFileFullPath: string;

                let newDirPath = HUIS_REMOTEIMAGES_ROOT;
                if (outputDirPath != null) {
                    newDirPath = path.join(outputDirPath, remoteId, REMOTE_IMAGES_DIRECTORY_NAME).replace(/\\/g, "/");
                }

                newFileFullPath = path.join(newDirPath, remoteId, newFileName).replace(/\\/g, "/");

                // editImage 内でパスが補正されることがあるので、補正後のパスをあらかじめ取得。
                // 補正は拡張子の付け替え。
                newFileFullPath = Model.OffscreenEditor.getEditResultPath(newFileFullPath, "image/png");

                this.path = path.relative(HUIS_REMOTEIMAGES_ROOT, newFileFullPath).replace(/\\/g, "/");

                // リサイズ待機リストに追加
                huisFiles.addWaitingResizeImageList({
                    src: this.garageExtensions.resolvedOriginalPath,
                    dst: newFileFullPath,
                    params: {
                        width: this.area.w,
                        height: this.area.h,
                        mode: this.garageExtensions.resizeMode,
                        force: true,
                        padding: true
                    }
                });
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

                if (this.garageExtensions != null) {
                    if (!this.garageExtensions.original) {
                        this.garageExtensions.original = this.path;
                    }
                } else {
                    this.garageExtensions = {
                        resizeMode: ImageResizeMode.DEFAULT,
                        original: this.path,
                        resolvedOriginalPath: this.resolvedPath
                    };
                }

                let convertedImage: IImage = {
                    area: this.area,
                    path: this.path,
                    garage_extensions: {
                        original: this.garageExtensions.original,
                        resize_mode: this.garageExtensions.resizeMode
                    }
                };

                return convertedImage;
            }

            /*
             * @return {boolen} 背景画像だった場合true, 違う場合falseを返す。
             */
            get isBackgroundImage(): boolean {
                let area: IArea = this.area;
                //TODO: develop Model.Area and isEqueal Method
                return area.x == HUIS_PAGE_BACKGROUND_AREA.x
                    && area.y == HUIS_PAGE_BACKGROUND_AREA.y
                    && area.w == HUIS_PAGE_BACKGROUND_AREA.w
                    && area.h == HUIS_PAGE_BACKGROUND_AREA.h
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

            set version(val: string) {
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

                } else {
                    this.resolvedPath = Util.PathManager.resolveImagePath(val);
                }
            }

            get resolvedPath(): string {
                return this.get("resolvedPath");
            }

            set resolvedPath(val: string) {

                this.resolvedPathCSS = JQUtils.encodeUriValidInCSS(val);

                this.set("resolvedPath", val);
            }

            get resolvedPathCSS(): string {
                return this.get("resolvedPathCSS");
            }

            set resolvedPathCSS(val: string) {
                this.set("resolvedPathCSS", val);
            }

            get properties(): string[] {
                return ["enabled", "area", "path", "resizeMode", "resizeOriginal"];
            }

            get itemType(): string {
                return "image";
            }

            get garageExtensions(): IGGarageImageExtensions {
                return this.get("garageExtensions");
            }

            set garageExtensions(val: IGGarageImageExtensions) {
                this.set("garageExtensions", val);
            }

            get resizeMode(): string {
                let garageExtensions = this.garageExtensions;
                let resizeMode = ImageResizeMode.DEFAULT;
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
                if (this.garageExtensions == null) {
                    console.error("garageExtensions is null");
                    return "";
                }
                return this.garageExtensions.original;
            }

            set resizeOriginal(val: string) {
                let changedResolvedOriginalPath: string = Util.PathManager.resolveImagePath(val);

                if (this.garageExtensions == null) {
                    console.error("garageExtensions is null");
                    return;
                }
                this.garageExtensions.original = val;
                this.garageExtensions.resolvedOriginalPath = changedResolvedOriginalPath;

                this.set("resizeOriginal", this.garageExtensions.resolvedOriginalPath);
            }

            get resizeResolvedOriginalPath(): string {
                let garageExtensions = this.garageExtensions;
                if (garageExtensions) {

                    if (garageExtensions.resolvedOriginalPath) {
                        return garageExtensions.resolvedOriginalPath;
                    } else {
                        garageExtensions.resolvedOriginalPath = Util.PathManager.resolveImagePath(garageExtensions.original);
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
                return JQUtils.encodeUriValidInCSS(this.resizeResolvedOriginalPath);
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
