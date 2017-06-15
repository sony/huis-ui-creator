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
        import JQUtils = Util.JQueryUtils;
        var TAG = "[Garage.View.Module] ";
        var MAX_PAGE_CONT = 5;

        export class Module extends Backbone.View<Model.Module> {

            private remoteId_: string;
            private materialsRootPath_: string;

            private buttonViews_: ButtonItem[];
            private labelViews_: LabelItem[];
            private imageViews_: ImageItem[];

            private faceAreaTemplate_: Tools.JST;
            private moduleContainerTemplate_: Tools.JST;

            private $facePages_: JQuery[];

            private parentFace: Model.Face;

            private static PAGE_INDEX_CHANGED = "pageIndexChanged";

            /**
             * constructor
             */
            constructor(parentFace?: Model.Face, options?: Backbone.ViewOptions<Model.Module>) {
                super(options);
                this.parentFace = parentFace;
            }

            events() {
                // Please add events
                return {
                };
            }

            initialize(options?: Backbone.ViewOptions<Model.Module>) {
                var modulesData: Model.Module[] = [];
                if (options && options.attributes) {
                    if (options.attributes["modules"]) {
                        modulesData = options.attributes["modules"];
                    }
                    if (options.attributes["materialsRootPath"]) {
                        this.materialsRootPath_ = options.attributes["materialsRootPath"];
                    }
                    if (options.attributes["remoteId"]) {
                        this.remoteId_ = options.attributes["remoteId"];
                    }
                }

                this.buttonViews_ = [];
                this.labelViews_ = [];
                this.imageViews_ = [];
                this.$facePages_ = [];
                var modules: Model.Module[] = [];
                for (var i = 0, l = modulesData.length; i < l; i++) {

                    let moduleModel: Model.Module = new Model.Module();
                    moduleModel.setInfoFromModule(modulesData[i]);
                    this.generateViews(moduleModel);
                    moduleModel.on(Module.PAGE_INDEX_CHANGED, this._pageIndexChanged.bind(this));

                    modules.push(moduleModel);
                }
                this.collection = new Model.ModulesCollection(modules, { facePageHeight: HUIS_FACE_PAGE_HEIGHT, facePageWidth: HUIS_FACE_PAGE_WIDTH });

                this.collection.on("add", this._renderNewModel.bind(this));

                var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
                this.faceAreaTemplate_ = Tools.Template.getJST("#template-face-page", templateFile);
                this.moduleContainerTemplate_ = Tools.Template.getJST("#template-module-container", templateFile);
            }

            render(): Module {
                var pageCount: number = (<any>this.collection).getPageCount();
                for (let i = this.$facePages_.length; i < pageCount; i++) {
                    let $facePage = $(this.faceAreaTemplate_({
                        index: i,
                        width: HUIS_FACE_PAGE_WIDTH,
                        height: HUIS_FACE_PAGE_HEIGHT
                    }));
                    this.$facePages_.push($facePage);
                }

                //Jsonファイルが破壊されているなどの理由で、this.$facePages_がひとつもないとき
                // index0の$facePageをつくる
                if (this.$facePages_.length == 0) {
                    let $facePage = $(this.faceAreaTemplate_({
                        index: 0,
                        width: HUIS_FACE_PAGE_WIDTH,
                        height: HUIS_FACE_PAGE_HEIGHT
                    }));
                    this.$facePages_.push($facePage);
                }


                let prevItem: Model.Module;
                this.collection.each((item, index) => {
                    let pageIndex: number = item.get("pageIndex");
                    let $targetFacePage = this.$facePages_[pageIndex];
                    let $moduleContainer = $(this.moduleContainerTemplate_({
                        index: index,
                        width: item.area.w,
                        height: item.area.h,
                        offsetY: item.offsetY,
                        pageIndex: item.pageIndex,
                        cid: item.cid
                    }));

                    if (this.parentFace.isSeparatorNeeded(prevItem, item)) {
                        this._renderSeparator(item.group.name, $moduleContainer);
                    }

                    // ラベルをレンダリング
                    this._renderLabels(item.label, index, $moduleContainer);
                    // 画像をレンダリング
                    this._renderImages(item.image, index, $moduleContainer);
                    // ボタンをレンダリング
                    this._renderButtons(item.button, index, $moduleContainer);

                    // DOM に追加
                    $targetFacePage.append($moduleContainer);
                    this.$el.append($targetFacePage);
                    prevItem = item;
                });

                //Jsonファイルが破壊されているなどの理由で、moduleがひとつもないとき
                // facePagesだけでappendする
                if (this.collection.length == 0) {
                    let $targetFacePage = this.$facePages_[0];
                    this.$el.append($targetFacePage);
                }


                return this;
            }

            /**
             * face 内のページ数を取得する。
             * 
             * @return {number} face 内のページ数。
             */
            getPageCount(): number {
                var moduleCount = this.collection.length;
                var pageCount = 0;
                for (let i = 0; i < moduleCount; i++) {
                    let moduleModel = this.collection.at(i);
                    // collection 内の model の pageIndex のうち、最大のものをページ数とする
                    if (pageCount < moduleModel.pageIndex + 1) {
                        pageCount = moduleModel.pageIndex + 1;
                    }
                }

                return pageCount;
            }

            /**
             * モジュール (ページ) を追加する。
             * ページ数の上限に達しているかどうかは呼び出しもとが判断しておく。
             *
             * @return {boolean} true: 成功, false: 失敗
             */
            addPage(): boolean {
                var pageCount = this.collection.length;

                // Module model の生成
                var newPageModuleModel = new Model.Module();
                newPageModuleModel.setInfo(this.remoteId_, pageCount);
                newPageModuleModel.pageIndex = pageCount;

                // 空の Item View を追加しておく
                this.buttonViews_.push(null);
                this.imageViews_.push(null);
                this.labelViews_.push(null);

                newPageModuleModel.on(Module.PAGE_INDEX_CHANGED, this._pageIndexChanged.bind(this));

                // collection に追加
                this.collection.add(newPageModuleModel);

                return true;
            }

            /**
             * モジュール (ページ) を削除する。
             * 
             * @pageIndex {number} 削除するページの index
             * @return {boolean} true: 成功, false: 失敗
             */
            deletePage(pageIndex: number): boolean {
                console.log(TAG + "deletePage() - before");
                console.log(this.collection);
                let l = this.collection.length;
                for (let i = l - 1; 0 <= i; i--) {
                    let moduleModel = this.collection.at(i);
                    if (moduleModel.pageIndex === pageIndex) {
                        // 指定した pageIndex の module を削除する
                        this.deleteModule(moduleModel.cid);
                    } else if (pageIndex < moduleModel.pageIndex) {
                        // 削除対象の pageIndex を超えている場合は、pageIndex をデクリメントする
                        moduleModel.pageIndex--;
                        moduleModel.trigger(Module.PAGE_INDEX_CHANGED, moduleModel);
                    }
                }

                this.$facePages_.splice(pageIndex, 1);

                console.log(TAG + "deletePage() - after");
                console.log(this.collection);

                return true;
            }

            /**
             * モジュールを削除する。
             * 
             * @moduleId {string} 削除するモジュールの ID
             * @return {boolean} true: 成功, false: 失敗
             */
            deleteModule(moduleId: string): boolean {
                let moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.warn(TAG + " deletePage() module not found");
                    return false;
                }

                /* module 内の button / label / image のモデルを削除する */
                let buttonView = this.buttonViews_[moduleIndex];
                if (buttonView) {
                    buttonView.collection.each((button) => {
                        if (button) {
                            button.destroy();
                        }
                    });
                    buttonView.collection.reset();
                    buttonView = null;
                }
                this.buttonViews_.splice(moduleIndex, 1);

                let labelView = this.labelViews_[moduleIndex];
                if (labelView) {
                    labelView.collection.each((label) => {
                        if (label) {
                            label.destroy();
                        }
                    });
                    labelView.collection.reset();
                    labelView = null;
                }
                this.labelViews_.splice(moduleIndex, 1);

                let imageView = this.imageViews_[moduleIndex];
                if (imageView) {
                    imageView.collection.each((image) => {
                        if (image) {
                            image.destroy();
                        }
                    });
                    imageView.collection.reset();
                    imageView = null;
                }
                this.imageViews_.splice(moduleIndex, 1);

                let moduleModel = this.collection.get(moduleId);
                if (moduleModel) {
                    this.collection.remove(moduleModel);
                    moduleModel.destroy();
                    moduleModel = null;
                }
            }

            /**
             * ボタンを取得する。
             * 
             * @param moduleId {string} [in] ボタンを検索する module の ID
             * @param buttonId {string} [in] 検索するボタンの ID
             * @return {Model.ButtonItem} 見つかったボタンの Model。見つからない場合は null。
             */
            getButton(moduleId: string, buttonId: string): Model.ButtonItem {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }
                if (!this.buttonViews_) {
                    return null;
                }
                var buttonView = this.buttonViews_[moduleIndex];
                if (!buttonView) {
                    return null;
                }
                return buttonView.collection.get(buttonId);
            }

            /**
             * module 内のすべてのボタンを取得する。
             * 
             * @param moduleId {string} [in] ボタンを取得する module の ID
             * @return {Model.ButtonItem[]} module 内のすべてのボタンの Model。見つからない場合は null。
             */
            getButtons(moduleId: string): Model.ButtonItem[] {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }

                if (!this.buttonViews_) {
                    return null;
                }
                var buttonView = this.buttonViews_[moduleIndex];
                if (!buttonView) {
                    return null;
                }
                return buttonView.collection.models;
            }

            /**
             * ボタンを追加する。
             * 
             * @param button {Model.ButtonItem} [in] 追加するボタンの model
             * @param moduleId {string} [in] ボタンの追加先となる module の ID
             * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
             */
            addButton(button: Model.ButtonItem, moduleId: string, offsetY?: number, callback?: Function): Model.ButtonItem {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }
                //var module = this.modules_[moduleIndex];
                var module = this.collection.at(moduleIndex);

                var buttonView = this.buttonViews_[moduleIndex];
                if (!buttonView) {
                    buttonView = new ButtonItem({
                        attributes: {
                            materialsRootPath: this.materialsRootPath_,
                            remoteId: module.remoteId
                        }
                    });
                    this.buttonViews_[moduleIndex] = buttonView;
                }

                var newButton = button.clone(module.remoteId, offsetY);

                // 所属する module の要素を取得し、View に set する
                var $module = this.$el.find("[data-cid='" + moduleId + "']");
                buttonView.setElement($module);
                buttonView.collection.add(newButton);

                return newButton;
            }

            /**
             * ボタンを削除する。
             * 
             * @param button {Model.ButtonItem} [in] 削除するボタンの model
             * @param moduleId {string} [in] 削除するボタンが存在する module の ID
             */
            deleteButton(button: Model.ButtonItem, moduleId: string) {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.error(TAG + "[Module.deleteButton] module not found.");
                    return;
                }
                // 対象となる module の buttonView を取得
                var buttonView = this.buttonViews_[moduleIndex];
                if (!buttonView) {
                    console.error(TAG + "[Module.deleteButton] buttonView is not found.");
                    return;
                }
                // buttonView が持っている collection から buttonItem を削除する
                buttonView.collection.remove(button);
            }

            /**
             * ボタンアイテムに「状態」を追加する
             */
            addButtonState(state: IState, moduleId: string, buttonId: string) {
                var button = this.getButton(moduleId, buttonId);
                if (!button) {
                    console.error(TAG + "addButtonState: button is not found");
                    return;
                }
            }

            /**
             * 画像アイテムを取得する。
             * 
             * @param moduleId {string} [in] 画像アイテムを検索する module の ID
             * @param imageId {string} [in] 検索する画像アイテムの ID
             * @return {Model.ImageItem} 見つかった画像アイテムの Model。見つからない場合は null。
             */
            getImage(moduleId: string, imageId: string): Model.ImageItem {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "getImage() module not found");
                    return null;
                }

                var imageView = this.imageViews_[moduleIndex];
                return imageView.collection.get(imageId);
            }

            /**
             * 画像アイテムを追加する。
             * 
             * @param image {Model.ImageItem} [in] 追加する画像アイテムの元となる model
             * @param moduleId {string} [in] 画像アイテムの追加先となる module の ID
             * @param callback {Function} 画像追加後に呼び出すコールバック関数
             * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
             */
            addImage(image: Model.ImageItem, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem;

            /**
             * 画像アイテムを追加する。
             * 
             * @param image {string} [in] 追加する画像アイテムのパス。パスを指定した場合は、ページの背景として追加される。
             * @param moduleId {string} [in] 画像アイテムの追加先となる module の ID
             * @param callback {Function} 画像追加後に呼び出すコールバック関数
             * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
             */
            addImage(image: string, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem;

            addImage(image: any, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem {
                if (!offsetY) {
                    offsetY = 0;
                }
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }
                var module = this.collection.at(moduleIndex);

                var imageView = this.imageViews_[moduleIndex];
                if (!imageView) {
                    imageView = new ImageItem({
                        attributes: {
                            materialsRootPath: HUIS_FILES_ROOT,
                            remoteId: module.remoteId
                        }
                    });
                    this.imageViews_[moduleIndex] = imageView;
                }

                // 新しい model を追加する
                let newImage: Model.ImageItem;
                var newArea: IArea;
                var srcImagePath: string;
                // image が string の場合は、image をパスとして扱い、ImageItem を新規作成する
                if (_.isString(image)) {
                    newImage = new Model.ImageItem();

                    // area はページ背景のものを使用する
                    newArea = {
                        x: HUIS_PAGE_BACKGROUND_AREA.x,
                        y: HUIS_PAGE_BACKGROUND_AREA.y,
                        w: HUIS_PAGE_BACKGROUND_AREA.w,
                        h: HUIS_PAGE_BACKGROUND_AREA.h
                    };
                    newImage.area = newArea;
                    if (0 < image.length) {
                        srcImagePath = image;
                        newImage.path = module.remoteId + "/" + path.basename(image);
                    }
                    newImage.pageBackground = true;
                } else { // image が文字列でない場合は、model として情報をコピーする
                    newImage = image.clone(this.materialsRootPath_, module.remoteId, offsetY);

                    srcImagePath = image.resolvedPath;
                }

                // 所属する module の要素を取得し、View に set する
                var $module = this.$el.find("[data-cid='" + moduleId + "']");
                imageView.setElement($module);
                if (newImage.pageBackground) {
                    // 背景の場合、先頭に追加する
                    imageView.collection.add(newImage, { at: 0 });
                } else {
                    imageView.collection.add(newImage);
                }

                // 有効な画像パスが指定されており、出力先のパスに画像が存在しない場合、グレースケール化してコピーする
                if (srcImagePath && fs.existsSync(srcImagePath) && !fs.existsSync(newImage.resolvedPath)) {
                    Model.OffscreenEditor.editImage(srcImagePath, IMAGE_EDIT_PARAMS, newImage.resolvedPath).done((result) => {
                        if (callback) {
                            callback(result);
                        }
                    });
                }

                return newImage;
            }


            /**
             * 画像アイテムを追加する。画像のコピーは発生しない。
             * 
             * @param image {Model.ImageItem} [in] 追加する画像アイテムの元となる model
             * @param moduleId {string} [in] 画像アイテムの追加先となる module の ID
             * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
             */
            addImageWithoutCopy(image: Model.ImageItem, moduleId: string, offsetY: number): Model.ImageItem {
                if (!offsetY) {
                    offsetY = 0;
                }

                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }
                var module = this.collection.at(moduleIndex);

                var imageView = this.imageViews_[moduleIndex];
                if (!imageView) {
                    imageView = new ImageItem({
                        attributes: {
                            materialsRootPath: this.materialsRootPath_,
                            remoteId: module.remoteId
                        }
                    });
                    this.imageViews_[moduleIndex] = imageView;
                }

                // 新しい model を追加する
                var newImage = new Model.ImageItem();

                var newArea: IArea;
                // image が string の場合は、image をパスとして扱う
                newArea = $.extend(true, {}, image.area);
                newArea.y += offsetY;
                newImage.area = newArea;

                // 画像の path を出力先の remoteId のディレクトリーになるように指定
                newImage.path = image.path;
                newImage.resolvedPath = image.resolvedPath;
                newImage.resizeOriginal = image.resizeOriginal;


                //バージョン情報をもっている場合、引き継ぐ
                if (image.version != null) {
                    newImage.version = image.version;
                }

                // 所属する module の要素を取得し、View に set する
                var $module = this.$el.find("[data-cid='" + moduleId + "']");
                imageView.setElement($module);
                if (newImage.pageBackground) {
                    // 背景の場合、先頭に追加する
                    imageView.collection.add(newImage, { at: 0 });
                } else {
                    imageView.collection.add(newImage);
                }

                return newImage;
            }

            /**
             * 画像アイテムを削除する。
             * 
             * @param image {Model.ImageItem} [in] 削除する画像アイテムの model
             * @param moduleId {string} [in] 削除する画像アイテムが存在する module の ID
             */
            deleteImage(image: Model.ImageItem, moduleId: string) {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.error(TAG + "[Module.deleteImage] module not found.");
                    return;
                }
                // 対象となる module の imageView を取得
                var imageView = this.imageViews_[moduleIndex];
                if (!imageView) {
                    console.error(TAG + "[Module.deleteImage] imageView is not found.");
                    return;
                }
                // imageView が持っている collection から imageItem を削除する
                imageView.collection.remove(image);
            }

            /**
             * ラベルを取得する。
             * 
             * @param moduleId {string} [in] ラベルを検索する module の ID
             * @param labelId {string} [in] 検索するラベルの ID
             * @return {Model.LabelItem} 見つかったラベルの Model。見つからない場合は null。
             */
            getLabel(moduleId: string, labelId: string): Model.LabelItem {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }

                var labelView = this.labelViews_[moduleIndex];
                return labelView.collection.get(labelId);
            }

            /**
             * ラベルを追加する。
             * 
             * @param label {Model.LabelItem} [in] 追加するラベルの model
             * @param moduleId {string} [in] ラベルの追加先となる module の ID
             * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
             */
            addLabel(label: Model.LabelItem, moduleId: string, offsetY?: number): Model.LabelItem {
                if (!offsetY) {
                    offsetY = 0;
                }
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }
                var moduleModel = this.collection.at(moduleIndex);

                var labelView = this.labelViews_[moduleIndex];
                if (!labelView) {
                    labelView = new LabelItem({
                    });
                    this.labelViews_[moduleIndex] = labelView;
                }

                // model をコピーして追加する
                let newLabel = label.clone(offsetY);

                // 所属する module の要素を取得し、View に set する
                var $module = this.$el.find("[data-cid='" + moduleId + "']");
                labelView.setElement($module);
                labelView.collection.add(newLabel);

                return newLabel;
            }

            /**
             * ラベルを削除する。
             * 
             * @param label {Model.LabelItem} [in] 削除するラベルの model
             * @param moduleId {string} [in] 削除するラベルが存在する module の ID
             */
            deleteLabel(label: Model.LabelItem, moduleId: string) {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.error(TAG + "[Module.deleteLabel] module not found.");
                    return;
                }
                // 対象となる module の labelView を取得
                var labelView = this.labelViews_[moduleIndex];
                if (!labelView) {
                    console.error(TAG + "[Module.deleteLabel] labelView is not found.");
                    return;
                }
                // labelView が持っている collection から labelItem を削除する
                labelView.collection.remove(label);
            }

            /**
             * Module View がもつすべての module を取得する。
             *
             * @param areaFilter {Function} moduleのareaによるフィルタ。未指定の場合は全てを取得。
             * @return {Model.Module[]} Module View がもつ module の配列
             */
            getModules(areaFilter?: (area) => boolean): Model.Module[] {
                let isValidArea = areaFilter ? areaFilter : function (area) { return true; };

                var modules: Model.Module[] = $.extend(true, [], this.collection.models);
                modules.forEach((module: Model.Module, index: number) => {
                    let buttonView = this.buttonViews_[index],
                        imageView = this.imageViews_[index],
                        labelView = this.labelViews_[index];

                    if (buttonView) {
                        module.button = buttonView.getButtons().filter((button) => {
                            return isValidArea(button.area);
                        });
                    }
                    if (imageView) {
                        module.image = imageView.getImages().filter((image) => {
                            return isValidArea(image.area);
                        });
                    }
                    if (labelView) {
                        module.label = labelView.getLabels().filter((label) => {
                            return isValidArea(label.area);
                        });
                    }
                });

                return modules;
            }

            /**
             * 指定した id の module を取得する。
             * 
             * @param moduleId {string} 取得したい module の ID
             * @return {Model.Module} moduleId と合致する module。見つからない場合は、null
             */
            getModule(moduleId: string): Model.Module {
                var moduleIndex = this._getModuleIndex(moduleId);
                if (moduleIndex < 0) {
                    console.log(TAG + "module not found");
                    return null;
                }

                var moduleModel = this.collection.at(moduleIndex);
                if (!moduleModel) {
                    return null;
                }

                var module: Model.Module = $.extend(true, {}, moduleModel);
                return module;
            }


            private generateViews(module: Model.Module) {
                // モジュール内に button があったら、ButtonItem View を生成
                if (module.button) {
                    this.buttonViews_.push(new ButtonItem({
                        attributes: {
                            buttons: module.button,
                            materialsRootPath: this.materialsRootPath_,
                            remoteId: module.remoteId
                        }
                    }));
                } else {
                    this.buttonViews_.push(null);
                }

                // モジュール内に label があったら、LabelItem View を生成
                if (module.label) {
                    this.labelViews_.push(new LabelItem({
                        attributes: {
                            labels: module.label,
                            materialsRootPath: this.materialsRootPath_
                        }
                    }));
                } else {
                    this.labelViews_.push(null);
                }

                // モジュール内に image があったら、ImageItem View を生成
                if (module.image) {
                    this.imageViews_.push(new ImageItem({
                        attributes: {
                            images: module.image,
                            materialsRootPath: this.materialsRootPath_,
                            remoteId: module.remoteId
                        }
                    }));
                } else {
                    this.imageViews_.push(null);
                }
            }

            addModuleInNewFacePages(inputModules: Model.Module[]) {
                let FUNCTION_NAME = TAG + "addModules : ";

                if (inputModules == null) {
                    console.warn(FUNCTION_NAME + "inputModules is null");
                    return;
                }
                let modulesModels: Model.Module[] = [];

                for (var i = 0, l = inputModules.length; i < l; i++) {
                    if (!this.isValidModule(inputModules[i])) {
                        // 無効なモジュールは表示しない
                        continue;
                    }

                    //ページカウントは、すでに記述されているページに追加する
                    let moduleModel: Model.Module = new Model.Module();
                    moduleModel.setInfoFromModule(inputModules[i]);
                    this.generateViews(moduleModel);
                    moduleModel.on(Module.PAGE_INDEX_CHANGED, this._pageIndexChanged.bind(this));
                    modulesModels.push(moduleModel);
                }

                (<any>this.collection).addModules(modulesModels, HUIS_FACE_PAGE_HEIGHT);


            }


            /**
             * モジュールが有効かどうか検査する
             * @param item {Model.Module} 検査対象モジュール
             * @return {boolean} 有効なモジュールの場合はtrue、そうでない場合はfalse
             */
            private isValidModule(item: Model.Module): boolean {
                if (item.button) {
                    // ボタンが有る場合はボタン全てを検査
                    return this.isValidButtons(item.button);
                } else {
                    // ボタンが無い場合は有効
                    return true;
                }
            }


            /**
             * ボタンリストが有効かどうか検査する
             * @param buttons {Model.ButtonItem[]} 検査対象ボタンリスト
             * @return {boolean} ボタンリストが有効な場合はtrue、そうでない場合はfalse
             */
            private isValidButtons(buttons: Model.ButtonItem[]): boolean {
                for (let button of buttons) {
                    if (this.isValidButton(button)) {
                        return true;
                    }
                }

                // 全ボタンが無効な場合は無効
                return false;
            }


            /**
             * ボタンが有効かどうか検査する
             * @param button {Model.ButtonItem} 検査対象ボタン
             * @return {boolean} ボタンが有効な場合はtrue、そうでない場合はfalse
             */
            private isValidButton(button: Model.ButtonItem): boolean {
                if (!button.state) return false;

                for (let state of button.state) {
                    if (!state.action) continue;

                    for (let action of state.action) {
                        if (action.code_db &&
                            action.code_db.device_type &&
                            action.code_db.device_type == DEVICE_TYPE_LEARNED &&
                            !action.bluetooth_data) {
                            // 学習リモコンの場合
                            if (action.code == null) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }


            private _getModuleIndex(id: string): number {
                var moduleIndex = -1;
                this.collection.find((module: Model.Module, index: number) => {
                    if (module.cid === id) {
                        moduleIndex = index;
                        return true;
                    }
                    return false;
                });

                return moduleIndex;
            }

            private _renderSeparator(moduleName: string, $targetModuleContainer: JQuery) {
                if (moduleName == null || $targetModuleContainer == null) {
                    return;
                }
                let moduleSeparator = new ModuleSeparator(moduleName);
                moduleSeparator.setElement($targetModuleContainer);
                moduleSeparator.render();
            }

            private _renderButtons(buttons: IButton[], index: number, $targetModuleContainer: JQuery) {
                if (!buttons || !this.buttonViews_[index]) {
                    return;
                }
                this.buttonViews_[index].setElement($targetModuleContainer);
                this.buttonViews_[index].render();
            }

            private _renderLabels(labels: ILabel[], index: number, $targetModuleContainer: JQuery) {
                if (!labels || !this.labelViews_[index]) {
                    return;
                }
                this.labelViews_[index].setElement($targetModuleContainer);
                this.labelViews_[index].render();
            }

            private _renderImages(images: IImage[], index: number, $targetModuleContainer: JQuery) {
                if (!images || !this.imageViews_[index]) {
                    return;
                }
                this.imageViews_[index].setElement($targetModuleContainer);
                this.imageViews_[index].render();
            }

            private _renderNewModel(model: Model.Module) {
                var pageIndex = model.pageIndex;
                for (let i = this.$facePages_.length; i < pageIndex + 1; i++) {
                    let $facePage = $(this.faceAreaTemplate_({
                        index: i,
                        width: HUIS_FACE_PAGE_WIDTH,
                        height: HUIS_FACE_PAGE_HEIGHT
                    }));
                    this.$facePages_.push($facePage);
                }
                let $targetFacePage = this.$facePages_[pageIndex];
                let $moduleContainer = $(this.moduleContainerTemplate_({
                    index: pageIndex,
                    width: model.area.w,
                    height: model.area.h,
                    offsetY: model.offsetY,
                    pageIndex: model.pageIndex,
                    cid: model.cid
                }));

                // module の index を取得
                var moduleIndex = this.collection.indexOf(model);

                // 画像をレンダリング
                this._renderImages(model.image, moduleIndex, $moduleContainer);
                // ラベルをレンダリング
                this._renderLabels(model.label, moduleIndex, $moduleContainer);
                // ボタンをレンダリング
                this._renderButtons(model.button, moduleIndex, $moduleContainer);

                // DOM に追加
                $targetFacePage.append($moduleContainer);
                this.$el.append($targetFacePage);
            }

            /**
             * module Model の pageIndex に変更があった場合、data 属性を更新する
             */
            private _pageIndexChanged(moduleModel: Model.Module) {
                if (!moduleModel) {
                    return;
                }
                let pageIndex = moduleModel.pageIndex;
                if (_.isUndefined(pageIndex)) {
                    return;
                }
                let moduleId = moduleModel.cid;

                // data 属性の更新
                let $targetModule = this.$el.find(".module-container[data-cid=\"" + moduleId + "\"]");
                JQUtils.data($targetModule, "modulePageIndex", pageIndex, { all: true });
                let $targetPage = $targetModule.parent();
                JQUtils.data($targetPage, "pageIndex", pageIndex);
            }

        }
    }
}
