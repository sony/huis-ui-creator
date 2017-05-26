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
    export module Model {
        var TAG = "[Garage.Model.LabelItem] ";

        export class LabelItem extends Item {

            constructor(iLabel: ILabel) {
                // attributes contained in iLabel is set in super constructor
                super(iLabel, null);
                // clone customized objects
                this.area = $.extend(true, {}, iLabel.area);
            }

            /**
             * LabelItemの複製を生成
             *
             * @param offsetY {number} 
             * @return {LabelItem}
             */
            public clone(offsetY: number = 0): LabelItem {
                let newLabel = new Model.LabelItem(this);
                newLabel.area.y += offsetY;

                //バージョン情報がある場合、コピーする
                if (this.version) {
                    newLabel.version = this.version;
                }

                return newLabel;
            }

            /**
             * Model.LabelItemをHUIS出力用のデータ形式に変換する。
             *
             * @param {string} remoteId このLabelItemが所属するremoteId
             * @param {string} ourputDirPath? faceファイルの出力先のディレクトリ
             * @return {ILabel} 変換されたデータ
             */
            convertToHuisData(): ILabel {

                let convertedLabel: ILabel = {
                    area: this.area,
                    text: this.text
                };
                if (this.color !== undefined) {
                    convertedLabel.color = this.color;
                }
                if (this.font !== undefined) {
                    convertedLabel.font = this.font;
                }
                if (this.size !== undefined) {
                    convertedLabel.size = this.size;
                }
                if (this.font_weight !== undefined) {
                    convertedLabel.font_weight = this.font_weight;
                }

                return convertedLabel;
            }

            private _isBold(): boolean {
                return this.font_weight === FontWeight.FONT_BOLD;
            }

            /*
            * テキストボタンの表示を、HUISで表示されたときと合わせるための補正値
            * @param textsize{number} 表示するテキストサイズ
            * @return Garage上で表示する補正後のテキストサイズ
            */
            private _getResizedTextSize(): number {

                let FUNCTION_NAME = "[Model.LabelItem]" + " : _getResizedTextSize :";

                const BOLD_TEXT_RESIZE_RATIO: number = 0.758;
                const REGULAR_TEXT_RESIZE_RATIO: number = 0.758;
                const MIN_TEXT_SIZE: number = 12;
                const GAIN_TEXT_BUTTON_SIZE_OFFSET_FUNC: number = 0.001;
                const GAIN_TEXT_LABEL_SIZE_OFFSET_FUNC: number = 0.001;

                if (this.size == null) {
                    console.error(FUNCTION_NAME + "size is null");
                    this.size = this.defaults().size;
                }

                let ratio = this._isBold() ? BOLD_TEXT_RESIZE_RATIO : REGULAR_TEXT_RESIZE_RATIO;

                return this.size * (ratio - (this.size - MIN_TEXT_SIZE) * GAIN_TEXT_LABEL_SIZE_OFFSET_FUNC);
            }

            /**
             * getters and setters
             */
            get text(): string {
                return this.get("text");
            }

            set text(val: string) {
                this.set("text", val);
            }

            get version(): string {
                return this.get("version");
            }

            set version(val: string) {
                this.set("version", val);
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

            get color(): number {
                return this.get("color");
            }

            get font_weight(): FontWeight {
                return this.get("font_weight");
            }

            set font_weight(val: FontWeight) {
                this.set("font_weight", val);
            }

            set color(val: number) {
                this.set("color", val);
            }

            get resolvedColor(): string {
                return this._getResolvedColor(this.get("color"));
            }

            get font(): string {
                return this.get("font");
            }

            set font(val: string) {
                this.set("font", val);
            }

            get size(): number {
                return this.get("size");
            }

            set size(val: number) {
                if (_.isNumber(val)) {
                    this.set("size", val);
                } else {
                    this.set("size", parseInt(<any>val, 10));
                }
            }

            // font-size for render is smaller than actual font-size to get close to appearance on HUIS
            // This property is referenced in templates/face-items.html
            get sizeForRender(): number {
                return this._getResizedTextSize();
            }

            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["enabled", "area", "text", "color", "font", "size", "font_weight"];
            }

            /**
             * このアイテムの種類
             */
            get itemType(): string {
                return "label";
            }

            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            // TODO: review default attrs
            defaults() {

                var defaultAttr = {
                    "enabled": true,
                    "area": { "x": 0, "y": 0, "w": 60, "h": 20 },
                    "text": "",
                    "color": 0,
                    "resolvedColor": "rgb(0,0,0)",
                    "font": "",
                    "size": 30,
                    "font_weight": FontWeight.FONT_BOLD,
                };

                return defaultAttr;
            }

            /**
             * 16階調のグレースケールを RGB 変換する
             */
            private _getResolvedColor(colorNumber: number): string {
                // 0 - 15 の整数に丸める
                if (colorNumber < 0) {
                    colorNumber = 0;
                } else if (15 < colorNumber) {
                    colorNumber = 15;
                }
                colorNumber = Math.round(colorNumber);

                // 0-15 の数字を rgb 表記のグレースケールに変換する
                var resolvedColor: string = "rgb(" + (colorNumber * 17) + "," + (colorNumber * 17) + "," + (colorNumber * 17) + ")";

                return resolvedColor;
            }

        }
    }
}
