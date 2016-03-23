/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module View {
		import Tools = CDP.Tools;
		var TAG = "[Garage.View.ImageItem] ";

		export class ImageItem extends Backbone.View<Model.ImageItem> {
			private materialsRootPath_: string;
			private remoteId_: string;

			private imageItemTemplate_: Tools.JST;
			/**
			 * constructor
			 */
			constructor(options?: Backbone.ViewOptions<Model.ImageItem>) {
				super(options);
			}

			events() {
				// Please add events
				return {
				};
			}

			initialize(options?: Backbone.ViewOptions<Model.ImageItem>) {
				if (options.attributes) {
					if (options.attributes["materialsRootPath"]) {
						this.materialsRootPath_ = options.attributes["materialsRootPath"];
					}
					if (options.attributes["remoteId"]) {
						this.remoteId_ = options.attributes["remoteId"];
					}

					// images が非配列で格納されていたら、、配列として格納する
					let unknownTypeImage = options.attributes["images"];
					if (unknownTypeImage) {
						let images: IGImage[] = [];
						if (_.isArray(unknownTypeImage)) {
							images = unknownTypeImage;
						} else {
							images.push(unknownTypeImage);
						}

						let imageModels: Model.ImageItem[] = [];
						for (let i = 0, l = images.length; i < l; i++) {
							let imageModel: Model.ImageItem = new Model.ImageItem({ materialsRootPath: this.materialsRootPath_, remoteId: this.remoteId_ });
							imageModel.area = $.extend(true, {}, images[i].area);
							imageModel.path = images[i].path;
							if (images[i].garageExtensions) {
								imageModel.garageExtensions = $.extend(true, {}, images[i].garageExtensions);
							}
							if (!imageModel.resizeOriginal) {
								imageModel.resizeOriginal = images[i].path;
							}
							// 先頭の画像、かつサイズがページサイズと同じ場合は背景画像として扱う
							if (i === 0) {
								let area = imageModel.area;
								if (area.x === HUIS_PAGE_BACKGROUND_AREA.x
									&& area.y === HUIS_PAGE_BACKGROUND_AREA.y
									&& area.w === HUIS_PAGE_BACKGROUND_AREA.w
									&& area.h === HUIS_PAGE_BACKGROUND_AREA.h) {
									imageModel.pageBackground = true;
								}
							}
							imageModels.push(imageModel);
						}

						this.collection = new Model.ImageItemsCollection(imageModels);
					}
				}

				if (!this.collection) {
					this.collection = new Model.ImageItemsCollection();
				}

				this.collection.on("add", this._renderNewModel.bind(this));

				var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
				this.imageItemTemplate_ = Tools.Template.getJST("#template-image-item", templateFile);
			}

			render(): ImageItem {
				this.collection.each((item: Model.ImageItem, index: number) => {
					let image: Model.ImageItem = $.extend(true, {}, item);
					if (this.remoteId_ === "common") {
						//let imagePath = image.path;
						//image.resolvedPath = path.join("app/res/faces/common/images", imagePath).replace(/\\/g, "/");

						//let garageExtensions = image.garageExtensions;
						//if (garageExtensions) {
						//	garageExtensions.resolvedOriginalPath = image.resolvedPath;
						//	image.garageExtensions = garageExtensions;
						//	image.resizeResolvedOriginalPath = image.resolvedPath;
						//}
					} else {
						if (!image.resolvedPath && this.materialsRootPath_) {
							let imagePath = image.path;
							// 画像パスを PC 内のパス (絶対パス) に変更する
							imagePath = path.resolve(path.join(this.materialsRootPath_, this.remoteId_, "images", imagePath)).replace(/\\/g, "/");
							image.resolvedPath = imagePath;
						}
						if (!image.resizeResolvedOriginalPath) {
							let garageExtensions = image.garageExtensions;
							if (garageExtensions) {
								if (!garageExtensions.resolvedOriginalPath && this.materialsRootPath_) {
									let originalPath = garageExtensions.original;
									// 画像パスを PC 内のパス (絶対パス) に変更する
									garageExtensions.resolvedOriginalPath = path.join(HUIS_REMOTEIMAGES_ROOT, originalPath).replace(/\\/g, "/");
								}
								image.garageExtensions = garageExtensions;
							}
						}
					}
					//if (!image.resolvedPath && this.materialsRootPath_) {
					//	let imagePath = image.path;
					//	// 画像パスを PC 内のパス (絶対パス) に変更する
					//	// ただし、"common" の画像は Garage 内のアセットを指定する
					//	if (this.remoteId_ === "common") {
					//		imagePath = path.join("app/res/faces/common/images", imagePath).replace(/\\/g, "/");
					//	} else {
					//		imagePath = path.resolve(path.join(this.materialsRootPath_, this.remoteId_, "images", imagePath)).replace(/\\/g, "/");
					//	}
					//	image.resolvedPath = imagePath;
					//}
					//if (!image.resizeResolvedOriginalPath) {
					//	let garageExtensions = image.garageExtensions;
					//	if (garageExtensions) {
					//		if (!garageExtensions.resolvedOriginalPath && this.materialsRootPath_) {
					//			let originalPath = garageExtensions.original;
					//			// 画像パスを PC 内のパス (絶対パス) に変更する
					//			// ただし、"common" の画像は Garage 内のアセットを指定する
					//			if (this.remoteId_ === "common") {
					//				garageExtensions.resolvedOriginalPath = path.join("app/res/faces/common/images", originalPath).replace(/\\/g, "/");
					//			} else {
					//				garageExtensions.resolvedOriginalPath = path.join(HUIS_REMOTEIMAGES_ROOT, originalPath).replace(/\\/g, "/");
					//			}
					//		}
					//		image.garageExtensions = garageExtensions;
					//	}
					//}
					let $image = $(this.imageItemTemplate_(image));
					if (image.garageExtensions) {
						switch (image.garageExtensions.resizeMode) {
							case "cover":
								$image.addClass("image-cover");
								break;
							case "stretch":
								$image.addClass("image-stretch");
								break;
							default:
								;
						}
					}
					this.$el.append($image);
				});
				return this;
			}

			/**
			 * ImageItem View がもつすべての ImageItem を返す。
			 * 
			 * @return {IGImage[]} ImageItem View がもつ ImageItem
			 */
			getImages(): IGImage[] {
				// enabled でない model を間引く 
				var imageModels = this.collection.models.filter((model) => {
					return model.enabled;
				});
				var images: IGImage[] = $.extend(true, [], imageModels);

				return images;
			}

			private _renderNewModel(model: Model.ImageItem) {
				var image: IGImage = $.extend(true, {}, model);
				if (!image.resolvedPath && this.materialsRootPath_) {
					let imagePath = image.path;
					if (imagePath) {
						imagePath = path.resolve(path.join(this.materialsRootPath_, this.remoteId_, "images", imagePath)).replace(/\\/g, "/");
						image.resolvedPath = imagePath;
					}
				}
				// 背景の場合は先頭に、それ以外の場合は末尾に追加する
				if (image.pageBackground) {
					this.$el.prepend($(this.imageItemTemplate_(image)));
				} else {
					this.$el.append($(this.imageItemTemplate_(image)));
				}
			}
		}
	}
}