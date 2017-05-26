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

/* tslint:disable:no-string-literal */

module Garage {
    export module Model {
        var TAG = "[Garage.Model.Module] ";

        export class Module extends Backbone.Model {

            // TODO: change constructor
            constructor(attributes?: any) {
                super(attributes, null);
                if (this.button == null) {
                    this.button = [];
                }
                if (this.image == null) {
                    this.image = [];
                }
                if (this.label == null) {
                    this.label = [];
                }
            }

            /*
             * このオブジェクトに対して各パラメータをセットする。
             * @param remoteId: string このModuleの所属するremoteId
             * @param pageIndex: number このModuleのpage番号
             * @param area: IArea このModuleの占める領域
             */
            public setInfo(remoteId: string, pageIndex: number, area?: IArea) {
                this.remoteId = remoteId;
                this.name = remoteId + "_page_" + pageIndex;
                this.pageIndex = pageIndex;
                this.offsetY = 0;
                this.button = [];
                this.image = [];
                this.label = [];
                if (area == null) {
                    this.area = {
                        x: 0,
                        y: 0,
                        w: HUIS_FACE_PAGE_WIDTH,
                        h: HUIS_FACE_PAGE_HEIGHT
                    }
                } else {
                    this.area = $.extend(true, {}, area);
                }
            }

            private isActionInvalid(action: IAction) {
                return (action.code == null
                    && (action.code_db == null
                    || (action.code_db.brand === " " || action.code_db.brand === "")
                && (action.code_db.db_codeset === " " || action.code_db.db_codeset === "")
                        && action.code_db.function !== "none")
                    && action.bluetooth_data == null);
            }

            /**
             * 有効なactionを1つも持っていない場合にtrueを返す。
             */
            // TODO: move this method to Model.ButtonItem
            public isButtonInvalid(button: Model.ButtonItem): boolean {
                for (let state of button.state) {
                    for (let action of state.action) {
                        if (!this.isActionInvalid(action)) {
                            return false;
                        }
                    }
                }
                return true;
            }

            clone() {
                let cloneModule: Model.Module = $.extend(true, {}, this);

                cloneModule.button = [];
                for (let button of this.button) {
                    cloneModule.button.push(button.clone());
                }

                cloneModule.image = [];
                for (let image of this.image) {
                    cloneModule.image.push(image.clone());
                }

                cloneModule.label = [];
                for (let label of this.label) {
                    cloneModule.label.push(label.clone());
                }

                return cloneModule;
            }

            /*
             * 引数で与えられたModuleをこのオブジェクトにmergeする。
             * 基本的には、moduleに含まれるItemを全て追加して、高さを足す。
             * Itemのcloneは作成されないので、注意。
             * また、無効なボタンはこのmergeの際に削除される。
             *
             * @param module: Model.module このオブジェクトにmergeする対象のmodule
             */
            public merge(module: Model.Module) {

                if (module.button != null) {
                    for (let elem of module.button) {
                        elem.area.y += this.area.h;
                    }
                    for (let button of module.button) {
                        if (!this.isButtonInvalid(button)) {
                            this.button.push(button);
                        }
                    }
                }
                if (module.image != null) {
                    for (let elem of module.image) {
                        elem.area.y += this.area.h;
                    }
                    this.image = this.image.concat(module.image);
                }
                if (module.label != null) {
                    for (let elem of module.label) {
                        elem.area.y += this.area.h;
                    }
                    this.label = this.label.concat(module.label);
                }
                this.area.h += module.area.h;
            }

            /**
             * Model.ModuleをHUIS出力用のデータ形式に変換する。
             *
             * @param {string} remoteId このmoduleが所属するremoteId
             * @param {string} ourputDirPath faceファイルの出力先のディレクトリ
             * @return {IModule} 変換されたデータ
             */
            // TODO: remove remoteId from arguments
            convertToHuisData(remoteId: string, outputDirPath: string): IModule {
                var module: IModule = {
                    area: this.area,
                };

                let versionString: string = this.getModuleVersion();
                if (versionString != null) {
                    module = {
                        version: versionString,
                        area: this.area,
                    };
                }

                module.button = [];
                if (this.button) {
                    for (let button of this.button) {
                        module.button.push(button.convertToHuisData(remoteId, outputDirPath));
                    }
                }

                module.image = [];
                if (this.image) {
                    for (let image of this.image) {
                        module.image.push(image.convertToHuisData(remoteId, outputDirPath));
                    }
                }

                module.label = [];
                if (this.label) {
                    for (let label of this.label) {
                        module.label.push(label.convertToHuisData());
                    }
                }
                return module;
            }

