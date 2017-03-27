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

        export class LabelItem extends Item implements Model.LabelItem {

            constructor(attributes?: any) {
                super(attributes, null);
            }

            /**
             * LabelItemの複製を生成
             *
             * @param offsetY {number} 
             * @return {LabelItem}
             */
            public clone(offsetY: number = 0): LabelItem {
                let newLabel = new Model.LabelItem();
                let newArea: IArea = $.extend(true, {}, this.area);
                newArea.y += offsetY;
                newLabel.area = newArea;
                newLabel.text = this.text;
                newLabel.color = this.color;
                newLabel.font = this.font;
                newLabel.size = this.size;
                newLabel.font_weight = this.font_weight;

                //バージョン情報がある場合、コピーする
                if (this.version) {
                    newLabel.version = this.version;
                }

                return newLabel;
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

            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[]{
                return ["enabled", "area", "text", "color", "font", "size","font_weight"];
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
            defaults() {

                var defaultAttr = {
                    "enabled": true,
                    "area": { "x": 0, "y": 0, "w": 60, "h": 20 },
                    "text": "",
                    "color": 0,
                    "resolvedColor": "rgb(0,0,0)",
                    "font": "",
                    "size": 30,
                    "font_weight" : FontWeight.FONT_BOLD,
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