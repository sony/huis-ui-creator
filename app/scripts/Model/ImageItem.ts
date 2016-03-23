/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length */

module Garage {
	export module Model {
		var TAG = "[Garage.Model.ImageItem] ";

		export class ImageItem extends Backbone.Model implements IGImage, ItemModel {

			private resolvedPathDirectory_: string;
			private remoteId_: string;
			private initialArea_: IArea;
			private initialResizeMode_: string;

			constructor(attributes?: any) {
				super(attributes, null);
				if (attributes) {
					if (attributes.materialsRootPath && attributes.remoteId) {
						this.resolvedPathDirectory_ = path.resolve(path.join(attributes.materialsRootPath, "remoteimages")).replace(/\\/g, "/");
						this.remoteId_ = attributes.remoteId;
					}
				}
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
            get path(): string {
				return this.get("path");
			}
            set path(val: string) {
				this.set("path", val);
				// resolvedPath (PC上のフルパス) を設定する
				if (!path) {
					// path が指定されていない場合は、resolvedPath も指定しない
					this.resolvedPath = "";

				} else if (this.remoteId_ === "common") {
					//this.resolvedPath = path.resolve(path.join("app/res/faces/common/images", val)).replace(/\\/g, "/");
					// common フェイスはアプリの res 内にあるが、デバッグ版とパッケージ版でパスが変わるので、CDP.Framework.toUrl() で絶対パスを得る
					let resolvedPath = CDP.Framework.toUrl(path.join("/res/faces/common/images", val).replace(/\\/g, "/"));
					// file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す
					if (resolvedPath.indexOf("file:///") === 0) {
						resolvedPath = resolvedPath.split("file:///")[1];
					}
					this.resolvedPath = resolvedPath;

				} else if (this.resolvedPathDirectory_) {
					this.resolvedPath = path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/");
				}
			}
			get resolvedPath(): string {
				return this.get("resolvedPath");
			}
			set resolvedPath(val: string) {
				this.set("resolvedPath", val);
			}
			get properties(): string[]{
				return ["enabled", "area", "path", "resizeMode"];
			}
			get itemType(): string {
				return "image";
			}
			get enabled(): boolean {
				return this.get("enabled");
			}
			set enabled(val: boolean) {
				this.set("enabled", val);
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
				//let garageExtentions: IGGarageImageExtensions = this.get("garageExtensions");
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

				//let garageExtentions: IGGarageImageExtensions = this.get("garageExtensions");
				//if (garageExtentions) {
				//	garageExtentions.resizeMode = val;
				//} else {
				//	garageExtentions = {
				//		original: "",
				//		resolvedOriginalPath: "",
				//		resizeMode: val
				//	};
				//}
				//this.set("resized", true);
				//this.set("garageExtensions", garageExtentions);
			}
			get resizeOriginal(): string {
				let garageExtensions = this.garageExtensions;
				if (garageExtensions) {
					return garageExtensions.original;
				}
				return "";

				//let garageExtentions: IGGarageImageExtensions = this.get("garageExtensions");
				//if (garageExtentions) {
				//	return garageExtentions.original;
				//}
				//return "";
			}
			set resizeOriginal(val: string) {
				let garageExtensions = this.garageExtensions;
				if (garageExtensions) {
					garageExtensions.original = val;
					if (this.remoteId_ === "common") {
						// common フェイスはアプリの res 内にあるが、デバッグ版とパッケージ版でパスが変わるので、CDP.Framework.toUrl() で絶対パスを得る。
						// file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す。
						let resolvedOriginalPath = CDP.Framework.toUrl(path.join("/res/faces/common/images", val).replace(/\\/g, "/"));
						if (resolvedOriginalPath.indexOf("file:///") === 0) {
							resolvedOriginalPath = resolvedOriginalPath.split("file:///")[1];
						}
						garageExtensions.resolvedOriginalPath = resolvedOriginalPath;
					} else {
						garageExtensions.resolvedOriginalPath = path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/");
					}
				} else {
					if (this.remoteId_ === "common") {
						// common フェイスはアプリの res 内にあるが、デバッグ版とパッケージ版でパスが変わるので、CDP.Framework.toUrl() で絶対パスを得る。
						// file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す。
						let resolvedOriginalPath = CDP.Framework.toUrl(path.join("/res/faces/common/images", val).replace(/\\/g, "/"));
						if (resolvedOriginalPath.indexOf("file:///") === 0) {
							resolvedOriginalPath = resolvedOriginalPath.split("file:///")[1];
						}
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

				//let garageExtentions: IGGarageImageExtensions = this.get("garageExtensions");
				//if (garageExtentions) {
				//	garageExtentions.original = val;
				//	garageExtentions.resolvedOriginalPath = path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/");
				//} else {
				//	garageExtentions = {
				//		original: val,
				//		resolvedOriginalPath: path.resolve(path.join(this.resolvedPathDirectory_, val)).replace(/\\/g, "/"),
				//		resizeMode: "contain"
				//	};
				//}
				//this.set("garageExtensions", garageExtentions);
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

                var image: IGImage = {
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