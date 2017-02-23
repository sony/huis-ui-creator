/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:no-string-literal */

module Garage {
    export module Model {
        var TAG = "[Garage.Model.Module] ";

        export class Module extends Backbone.Model implements IGModule {

            constructor(attributes?: any) {
                super(attributes, null);
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
            public isButtonInvalid(button: IGButton): boolean {
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

            /*
             * 各メンバ変数を設定する。offsetYとpageIndexは0で初期化される。
             * @param gmodule ? : IModule リモコンファイルから読み出して得られた情報をまとめたオブジェクト
             * @param remoteId ? : このモジュールを含むリモコンのID
             * @param moduleName ? : モジュールの定義ファイル名
             */
            public setInfoFromIModule(imodule: IModule, remoteId: string, pageIndex: number, moduleName: string) {

                let gmodule: IGModule = {
                    offsetY: this.offsetY,
                    remoteId: remoteId,
                    name: moduleName,
                    area: imodule.area,
                    pageIndex: pageIndex,
                    group: imodule.group,
                }

                if (imodule.button) {
                    // [TODO] button.state.image.garage_extensions 対応
                    gmodule.button = this._buttons2gbuttons(imodule.button);
                    this.setVersionInfoToIGButton(imodule, gmodule.button);
                }
                if (imodule.image) {
                    gmodule.image = this._images2gimages(imodule.image);
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
            public setInfoFromGModule(gmodule: IGModule) {
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
             * IGButton, IGLabel, IGImageからバージョン情報を抽出する。
             * @param buttons ? : IGButtons
             * @param imagess ? : IGImages
             * @param labels ? : IGLabels
             * return 入力オブジェクトから集めたのバージョン情報の配列 : string[]
             */
            private getVersions(buttons?: IGButton[], images?: IGImage[], labels?: IGLabel[]): Model.VersionString[] {
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
             * @param gImages :IGImage[] 代入先のモジュール
             */
            private setVersionInfoToIGImage(iModule: IModule, gImages: IGImage[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToIGIMage : ";

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
            private setVersionInfoToIGButton(iModule: IModule, gButtons: IGButton[]) {
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
             * @param gLabel :IGLabel[] 代入先のモジュール
             */
            private setVersionInfoToIGLabel(iModule: IModule, gLabel: IGLabel[]) {
                let FUNCTION_NAME = TAG + " : setVersionInfoToIGLabel : ";

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
             * IImage を IGImage に変換する。主に garage_extensions を garageExtensions に付け替え。
             * 
             * @param images {IImage[]} [in] IGImage[] に変換する IImage[]
             * @return {IGImage[]} 変換された IGImage[]
             */
            private _images2gimages(images: IImage[]): IGImage[] {
                let gimages: IGImage[] = $.extend(true, [], images);
                gimages.forEach((image) => {
                    let garage_extensions: IGarageImageExtensions = image["garage_extensions"];
                    if (garage_extensions) {
                        image.garageExtensions = {
                            original: garage_extensions.original,
                            resolvedOriginalPath: "",
                            resizeMode: garage_extensions.resize_mode
                        };
                        delete image["garage_extensions"];
                    }
                });

                return gimages;
            }

            /**
             * IState[] を IGState[] に変換する。
             * 
             * @param buttons {IState[]} IGState[] に変換する IState[]
             * @return {IGState[]} 変換された IGState[]
             */
            private _states2gstates(states: IState[]): IGState[] {
                let gstates: IGState[] = [];
                states.forEach((state) => {
                    let gstate: IGState = {};
                    if (!_.isUndefined(state.id)) {
                        gstate.id = state.id;
                    }
                    if (state.image) {
                        gstate.image = this._images2gimages(state.image);
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
                });

                return gstates;
            }

            /**
              * IButton[] を IGButton[] に変換する。
              * 
              * @param buttons {IButton[]} IGButton[] に変換する IButton[]
              * @return {IGButton[]} 変換された IGButton[]
              */
            private _buttons2gbuttons(buttons: IButton[]): IGButton[] {
                let gbuttons: IGButton[] = [];
                buttons.forEach((button) => {
                    let gstates: IGState[] = this._states2gstates(button.state);
                    let gbutton: IGButton = {
                        area: $.extend(true, {}, button.area),
                        state: gstates,
                        currentStateId: undefined
                    };
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
            get button(): IGButton[] { return this.get("button"); }
            set button(val: IGButton[]) { this.set("button", val); }
            get label(): IGLabel[] { return this.get("label"); }
            set label(val: IGLabel[]) { this.set("label", val); }
            get image(): IGImage[] { return this.get("image"); }
            set image(val: IGImage[]) { this.set("image", val); }
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