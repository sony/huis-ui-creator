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

module Garage {
    export module Util {
        export interface IDataOptions {
            all?: boolean; //! true を指定した場合、すべての要素の deta 属性に値を入れる。それ以外の場合は、先頭の要素の data 属性に値を入れる。
        }

        export class JQueryUtils {
            static TAG = "JQueryUtils";

            /**
             * jQuery オブジェクトで選択された DOM の data 属性を取得する。
             * 
             * @param $elem {JQuery} DOM を選択した jQuery
             * @param key {string} data 属性のキー。キーは　data を除いて lowerCammelCase で書く ([例] data-key-value -> keyValue)
             * @return {any} 取得した値
             */
            static data($elem: JQuery, key: string, options?: IDataOptions): any;

            /**
             * jQuery オブジェクトで選択された DOM の data 属性に値を設定する。
             * 
             * @param $elem {JQuery} DOM を選択した jQuery
             * @param key {string} data 属性のキー。キーは　data を除いて lowerCammelCase で書く ([例] data-key-value -> keyValue)
             * @param value {string | number} 設定したい値
             * @pram options {IDataOptions} オプション
             * @return {any} 取得した値
             */
            static data($elem: JQuery, key: string, value: string | number, options?: IDataOptions): void;

            static data($elem: JQuery, key: string, param1?: any | string | number, param2?: IDataOptions): void | any {
                if (!$elem || $elem.length < 1) {
                    return null;
                }

                if (_.isString(param1) || _.isNumber(param1)) {
                    if (param2 && param2.all) {
                        $elem.each((index, elem) => {
                            (<HTMLElement>elem).dataset[key] = param1;
                        });
                    } else {
                        $elem.get(0).dataset[key] = param1;
                    }
                } else {
                    return $elem.get(0).dataset[key];
                }
            }


            static enccodeUriValidInCSS(inputUrl: string): string {

                if (inputUrl == null) {
                    console.warn("[JQueryUtils]enccodeUriValidInCSS : inputUrl is null");
                    return;
                }

                return this.encodeUriValidInWindowsAndCSS(inputUrl);
                /*
                //ダミーの変数、マック対応時に動的に入手
                let isWindows = true;
                let isMac = false;

                if (isWindows) {
                    return this.encodeUriValidInWindowsAndCSS(inputUrl);
                }
                
                else if (isMac) {
                    return this.encodeUriValidInMacAndCSS(inputUrl);
                }
                */

            }

            /*
              * CSSのURLが解釈できず、Windowsでは使用可能な文字を、CSSでも有効な文字に変換して返す。
              * @param url{string} cssのbackground-imageに設定する画像のurl
              * @return {string} CSSでも解釈可能なURL
              */
            static encodeUriValidInWindowsAndCSS(inputUrl: string): string {

                if (inputUrl == null) {
                    console.warn( "[JQueryUtils]encodeUriValidInWindows : inputUrl is null");
                    return;
                }

                let tmpUrl: string = encodeURI(inputUrl);

                //encodeURIで未サポートの#と'を変換する。
                var regExp1 = new RegExp("\\#", "g");
                tmpUrl = tmpUrl.replace(regExp1, "%23");

                var regExp2 = new RegExp("\\'", "g");
                tmpUrl = tmpUrl.replace(regExp2, "%27");
                return tmpUrl;
            }




            /*
              * encodeUriValidInWindowsAndCSSで変換されたパスを元に戻す
              * @param inputUrl{string} encodeUriValidInWindowsAndCSSで変換されたurl
              * @return {string} encodeUriValidInWindowsAndCSSで変換される前のurl
              */
            static decodeUriValidInWindowsAndCSS(inputUrl: string): string {

                if (inputUrl == null) {
                    console.warn("[JQueryUtils]decodeUriValidInWindowsAndCSS : inputUrl is null");
                    return;
                }

                //encodeURIで未サポートの#と'を変換する。
                var regExp1 = new RegExp("%23", "g");
                inputUrl = inputUrl.replace(regExp1, "#");

                var regExp2 = new RegExp("%27", "g");
                inputUrl = inputUrl.replace(regExp2, "'");

                let tmpUrl: string = decodeURI(inputUrl);

                return tmpUrl;
            }

            /**
             * css の backgrond-image に設定されたURLからパスを取得する。
             * css としてエンコードされていた文字列はデコードされた状態で返す。
             * @param backgroundImageCss {string} background-image の設定値
             * @return パス
             */
            static extractBackgroundImagePathFromCss(backgroundImageCss: string): string {
                if (!backgroundImageCss) {
                    return "";
                }

                let cssPath = JQueryUtils.decodeUriValidInWindowsAndCSS(backgroundImageCss);

                //url("file: から ?xxx" までを抽出。 このとき ?xxx")とすると、ユーザー名に)があったときにバグを起こす。
                let path = cssPath.match(/[^url\("file:\/\/\/][^\?"]*/);
                if (path && path[0]) {
                    return path[0];
                } else {
                    return "";
                }
            }


            /*
              * CSSのURLが解釈できず、Macでは使用可能な文字を、CSSでも有効な文字に変換して返す。
              * @param url{string} cssのbackground-imageに設定する画像のurl
              * @return {string} CSSでも解釈可能なURL
              */
            static encodeUriValidInMacAndCSS(inputUrl: string): string {

                if (inputUrl == null) {
                    console.warn("[JQueryUtils]encodeUriValidInMacAndCSS : inputUrl is null");
                    return;
                }

                let tmpUrl: string = encodeURI(inputUrl);

                //encodeURIで未サポートの#と'を変換する。
                var regExp1 = new RegExp("\\#", "g");
                tmpUrl = tmpUrl.replace(regExp1, "%23");

                var regExp2 = new RegExp("\\'", "g");
                tmpUrl = tmpUrl.replace(regExp2, "%27");
                return tmpUrl;
            }

            /*
            * テキストボタンの表示を、HUISで表示されたときと合わせるための補正値
            * @param textsize{number} 表示するテキストサイズ
            * @return Garage上で表示する補正後のテキストサイズ
            */
            static getOffsetTextButtonSize(textsize: number): number {
                let FUNCTION_NAME = "[JQueryUtils]" + " : getOffsetTextSize :";

                if (textsize == null) {
                    console.error(FUNCTION_NAME + "textsize is null");
                    return 0;
                }

                return textsize * (RATIO_TEXT_SIZE_HUIS_GARAGE_BUTTON - (textsize - MIN_TEXT_SIZE) * GAIN_TEXT_BUTTON_SIZE_OFFSET_FUNC);
            }

            /*
            * テキストラベルの表示を、HUISで表示されたときと合わせるための補正値
            * @param textsize{number} 表示するテキストサイズ
            * @return Garage上で表示する補正後のテキストサイズ
            */
            static getOffsetTextLabelSize(textsize: number): number {
                let FUNCTION_NAME = "[JQueryUtils]" + " : getOffsetTextLabelSize :";

                if (textsize == null) {
                    console.error(FUNCTION_NAME + "textsize is null");
                    return 0;
                }

                return textsize * (RATIO_TEXT_SIZE_HUIS_GARAGE_LABEL - (textsize - MIN_TEXT_SIZE) * GAIN_TEXT_LABEL_SIZE_OFFSET_FUNC);
            }


            //NaNか判定 Number.isNaNが使えないので代用
            static isNaN(v): boolean {
                return v !== v;
            }



        }
    }
} 