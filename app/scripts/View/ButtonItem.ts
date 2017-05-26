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

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import JQUtils = Util.JQueryUtils;
        var TAG = "[Garage.View.ButtonItem] ";

        export class ButtonItem extends Backbone.View<Model.ButtonItem> {

            private materialsRootPath_: string;
            private remoteId_: string;
            private buttonItemTemplate_: Tools.JST;

            // TODO: change comment
            /**
             * constructor
             */
            // TODO: change arguments of constructor
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super();
                if (options.attributes) {
                    if (options.attributes["materialsRootPath"]) {
                        this.materialsRootPath_ = options.attributes["materialsRootPath"];
                    }
                    if (options.attributes["remoteId"]) {
                        this.remoteId_ = options.attributes["remoteId"];
                    }

                    let unknownTypeButtons = options.attributes["buttons"];
                    if (unknownTypeButtons) {
                        let buttons: Model.ButtonItem[] = [];
                        if (_.isArray(unknownTypeButtons)) {
                            buttons = unknownTypeButtons;
                        } else {
                            buttons.push(unknownTypeButtons);
                        }
                        let buttonModels: Model.ButtonItem[] = [];
                        for (let i = 0, l = buttons.length; i < l; i++) {
                            let buttonData: Model.ButtonItem = buttons[i];
                            var buttonModel: Model.ButtonItem = new Model.ButtonItem({
                                remoteId: this.remoteId_,
                                materialsRootPath: this.materialsRootPath_
                            });

                            if (buttonData.name){
                                buttonModel.name = buttonData.name;
                            }

                            if (buttonData.version) {
                                buttonModel.version = buttonData.version;
                            }

                            buttonModel.area = buttonData.area;
                            var states = buttonData.state;
                            buttonModel.state = states;
                            if (buttonData.default) {
                                buttonModel.set("default", buttonData.default);
                                buttonModel.set("currentStateId", buttonData.default);
                            }
                            buttonModels.push(buttonModel);
                        }
                        this.collection = new Model.ButtonItemsCollection(buttonModels);
                    }
                }

                if (!this.collection) {
                    this.collection = new Model.ButtonItemsCollection();
                }

                this.collection.on("add", this._renderNewModel.bind(this));

                var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
                this.buttonItemTemplate_ = Tools.Template.getJST("#template-button-item", templateFile);

                super(options);
            }

            events() {
                // Please add events
                return {
                };
            }

            render(): ButtonItem {
                this.collection.each((model: Model.ButtonItem) => {
                    this._modifyModel(model);
                    let filtered_state = null;
                    let filtered_action = null;
                    if (_.isArray(model.state)) {
                        // 全actionが無効なstate
                        filtered_state = model.state.filter((s: Model.ButtonState, index: number, array: Model.ButtonState[]) => {
                            // 無効なaction
                            filtered_action = s.action.filter((a: IAction, i: number, arr: IAction[]) => {
                                //すべてのActionでコードもない、ブランド名もコードセットもない function名が "" or "none" で bluetooth_dataもないボタンは表示しない。
                                return (a.code == null &&
                                    (a.code_db == null || (a.code_db.brand === " " || a.code_db.brand === "") && (a.code_db.db_codeset === " " || a.code_db.db_codeset === "") && a.code_db.function !== "none") &&
                                    a.bluetooth_data == null);
                            });
                            return (filtered_action.length >= s.action.length);
                        });

                        //filterされた数と、総数が一致 : 有効なstateが一つもない場合 このボタンは無効とする。
                        if (model.state.length == filtered_state.length) {
                            return this;
                        }
                    }

                    this.$el.append($(this.buttonItemTemplate_(model)));
                });
                return this;
            }

            /**
             * ButtonItem View がもつすべての ButtonItem を返す。
             * 
             * @return {Model.ButtonItem[]} ButtonItem View がもつ ButtonItem
             */
            getButtons(): Model.ButtonItem[] {
                // enabled でない model を間引く 
                var buttonModels = this.collection.models.filter((model) => {
                    return model.enabled;
                });
                var buttons: Model.ButtonItem[] = $.extend(true, [], buttonModels);

                return buttons;
            }

            /**
             * 追加されたモデルをレンダリングする
             */
            private _renderNewModel(model: Model.ButtonItem) {
                this._modifyModel(model);
                this.$el.append($(this.buttonItemTemplate_(model)));
            }

            /**
             * model の調整。
             * button の active な state を設定する。
             */
            private _modifyModel(model: Model.ButtonItem) {
                if (model.state && model.state.length) {
                    var states = model.state;
                    var statesCount = model.state.length;

                    // 現在の state を特定する
                    var currentStateId: number = model.get("currentStateId");
                    if (currentStateId === undefined) {
                        // currentStateId が未指定の場合は、先頭の state を active にする
                        states[0]["active"] = true;
                        for (let i = 1; i < statesCount; i++) {
                            states[i]["active"] = false;
                        }
                    } else {
                        let foundCurrentStateId = false;
                        // state の id をチェックして、現在の state を active にする。
                        // 該当する state が見つからなかったら、先頭の state を active にする。
                        for (let i = statesCount - 1; 0 <= i; i--) {
                            let state = states[i];
                            if (state.stateId === currentStateId) {
                                state["active"] = true;
                                foundCurrentStateId = true;
                            } else if (i === 0 && !foundCurrentStateId) {
                                state["active"] = true;
                            } else {
                                state["active"] = false;
                            }
                        }
                    }

                    // state 内の画像パスを Garage 用に変換する。
                    for (let i = 0, l = states.length; i < l; i++) {
                        var state = states[i];
                        if (state.image && this.materialsRootPath_) {
                            if (_.isArray(state.image)) {
                                /* jshint loopfunc: true */
                                state.image.forEach((img, index) => {
                                    let imagePath = img.path;
                                    // 画像パスを Garage 内のパスに変更する。
                                    let resolvedPath = path.resolve(path.join(this.materialsRootPath_, "remoteimages", imagePath)).replace(/\\/g, "/");
                                    img.resolvedPath = resolvedPath;

                                    let resizeOriginal = img.resizeOriginal;
                                    if (!resizeOriginal) {
                                        resizeOriginal = imagePath;
                                        img.resizeOriginal = resizeOriginal;
                                    }
                                    let resizeResolvedOriginalPath = path.resolve(path.join(this.materialsRootPath_, "remoteimages", resizeOriginal)).replace(/\\/g, "/");
                                    img.resizeResolvedOriginalPath = resizeResolvedOriginalPath;
                                });
                                /* jshint loopfunc: false */
                            } else {
                                // 配列ではなく、一つのオブジェクトとして image が格納されていた場合の対応
                                let img: Model.ImageItem = <any>state.image;
                                let imagePath = img.path;
                                // 画像パスを Garage 内のパスに変更する。
                                if (imagePath) {
                                    let resolevedPath = path.resolve(path.join(this.materialsRootPath_, "remoteimages", imagePath)).replace(/\\/g, "/");
                                    img.resolvedPath = resolevedPath;
                                }
                            }
                        }
                    }
                    model.state = states;
                }
            }
        }
    }
}