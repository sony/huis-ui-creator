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

        export class Module extends Backbone.Model{

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

            public getOutputModuleData(remoteId: string, outputDirPath: string): IModule {
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

                if (this.button) {
                    module.button = this._normalizeButtons(this.button, remoteId, outputDirPath);
                }
                if (this.image) {
                    module.image = this._normalizeImages(this.image, remoteId, outputDirPath);
                }
                if (this.label) {
                    module.label = this._normalizeLabels(this.label);
                }
                return module;
            }

            /**
             * Button データから module 化に不要なものを間引く
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            private _normalizeButtons(buttons: Model.ButtonItem[], remoteId: string, outputDirPath?:string): IButton[] {
                var normalizedButtons: IButton[] = [];

                for (let i = 0, l = buttons.length; i < l; i++) {
                    let button: Model.ButtonItem = buttons[i];
                    let normalizedButton: IButton = {
                        area: button.area,
                        state: this._normalizeButtonStates(button.state, remoteId, outputDirPath)
                    };
                    if (button.default != null) {
                        normalizedButton.default = button.default;
                    }
                    if (button.name != null) {
                        normalizedButton.name = button.name;
                    }
                    normalizedButtons.push(normalizedButton);
                }

                return normalizedButtons;
            }

            /**
             * button.state データから module 化に不要なものを間引く
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            private _normalizeButtonStates(states: Model.ButtonState[], remoteId: string, outputDirPath? :string): IState[] {
                var normalizedStates: IState[] = [];

                states.forEach((state: Model.ButtonState) => {
                    let normalizedState: IState = {
                        id: state.stateId
                    };

                    if (state.image) {
                        normalizedState.image = this._normalizeImages(state.image, remoteId, outputDirPath);
                    }
                    if (state.label) {
                        normalizedState.label = this._normalizeLabels(state.label);
                    }
                    if (state.action) {
                        normalizedState.action = this._normalizeButtonStateActions(state.action);
                    }
                    if (state.translate) {
                        normalizedState.translate = this._normalizeButtonStateTranaslates(state.translate);
                    }

                    normalizedStates.push(normalizedState);
                });

                return normalizedStates;
            }

            /**
             * button.state.action データから module 化に不要なものを間引く
             */
            private _normalizeButtonStateActions(actions: IAction[]): IAction[] {
                var normalizedActions: IAction[] = [];

                actions.forEach((action: IAction) => {
                    let normalizedAction: IAction = {
                        input: (action.input) ? action.input : "none"
                    };
                    if (action.code) {
                        normalizedAction.code = action.code;
                    }
                    if (action.code_db) {
                        normalizedAction.code_db = {
                            function: (action.code_db.function) ? Util.HuisFiles.getPlainFunctionKey(action.code_db.function) : "none",
                            brand: action.code_db.brand,
                            device_type: action.code_db.device_type,
                            db_codeset: action.code_db.db_codeset
                        };
                        if (!_.isUndefined(action.code_db.db_device_id)) {
                            normalizedAction.code_db.db_device_id = action.code_db.db_device_id;
                        }
                        if (!_.isUndefined(action.code_db.model_number)) {
                            normalizedAction.code_db.model_number = action.code_db.model_number;
                        }
                        if (!_.isUndefined(action.bluetooth_data)) {
                            normalizedAction.bluetooth_data = action.bluetooth_data;
                        }
                    } else {
                        normalizedAction.code_db = {
                            function: "none",
                            brand: " ",
                            device_type: " ",
                            db_codeset: " "
                        }
                    }
                    if (!_.isUndefined(action.interval)) {
                        normalizedAction.interval = action.interval;
                    }

                    normalizedActions.push(normalizedAction);
                });

                return normalizedActions;
            }

            /**
             * button.state.translate データから module 化に不要なものを間引く
             */
            private _normalizeButtonStateTranaslates(translates: IStateTranslate[]): IStateTranslate[] {
                var normalizedTranslates: IStateTranslate[] = [];

                translates.forEach((translate: IStateTranslate) => {
                    normalizedTranslates.push({
                        input: translate.input,
                        next: translate.next
                    });
                });

                return normalizedTranslates;
            }

            /**
             * Image データから module 化に不要な物を間引く
             */
            private _normalizeLabels(labels: ILabel[]): ILabel[] {
                var normalizedLabels: ILabel[] = [];

                for (let i = 0, l = labels.length; i < l; i++) {
                    let label: ILabel = labels[i];
                    let normalizedLabel: ILabel = {
                        area: label.area,
                        text: label.text
                    };
                    if (label.color !== undefined) {
                        normalizedLabel.color = label.color;
                    }
                    if (label.font !== undefined) {
                        normalizedLabel.font = label.font;
                    }
                    if (label.size !== undefined) {
                        normalizedLabel.size = label.size;
                    }
                    if (label.font_weight !== undefined) {
                        normalizedLabel.font_weight = label.font_weight;
                    }

                    //fontWeightをFontWeight >> stringに
                    normalizedLabels.push(normalizedLabel);
                }

                return normalizedLabels;
            }

            /**
             * Image データから module 化に不要な物を間引く。
             * また、リモコン編集時に画像のリサイズが発生している場合は、
             * image.path に image.garage_extensions.original をリサイズした画像のパスにする。
             * リサイズ処理自体はここでは行わない。
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する
             */
            private _normalizeImages(images: Model.ImageItem[], remoteId: string, outputDirPath? :string ): IImage[] {
                var normalizedImages: IImage[] = [];

                images.forEach((image) => {
                    let garageExtensions = image.garageExtensions;
                    if (garageExtensions) {
                        if (!garageExtensions.original) {
                            garageExtensions.original = image.path;
                        }
                    } else {
                        garageExtensions = {
                            resizeMode: "contain",
                            original: image.path,
                            resolvedOriginalPath: image.resolvedPath
                        };
                    }

                    let normalizedImage: IImage;

                    // 編集画面でサイズ変更が行われていたら、リサイズ用に path を変更しておく。
                    // リサイズ処理はここでは行わない。
                    // outputDirPathがある場合は必ずする。
                    if (image.resized || outputDirPath != null) {

                        // リサイズ後のファイル名を作る。
                        // "image.png" の場合、"image_w<width>_h<height>_<resizeMode>.png" となる。
                        // 例) "image_w200_h150_stretch.png"
                        let originalPath = garageExtensions.original;
                        let resolvedOriginalPath = garageExtensions.resolvedOriginalPath;
                        if (!resolvedOriginalPath) {
                            resolvedOriginalPath = path.join(HUIS_REMOTEIMAGES_ROOT, originalPath).replace(/\\/g, "/");
                            garageExtensions.resolvedOriginalPath = resolvedOriginalPath;
                        }
                        let parsedPath = path.parse(resolvedOriginalPath);
                        let newFileName = Model.OffscreenEditor.getEncodedPath(parsedPath.name + "_w" + image.area.w + "_h" + image.area.h + "_" + garageExtensions.resizeMode + parsedPath.ext) + parsedPath.ext;
                        // ファイル名のをSHA1エンコードして文字コードの非互換性を解消する

                        let newFileFullPath: string;

                        let newDirPath = parsedPath.dir;
                        if (outputDirPath != null) {
                            newDirPath = path.join(outputDirPath, remoteId, REMOTE_IMAGES_DIRECTORY_NAME).replace(/\\/g, "/");;
                        }

                        // original の画像が remoteimages 直下にある場合は、リサイズ後のファイルの保存先を各モジュールのディレクトリーにする
                        // outputDirPathmがある場合は、remoteimages/[remoteid]のしたにコピーする
                        if (originalPath.indexOf("/") === -1 || outputDirPath != null) {
                            newFileFullPath = path.join(newDirPath, remoteId, newFileName).replace(/\\/g, "/");
                        } else {
                            newFileFullPath = path.join(newDirPath, newFileName).replace(/\\/g, "/");
                        }
                        // editImage 内でパスが補正されることがあるので、補正後のパスをあらかじめ取得。
                        // 補正は拡張子の付け替え。
                        newFileFullPath = Model.OffscreenEditor.getEditResultPath(newFileFullPath, "image/png");

                        normalizedImage = {
                            area: image.area,
                            path: path.relative(HUIS_REMOTEIMAGES_ROOT, newFileFullPath).replace(/\\/g, "/")
                        };

                        // リサイズ待機リストに追加
                        huisFiles.addWaitingResizeImageList({
                            src: garageExtensions.resolvedOriginalPath,
                            dst: newFileFullPath,
                            params: {
                                width: image.area.w,
                                height: image.area.h,
                                mode: garageExtensions.resizeMode,
                                force: true,
                                padding: true
                            }
                        });
                    } else {
                        normalizedImage = {
                            area: image.area,
                            path: image.path
                        };
                    }

                    normalizedImage.garage_extensions = {
                        original: garageExtensions.original,
                        resize_mode: garageExtensions.resizeMode
                    };
                    normalizedImages.push(normalizedImage);
                });

                return normalizedImages;
            }

            /*
             * 各メンバ変数を設定する。offsetYとpageIndexは0で初期化される。
             * @param gmodule ? : IModule リモコンファイルから読み出して得られた情報をまとめたオブジェクト
             * @param remoteId ? : このモジュールを含むリモコンのID
             * @param moduleName ? : モジュールの定義ファイル名
             */
            public setInfoFromIModule(imodule: IModule, remoteId: string, pageIndex: number, moduleName: string) {

                let gmodule = new Model.Module({
                    offsetY: this.offsetY,
                    remoteId: remoteId,
                    name: moduleName,
                    area: imodule.area,
                    pageIndex: pageIndex,
                    group: imodule.group,
                });

                if (imodule.button) {
                    // [TODO] button.state.image.garage_extensions 対応
                    gmodule.button = this._buttons2gbuttons(imodule.button, remoteId);
                    this.setVersionInfoToIGButton(imodule, gmodule.button);
                }
                if (imodule.image) {
                    gmodule.image = this._images2gimages(imodule.image, remoteId);
                    this.setVersionInfoToIGImage(imodule, gmodule.image);
                }
                if (imodule.label) {
                    gmodule.label = $.extend(true, [], imodule.label);
                    this.setVersionInfoToIGLabel(imodule, gmodule.label);
                }

                this.setInfoFromGModule(gmodule);
            }

            /*
             * 各メンバ変数を設定する。
             * @param gmodule ? : IGModule 必要なパラメータをまとめたオブジェクト。
             */
            public setInfoFromGModule(gmodule: Model.Module) {
                this.button = gmodule.button;
                this.image = gmodule.image;
                this.label = gmodule.label;
                this.remoteId = gmodule.remoteId;
                this.name = gmodule.name;
                this.area = $.extend(true, {}, gmodule.area);
                this.offsetY = gmodule.offsetY;
                this.pageIndex = gmodule.pageIndex;
                this.version = gmodule.version;
                this.group = gmodule.group;
            }

            /*
             * IGButton, Model.LabelItem, Model.ImageItemからバージョン情報を抽出する。
             * @param buttons ? : IGButtons
             * @param imagess ? : Model.ImageItems
             * @param labels ? : Model.LabelItems
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
                let FUNCTION_NAME: string = TAG + " : getOldestVersionOfGButton : ";

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
             * gmoduleの構成要素(button,label,image)のバージョンから、最も古いバージョンを返す。
             * @param gModule : IGModule バージョン情報を内在した構成要素をもつGarageないで使われていたモジュール
             * @return oldestVersionString : string gModule内のもっとも古いバージョン情報。１つもバージョン情報を持ってない場合、nullを返す。
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
             * @param gImages :Model.ImageItem[] 代入先のモジュール
             */
            private setVersionInfoToIGImage(iModule: IModule, gImages: Model.ImageItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToModel.ImageItem : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (gImages == null) {
                    console.warn(FUNCTION_NAME + "gImages is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < gImages.length; i++) {
                    gImages[i].version = iModule.version;
                }
            }

            /*
             * モジュールにバージョン情報がある場合、Buttonにその情報を引き継がせる
             * @param module :IModule 参照元のモジュール
             * @param gButtons :IGButton[] 代入先のモジュール
             */
            private setVersionInfoToIGButton(iModule: IModule, gButtons: Model.ButtonItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToIGButton : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (gButtons == null) {
                    console.warn(FUNCTION_NAME + "gButtons is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < gButtons.length; i++) {
                    gButtons[i].version = iModule.version;
                }
            }


            /*
             * モジュールにバージョン情報がある場合、Buttonにその情報を引き継がせる
             * @param module :IModule 参照元のモジュール
             * @param gLabel :Model.LabelItem[] 代入先のモジュール
             */
            private setVersionInfoToIGLabel(iModule: IModule, gLabel: Model.LabelItem[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToModel.LabelItem : ";

                if (iModule == null) {
                    console.warn(FUNCTION_NAME + "iModule is null");
                    return;
                }

                if (gLabel == null) {
                    console.warn(FUNCTION_NAME + "gLabel is null");
                    return;
                }

                if (!iModule.version) {
                    return;//バージョン情報が存在しない場合、なにもしない。
                }

                for (let i = 0; i < gLabel.length; i++) {
                    gLabel[i].version = iModule.version;
                }
            }

            /**
             * IImage を Model.ImageItem に変換する。主に garage_extensions を garageExtensions に付け替え。
             * 
             * @param images {IImage[]} [in] Model.ImageItem[] に変換する IImage[]
             * @return {Model.ImageItem[]} 変換された Model.ImageItem[]
             */
            private _images2gimages(images: IImage[], remoteId: string): Model.ImageItem[] {

                let gimages: Model.ImageItem[] = [];

                for (let image of images) {
                    let imageItem = new Model.ImageItem({
                        materialsRootPath: HUIS_FILES_ROOT,
                        remoteId: remoteId
                    });
                    imageItem.area = $.extend(true, {}, image.area);
                    imageItem.path = image.path;
                    imageItem.resizeOriginal = image.path;
                    gimages.push(imageItem);
                }

                return gimages;
            }

            /**
             * IState[] を Model.ButtonState[] に変換する。
             * 
             * @param buttons {IState[]} Model.ButtonState[] に変換する IState[]
             * @return {Model.ButtonState[]} 変換された Model.ButtonState[]
             */
            private _states2gstates(states: IState[], remoteId: string): Model.ButtonState[] {
                let gstates: Model.ButtonState[] = [];
                for (let state of states) {
                    let gstate = new Model.ButtonState();
                    if (!_.isUndefined(state.id)) {
                        gstate.stateId = state.id;
                    }
                    if (state.image) {
                        gstate.image = this._images2gimages(state.image, remoteId);
                    }
                    if (state.label) {
                        gstate.label = $.extend(true, [], state.label);
                    }
                    if (state.action) {
                        gstate.action = $.extend(true, [], state.action);
                    }
                    if (state.translate) {
                        gstate.translate = $.extend(true, [], state.translate);
                    }
                    if (!_.isUndefined(state.active)) {
                        gstate.active = state.active;
                    }
                    gstates.push(gstate);
                }

                return gstates;
            }

            /**
              * IButton[] を IGButton[] に変換する。
              * 
              * @param buttons {IButton[]} IGButton[] に変換する IButton[]
              * @return {IGButton[]} 変換された IGButton[]
              */
            private _buttons2gbuttons(buttons: IButton[], remoteId: string): Model.ButtonItem[] {
                let gbuttons: Model.ButtonItem[] = [];
                buttons.forEach((button) => {
                    let gstates: Model.ButtonState[] = this._states2gstates(button.state, remoteId);
                    let gbutton = new Model.ButtonItem({
                        materialsRootPath: HUIS_FILES_ROOT,
                        remoteId: remoteId,
                        area: $.extend(true, {}, button.area),
                        state: gstates,
                        currentStateId: undefined
                    });
                    if (button.default) {
                        gbutton.default = button.default;
                    }
                    if (button.name) {
                        gbutton.name = button.name;
                    }
                    gbuttons.push(gbutton);
                });

                return gbuttons;
            }



            /**
             * getters and setters
             */
            get area(): IArea { return this.get("area"); }
            set area(val: IArea) { this.set("area", val); }
            get button(): Model.ButtonItem[] { return this.get("button"); }
            set button(val: Model.ButtonItem[]) { this.set("button", val); }
            get label(): Model.LabelItem[] { return this.get("label"); }
            set label(val: Model.LabelItem[]) { this.set("label", val); }
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