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

/// <reference path="../include/Interfaces.d.ts" />

/* tslint:disable:max-line-length */

module Garage {
    export module Model {

        import IPromise = CDP.IPromise;
        //import makePromise = CDP.makePromise;
        import Framework = CDP.Framework;

        var TAG: string = "[Garage.Model.OffscreenEditor] ";

        export interface IImageEditParams {
            imageType?: string;            //!< 出力する画像の mimeType ("image/png" or "image/jpeg"。未指定の場合は、"image/png")
            resize?: IImageResizeParams; //!<画像リサイズのためのパラメーター
            grayscale?: number;            //!< グレースケールの度合い (0～1.0)。1.0 は完全にグレースケール
        }

        export interface IImageResizeParams {
            width: number;            //!< リサイズ後の横サイズ
            height: number;            //!< リサイズ後の縦サイズ
            force?: boolean;        //!< 元の画像サイズよりも大きくなる場合でもリサイズするかどうか
            padding?: boolean;        //!< 指定したサイズでリサイズしたときに生じた余白を維持するかどうか
            mode?: string; //!< 画像の拡大縮小モード。contain (default) / cover / stretch のいずれか。
        }

        export interface IEditImageResults {
            dataUrl: string; //<! 編集した画像の data URL
            path: string; //<! 編集した画像の保存先のパス
        }

        /**
         * @class OffscreenEditor
         * @brief pixi.js を使ってリサイズやグレースケール変換等の簡単な画像編集を行う
         */
        export class OffscreenEditor {
            private imageSrc_: string;
            private renderer_: PIXI.SystemRenderer;

            /**
             * コンストラクター
             * 
             * @param 
             */
            constructor(imageSrc: string, renderer?: PIXI.SystemRenderer) {
                this.imageSrc_ = imageSrc;

                if (renderer) {
                    this.renderer_ = renderer;
                } else {
                    this.renderer_ = PIXI.autoDetectRenderer();
                }
            }

            /**
             * ハッシュ化が必要かどうか判断する。
             * ユーザー画像を指定した画像と、commonパーツの画像のみ有効にするため。
             * もともとのパスがremoteImagesの00XXがdstのパスでない場合は、ハッシュ化。
             * Screensaver機能の場合はハッシュ化をしない
             * TODO: editImageをもう少し汎用的にして、目的別にパラメータを変更して使うべき
             *
             * @param {string} dstPath 保存先のパス
             * @param {string} imageSrc 保存元のパス
             * @return {boolean} 
             */
            private static needHashName(dstPath: string, imageSrc: string): boolean {
                if (Model.ScreensaverDialog.isScreenSaverImage(dstPath)) {
                    return false;
                }
                let facePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/"));
                return imageSrc.indexOf(HUIS_REMOTEIMAGES_ROOT) === -1 && imageSrc.indexOf(facePath) === -1;
            }

            /**
             * 画像を編集し、編集した画像をファイル出力する
             * 
             * @param imageSrc {string} 編集する画像のパス
             * @param params {IImageEditparams} 画像編集のパラメーター
             * @param dstPath {string} 編集した画像の出力先のパス
             * @param {IPromise<IEditImageResults>} 編集結果。dstPath で指定したパスの拡張子が不適切な場合、適切な拡張子に変更されるので、出力ファイルパスは編集結果の path を参照すべき。
             */
            public static editImage(imageSrc: string, params: IImageEditParams, dstPath: string): IPromise<IEditImageResults>;
            /**
             * 画像を編集し、編集した画像の dataUrl を返す
             * 
             * @param imageSrc {string} 編集する画像のパス
             * @param params {IImageEditparams} 画像編集のパラメーター
             * @return {string} 編集した画像の dataUrl
             */
            public static editImage(imageSrc: string, params: IImageEditParams): IPromise<string>;

