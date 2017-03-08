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

            /*
             * このFace、及び含まれるModuleにremoteIdをセットする。
             * @param val: string 設定するremoteId
             */
            public setWholeRemoteId(val: string) {
                this.remoteId = val;
                for (let elem of this.modules) {
                    elem.remoteId = val;
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