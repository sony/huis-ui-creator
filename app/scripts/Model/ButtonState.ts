/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.ButtonState] ";

        export class ButtonState extends Backbone.Model implements IGState {
            private imageCollection_: Backbone.Collection<ImageItem>;
            private labelCollection_: Backbone.Collection<LabelItem>;
            private remoteId_: string;
            private materialsRootPath_: string;

            defaults() {
                // Please write default parameters' value
                return {
                };
            }

            constructor(attributes?: any) {
                super();
                this.imageCollection_ = new ImageItemsCollection();
                this.labelCollection_ = new LabelItemsCollection();
                super(attributes, null);
                if (attributes) {
                    if (attributes.materialsRootPath && attributes.remoteId) {
                        this.materialsRootPath_ = attributes.materialsRootPath;
                        this.remoteId_ = attributes.remoteId;
                    }
                }
            }

            get stateId(): number {
                return this.get("stateId");
            }

            set stateId(val: number) {
                this.set("stateId", val);
            }

            get area(): IArea {
                return this.get("area");
            }

            set area(val: IArea) {
                this.set("area", val);
                // state 内の model の area 更新
                // [TODO] areaRatio を考慮すべきだが、暫定的に親要素と同じサイズ
                this.imageCollection_.forEach((imageModel) => {
                    imageModel.area = {
                        x: 0,
                        y: 0,
                        w: val.w,
                        h: val.h
                    };
                });
            }

            get image(): IGImage[]{
                let images: IGImage[] = [];
                let imageModels = this.imageCollection_.models;
                if (imageModels && 0 < imageModels.length) {
                    imageModels.forEach((imageModel) => {
                        let image: IGImage = {
                            area: $.extend(true, {}, imageModel.area),
                            path: imageModel.path
                        };
                        if (imageModel.resolvedPath) {
                            image.resolvedPath = imageModel.resolvedPath;
                        }
                        if (imageModel.resolvedPathCSS) {
                            image.resolvedPathCSS = imageModel.resolvedPathCSS;
                        }
                        if (imageModel.garageExtensions) {
                            image.garageExtensions = $.extend(true, {}, imageModel.garageExtensions);
                        }
                        if (imageModel.resizeMode) {
                            image.resizeMode = imageModel.resizeMode;
                        }
                        if (imageModel.resizeOriginal) {
                            image.resizeOriginal = imageModel.resizeOriginal;
                        }
                        if (imageModel.resizeResolvedOriginalPath) {
                            image.resizeResolvedOriginalPath = imageModel.resizeResolvedOriginalPath;
                        }
                        if (imageModel.resizeResolvedOriginalPathCSS) {
                            image.resizeResolvedOriginalPathCSS = imageModel.resizeResolvedOriginalPathCSS;
                        }
                        if (imageModel.areaRatio) {
                            image.areaRatio = $.extend(true, {}, imageModel.areaRatio);
                        }
                        image.resized = imageModel.resized;

                        images.push(image);
                    });
                    return images;
                }
                return null;
                //return this.get("image");
            }

            set image(val: IGImage[]) {
                let imageModels: ImageItem[] = [];

                val.forEach((image) => {
                    let imageModel = new ImageItem({
                        materialsRootPath: this.materialsRootPath_,
                        remoteId: this.remoteId_
                    });
                    imageModel.area = $.extend(true, {}, image.area);
                    // [TODO] 将来的に areaRatio から area を算出するつもりだが、暫定的に親要素と同じ大きさとする
                    if (this.area) {
                        imageModel.area = {
                            x: 0,
                            y: 0,
                            w: this.area.w,
                            h: this.area.h
                        };
                    }
                    imageModel.path = image.path;
                    if (image.garageExtensions) {
                        imageModel.garageExtensions = $.extend(true, {}, image.garageExtensions);
                    }
                    // image.resizeOriginal が明示的に指定されている場合は、上書きする
                    if (image.resizeOriginal) {
                        imageModel.resizeOriginal = image.resizeOriginal;
                    }
                    // model に resizeOriginal が指定されていない場合は、path をオリジナルとして指定する
                    if (!imageModel.resizeOriginal) {
                        imageModel.resizeOriginal = image.path;
                    }
                    if (image.resizeMode) {
                        imageModel.resizeMode = image.resizeMode;
                    }
                    imageModel.resized = true;
                    if (image.areaRatio) {
                        imageModel.areaRatio = $.extend(true, {}, image.areaRatio);
                    }

                    imageModels.push(imageModel);
                });
                this.imageCollection_.reset(imageModels);
                //this.set("image", val);
            }

            get label(): IGLabel[]{
                return this.get("label");
            }

            set label(val: IGLabel[]) {
                this.set("label", val);
            }

            get action(): IAction[]{
                return this.get("action");
            }

            set action(val: IAction[]) {
                this.set("action", val);
            }

            get translate(): IStateTranslate[] {
                return this.get("translate");
            }

            set translate(val: IStateTranslate[]) {
                this.set("translate", val);
            }

            get active(): boolean {
                return this.get("active");
            }

            set active(val: boolean) {
                this.set("active", val);
            }
        }
    }
}