            /*
             * 各メンバ変数を設定する。offsetYとpageIndexは0で初期化される。
             * @param imodule ? : IModule リモコンファイルから読み出して得られた情報をまとめたオブジェクト
             * @param remoteId ? : このモジュールを含むリモコンのID
             * @param moduleName ? : モジュールの定義ファイル名
             */
            public setInfoFromIModule(imodule: IModule, remoteId: string, pageIndex: number, moduleName: string) {

                // TODO: change constructor
                let module = new Model.Module({
                    offsetY: this.offsetY,
                    remoteId: remoteId,
                    name: moduleName,
                    area: imodule.area,
                    pageIndex: pageIndex,
                    group: imodule.group,
                });

                if (imodule.button) {
                    // [TODO] button.state.image.garage_extensions 対応
                    module.button = this._iButtons2ButtomItems(imodule.button, remoteId);
                    this.setVersionInfoToButtonItems(imodule, module.button);
                }
                if (imodule.image) {
                    module.image = this._iImages2ImageItems(imodule.image, remoteId);
                    this.setVersionInfoToImageItems(imodule, module.image);
                }
                if (imodule.label) {
                    module.label = [];
                    for (let label of imodule.label) {
                        module.label.push(new Model.LabelItem(label));
                    }
                    this.setVersionInfoToLabel(imodule, module.label);
                }
                this.setInfoFromModule(module);
            }

            // TODO: Replace this method with creating new object
            /*
             * 各メンバ変数を設定する。
             * @param {Model.Module} module 必要なパラメータをまとめたオブジェクト。
             */
            public setInfoFromModule(module: Model.Module) {
                this.button = module.button;
                this.image = module.image;
                this.label = module.label;
                this.remoteId = module.remoteId;
                this.name = module.name;
                this.area = $.extend(true, {}, module.area);
                this.offsetY = module.offsetY;
                this.pageIndex = module.pageIndex;
                this.version = module.version;
                this.group = module.group;
            }

            /*
             * Model.ButtonItem, Model.LabelItem, Model.ImageItemからバージョン情報を抽出する。
             * @param buttons ? : Model.ButtonItem[]
             * @param imagess ? : Model.ImageItem[]
             * @param labels ? : Model.LabelItem[]
             * return 入力オブジェクトから集めたのバージョン情報の配列 : string[]
             */
            private getVersions(buttons?: Model.ButtonItem[], images?: Model.ImageItem[], labels?: Model.LabelItem[]): Model.VersionString[] {
                let FUNCTION_NAME: string = TAG + " : getVersions : ";
                if (!buttons && !images && !labels) {
                    console.warn(FUNCTION_NAME + "no inputs");
                    return;
                }
                let result: Model.VersionString[] = [];

                if (buttons) {
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].version) {
                            result.push(new Model.VersionString(buttons[i].version));
                        }
                    }
                }

                if (images) {
                    for (let i = 0; i < images.length; i++) {
                        if (images[i].version) {
                            result.push(new Model.VersionString(images[i].version));
                        }
                    }
                }

                if (labels) {
                    for (let i = 0; i < labels.length; i++) {
                        if (labels[i].version) {
                            result.push(new Model.VersionString(labels[i].version));
                        }
                    }
                }