            public static editImage(imageSrc: string, params: IImageEditParams, dstPath?: string): IPromise<IEditImageResults | string> {
                let FUNCTION_NAME = TAG + "editImage : ";
                var df = $.Deferred();
                var promise: IPromise<IEditImageResults | string> = CDP.makePromise(df);
                var encodedDstPath = null;

                //変換するファイルが存在するか確認
                if (!fs.existsSync(imageSrc)) {
                    console.error(FUNCTION_NAME + imageSrc + "(imageSrc) does not exist");
                    df.reject();
                    return promise;
                }

                //imageSrcがディレクトリかどうか確認
                let fileStat = fs.lstatSync(imageSrc);
                if (fileStat != null && fileStat.isDirectory()) {
                    //imageSrcがファイル名ではなく、ディレクトリあった場合、エラー
                    console.error(FUNCTION_NAME + "imageSrc (" + imageSrc + ")is directory");
                    df.reject();
                    return promise;
                }

                console.log(TAG + "before editImage src: " + imageSrc);
                let loadPath = Util.JQueryUtils.encodeUriValidInCSS(imageSrc.replace(/\\/g, "/"));

                // 画像のロード
                OffscreenEditor.loadTexture(loadPath)
                    .done((texture: PIXI.Texture) => {

                        //textureから、画像のデータを取得する。
                        let imageWidth: number = 800;
                        let imageHeight: number = 600;
                        if (params.resize != null) {
                            imageWidth = params.resize.width;
                            imageHeight = params.resize.height;
                        }
                        var renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer =
                            PIXI.autoDetectRenderer(imageWidth, imageHeight, { transparent: true });
                        let imageDataUrl = OffscreenEditor.getDataUrlOfEditedImage(texture, params, renderer);
                        //画像データを取得したら、不要なrendererは削除する。
                        renderer.destroy(true);

                        // 出力先のパスが指定されている場合は、ファイル出力を行う
                        if (dstPath) {

                            if (OffscreenEditor.needHashName(dstPath, imageSrc)) {
                                dstPath = this.getEncodedPath(dstPath);
                            }

                            // Buffer オブジェクトを使用して、base64 デコーディング
                            let buffer = new Buffer(imageDataUrl.split("base64,")[1], "base64");

                            // imageType と指定したパスの拡張子が合わない場合は補正する。
                            dstPath = OffscreenEditor.getEditResultPath(dstPath, params.imageType);
                            encodedDstPath = OffscreenEditor.getEncodedPath(dstPath);

                            try {
                                fs.outputFileSync(dstPath, buffer);
                                console.log(TAG + "after editImage dst: " + dstPath);
                                df.resolve({
                                    dataUrl: imageDataUrl,
                                    path: dstPath
                                });
                            } catch (e) {
                                console.error(e);
                                df.reject(e);
                            }

                        } else { // 編集した画像の dataUrl を返す
                            df.resolve(imageDataUrl);
                        }
                    })
                    .fail(() => {
                        console.error(FUNCTION_NAME + "error occur in loadTexture");
                        df.reject();
                    });

                return promise;
            }

            /**
             * 指定したパスを、画像編集後のパスに補正する。
             * 指定したパスの拡張子が、指定した imageType のものと不整合がある場合は、適切な拡張子を追加する。
             * 指定したパスの拡張子に問題がない場合は、そのままのパスを返す。
             * 
             * @param dstPath {string} 編集後のパスの候補。
             * @param imageType {string} 画像編集後のフォーマットの type。"image/png", "image/jpeg" が有効。省略した場合、または無効な type を指定した場合は、 "image/png" として扱われる。
             * 
             * @return {string} 補正したパス
             */
            public static getEditResultPath(dstPath: string, imageType?: string): string {
                let extension = ".png";
                if (imageType === "image/jpeg") {
                    extension = ".jpg";
                }
                let dstPathExtension = path.extname(dstPath);
                if (dstPathExtension.toLowerCase() !== extension) {
                    dstPath += extension;
                }
                return dstPath;
            }

            /**
             * 指定したパスをSHA1ハッシュ値の名前に変更する。
             * 変更するのはディレクトリ名ではなくファイル名の拡張子を除いた部分(basename)。
             * 日本語ファイル名がWindowsではShiftJIS、HUISではUTF-8で不整合が生じるため。
             * 
             * @param dstPath {string} 編集後のパスの候補。
             * 
             * @return {string} 補正したパス
             */
            public static getEncodedPath(dstPath: string): string {
                console.log("[getEncodedPath] dstPath = " + dstPath);

                let basename = path.basename(dstPath);
                let extname = path.extname(dstPath);
                let dirname = path.dirname(dstPath);

                const hash = node_crypt.createHash('sha1');

                let date = new Date();
                let unixTimestamp = date.getTime();
                //同名でも、違う名前にするため、時間もハッシュ化の引数にいれる。
                hash.update(basename + unixTimestamp);
                basename = hash.digest('hex');
                console.log("SHA1 basename = " + basename);
                dstPath = dirname + '/' + basename + extname;
                console.log("SHA1 path = " + dstPath);

                return dstPath;
            }

