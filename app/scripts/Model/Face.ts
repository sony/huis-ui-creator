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

        const TAG: string = "[Garage.Model.Face] ";

        export class Face extends Backbone.Model implements IGFace {

            constructor(remoteId: string, name: string, category: string, modules?: Model.Module[], attributes?: any, options?: any) {
                super(attributes, options);

                this.modules = [];
                if (modules != null) {
                    this.modules = modules;
                }

                this.remoteId = remoteId;
                this.name = name;
                this.category = category;
            }

            private _createEmptyModule(remoteId: string, pageIndex: number): Model.Module {
                let emptyModuleArea = {
                    x: 0,
                    y: 0,
                    w: HUIS_FACE_PAGE_WIDTH,
                    h: 0,
                }
                let module = new Model.Module();
                module.setInfo(remoteId, pageIndex, emptyModuleArea);
                return module;
            }

            private _finalizeModule(module: Model.Module): Model.Module {
                module.area = {
                    x: 0,
                    y: 0,
                    w: HUIS_FACE_PAGE_WIDTH,
                    h: HUIS_FACE_PAGE_HEIGHT
                }
                return module;
            }

            public getCodes(): string[] {
                let resultCodes: string[] = [];

                var modules = this.modules;
                for (let i = 0, ml = modules.length; i < ml; i++) {
                    var buttons = modules[i].button;
                    if (!buttons) {
                        continue;
                    }
                    for (let j = 0, bl = buttons.length; j < bl; j++) {
                        var states = buttons[j].state;
                        if (!states) {
                            continue;
                        }
                        for (let k = 0, sl = states.length; k < sl; k++) {
                            var actions = states[k].action;
                            if (!actions) {
                                continue;
                            }
                            for (let l = 0, al = actions.length; l < al; l++) {
                                var code = actions[l].code;
                                if (code) {
                                    resultCodes.push(code);
                                }
                            }
                        }
                    }
                }

                if (resultCodes.length == 0) {
                    return null;
                }

                return resultCodes;
            }

            /*
             * このFaceをfullcustomで生成されるModuleと同様のフォーマットのFaceに変換する。
             */
            public convertToFullCustomFace() {

                let convertedModules: Model.Module[] = [];
                let pageIndex = 0;

                let module = this._createEmptyModule(this.remoteId, pageIndex);
                let prevElem: Model.Module;
                for (let elem of this.modules) {
                    let isCrossPage = module.area.h + elem.area.h > HUIS_FACE_PAGE_HEIGHT;
                    if (isCrossPage) {
                        convertedModules.push( this._finalizeModule(module) );
                        pageIndex++;
                        module = this._createEmptyModule(this.remoteId, pageIndex);
                    }
                    if (this.isSeparatorNeeded(prevElem, elem)) {
                        let moduleSeparator = new Model.ModuleSeparator(elem.group.name);
                        moduleSeparator.insertTo(elem);
                    }
                    module.merge(elem);
                    prevElem = elem;
                }
                convertedModules.push( this._finalizeModule(module) );

                this.modules = convertedModules;
                this.category = DEVICE_TYPE_FULL_CUSTOM;
                return this;
            }

            /*
             * 引数で与えられた二つの引数の間にSeparatorが必要か否かを判定する。
             * @param prevItem: Model.Module
             * @param currentItem: Model.Module
             */
            public isSeparatorNeeded(prevItem: Model.Module, currentItem: Model.Module): boolean {
                if (currentItem == null) {
                    console.warn(TAG + "currentItem is null, skip moduleSeparator");
                    return false;
                }

                if (this.category !== "Custom") {
                    return false;
                }

                if (prevItem == null) {
                    // First module of "custom" face
                    return true;
                } else {
                    if (prevItem.group == null) {
                        // Just null check
                        return false;
                    }
                    if (prevItem.group.name !== currentItem.group.name
                        || prevItem.group.original_remote_id !== currentItem.group.original_remote_id) {
                        // currentItem is different from prevItem
                        return true;
                    }
                    if (prevItem.get("pageIndex") !== currentItem.get("pageIndex")) {
                        // cross page border
                        return true;
                    }
                }

                return false;
            }

            /**
             * このFaceを複製した上で、引数で与えられたremoteIdを持つ新たなFaceを作成する。
             *
             * @param {string} dstRemoteId 新しいFaceのremoteId
             * @return {Model.Face} 新しくコピーされたFace
             */
            copy(dstRemoteId: string): Model.Face {
                let newFace: Model.Face = this.clone();
                let images = newFace._searchImages();
                newFace._copyImage(images, dstRemoteId);
                newFace.setWholeRemoteId(dstRemoteId);
                return newFace;
            }

            /**
             * 引数で与えられたImageを、引数で与えられたremoteIdの画像ディレクトリ(例：HuisFiles/remoteimages/0000)にコピーする。
             *
             * @param {IGImage[]} images 変更対象のImage。
             * @param {string} remoteId 変更先となる画像ディレクトリのremoteId。
             */
            private _copyImage(images: IGImage[], remoteId: string) {
                for (let image of images) {
                    // Copy resized image referenced from image.path
                    if (image.path != null) {
                        let srcImagePath = path.join(HUIS_REMOTEIMAGES_ROOT, image.path).replace(/\\/g, "/");
                        let imageFileName = image.path.substr(image.path.lastIndexOf("/") + 1);
                        image.path = path.join(remoteId, imageFileName).replace(/\\/g, "/");
                        let dstImagePath = path.join(HUIS_REMOTEIMAGES_ROOT, image.path).replace(/\\/g, "/");

                        if (fs.existsSync(srcImagePath)) {
                            fs.copySync(srcImagePath, dstImagePath);
                        }
                    }
                    // Copy original image referenced from garageExtensions.original
                    if (image.garageExtensions != null && image.garageExtensions.original != null) {
                        let srcImagePath = path.join(HUIS_REMOTEIMAGES_ROOT, image.garageExtensions.original).replace(/\\/g, "/");
                        let imageFileName = image.garageExtensions.original.substr(image.garageExtensions.original.lastIndexOf("/") + 1);
                        image.garageExtensions.original = path.join(remoteId, imageFileName).replace(/\\/g, "/");
                        let dstImagePath = path.join(HUIS_REMOTEIMAGES_ROOT, image.garageExtensions.original).replace(/\\/g, "/");

                        if (fs.existsSync(srcImagePath)) {
                            fs.copySync(srcImagePath, dstImagePath);
                        }
                    }
                }
            }

            /**
             * このFaceに含まれるImageを全て検索する。
             * 具体的には、Moduleに含まれるImage、Button.Stateに含まれるImageを全て検索する。
             *
             * @return {IGImage[]} 検索されたImage。
             */
            private _searchImages(): IGImage[] {
                let images: IGImage[] = [];
                for (let module of this.modules) {
                    if (module.image != null) {
                        images = images.concat(module.image);
                    }
                    for (let button of module.button) {
                        for (let state of button.state) {
                            if (state.image != null) {
                                images = images.concat(state.image);
                            }
                        }
                    }
                }
                return images;
            }

            /**
             * faceのcloneを作成する。型情報はコピーされない事に注意。
             *
             * @return {Model.Face} コピーされたface。
             */
            clone(): Model.Face {
                return $.extend(true, {}, this);
            }

            /**
             * このFaceの総ページ数を返す
             */
            getTotalPageNum() {
                let FUNCTION_NAME = TAG + "TotalPageNum : ";

                if (this.modules == null || this.modules.length == null) {
                    console.warn(FUNCTION_NAME + "modules in this face (" + name + "is null");
                    return undefined;
                }

                //ページが保持しているモジュール数を総ページ数とする。
                return this.modules.length
            }

            /**
             * このFace、及び含まれるModuleにremoteIdをセットする。
             * その際に、Moduleのnameに含まれるremoteIdも更新する。
             *
             * @param val: string 設定するremoteId
             */
            private setWholeRemoteId(val: string) {
                this.remoteId = val;
                for (let elem of this.modules) {
                    elem.remoteId = val;
                    elem.name = elem.name.replace(/\d{4}/, val);
                }
            }

            get remoteId() {
                return this.get("remoteId");
            }

            set remoteId(val) {
                this.set("remoteId", val);
            }

            get name() {
                return this.get("name");
            }

            set name(val) {
                this.set("name", val);
            }

            get category() {
                return this.get("category");
            }

            set category(val) {
                this.set("category", val);
            }

            get modules(): Model.Module[] {
                return this.get("modules");
            }

            set modules(val) {
                this.set("modules", val);
            }

            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["remoteId", "name", "category", "modules"];
            }

        }
    }
}