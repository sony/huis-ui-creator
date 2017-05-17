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

                // Copy IImage.gatage_extensions to IGImage.garageExtensions
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
             * @param materialsRootPath {string}
             * @param dstRemoteId {string}
             * @param offsetY {number}
             * @return {ImageItem}
             */
            public clone(materialsRootPath: string = null, dstRemoteId: string = this.remoteId_, offsetY: number = 0): ImageItem {
                var newImage = new Model.ImageItem({
                    materialsRootPath: materialsRootPath,
                    remoteId: dstRemoteId
                });

                if (materialsRootPath == null) {
                    newImage.resolvedPathDirectory_ = this.resolvedPathDirectory_;
                }

                var newArea: IArea = $.extend(true, {}, this.area);
                newArea.y += offsetY;
                newImage.area = newArea;
                // 画像pathがremoteId（数字4桁）で始まっている場合は、remoteIdを変更
                if (this.path.match(/\d{4}\//)) {
                    newImage.path = dstRemoteId + "/" + path.basename(this.path);
                } else {
                    newImage.path = this.path;
                }
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
                newImage.resized = this.resized;


                return newImage;
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
                } else {
                    // 最初に指定した width / height と異なるものが指定されたら、resized を true にする。
                    // ただし一度 resized を true にしたら false にすることはない。
                    if (this.initialArea_.w !== val.w || this.initialArea_.h !== val.h) {
                        this.resized = true;
                    }
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
                this.resized = true;
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

            get resized(): boolean {
                return this.get("resized");
            }

            set resized(val: boolean) {
                this.set("resized", val);
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