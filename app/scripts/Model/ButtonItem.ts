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
        var TAG = "[Garage.Model.ButtonItem] ";

        namespace constValue {
            //デフォルトとして利用されるステートのstateCollection_.models[]の配列インデックス
            //defaultがない場合に利用される。
            export const DEFAULT_STATE_INDEX: number = 0;
        }

        export class ButtonItem extends Model.Item {

            remoteId: string;
            private stateCollection_: ButtonStateCollection;
            private materialsRootPath_: string;
            private resolvedImagePathDirectory_: string;
            private resolvedCopySrcImagePathDirectory_: string; // ボタン内で参照している画像のコピー元のディレクトリー
            private initialArea_: IArea; // ButtonItem の最初に設定された Area


            constructor(attributes?: any, options?: any) {
                super(attributes, options);
                if (attributes) {
                    this.remoteId = attributes.remoteId;

                    if (attributes.materialsRootPath) {
                        this.materialsRootPath_ = attributes.materialsRootPath;
                        if (this.remoteId) {
                            this.resolvedImagePathDirectory_ = path.resolve(path.join(attributes.materialsRootPath, "remoteimages")).replace(/\\/g, "/");
                        }
                        if (attributes.srcRemoteId) {
                            // 画像のコピー元のディレクトリー
                            this.resolvedCopySrcImagePathDirectory_ = path.resolve(path.join(attributes.materialsRootPath, "remoteimages")).replace(/\\/g, "/");
                        }
                        if (attributes.state) {
                            this.state = attributes.state;
                        }
                    }
                }
            }

            /**
             * ButtonItemの複製を生成
             *
             * @param dstRemoteId {string}
             * @param offsetY {number}
             * @return {ButtonItem}
             */
            public clone(dstRemoteId: string = this.remoteId, offsetY: number = 0): ButtonItem {
                var newButton = new Model.ButtonItem({
                    materialsRootPath: this.materialsRootPath_,
                    remoteId: dstRemoteId,
                    srcRemoteId: this.remoteId
                });

                // button.area のコピー
                var newArea: IArea = $.extend(true, {}, this.area);
                newArea.y += offsetY;
                newButton.area = newArea;

                if (this.default) {
                    newButton.default = this.default;
                }

                if (this.name) {
                    newButton.name = this.name;
                }

                if (this.version) {
                    newButton.version = this.version;
                }

                if (this.currentStateId) {
                    newButton.currentStateId = this.currentStateId;
                }

                newButton.state = [];
                // button.state のコピー
                for (let state of this.state) {
                    newButton.state.push(state.clone());
                }

                return newButton;
            }

            /**
             * Model の initialize
             */
            initialize(attribute?, options?) {
                //console.log("Model.ButtonItem initialize");
            }

            public isAirconButton() {
                let airconButtonNamePrefix = "STR_REMOTE_BTN_AIRCON";
                return (this.name.indexOf(airconButtonNamePrefix) == 0);
            }

            get area(): IArea {
                return this.get("area");
            }

            set area(val: IArea) {
                this.set("area", val);
                if (!this.initialArea_) {
                    this.initialArea_ = $.extend(true, {}, val);
                }
                this._setStateItemsArea(val);
                if (this.stateCollection_) {
                    this.stateCollection_.forEach((stateModel) => {
                        stateModel.area = val;
                    });
                }
            }

            /*
             * @return {Model.ButtonState} デフォルトで表示するStateを取得する。存在場合nullを返す。
             */
            getDefaultState(): Model.ButtonState {
                let FUNCTION_NAME = TAG + " getDefaultState() : ";

                if (this.default !== null) {
                    return this.getStateByStateId(this.default);
                }

                //デフォルトとして設定されているステートIDのステートがない場合、配列番号を指定。
                return this.stateCollection_.models[constValue.DEFAULT_STATE_INDEX];
            }

            /*
             * @param {number} stateId 取得したいModel.ButtonStateのStateId
             * @return {Model.ButtonState} 発見できない場合、nullを返す。
             */
            getStateByStateId(stateId: number): Model.ButtonState {

                for(let targetState of this.stateCollection_.models) {
                        if (targetState.stateId == stateId) {
                        return targetState;
                        }
                }

                return null;
            }

            /**
             * Model.ButtonItemをHUIS出力用のデータ形式に変換する。
             *
             * @param {string} remoteId このButtonItemが所属するremoteId
             * @param {string} ourputDirPath? faceファイルの出力先のディレクトリ
             * @return {IButton} 変換されたデータ
             */
            convertToHuisData(remoteId: string, outputDirPath?: string): IButton {

                let convertedStates = [];
                for (let state of this.state) {
                    convertedStates.push(state.convertToHuisData(remoteId, outputDirPath));
                }

                let convertedButton: IButton = {
                    area: this.area,
                    state: convertedStates
                };
                if (this.default != null) {
                    convertedButton.default = this.default;
                }
                if (this.name != null) {
                    convertedButton.name = this.name;
                }

                return convertedButton;
            }

            get default(): number {
                return this.get("default");
            }

            set default(val: number) {
                this.set("default", val);
            }

            get name(): string {
                return this.get("name");
            }

            set name(val: string) {
                this.set("name", val);
            }

            get version(): string {
                return this.get("version");
            }

            set version(val: string) {
                this.set("version", val);
            }

            get interval(): number{
                return this.get("interval");
            }

            set interval(val: number) {
                this.set("interval", val);
            }

            get currentStateId(): number {
                return this.get("currentStateId");
            }

            set currentStateId(val: number) {
                this.set("currentStateId", val);
            }

            // TODO: change name, state to states
            get state(): Model.ButtonState[] {
                if (this.stateCollection_ != null && this.stateCollection_.models != null) {
                    return this.stateCollection_.models;
                }
            }

            set state(val: Model.ButtonState[]) {
                // stateCollection の初期化 / リセット
                if (!this.stateCollection_) {
                    this.stateCollection_ = new ButtonStateCollection();
                } else {
                    this.stateCollection_.reset();
                }
                // TODO: delete following
                // stateData を model 化して stateCollection に追加する
                if (_.isArray(val)) {
                    val.forEach((stateData: Model.ButtonState, index: number) => {
                        let stateModel: ButtonState = new ButtonState({
                            materialsRootPath: this.materialsRootPath_, remoteId: this.remoteId
                        });
                        stateModel.stateId = stateData.stateId;
                        stateModel.active = stateData.active;
                        stateModel.action = $.extend(true, [], stateData.action);
                        stateModel.translate = $.extend(true, [], stateData.translate);
                        stateModel.image = $.extend(true, [], stateData.image);
                        stateModel.label = $.extend(true, [], stateData.label);
                        stateModel.area = this.area;
                        // image にひも付けられている画像を module のディレクトリーにコピー
                        let image = stateModel.image;
                        if (image) {
                            this._copyImageFile(image);
                        }
                        this.stateCollection_.add(stateModel);
                    });
                } else {
                    let stateModel: ButtonState = new ButtonState(val);

                    this.stateCollection_.add(stateModel);
                }

                // Action毎の機器情報の設定
                for (let i = 0, l = this.stateCollection_.length; i < l; i++) {
                    let stateModel = this.stateCollection_.at(i);
                    if (stateModel && stateModel.action && stateModel.action.length) {
                        for (let targetAction of stateModel.action){
                            if (targetAction && targetAction.code_db && !targetAction.deviceInfo) {
                                // 機器情報が設定されていない場合はactionに設定されている情報をコピー
                                targetAction.deviceInfo = {
                                    id: "",
                                    code_db: targetAction.code_db,
                                    bluetooth_data: (targetAction.bluetooth_data) ? targetAction.bluetooth_data : null,
                                    functions: []
                                };
                            }
                        }
                        
                    }
                }
                this._setStateItemsArea(this.area);
            }


            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[]{
                return ["enabled", "area", "default", "currentStateId", "state", "deviceInfo", "name","version", "interval"];
            }

            // TODO: delete
            /**
             * アイテムの種類
             */
            get itemType(): string {
                return "button";
            }

            // TODO: review default attrs
            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {
                let states: Model.ButtonState[] = [];

                let button: any = {
                    "enabled": true,
                    area: {
                        x: 0,
                        y: 0,
                        w: 100,
                        h: 120
                    },
                    default: 0,
                    currentStateId: 0,
                    state: states,
                    name:"button",
                };

                return button;
            }


            // TODO: destroy and validate methods are copy-and-pasted, need review
            // http://tnakamura.hatenablog.com/entry/2013/02/07/135119

            /**
             * destroy をオーバーライド。
             * 本来ならサーバーと通信するがサンプルではデータを永続化しないため、
             * destroy イベントだけ発生させる。
             */
            /*override*/ destroy() {
                this.trigger("destroy", this);
            }

            /**
             * set メソッドに渡されたデータを検証する。
             * 何か値を返すと検証エラー扱いになるので、
             * 不正な値だったときはエラーメッセージなんかを返すといい。
             */
            /*override*/ validate(attrs: any): string {
                // 検証には、underscore の便利メソッドを使っている。
                if (_.isString(attrs.id) && _.isEmpty(attrs.id)) {
                    return "invalid id.";
                }
            }

            /**
             * ボタンに状態を追加する
             * 
             * @param state {IState} 追加する状態
             */
            addState(state: IState) {
                if (!state) {
                    return;
                }
                var stateModel: ButtonState = new ButtonState({
                        stateId: state.id,
                        active: state.active,
                        action: state.action,
                        translate: state.translate,
                        image: state.image,
                        label: state.label
                });
                this.stateCollection_.add(stateModel);
            }

            /**
             * コピー元の画像ディレクトリーが存在していたら、
             * state.image に指定されている画像を module ディレクトリーにコピーする。
             */
            private _copyImageFile(images: Model.ImageItem[]): void {
                if (!images || !this.resolvedImagePathDirectory_ || !this.resolvedCopySrcImagePathDirectory_) {
                    return;
                }

                images.forEach((image: Model.ImageItem) => {
                    let resolvedPath = path.resolve(this.resolvedImagePathDirectory_, image.path);
                    let resolvedCopySrcImagePath = path.resolve(this.resolvedCopySrcImagePathDirectory_, image.path);
                    if (!fs.existsSync(resolvedCopySrcImagePath)) {
                        return;
                    }
                    // 画像ファイルをコピー
                    if (!fs.existsSync(resolvedPath)) {
                        fs.copySync(resolvedCopySrcImagePath, resolvedPath);
                    }
                });
            }

            /**
             * state 内の画像・ラベルアイテムの area の設定
             */
            private _setStateItemsArea(buttonArea: IArea): void {
                var states = this.state;
                if (!states) {
                    return;
                }

                states.forEach((state: Model.ButtonState) => {
                    if (state.image) {
                        this._setStateImageItemArea(state.image, buttonArea);
                    }
                    if (state.label) {
                        this._setStateLabelItemArea(state.label, buttonArea);
                    }
                });
            }

            /**
             * state 内の画像アイテムの area の設定
             */
            private _setStateImageItemArea(images: Model.ImageItem[], buttonArea: IArea) {
                if (!images || !this.initialArea_) {
                    return;
                }

                var initialArea = this.initialArea_;
                images.forEach((image: Model.ImageItem) => {
                    if (!image.areaRatio) {
                        let imageArea = image.area;
                        image.areaRatio = {
                            x: 0 < initialArea.w ? imageArea.x / initialArea.w : 1,
                            y: 0 < initialArea.h ? imageArea.y / initialArea.h : 1,
                            w: 0 < initialArea.w ? imageArea.w / initialArea.w : 1,
                            h: 0 < initialArea.h ? imageArea.h / initialArea.h : 1
                        };
                    } else {
                        image.area = {
                            x: buttonArea.x * image.areaRatio.x,
                            y: buttonArea.y * image.areaRatio.y,
                            w: buttonArea.w * image.areaRatio.w,
                            h: buttonArea.h * image.areaRatio.h
                        };
                    }
                });
            }

            /**
             * state 内のラベルアイテムの area の設定
             */
            private _setStateLabelItemArea(labels: Model.LabelItem[], buttonArea: IArea) {
                if (!labels || !this.initialArea_) {
                    return;
                }

                var initialArea = this.initialArea_;
                labels.forEach((label: Model.LabelItem) => {
                    if (!label.areaRatio) {
                        let labelArea = label.area;
                        label.areaRatio = {
                            x: 0 < initialArea.w ? labelArea.x / initialArea.w : 1,
                            y: 0 < initialArea.h ? labelArea.y / initialArea.h : 1,
                            w: 0 < initialArea.w ? labelArea.w / initialArea.w : 1,
                            h: 0 < initialArea.h ? labelArea.h / initialArea.h : 1
                        };
                    } else {
                        label.area = {
                            x: buttonArea.x * label.areaRatio.x,
                            y: buttonArea.y * label.areaRatio.y,
                            w: buttonArea.w * label.areaRatio.w,
                            h: buttonArea.h * label.areaRatio.h
                        };
                    }
                });
            }

            /**
             * state 内のアイテムに areaRatio を付加する
             */
            private _setAreaRatioToStateItems(): void {
                var states = this.state;
                if (!states) {
                    return;
                }

                states.forEach((state: Model.ButtonState) => {
                    if (state.image) {
                        this._setAreaRatioToStateImageItems(state.image);
                    }
                    if (state.label) {
                        this._setAreaRatioToStateLabelItems(state.label);
                    }
                });

                this.state = states;
            }

            /**
             * state 内の画像アイテムに areaRatio を付加する
             */
            private _setAreaRatioToStateImageItems(images: Model.ImageItem[]) {
                if (!this.initialArea_) {
                    return;
                }

                var buttonArea = this.initialArea_;
                images.forEach((image: Model.ImageItem) => {
                    if (!image.areaRatio) {
                        let imageArea = image.area;
                        image.areaRatio = {
                            x: 0 < buttonArea.x ? imageArea.x / buttonArea.x : 1,
                            y: 0 < buttonArea.y ? imageArea.y / buttonArea.y : 1,
                            w: 0 < buttonArea.w ? imageArea.w / buttonArea.w : 1,
                            h: 0 < buttonArea.h ? imageArea.h / buttonArea.h : 1
                        };
                    }
                });
            }

            /**
             * state 内のラベルアイテムに areaRatio を付加する
             */
            private _setAreaRatioToStateLabelItems(labels: Model.LabelItem[]) {
                if (!this.initialArea_) {
                    return;
                }

                var buttonArea = this.initialArea_;
                labels.forEach((label: Model.LabelItem) => {
                    if (!label.areaRatio) {
                        let labelArea = label.area;
                        label.areaRatio = {
                            x: 0 < buttonArea.x ? labelArea.x / buttonArea.x : 1,
                            y: 0 < buttonArea.y ? labelArea.y / buttonArea.y : 1,
                            w: 0 < buttonArea.w ? labelArea.w / buttonArea.w : 1,
                            h: 0 < buttonArea.h ? labelArea.h / buttonArea.h : 1
                        };
                    }
                });
            }
        }
    }
}