                return result;
            }

            /*
            * ２つのバージョン情報から、より番号が若い方を返す。
            * @param version1 :string 比較対象のバージョン情報１ 
            * @param version2 :string 比較対象のバージョン情報２
            * return より番号が若い方のバージョン情報 : string
            */
            private getOlderVersionOf(version1: Model.VersionString, version2: Model.VersionString): Model.VersionString {
                let FUNCTION_NAME: string = TAG + " : getOlderVersion : ";

                if (version1 == null && version2 == null) {//両方ともNULLの場合、NULLを返す。
                    return null;
                }

                if (version1 == null) {//片方がNULLの場合、　もう片方を返す。
                    if (version2) {
                        return version2;
                    }
                    return null;
                }

                if (version2 == null) {//片方がNULLの場合、　もう片方を返す。
                    if (version1) {
                        return version1;
                    }
                    return null;
                }

                if (version1.isOlderThan(version2)) {
                    return version1;
                } else {
                    return version2;
                }
            }

            /*
             * 入力された　最も古いバージョン情報値:string を返す
             * @param versions : string[]
             * return :string 最古のボタンバージョン
             */
            private getOldestVersionOf(versions: Model.VersionString[]): Model.VersionString {
                let FUNCTION_NAME: string = TAG + " : getOldestVersionOf : ";

                if (versions == undefined) {
                    console.warn(FUNCTION_NAME + "versions is undefined");
                    return;
                }

                let oldestVersion: Model.VersionString = null;

                for (let i = 0; i < versions.length; i++) {
                    oldestVersion = this.getOlderVersionOf(oldestVersion, versions[i]);
                }

                return oldestVersion;
            }

            /*
             * moduleの構成要素(button,label,image)のバージョンから、最も古いバージョンを返す。
             * @return oldestVersionString : string module内のもっとも古いバージョン情報。１つもバージョン情報を持ってない場合、nullを返す。
             */
            public getModuleVersion(): string {
                let FUNCTION_NAME: string = TAG + " : getModuleVersion : ";

                let versions: Model.VersionString[] = this.getVersions(this.button, this.image, this.label);
                let oldestVersion: Model.VersionString = this.getOldestVersionOf(versions);

                if (oldestVersion != null) {
                    let oldestVersionString: string = oldestVersion.getVersionString();
                    return oldestVersionString;
                } else {
                    return null;
                }

            }

            /*
             * モジュールにバージョン情報がある場合、Imageにその情報を引き継がせる
             * @param module :IModule 参照元のモジュール
             * @param images :Model.ImageItem[] 代入先のモジュール
             */
            private setVersionInfoToImageItems(iModule: IModule, images: Model.ImageItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToModel.ImageItem : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (images == null) {
                    console.warn(FUNCTION_NAME + "images is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < images.length; i++) {
                    images[i].version = iModule.version;
                }
            }

            /*
             * モジュールにバージョン情報がある場合、Buttonにその情報を引き継がせる
             * @param module :IModule 参照元のモジュール
             * @param buttons :Model.ButtonItem[] 代入先のモジュール
             */
            private setVersionInfoToButtonItems(iModule: IModule, buttons: Model.ButtonItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToButtonItems : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (buttons == null) {
                    console.warn(FUNCTION_NAME + "buttons is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].version = iModule.version;
                }
            }

            /*
             * モジュールにバージョン情報がある場合、Buttonにその情報を引き継がせる
             * @param module :IModule 参照元のモジュール
             * @param label :Model.LabelItem[] 代入先のモジュール
             */
            private setVersionInfoToLabel(iModule: IModule, label: Model.LabelItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToModel.LabelItem : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (label == null) {
                    console.warn(FUNCTION_NAME + "label is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < label.length; i++) {
                    label[i].version = iModule.version;
                }
            }

            /**
             * IImage を Model.ImageItem に変換する。主に garage_extensions を garageExtensions に付け替え。
             * 
             * @param images {IImage[]} [in] Model.ImageItem[] に変換する IImage[]
             * @return {Model.ImageItem[]} 変換された Model.ImageItem[]
             */
            private _iImages2ImageItems(iImages: IImage[], remoteId: string): Model.ImageItem[] {

                let images: Model.ImageItem[] = [];
                // TODO: Replace this method with creating new object
                for (let iImage of iImages) {
                    let imageItem = new Model.ImageItem({
                        materialsRootPath: HUIS_FILES_ROOT,
                        remoteId: remoteId
                    });
                    imageItem.area = $.extend(true, {}, iImage.area);
                    imageItem.path = iImage.path;
                    imageItem.resizeOriginal = iImage.path;
                    if (iImage.garage_extensions != null) {
                        imageItem.garageExtensions = {
                            original: iImage.garage_extensions.original,
                            resizeMode: iImage.garage_extensions.resize_mode,
                            resolvedOriginalPath: ""
                        }
                    }
                    images.push(imageItem);
                }

                return images;
            }

            /**
             * IState[] を Model.ButtonState[] に変換する。
             * 
             * @param buttons {IState[]} Model.ButtonState[] に変換する IState[]
             * @return {Model.ButtonState[]} 変換された Model.ButtonState[]
             */
            private _iState2ButtonStates(iStates: IState[], remoteId: string): Model.ButtonState[] {
                let states: Model.ButtonState[] = [];
                for (let iState of iStates) {
                    // TODO: Replace this method with creating new object
                    let state = new Model.ButtonState();
                    if (!_.isUndefined(iState.id)) {
                        state.stateId = iState.id;
                    }
                    if (iState.image) {
                        state.image = this._iImages2ImageItems(iState.image, remoteId);
                    }
                    state.label = [];
                    if (iState.label) {
                        for (let label of iState.label) {
                            state.label.push(new Model.LabelItem(label));
                        }
                    }
                    if (iState.action) {
                        state.action = $.extend(true, [], iState.action);
                    }
                    if (iState.translate) {
                        state.translate = $.extend(true, [], iState.translate);
                    }
                    if (!_.isUndefined(iState.active)) {
                        state.active = iState.active;
                    }
                    states.push(state);
                }

                return states;
            }

            /**
              * IButton[] を Model.ButtonItem[] に変換する。
              * 
              * @param {IButton[]} buttons Model.ButtonItem[] に変換する IButton[]
              * @return {Model.ButtonItem[]} 変換された Model.ButtonItem[]
              */
            private _iButtons2ButtomItems(iButtons: IButton[], remoteId: string): Model.ButtonItem[] {
                let buttons: Model.ButtonItem[] = [];
                iButtons.forEach((iButton) => {
                    // TODO: Replace this method with creating new object
                    let states: Model.ButtonState[] = this._iState2ButtonStates(iButton.state, remoteId);
                    let button = new Model.ButtonItem({
                        materialsRootPath: HUIS_FILES_ROOT,
                        remoteId: remoteId,
                        area: $.extend(true, {}, iButton.area),
                        state: states,
                        currentStateId: undefined
                    });
                    if (iButton.default) {
                        button.default = iButton.default;
                    }
                    if (iButton.name) {
                        button.name = iButton.name;
                    }
                    buttons.push(button);
                });

                return buttons;
            }

            /**
             * getters and setters
             */
            get area(): IArea { return this.get("area"); }
            set area(val: IArea) { this.set("area", val); }
            // TODO: change name, button to buttons
            get button(): Model.ButtonItem[] { return this.get("button"); }
            set button(val: Model.ButtonItem[]) { this.set("button", val); }
            // TODO: change name, label to labels
            get label(): Model.LabelItem[] { return this.get("label"); }
            set label(val: Model.LabelItem[]) { this.set("label", val); }
            // TODO: change name, image to images
            get image(): Model.ImageItem[] { return this.get("image"); }
            set image(val: Model.ImageItem[]) { this.set("image", val); }
            get offsetY(): number { return this.get("offsetY"); }
            set offsetY(val: number) { this.set("offsetY", val); }
            get pageIndex(): number { return this.get("pageIndex"); }
            set pageIndex(val: number) { this.set("pageIndex", val); }
            get remoteId(): string { return this.get("remoteId"); }
            set remoteId(val: string) { this.set("remoteId", val); }
            get name(): string { return this.get("name"); }
            set name(val: string) { this.set("name", val); }
            get version(): string { return this.get("version"); }
            set version(val: string) { this.set("version", val); }
            get group(): IGroup { return this.get("group"); }
            set group(val: IGroup) { this.set("group", val); }

            defaults() {
                var module: IModule = {
                    area: { x: 0, y: 0, w: 0, h: 0 },
                };
            }

        }
    }
}