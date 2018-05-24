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

/// <reference path="../../include/interfaces.d.ts" />


module Garage {
    export module Model {
        export namespace ConstValue {
            export const DEFAULT_IMAGE_PATH: string = "../res/images/screensaver/default_screensaver.png";
            export const SCREENSAVER_DIR_NAME: string = "standbydisplay";
            export const SCREENSAVER_IMAGE_FILE_NAME_PREFIX: string = "SD";
            export const SCREENSAVER_IMAGE_FILE_NAME_SUFFIX: string = ".png";
            export const SCREENSAVER_IMAGE_FILE_NAME: string = SCREENSAVER_IMAGE_FILE_NAME_PREFIX + "0000" + SCREENSAVER_IMAGE_FILE_NAME_SUFFIX;

            export const SCREENSAVER_WIDTH: number = 540;
            export const SCREENSAVER_HEIGHT: number = 960;
            export const SCREENSAVER_EDIT_IMAGE_PARAMS: IImageEditParams = {
                resize: {
                    width: SCREENSAVER_WIDTH,
                    height: SCREENSAVER_HEIGHT,
                    mode: "contain",
                    padding: true,
                    force: true
                },
                grayscale: 1.0
            };
        }

        export class ScreensaverDialog extends Backbone.Model {
            /**
             * imagePath はデフォルト画像のパスを初期値として与えておく
             * @param {any} attributes
             * @param {any} options
             */
            constructor(attributes?: any, options?: any) {
                super(attributes, options);
                this.imagePath = Util.PathManager.resolve(ConstValue.DEFAULT_IMAGE_PATH);
            }

            /**
             * 現在設定中の画像パスを取得する。
             * ユーザー指定直後は指定したそのもののパスが入る。
             * @return {string} 現在設定中の画像パス
             */
            get imagePath(): string {
                return this.get("imagePath");
            }

            set imagePath(path: string) {
                // change イベント発火のため、attribute で管理する
                this.set({ "imagePath": path });
            }

            /**
             * HTMLのurlに渡す際に、一部文字を変更する必要がある。
             * 画像パスの"\"を"\\"に、"#"を"%23"に
             * 変換するためのメソッド。
             */
            getEncodedImagePath(): string {
                let encodedUri: string = this.imagePath.replace(/\\/g, "\\\\").replace(/\#/g, "%23");
                console.log("encoded : " + encodedUri);
                return encodedUri;
            }

            /**
             * @return {string} アプリ作業用フォルダの画像を保持するディレクトリのパス
             */
            private getWorkingDirPath(): string {
                return Util.PathManager.getHuisFilesDir() + "/" + ConstValue.SCREENSAVER_DIR_NAME;
            }

            /**
             * アプリ作業用フォルダの画像パスを取得する。
             * 画像名は変更してしまうので、固定されている。
             * @return {string} アプリ作業用フォルダの画像パス
             */
            private getWorkingImagePath(): string {
                return this.getWorkingDirPath() + "/" + ConstValue.SCREENSAVER_IMAGE_FILE_NAME;
            }

            /**
             * お気に入り待受画面用のフォルダが存在しない場合作成する
             */
            private prepareDir() {
                let dirPath = this.getWorkingDirPath();
                if (!fs.existsSync(dirPath)) {
                    fs.mkdir(dirPath);
                }
            }

            /**
             * HUIS本体が持っている画像データの情報を取得する
             */
            loadHuisDevData(): void {
                this.prepareDir();
                let targetFilePath: string = this.getWorkingImagePath();
                if (!fs.existsSync(targetFilePath)) {
                    console.log("no screensaver image : " + targetFilePath);
                    return;
                }
                this.imagePath = targetFilePath;
            }

            private getDefaultImagePath(): string {
                return Util.PathManager.resolve(ConstValue.DEFAULT_IMAGE_PATH);
            }

            /**
             * デフォルト画像が設定されているか確認する
             *
             * @return {boolean} デフォルト画像のとき true
             */
            isDefault(): boolean {
                return this.imagePath == this.getDefaultImagePath();
            }

            /**
             * デフォルトの画像を設定する
             */
            setDefault(): void {
                this.imagePath = this.getDefaultImagePath();
            }

            /**
             * 設定された画像を保存する。
             * まずアプリ作業用フォルダに保存したあと、HUIS本体に同期する。
             *
             * @return {CDP.IPromise<string>} 成功時 コンバート後の絶対画像パスを返す。失敗時 nullを返す。
             */
            saveImage(): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let outputImagePath = this.getWorkingImagePath();

                if (!this.isDefault()) {
                    Model.OffscreenEditor.editImage(this.imagePath, ConstValue.SCREENSAVER_EDIT_IMAGE_PARAMS, outputImagePath)
                        .done((editedImage) => {
                            this.syncToHuis(df);
                        }).fail((err) => {
                            console.error("editImage calling failed : err : " + err);
                        });
                } else {
                    // don't save image in HuisFiles when default not to copy file to HuisDevice
                    setTimeout(() => {
                        fs.removeSync(outputImagePath);
                        this.syncToHuis(df);
                    });
                }

                return promise;
            }

            /**
             * HUISに現在のお気に入り待受画面のファイルを同期(コピー)する
             *
             * @param {JQueryDeferred<void>} promise用のdeffered
             */
            private syncToHuis(df: JQueryDeferred<void>) {
                let dstPath: string = HUIS_ROOT_PATH + "/" + ConstValue.SCREENSAVER_DIR_NAME;
                if (!fs.existsSync(dstPath)) {
                    console.log("no " + dstPath + " dir, mkdir");
                    fs.mkdir(dstPath);
                }
                let syncTask = new Util.HuisDev.FileSyncTask();
                syncTask.exec(this.getWorkingDirPath(), dstPath, false, null, null, () => {
                    df.resolve();
                });
            }

            /**
             * @param {string} dstPath
             * @return {boolean} 引数がお気に入り待受画面の画像パスならtrue
             */
            static isScreenSaverImage(dstPath: string): boolean {
                let regexp: RegExp = new RegExp(Model.ConstValue.SCREENSAVER_IMAGE_FILE_NAME);
                if (dstPath.match(regexp)) {
                    return true;
                }
                return false;
            }
        }
    }
}
