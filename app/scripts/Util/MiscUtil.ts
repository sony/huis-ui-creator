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

/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        var TAGS = {
            MiscUtil: "[Garage.Util.MiscUtil] ",
        };

        namespace PlatformConsts {
            export const WIN32: string = "win32";
            export const DARWIN: string = "darwin";
            export const DEFAULT: string = WIN32;
        }

        namespace ConfigFlags {
            //通常仕向けか、ビジネス仕向けか を決めるフラグ。true:ビジネス仕向け。false:通常仕向け
            export const IS_BZ: boolean = false;
        }

        /**
         * @class StyleBuilderDefault
         * @brief スタイル変更時に使用する既定の構造体オブジェクト
         */
        class StyleBuilderDefault implements CDP.UI.Toast.StyleBuilder {

            //! class attribute に設定する文字列を取得
            getClass(): string {
                return "ui-loader ui-overlay-shadow ui-corner-all ui-body-b";
            }

            //! style attribute に設定する JSON オブジェクトを取得
            getStyle(): any {
                let style = {
                    "display": "block",
                    "opacity": 1
                };
                return style;
            }

            //! オフセットの基準位置を取得
            getOffsetPoint(): number {
                //! @enum オフセットの基準
                enum OffsetX {
                    LEFT = 0x0001,
                    RIGHT = 0x0002,
                    CENTER = 0x0004,
                }

                //! @enum オフセットの基準
                enum OffsetY {
                    TOP = 0x0010,
                    BOTTOM = 0x0020,
                    CENTER = 0x0040,
                }

                return OffsetX.CENTER | OffsetY.TOP;
            }

            //! X 座標のオフセット値を取得
            getOffsetX(): number {
                return 0;
            }

            //! Y 座標のオフセット値を取得
            getOffsetY(): number {
                return 87;
            }
        }

        /**
         * @class MiscUtil
         * @brief その他のユーティリティーを集めたクラス
         */
        export class MiscUtil {
            public static ERROR_TYPE_NOERROR: number = 1;
            public static ERROR_FILE_ACCESS: number = 0;
            public static ERROR_TYPE_JPEG2000: number = -1;
            public static ERROR_TYPE_JPEGLOSSLESS: number = -2;
            public static ERROR_TYPE_NOT_JPEG: number = -3;
            public static ERROR_SIZE_TOO_LARGE: number = -10;

            /**
             * ファイルパスの file:/// スキームを除去、ファイルパス内のパーセントエンコーディングをデコード、\→/の変換を行う
             * プログラム内部でパスの解決にURLを使っている箇所で利用される
             * 
             * @param path {string} [in] 入力となるパス。
             * @param en {Boolean} [in] \記号の変換を行うかどうか(trueで行う)。
             * @return {string} 変換後のパス
             */
            static getAppropriatePath(path: string, en?: Boolean): string {
                console.log("MiscUtil::getAppropriatePath path=" + path);
                path = decodeURIComponent(path);
                let removePrefix: string;
                // darwinでは絶対パス表現として/を先頭に残す
                if (MiscUtil.isDarwin()) {
                    removePrefix = 'file://';
                } else {
                    removePrefix = 'file:///';
                }
                if (path.indexOf(removePrefix) === 0) {
                    path = path.split(removePrefix)[1];
                }
                if (en) {
                    path = path.replace(/\\/g, "/");
                }

                return (path);
            }

            /**
             * 現在の動作プラットフォームを返す。
             * @return {string} Garage.Util.PlatformConstsで定義されたPlatform名を返す。
             */
            private static getPlatform(): string {
                if (process != null && process.platform != null) {
                    return process.platform;
                }
                // When can't get platform, return DEFAULT platform
                return PlatformConsts.DEFAULT;
            }

            /**
             * 動作プラットフォームがWindowsかどうかを判定する。
             * @return {boolean} Windowsであればtrue、そうでなければfalseを返す。
             */
            static isWindows(): boolean {
                return MiscUtil.getPlatform() === PlatformConsts.WIN32;
            }

            /**
             * 動作プラットフォームがWindowsかどうかを判定する。
             * @return {boolean} Darwinであればtrue、そうでなければfalseを返す。
             */
            static isDarwin(): boolean {
                return MiscUtil.getPlatform() === PlatformConsts.DARWIN;
            }

            /**
             * 仕向けが法事向けかどうかを判定する。
             * @return {boolean} 法人向けであればtrue、そうでなければfalseを返す。
             */
            static isBz(): boolean {
                return ConfigFlags.IS_BZ;
            }

            /**
             * HUISが取り扱えるサイズの画像ファイルならERROR_TYPE_NOERRORを返す
             * サイズ上限はGarage.MAX_IMAGE_FILESIZEで定義されている。
             * @param path {string} [in] チェックしたいJPEG/PNGファイル
             */
            static checkFileSize(path: string): number {
                let s: Stats = null;

                try {
                    let fd = fs.openSync(path, 'r');
                    s = fs.fstatSync(fd);
                    fs.closeSync(fd);
                } catch (e) {
                    console.error("checkFileSize: " + e);
                    return
                }
                // サイズチェック
                if (s.size >= MAX_IMAGE_FILESIZE) return (MiscUtil.ERROR_SIZE_TOO_LARGE);

                return (MiscUtil.ERROR_TYPE_NOERROR);
            }

            /**
             * JPEGの種別を判定し、HUISが取り扱えるものならERROR_TYPE_NOERRORを返す
             * @param path {string} [in] チェックしたいJPEGファイル
             */

            static checkJPEG(path: string): number {
                let b = new Buffer(8);

                try {

                    let fd = fs.openSync(path, 'r');

                    fs.readSync(fd, b, 0, 8, 0);
                    fs.closeSync(fd);
                } catch (e) {
                    console.error("checkJPEG: " + e);
                    return (MiscUtil.ERROR_FILE_ACCESS);
                }
                // JPEG2000か
                if ((b[0] === 0) && (b[1] === 0)) {
                    //console.log(b);
                    return (MiscUtil.ERROR_TYPE_JPEG2000);
                }
                // JPEGか
                if ((b[0] !== 255) || (b[1] !== 216)) { // JPEGは0xFFD8から始まる。それ以外はJPEGではないのでエラー。
                    //console.log(b);
                    return (MiscUtil.ERROR_TYPE_NOT_JPEG);
                }
                // JPEG losslessか
                if (b[3] === 238) {     // JPEGは4バイトめが0xE0(JFIF)か0xE1(Exif)
                    //console.log(b);
                    return (MiscUtil.ERROR_TYPE_JPEGLOSSLESS);
                }

                return (MiscUtil.ERROR_TYPE_NOERROR);
            }


            /**
             * 指定されたパスにファイルが存在するか検査する
             * @param path {string} 検査対象のファイルパス
             * @return ファイルが存在する場合はtrue、そうでない場合（対象がフォルダだった場合を含む）はfalse
             */
            static existsFile(path: string): boolean {
                try {
                    if (path &&
                        fs.existsSync(path) &&
                        !fs.lstatSync(path).isDirectory()) {
                        return true;
                    }
                } catch (e) {
                    console.warn("can not access to the image file: " + path + "\n" + e);
                }

                return false;
            }

            /** 
             * @return{boolen} 有効な配列の場合trueを返す。
             */
            static isValidArray(array: any[]) {
                return array.length > 0;
            }

            /**
             * 禁則文字が入力された場合、トーストを出力し、禁則文字をぬいた文字列を返す。。
             */
            static getRemovedInhibitionWords(inputValue: string): string {
                //入力した文字に禁則文字が含まれていた場合、トーストで表示。文字内容も削除。
                let inhibitWords: string[] = this.getInhibitionWords(inputValue);
                let resultString: string = inputValue;
                if (inhibitWords != null) {
                    let outputString: string = "";
                    for (let i = 0; i < inhibitWords.length; i++) {
                        if (i > 0) {
                            outputString += ", "
                        }
                        outputString += inhibitWords[i] + " ";

                        //GegExp(正規表現)を利用するために、頭に\\をつける。
                        inhibitWords[i] = "\\" + inhibitWords[i];

                        var regExp = new RegExp(inhibitWords[i], "g");
                        resultString = resultString.replace(regExp, "");
                    }
                    outputString += $.i18n.t("toast.STR_TOAST_INPUT_INHIBITION_WORD");
                    this.showGarageToast(outputString);
                }

                return resultString;
            }

            /**
             * 禁則文字が入力された場合、含まれた禁則文字の文字列を返す。
             */
            static getInhibitionWords(inputKey: string): string[] {
                let FUNCTION_NAME = "BasePage.ts : isInhibitionWord : "

                let result: string[] = [];
                let BLACK_LIST_INPUT_KEY: string[] =
                    ['/',
                        ":",
                        ";",
                        "*",
                        "?",
                        "<",
                        ">",
                        '"',
                        "|",
                        '\\'];

                for (let i = 0; i < BLACK_LIST_INPUT_KEY.length; i++) {
                    if (inputKey.indexOf(BLACK_LIST_INPUT_KEY[i]) != -1) {
                        result.push(BLACK_LIST_INPUT_KEY[i]);
                    }
                }

                if (result.length === 0) {
                    return null;
                }

                return result;
            }

            /*
             * Garageのデザインで、Toastを標示する。
             */
            static showGarageToast(message: string) {
                var FUNCTION_NAME = "BasePage.ts : showGarageToast : ";
                if (_.isUndefined(message)) {
                    console.log(FUNCTION_NAME + "message is undefined");
                }

                var style: CDP.UI.Toast.StyleBuilderDefault = new StyleBuilderDefault();
                CDP.UI.Toast.show(message, 1500, style);
            }

        }
    }
}
