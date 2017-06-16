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
                        let images: Model.ImageItem[] = [];
                        if (_.isArray(unknownTypeImage)) {
                            images = unknownTypeImage;
                        } else {
                            images.push(unknownTypeImage);
                        }

                        let imageModels: Model.ImageItem[] = [];
                        for (let i = 0, l = images.length; i < l; i++) {
                            let imageModel: Model.ImageItem = new Model.ImageItem();
                            imageModel.area = $.extend(true, {}, images[i].area);
                            imageModel.path = images[i].path;
                            if (images[i].garageExtensions) {
                                imageModel.garageExtensions = $.extend(true, {}, images[i].garageExtensions);
                            }
                            if (!imageModel.resizeOriginal) {
                                imageModel.resizeOriginal = images[i].path;
                            }

                            //バージョンの情報がある場合は、代入
                            if (images[i].version !== null) {
                                imageModel.version = images[i].version;
                            }

                            // 先頭の画像、かつサイズがページサイズと同じ場合は背景画像として扱う
                            if (i === 0) {
                                let area = imageModel.area;
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

            /**
             * ImageItem Collection をレンダリングする
             */
            render(): View.ImageItem {
                this.collection.each((item: Model.ImageItem, index: number) => {
                    let image: Model.ImageItem = $.extend(true, {}, item);
                    if (this.remoteId_ === "common") {
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
             * @return {Model.ImageItem[]} ImageItem View がもつ ImageItem
             */
            getImages(): Model.ImageItem[] {
                // enabled でない model を間引く 
                var imageModels = this.collection.models.filter((model) => {
                    return model.enabled;
                });
                var images: Model.ImageItem[] = $.extend(true, [], imageModels);

                return images;
            }

            /**
             * collection に ImageItem が追加されたら、追加されたものをレンダリングする
             */
            private _renderNewModel(model: Model.ImageItem) {
                var image: Model.ImageItem = $.extend(true, {}, model);
                if (!image.resolvedPath && this.materialsRootPath_) {
                    let imagePath = image.path;
                    if (imagePath) {
                        imagePath = path.resolve(path.join(this.materialsRootPath_, this.remoteId_, "images", imagePath)).replace(/\\/g, "/");
                        image.resolvedPath = imagePath;
                    }
                }
                // 背景の場合は先頭に、それ以外の場合は末尾に追加する
                if (image.isBackgroundImage) {
                    this.$el.prepend($(this.imageItemTemplate_(image)));
                } else {
                    this.$el.append($(this.imageItemTemplate_(image)));
                }
            }
        }
    }
}
