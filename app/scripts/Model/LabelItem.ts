/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.LabelItem] ";

		export class LabelItem extends Backbone.Model implements IGLabel, ItemModel {

			constructor(attributes?: any) {
				super(attributes, null);
			}

			/**
             * getters and setters
             */
            get area(): IArea {
				return this.get("area");
			}

            set area(val: IArea) {
				this.set("area", val);
			}

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
			 * このアイテムが有効であるかどうか
			 */
			get enabled(): boolean {
				return this.get("enabled");
			}

			set enabled(val: boolean) {
				this.set("enabled", val);
			}


            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {

                var label: IGLabel = {
					"enabled": true,
					"area": { "x": 0, "y": 0, "w": 60, "h": 20 },
                    "text": "",
                    "color": 0,
					"resolvedColor": "rgb(0,0,0)",
                    "font": "",
                    "size": 30,
                    "font_weight" : FontWeight.FONT_BOLD,
                };

                return label;
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