            /**
             * 画像を読み込み、PIXI.js のテクスチャーを取得する
             * 
             * @param src {string} テクスチャーを取得する画像のパス
             * @return {IPromise<PIXI.Texture>} 読み込んだテクスチャーの promise オブジェクト
             */
            public static loadTexture(src: string): IPromise<PIXI.Texture> {
                let FUNCTION_NAME = TAG + "loadTexture : ";
                let df = $.Deferred();
                let promise: IPromise<PIXI.Texture> = CDP.makePromise(df);

                if (null == src) {
                    df.resolve(PIXI.Texture.EMPTY);
                } else {
                    try {
                        let pixiCache: PIXI.Texture = PIXI.utils.TextureCache[src];
                        if (pixiCache) {
                            pixiCache.destroy(true);
                        }
                        PIXI.Texture.removeTextureFromCache(src);

                        let texture = PIXI.Texture.fromImage(src);
                        if (texture.baseTexture && texture.baseTexture.hasLoaded) {
                            df.resolve(texture);
                        } else {
                            let onLoad = () => {
                                df.resolve(texture);
                            };
                            texture.once("update", onLoad);
                        }
                    } catch (err) {
                        console.error(FUNCTION_NAME + err);
                        df.reject();
                    }
                }

                return promise;
            }

            /**
             * 編集後の画像のData URLを取得する
             */
            private static getDataUrlOfEditedImage(texture: PIXI.Texture, params: IImageEditParams, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): string {
                let stage = new PIXI.Container();
                let sprite = new PIXI.Sprite(texture);

                // リサイズの実行
                if (params.resize) {
                    this._resizeImage(texture, params.resize, sprite, renderer);
                }

                let filters: PIXI.AbstractFilter[] = [];
                // グレースケール化
                if (!_.isUndefined(params.grayscale)) {
                    let grayScaleFilter = new PIXI.filters.GrayFilter();
                    grayScaleFilter.gray = params.grayscale;
                    filters.push(grayScaleFilter);
                }

                if (0 < filters.length) {
                    sprite.filters = filters;
                }

                stage.addChild(sprite);
                renderer.render(stage);

                // 出力する画像の mimeType 設定。
                // デフォルトは image/png。他に image/jpeg を選択できる。
                let imageType = "image/png";
                if (params.imageType && params.imageType === "image/jpeg") {
                    imageType = params.imageType;
                }
                // レンダラーの canvas に描画されているグラフィクスを、指定した mimeType の画像の dataUrl として出力
                let imageDataUrl = renderer.view.toDataURL(imageType);

                return imageDataUrl;
            }

            /**
             * 画像のリサイズを行う
             */
            private static _resizeImage(texture: PIXI.Texture, resize: IImageResizeParams, sprite: PIXI.Sprite, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer) {
                if (!texture || !resize || !sprite || !renderer) {
                    return;
                }
                let scaleX = 0 < texture.width ? resize.width / texture.width : 1,
                    scaleY = 0 < texture.height ? resize.height / texture.height : 1;
                let resizeMode = resize.mode ? resize.mode : ImageResizeMode.DEFAULT;

                switch (resizeMode) {
                    case ImageResizeMode.CONTAIN:
                        {
                            // scale は X, Y の小さい方を採用する
                            let scale = scaleX < scaleY ? scaleX : scaleY;
                            if (1 < scale && !resize.force) {
                                scale = 1;
                            }
                            sprite.scale.set(scale);

                            let scaledW = texture.width * scale,
                                scaledH = texture.height * scale;
                            if (resize.padding) {
                                let anchorX = - (resize.width - scaledW) / scaledW / 2,
                                    anchorY = - (resize.height - scaledH) / scaledH / 2;
                                sprite.anchor.set(anchorX, anchorY);
                            } else {
                                renderer.resize(scaledW, scaledH);
                            }
                        }
                        break;
                    case ImageResizeMode.COVER:
                        {
                            // scale は X, Y の小さい方を採用する
                            let scale = scaleX < scaleY ? scaleY : scaleX;
                            sprite.scale.set(scale);

                            let scaledW = texture.width * scale,
                                scaledH = texture.height * scale;
                            let anchorX = - (resize.width - scaledW) / scaledW / 2,
                                anchorY = - (resize.height - scaledH) / scaledH / 2;
                            sprite.anchor.set(anchorX, anchorY);
                        }
                        break;

                    // stretch
                    default:
                        {
                            sprite.scale.set(scaleX, scaleY);
                        }
                }
            }
        }
    }
}
