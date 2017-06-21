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

/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        import IPromise = CDP.IPromise;

        var TAGS = {
            HuisFiles: "[Garage.Util.HuisFiles] ",
            ModuleParser: "[Garage.Util.ModuleParser] "
        };

        interface IPlainFace {
            name: string;
            category: string;
            modules: any[];
        }


        interface IWaitingRisizeImage {
            src: string; //! リサイズの original のパス。(PC 上のフルパス)
            dst: string; //! リサイズの出力先のパス。(PC 上のフルパス)
            params: Model.IImageResizeParams;
        }


        export interface IFunctionLabel {
            /** 信号名 */
            key: string;

            /** 信号名表示 */
            label: string;
        }

        /**
         * @class HuisFiles
         * @brief HUIS 内のファイルの parse 等を行うユーティリティークラス
         */
        export class HuisFiles {

            private huisFilesRoot_: string;
            private phnConfig_: IPhnConfig;
            private remoteList_: IRemoteId[];
            private remoteInfos_: IRemoteInfo[];
            private commonRemoteInfo_: IRemoteInfo; //! Common (Label や Image 追加用のもの)
            private watingResizeImages_: IWaitingRisizeImage[];//export時、余計な画像を書き出さないために必要

            get phnConfig(): IPhnConfig {
                return this.phnConfig_;
            }

            constructor() {
                if (!fs) {
                    fs = require("fs-extra");
                }
                if (!path) {
                    path = require("path");
                }
                this.huisFilesRoot_ = undefined;
                this.phnConfig_ = undefined;
                this.remoteList_ = [];
                this.remoteInfos_ = [];
                this.commonRemoteInfo_ = null;
                this.watingResizeImages_ = [];
            }

            /**
             * 初期化
             * 
             * @param huisFilesRoot {string} [in] HUIS のファイルが置かれているパス。HUIS 本体から一時的にコピーされた PC 上のディレクトリーを指定する。
             * @return {boolean} true: 成功 / false: 失敗
             */
            init(huisFilesRoot: string): boolean {
                this.remoteList_ = [];
                this.remoteInfos_ = [];
                this.watingResizeImages_ = [];

                huisFilesRoot = path.resolve(huisFilesRoot);
                if (!fs.existsSync(huisFilesRoot)) {
                    console.error(TAGS.HuisFiles + "init() " + huisFilesRoot + " is invalid path.");
                    return false;
                }

                this.huisFilesRoot_ = huisFilesRoot;
                var remoteList = this._loadRemoteList();
                if (!remoteList) {
                    console.error(TAGS.HuisFiles + "init() failed to load remotelist");
                    return false;
                }
                this.remoteList_ = remoteList;

                var remoteInfos: IRemoteInfo[] = this._fetchRemoteInfos();
                if (!remoteInfos) {
                    console.error(TAGS.HuisFiles + "init() failed to load faces");
                    return false;
                }

                this.remoteInfos_ = remoteInfos;

                // Common のリモコンを読み込む
                if (!this.commonRemoteInfo_) {
                    console.log("setting commonRemoteInfo_");
                    let remoteId = "common";

                    let facePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/common.face"));
                    //ビジネス仕向けか否かで、表示するCommonアイテムを変える。
                    if (Util.MiscUtil.isBz()) {
                        facePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/common_bz.face"));
                    }

                    console.log("facePath=" + facePath);

                    //// file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す
                    let rootDirectory = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces"));
                    console.log("rootDirectory=" + rootDirectory);

                    let commonFace = this._parseFace(facePath, remoteId, rootDirectory);
                    this.commonRemoteInfo_ = {
                        remoteId: remoteId,
                        face: commonFace,
                    };
                }

                this.phnConfig_ = PhnConfigFile.loadFromFile(this.huisFilesRoot_);

                return true;
            }


            /*
             * watingResizeImages_を初期化する。
             */
            initWatingResizeImages() {
                let FUNCTION_NAME = TAGS.HuisFiles + "initWatingResizeImages : ";
                this.watingResizeImages_ = [];
            }

            /**
             * 指定した remoteId とひも付けられた face を取得する。
             * このメソッドを呼ぶ前に、init() を呼び出す必要がある。
             * 
             * @param remoteId {string} [in] 取得したい face の remoteId
             * @paran master {boolean} [in] masterface を取得したい場合は true を指定する。省略した場合は通常の face を返す。
             * @return {Model.Face} face
             */
            getFace(remoteId: string, master?: boolean): Model.Face {
                var remoteInfos: IRemoteInfo[] = this.remoteInfos_;
                if (!remoteInfos || !_.isArray(remoteInfos)) {
                    return null;
                }

                // Commonの場合はMasterFaceがないので、faceを返す。
                if (remoteId == "common") {
                    return this.commonRemoteInfo_.face;
                }

                for (let i = 0, l = remoteInfos.length; i < l; i++) {
                    if (remoteInfos[i].remoteId === remoteId) {
                        if (master) {
                            return remoteInfos[i].mastarFace;
                        } else {
                            return remoteInfos[i].face;
                        }
                    }
                }
                return null;
            }

            /*
            * 一時的に利用するFaceModelを返す。
            * @param {string} remoteId 生成されるFaceのRemoteId
            * @param {string} faceName 生成されるFaceの名前
            * @param {Model.Module[]} modules 生成されるFaceに含まれているモジュール群
            * @return {Model.Face} 一時的に生成したFaceModel
            */
            createTmpFace(remoteId: string, faceName: string, modules: Model.Module[]): Model.Face {
                let tmpFace: Model.Face = new Model.Face(remoteId, faceName, DEVICE_TYPE_FULL_CUSTOM, modules);
                return tmpFace;
            }

            /**
             * 指定した category と「一致する」または「一致しない」face 群を取得する。
             * このメソッドを呼ぶ前に、init() を呼び出す必要がある。
             * 
             * @param condition {Object} [in] 取得したい face 群の category 条件
             * @return {Model.Face[]} 指定した category 条件を満たした face 群
             */
            getFilteredFacesByCategories(condition: { matchingCategories?: string[], unmatchingCategories?: string[] }, master?: boolean): Model.Face[] {
                if (!this.faces) {
                    return [];
                }

                var faces: Model.Face[] = [];
                this.remoteInfos_.forEach((remoteInfo) => {
                    if (master) {
                        faces.push(remoteInfo.mastarFace);
                    } else {
                        faces.push(remoteInfo.face);
                    }
                });

                return faces.filter((face: Model.Face) => {
                    if (!face) {
                        return false;
                    }
                    // condition.matchingCategories のカテゴリーのうちどれかに当てはまるかチェック
                    if (condition.matchingCategories) {
                        let matched = false;
                        condition.matchingCategories.forEach((category: string) => {
                            if (!matched && face.category.toLowerCase() === category.toLowerCase()) {
                                matched = true;
                            }
                        });
                        // 当てはまるものがなければ、false を返す
                        if (!matched) {
                            return false;
                        }
                    }
                    if (condition.unmatchingCategories) {
                        let matched = false;
                        condition.unmatchingCategories.forEach((category: string) => {
                            if (!matched && face.category.toLowerCase() === category.toLowerCase()) {
                                matched = true;
                            }
                        });
                        // 当てはまるものがあれば、false を返す
                        if (matched) {
                            return false;
                        }
                    }

                    return true;
                });
            }

            // TODO: refactor
            /**
             * 機器の master face に記述されている「機能 (function)」 をすべて取得する
             * 
             * @param {string} マスターから機能を取得したいリモコンの remoteId
             * @return {string[]} 機能の一覧。取得できない場合は null
             */
            getMasterFunctions(remoteId: string): string[];

            /**
             * 機器の master face に記述されている「機能 (function)」 をすべて取得する
             * 
             * @param brand {string} メーカー名
             * @param deviceType {string} カテゴリー
             * @param codeset {string} コードセット
             * @return {string[]} 機能の一覧。取得できない場合は null
             */
            getMasterFunctions(brand: string, deviceType: string, codeset?: string): string[];

            getMasterFunctions(param1: string, param2?: string, param3?: string): string[] {
                // param2 が指定されている場合は、param1: メーカー名, param2: カテゴリー, param3: 型番

                if (param2) {
                    let brand = param1,
                        deviceType = param2,
                        codeset = param3;

                    return this._getMasterFunctions(this.getRemoteIdByCodeDbElements(brand, deviceType, codeset));

                } else { // param2 が指定されていない場合は、param1: remoteId
                    let remoteId = param1;
                    return this._getMasterFunctions(remoteId);
                }
            }


            /**
             * IActionオブジェクトからremoteIdを取得する
             * @param action {IAction}
             * @return {string} remoteId
             */
            getRemoteIdByAction(action: IAction): string {
                let FUNCTION_NAME = TAGS.HuisFiles + "getRemoteIdByAction";
                if (action == null) {
                    console.warn(FUNCTION_NAME + "action is null");
                    return;
                }
                let remoteId: string = undefined;

                if (action != null) {

                    // codeで検索
                    let code = action.code;
                    if (remoteId == null && code != null) {
                        remoteId = this.getRemoteIdByCode(code);
                    }

                    //codeで検索でわからないばあい、functionCodeHashで取得
                    if (remoteId == null &&
                        action.deviceInfo &&
                        action.deviceInfo.functionCodeHash != null) {
                        let functionCodeHash = action.deviceInfo.functionCodeHash;
                        let checkCode: string = null;

                        //functionCodeHashのうち、適当なcodeで検索
                        for (let key in functionCodeHash) {
                            checkCode = functionCodeHash[key];
                            break;
                        }
                        remoteId = this.getRemoteIdByCode(checkCode);
                    }

                    // functionCodeHashでみつからない場合、deviceinfoで検索
                    if (remoteId == null &&
                        action.deviceInfo) {
                        remoteId = this.getRemoteIdByButtonDeviceInfo(action.deviceInfo);
                    }

                    // それでもみつからない場合、code_dbで検索.ただし、ご検出のするので、Bluetooth_dataがあるときは使わない
                    if (remoteId == null && action.code_db && !action.bluetooth_data) {
                        let codeDb = action.code_db;
                        remoteId = this.getRemoteIdByCodeDbElements(codeDb.brand, codeDb.device_type, codeDb.db_codeset);
                    }

                    //remoteIdがみつからない場合、キャッシュからremoteIdを取得
                    if (remoteId == null && action.deviceInfo && action.deviceInfo.remoteName !== "Special") {
                        remoteId = action.deviceInfo.id;
                    }

                }

                return remoteId;

            }


            /*
            * 同一のコードを持つremoteがあった場合そのremoteIdをする
            * @param code{string} 学習して登録した際の button/state/action/code
            * @return remoteId{string} 入力したcodeをもつリモコンのID
            */
            getRemoteIdByCode(code: string): string {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " : getRemoteIdByCode : ";
                if (code == null) {
                    console.warn(FUNCTION_NAME + "code is undefined");
                    return;
                }

                for (let i = 0, l = this.remoteList_.length; i < l; i++) {
                    let remoteId = this.remoteList_[i].remote_id;
                    let face = this.getFace(remoteId);
                    if (!face) {
                        continue;
                    }
                    let codesMaster: string[] = this.getAllFaceCodes(remoteId);
                    let deviceType = face.category;

                    //サポート外のdeviceTypeだった場合、次のremoteIdへ
                    if (NON_SUPPORT_DEVICE_TYPE_IN_EDIT.indexOf(deviceType) != -1) {
                        continue;
                    }

                    if (codesMaster) {
                        //同一のコードを持つremoteがあった場合そのremoteId
                        for (let j = 0; j < codesMaster.length; j++) {
                            if (code == codesMaster[j]) {
                                return remoteId;
                            }
                        }
                    }

                }

                return null;
            }

            /**
            * 同じbrand, deviceType, codesetをもつリモコンのremoteIdを取得する。
            * ただし、誤検出の懸念から、Bluetoothは対象外とする
            * @param brand{string} 機器のブランド
            * @param deviceType{string} 機器のタイプ
            * @param codeset{string} 機器のコードセット
            * @return remoteId{string}リモコンのID
            */
            getRemoteIdByCodeDbElements(brand, deviceType, codeset): string {
                let FUNCTION_NAME = TAGS.HuisFiles + " :getRemoteIdByCodeDb: ";

                for (let i = 0, l = this.remoteList_.length; i < l; i++) {
                    let remoteId = this.remoteList_[i].remote_id;
                    let codeDb = this.getMasterCodeDb(remoteId);
                    let deviceInfo: IButtonDeviceInfo = this.getDeviceInfo(remoteId);

                    if (deviceInfo != null && deviceInfo.bluetooth_data != null) {
                        continue;
                    }




                    if (codeDb) {
                        //brandを取得
                        if (codeDb.brand == null || codeDb.brand == "" || codeDb.brand == " ") {
                            continue;
                        }

                        //deviceTypeを取得
                        if (codeDb.device_type == null || codeDb.device_type == "" || codeDb.device_type == " ") {
                            continue;
                        }

                        //codesetを取得
                        if (codeDb.db_codeset == null || codeDb.db_codeset == "" || codeDb.db_codeset == " ") {
                            continue;
                        }

                        if (codeDb.brand === brand &&
                            codeDb.device_type === deviceType &&
                            codeDb.db_codeset === codeset) {
                            return remoteId;
                        }
                    }
                }

                return null;
            }

            /**
            * 該当するBluetooth機器を持つリモコンのremoteIdを取得する。
            * @param bluetoothDevice {IBluetoothDevice} Bluetooth機器情報
            * @return {string} リモコンのID。該当リモコンが存在しない場合はnull。
            */
            getRemoteIdByBluetoothDevice(bluetoothDevice: IBluetoothDevice): string {
                let FUNCTION_NAME = TAGS.HuisFiles + " :getRemoteIdByBluetoothDevice: ";

                if (bluetoothDevice == null) {
                    console.warn(FUNCTION_NAME + "bluetoothDevice is null");
                    return null;
                }

                for (let i = 0, l = this.remoteInfos_.length; i < l; i++) {
                    let targetRemoteId = this.remoteInfos_[i].remoteId;
                    let bluetoothData = this.getMasterBluetoothData(targetRemoteId);
                    if (bluetoothData &&
                        bluetoothData.bluetooth_device &&
                        bluetoothData.bluetooth_device.bluetooth_address === bluetoothDevice.bluetooth_address
                    ) {
                        return targetRemoteId;
                    }
                }

                return null;
            }

            /**
             * 機器の master face に記述されている最初の code を取得する。
             * 取得した code は、「このcodeをもつリモコンはどのremoteIdか」検索するために利用されると想定。
             * 
             * @param remoteId {string} リモコンの remoteId
             * @return {strings[]} master face に記述されている codeをすべて格納した配列。見つからない場合は null。
             */
            private getMasterFaceCodes(remoteId: string): string[] {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " :getMasterFaceCode: ";
                if (remoteId == undefined) {
                    console.warn(FUNCTION_NAME + "remoteId is undefined");
                    return;
                }

                let masterFace = this.getFace(remoteId, true);
                if (!masterFace) {
                    console.warn(TAGS.HuisFiles + "getMasterFaceCode() masterFace is not found.");
                    return null;
                }

                return masterFace.getCodes();

            }

            private getAllFaceCodes(remoteId: string) {
                let codes = [];

                let faceCodes = this.getFaceCodes(remoteId);
                if (faceCodes != null) {
                    codes = faceCodes;
                }

                let masterCodes = codes.concat(this.getMasterFaceCodes(remoteId));
                if (masterCodes != null) {
                    codes = codes.concat(masterCodes);
                }

                codes.filter((x, i, self) => self.indexOf(x) === i);
                return codes;
            }

            private getFaceCodes(remoteId: string): string[] {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " :getMasterCode: ";
                if (remoteId == undefined) {
                    console.warn(FUNCTION_NAME + "remoteId is undefined");
                    return;
                }

                let face = this.getFace(remoteId, false);
                if (!face) {
                    console.warn(TAGS.HuisFiles + "getMasterCode() masterFace is not found.");
                    return null;
                }

                return face.getCodes();
            }

            private _getMasterFunctions(remoteId: string): string[] {
                let masterFace = this.getFace(remoteId, true);
                return (masterFace != null) ? masterFace.getFunctions() : null;
            }

            public getFaceFunctions(remoteId: string): string[] {
                let face = this.getFace(remoteId, false);
                return (face != null) ? face.getFunctions() : null;
            }

            public getAllFunctions(remoteId: string): string[] {
                let faceFunc = this.getFaceFunctions(remoteId);
                let masterFunc = this.getMasterFunctions(remoteId);

                return HuisFiles.mergeFunctions(masterFunc, faceFunc);
            }

            private static mergeFunctions(base: string[], additional: string[]): string[] {
                if (base == null || base.length <= 0) {
                    return additional;
                } else if (additional.length <= 0) {
                    return base;
                }

                let merged: string[] = base.concat();

                for (let addFunc of additional) {
                    if (merged.indexOf(addFunc) < 0) {
                        // 存在しないので追加

                        let sameFuncs =
                            merged.filter((func) => {
                                return HuisFiles.getPlainFunctionKey(func) === HuisFiles.getPlainFunctionKey(addFunc);
                            });

                        if (sameFuncs.length <= 0) {
                            // 同名信号なし
                            merged.push(addFunc);
                            continue;
                        }

                        sameFuncs.push(addFunc);
                        sameFuncs.sort((a, b) => {
                            let numA = HuisFiles.extractFuncNumber(a);
                            let numB = HuisFiles.extractFuncNumber(b);
                            return (numA < numB) ? -1 : 1;
                        });

                        let insertIndex: number;
                        let index = sameFuncs.indexOf(addFunc);
                        if (index == sameFuncs.length - 1) {
                            // 既存の最大番号を持つ信号の後に挿入
                            insertIndex = merged.indexOf(sameFuncs[index - 1]) + 1;
                        } else {
                            // 自分の次に大きい番号を持つ信号の位置に挿入
                            insertIndex = merged.indexOf(sameFuncs[index + 1]);
                        }

                        merged.splice(insertIndex, 0, addFunc);
                    }
                }

                return merged;
            }

            /**
             * 機器の master face に記述されている最初の code_db を取得する。
             * 取得した code_db は、機器の「ブランド」、「種類」等の情報のために使用されることを想定している。
             * 
             * @param remoteId {string} リモコンの remoteId
             * @return {ICodeDB} master face に記述されている最初の code_db。見つからない場合は null。
             */
            getMasterCodeDb(remoteId: string): ICodeDB {
                let masterFace = this.getFace(remoteId, true);
                return (masterFace != null) ? masterFace.getCodeDb() : null;
            }

            /*
            * 機器の master face に記述されている最初の codeのうち、FuncitonNameが一致しているものを取得する。
            * @param remoteId : string リモコンの remoteId
            * @return functionのIDとcodenの対応表を返す
            */
            getMasterFunctionCodeMap(remoteId: string): IStringStringHash {
                return this.getFunctionCodeMap(remoteId, true);
            }

            /**
             * 指定リモコンの信号名：信号の連想配列を取得
             *
             * @param remoteId {string}
             * @param isMaster {boolean} master face を取得するかどうか
             * @return {IStringStringHash}
             */
            private getFunctionCodeMap(remoteId: string, isMaster: boolean): IStringStringHash {
                let FUNCTION_NAME = TAGS.HuisFiles + "getFunctionCodeMap";

                if (remoteId == undefined) {
                    console.warn(FUNCTION_NAME + "remoteId is undefined");
                    return null;
                }

                let face: Model.Face = this.getFace(remoteId, isMaster);
                if (!face) {
                    return null;
                }

                return HuisFiles.getFunctionCodeMapByModules(face.modules);
            }


            /**
             * 対象リモコンのfaceおよびmasterFaceのマージされた 信号名：信号 の連想配列を取得
             *
             * @param remoteId {string}
             * @return {IStringStringHash}
             */
            public getAllFunctionCodeMap(remoteId: string): IStringStringHash {
                let master = this.getFunctionCodeMap(remoteId, true);
                let face = this.getFunctionCodeMap(remoteId, false);

                let merged = $.extend(true, face, master);

                return merged;
            }


            /**
             * 渡されたモジュールから 信号名：信号 の連想配列を取得
             *
             * @param modules {Model.Module[]}
             * @return {IStringSringHash}
             */
            private static getFunctionCodeMapByModules(modules: Model.Module[]): IStringStringHash {
                let result: IStringStringHash = {};

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
                                let action = actions[l];
                                let code = (action.code != null) ? action.code : "";
                                let codeDb = action.code_db;
                                let functionName = action.code_db.function;
                                if (functionName != null && functionName != undefined && functionName != " " &&
                                    (code != "" || codeDb.db_codeset != " " || codeDb.brand != " " || action.bluetooth_data != null)) {
                                    result[functionName] = code;
                                }
                            }
                        }
                    }
                }

                return result;
            }

            /**
             * HuisFilesを検索し、設定すべき信号名を取得
             *
             * @param funcName {string}
             * @param code {string}
             * @param remoteId {string}
             * @return {string}
             */
            private findFunctionKeyInHuisFilesByFunctionName(funcName: string, code: string, remoteId: string): string {
                let functionCodeHash = this.getAllFunctionCodeMap(remoteId);

                return HuisFiles.findFuncNameOrCreateSpecialName(funcName, code, functionCodeHash);
            }


            /**
             * 信号名から特殊文字を排除し、素の信号名を取得
             *
             * @param functionName {string} 
             * @return {string}
             */
            static getPlainFunctionKey(functionName: string): string {
                let delimiterIndex = functionName.indexOf(FUNC_NUM_DELIMITER);
                if (delimiterIndex === -1) {
                    return functionName;
                } else {
                    return functionName.substring(0, delimiterIndex);
                }
            }


            /**
             * 既存の信号リストから該当する信号名を取得する。
             * 該当する信号が無い場合は連番を付与した新規の信号名を返す。
             *
             * @param funcName {string} 信号名
             * @param code {string} 信号
             * @param funcCodeHash {IStringStringHash} 既存の信号名リスト
             * @return {string} 同一とみなされた信号の信号名、または新規の信号名
             */
            private static findFuncNameOrCreateNumberedName(funcName: string, code: string, funcCodeHash: IStringStringHash): string {
                return HuisFiles.findFuncNameOrCreate(
                    funcName,
                    code,
                    funcCodeHash,
                    (name, sameFuncs) => {
                        let newKey = HuisFiles.getPlainFunctionKey(funcName);

                        let i = 0;
                        while (sameFuncs.indexOf(newKey) >= 0) {
                            newKey = HuisFiles.getPlainFunctionKey(funcName) + FUNC_NUM_DELIMITER + i++;
                        }

                        return newKey;
                    });
            }


            /**
             * 既存の信号リストから該当する信号名を取得する。
             * 該当する信号が無い場合は該当ボタン独自の信号名を表すコードを付与した信号名を返す。
             *
             * @param funcName {string} 信号名
             * @param code {string} 信号
             * @param funcCodeHash {IStringStringHash} 既存の信号名リスト
             * @return {string} 同一とみなされた信号の信号名、または新規の信号名
             */
            private static findFuncNameOrCreateSpecialName(funcName: string, code: string, funcCodeHash: IStringStringHash): string {
                return HuisFiles.findFuncNameOrCreate(
                    funcName,
                    code,
                    funcCodeHash,
                    (name, sameFuncs) => {
                        if (funcName != "none") {
                            return HuisFiles.getPlainFunctionKey(funcName) + FUNC_NUM_DELIMITER + FUNC_CODE_RELEARNED;
                        } else {
                            return funcName;
                        }
                    });
            }


            /**
             * 既存の信号リストから該当する信号名を取得する。
             * 該当する信号が無い場合は指定された新規信号名生成関数を呼び出す。
             *
             * @param funcName {string} 信号名
             * @param code {string} 信号
             * @param funcCodeHash {IStringStringHash} 既存の信号名リスト
             * @param createFunc {(name, sameFuncs) => string} 該当信号が無かった場合の新規信号名生成関数
             * @return {string} 同一とみなされた信号の信号名、または新規の信号名
             */
            private static findFuncNameOrCreate(funcName: string, code: string, funcCodeHash: IStringStringHash, createFunc: (name, sameFuncs) => string): string {
                if (funcCodeHash == null || Object.keys(funcCodeHash).length <= 0) {
                    return HuisFiles.getPlainFunctionKey(funcName);
                }
                let tmpCode = code ? code : "";

                let sameFuncs: string[] = [];
                for (let key in funcCodeHash) {
                    if (HuisFiles.getPlainFunctionKey(funcName) == HuisFiles.getPlainFunctionKey(key)) {
                        if (tmpCode == funcCodeHash[key]) {
                            return key;
                        }

                        sameFuncs.push(key);
                    }
                }

                return createFunc(funcName, sameFuncs);
            }

            /**
             * 機器の master face に記述されている最初の bluetooth_data を取得する。
             *
             * @param remoteId {string} リモコンの remoteId
             * @return {ICodeDB} master face に記述されている最初の bluetooth_data。見つからない場合は null。
             */
            getMasterBluetoothData(remoteId: string): IBluetoothData {
                let masterFace: Model.Face = this.getFace(remoteId, true);
                if (!masterFace) {
                    return null;
                }

                let result: IStringStringHash = {};

                var modules = masterFace.modules;
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
                                var bluetoothData = actions[l].bluetooth_data;
                                if (bluetoothData) {
                                    return $.extend(true, {}, bluetoothData);
                                }
                            }
                        }
                    }
                }

                return null;
            }

            /**
             * Common の face を取得する。
             */
            getCommonFace(): Model.Face {
                return this.commonRemoteInfo_.face;
            }

            /**
             * 新しい face を作成できるかどうか。
             * @return 正常にリモコンを作れる場合 0, 異常時は0以下の値を返す。
             */
            canCreateNewRemote(): number {
                //現在の face の個数が MAX_HUIS_FILES 未満であるかどうかで判定する。
                if (this.remoteList_.length >= MAX_HUIS_FILES) {
                    return -1;
                }

                //HUIS内にPalletAreaに参照できるリモコンがあるか否かで判定する。
                if (this.getNumVariableRemote() <= 0) {
                    return -2;
                }

                return 0;

            }


            /**
            * 利用できるリモコンのリストを返す
            * @return {IRemoteInfo[]}
            */
            getSupportedRemoteInfo(): IRemoteInfo[] {
                let FUNCTION_NAME = TAGS.HuisFiles + "getRemoteNameList :";

                if (this.remoteInfos_.length == 0) {
                    console.warn(FUNCTION_NAME + "remoteInfos_.length is 0");
                    return;
                }

                let result: IRemoteInfo[] = [];

                for (let i = 0; i < this.remoteInfos_.length; i++) {
                    if (NON_SUPPORT_DEVICE_TYPE_IN_EDIT.indexOf(this.remoteInfos_[i].face.category) == -1) {
                        result.push(this.remoteInfos_[i]);
                    }
                }

                return result;
            }

            /*
             * マクロで利用できるリモコンのリストを返す。
             * @return {IRemoteInfo[]}
             */
            getSupportedRemoteInfoInMacro(): IRemoteInfo[] {
                let FUNCTION_NAME = TAGS.HuisFiles + "getSupportedRemoteInfoInMacro :";

                if (this.remoteInfos_.length == 0) {
                    console.warn(FUNCTION_NAME + "remoteInfos_.length is 0");
                    return;
                }

                let result: IRemoteInfo[] = [];

                for (let i = 0; i < this.remoteInfos_.length; i++) {
                    if (NON_SUPPORT_DEVICE_TYPE_IN_MACRO.indexOf(this.remoteInfos_[i].face.category) == -1) {
                        result.push(this.remoteInfos_[i]);
                    }
                }

                return result;
            }

            /**
             * ページジャンプボタンで使用可能なリモコン情報を取得
             *
             * @param tmpRemoteId {string} 編集中リモコンのremote_id
             * @param faceName {string} 編集中リモコンの名称
             * @param modules {Model.Module[]} 編集中リモコンのモジュール
             * @return {IRemoteInfo[]}
             */
            getSupportedRemoteInfoInJump(tmpRemoteId: string, faceName: string, modules: Model.Module[]): IRemoteInfo[] {
                let FUNCTION_NAME = TAGS.HuisFiles + "getSupportedRemoteInfoInMacro :";

                if (this.remoteInfos_.length == 0) {
                    console.warn(FUNCTION_NAME + "remoteInfos_.length is 0");
                    return;
                }

                let result: IRemoteInfo[] = [];
                let containsTmpRemote = false;
                for (let i = 0; i < this.remoteInfos_.length; i++) {
                    let target = this.remoteInfos_[i];

                    if (target.face.remoteId == tmpRemoteId) {
                        // 編集中のリモコン
                        containsTmpRemote = true;
                        result.push(this.createTmpRemoteInfo(tmpRemoteId, modules, target.face.category, target.mastarFace));

                    } else {
                        result.push(target);

                    }
                }

                // 新規作成中の場合はリストの先頭に追加
                if (!containsTmpRemote) {
                    result.unshift(this.createTmpRemoteInfo(tmpRemoteId, modules));
                }

                return result;
            }

            /**
             * 一時的なのリモコン情報を生成
             *
             * @param remoteId {string}
             * @param modules {Model.Module}
             * @param catgory {string}
             * @param masterFace {Model.Face}
             * @return {IRemoteInfo}
             */
            private createTmpRemoteInfo(remoteId: string, modules: Model.Module[], category: string = "", masterFace?: Model.Face): IRemoteInfo {

                let faceName = $.i18n.t('edit.property.STR_EDIT_PROPERTY_PULLDOWN_CURRENT_REMOTE');//faceNameを使用せず固定
                let tmpFace: Model.Face = new Model.Face(remoteId, faceName, category, modules)

                let tmpInfo: IRemoteInfo = {
                    remoteId: remoteId,
                    face: tmpFace
                };

                if (masterFace != null) {
                    tmpInfo.mastarFace = masterFace;
                }

                return tmpInfo;
            }

            /*
            * remoetIdをつかいIDeviceInfoを取得する。ただし、functionはnoneとする
            */
            getDeviceInfo(remoteId): IButtonDeviceInfo {
                let FUNCTION_NAME = TAGS.HuisFiles + "getDevieInfo:";

                if (remoteId == null) {
                    return;
                }

                let functions = this.getMasterFunctions(remoteId);
                let codeDb = this.getMasterCodeDb(remoteId);
                let functionCodeHash = this.getAllFunctionCodeMap(remoteId);
                let bluetoothData = this.getMasterBluetoothData(remoteId);

                let face = huisFiles.getFace(remoteId);
                if (face == null) {
                    console.warn(FUNCTION_NAME + "face not found. remoteID: " + remoteId);
                    return;
                }

                let deviceInfo: IButtonDeviceInfo = {
                    id: "",
                    functions: functions,
                    remoteName: face.name,
                    code_db: codeDb
                };
                if (bluetoothData) {
                    deviceInfo.bluetooth_data = bluetoothData;
                }

                if (functionCodeHash != null) {
                    deviceInfo.functionCodeHash = functionCodeHash;
                }

                return deviceInfo;
            }


            /**
             * PalletAreaに出現するリモコンの数を取得する
             * @return PalletAreaに出現するリモコンの数 : number
             */
            getNumVariableRemote(): number {
                let FUNCTION_NAME = TAGS + " : getNumVariableRmote : ";
                if (this.remoteInfos_ == undefined) {
                    console.warn(FUNCTION_NAME + "remoteInfos_ is undefined");
                    return 0;
                }

                if (this.remoteInfos_.length == 0) {
                    return 0;
                }

                let result = 0;

                for (let i: number = 0; i < this.remoteInfos_.length; i++) {
                    //サポートされているdevice_type場合、result + 1
                    if (this.remoteInfos_[i].face) {
                        if (NON_SUPPORT_DEVICE_TYPE_IN_EDIT.indexOf(this.remoteInfos_[i].face.category) == -1) {
                            result++;
                        }
                    }


                }

                return result;
            }

            /**
             * 新しい remoteId を作成する。
             * 新しい remoteId は remoteList に格納されていないものの中で最小の数字を 4 桁の 0 パディングしたものである。
             * (例: "0012", "0345", "8765" など)
             * 
             * 作成した remoteId は remoteList に追加される。
             * 
             * @return {string} 作成された remoteId。失敗した場合は null。
             */
            createNewRemoteId(): string {
                // remoteId リストをソート
                var sortedRemoteId: IRemoteId[] = $.extend(true, [], this.remoteList_)
                    .sort(function (val1: IRemoteId, val2: IRemoteId) {
                        return parseInt(val1.remote_id, 10) - parseInt(val2.remote_id, 10);
                    });

                var newRemoteId = -1;
                // remoteId リストに remoteId がひとつしかない場合
                if (sortedRemoteId.length === 1) {
                    let remoteId = parseInt(sortedRemoteId[0].remote_id, 10);
                    // 0 であれば新しい remoteId は 1 に。
                    // それ以外なら remoteId は 0 に。
                    if (0 === remoteId) {
                        newRemoteId = 1;
                    } else {
                        newRemoteId = 0;
                    }
                } else if (sortedRemoteId.length > 1) {
                    // 新しい remoteId として使える数字を探す
                    let l = sortedRemoteId.length;
                    for (let i = 0; i < l - 1; i++) {
                        let remoteId1 = parseInt(sortedRemoteId[i].remote_id, 10);
                        // remoteList の先頭が 0000 より大きかったら、新しい remoteId を 0 とする
                        if (i === 0 && 0 !== remoteId1) {
                            newRemoteId = 0;
                            break;
                        }
                        // 現在の index の remoteId と 次の index の remoteId との差が 2 以上なら、
                        // 現在の index の remoteId + 1 を新しい remoteId とする
                        let remoteId2 = parseInt(sortedRemoteId[i + 1].remote_id, 10);
                        if (2 <= remoteId2 - remoteId1) {
                            newRemoteId = remoteId1 + 1;
                            break;
                        }
                    }
                    // 適切な remoteId が見つからず。remoteList の終端に達したら、
                    // リストの最後の remoteId + 1 を新しい remoteId とする
                    if (newRemoteId < 0) {
                        newRemoteId = parseInt(sortedRemoteId[l - 1].remote_id, 10) + 1;
                    }
                } else if (sortedRemoteId.length <= 0) {
                    newRemoteId = 0;
                }

                if (0 <= newRemoteId) {
                    // 4 桁の 0 パディングで返却
                    let newRemoteIdStr = ("000" + newRemoteId).slice(-4);
                    // remoteId リストに追加。HUISの表示都合でリスト末尾に追加(push)→先頭に追加(unshift)に変更('16/7/1)
                    this.remoteList_.unshift({
                        remote_id: newRemoteIdStr
                    });

                    return newRemoteIdStr;
                } else {
                    return null;
                }
            }

            /**
             * 指定したリモコンを削除する。
             * ただし、実際に削除されるのは updateRemoteList() を呼んだとき。
             * 
             * @param remoteId {string} 削除するリモコンの remoteId
             */
            removeFace(remoteId: string): void {
                var remoteListCount = this.remoteList_.length;
                // 該当する remoteId をもつものを取り除く
                var removedRemoteList = this.remoteList_.filter((remote) => {
                    return remote.remote_id !== remoteId;
                });
                var removedRemoteListCount = removedRemoteList.length;
                if (removedRemoteListCount < remoteListCount) {
                    // remoteList の更新
                    this.remoteList_ = removedRemoteList;
                }
            }

            /**
             * face ファイルを更新する。
             * 指定した remoteId の face が存在しない場合は、新規作成する。
             * face を新規作成した場合は、remotelist.json を更新する。
             *
             * @param {Model.Face}  inputFace 更新後のface情報 
             * @param {ButtonDeviceInfoCache} cache  一緒に書き出す キャッシュ用のファイル。
             * @param {bollean} isToImportExport  importExport用に使われる場合true
             * @param {string} outputDirPath?  faceファイルの出力先のディレクトリを指定したい場合入力する。
             * @param {string} isMasterFace masterFaceファイルを書き出す際にはtrueを入力する。
             */
            updateFace(inputFace: Model.Face, cache: ButtonDeviceInfoCache, isToImportExport: boolean = false, outputDirPath?: string, isMasterFace: boolean = false): IPromise<void> {

                let FUNCTION_NAME = TAGS.HuisFiles + "updateFace : ";

                if (inputFace == null) {
                    console.warn(FUNCTION_NAME + "inputFace is invalid");
                }

                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let remoteId = inputFace.remoteId;
                let faceName = inputFace.name;
                let deviceType = inputFace.category;
                let modules = inputFace.modules;

                var moduleCount = modules.length;
                let iModules: IModule[] = [];
                var moduleNames: string[] = [];

                let images: Model.ImageItem[] = inputFace.searchImages();
                for (let image of images) {
                    image.reserveResizeImageFile(remoteId, outputDirPath);
                }

                // サイズ変更を行った画像を一括でリサイズする
                this._resizeImages().always(() => {
                    // 不要な画像を削除
                    if (!isToImportExport) {
                        this._removeUnnecessaryImages(inputFace);
                    }

                    // module ファイルの更新
                    for (let i = 0; i < moduleCount; i++) {
                        let moduleInfo = this._updateModule(remoteId, modules[i], outputDirPath);
                        iModules.push(moduleInfo.module);
                        moduleNames.push(moduleInfo.name);
                    }

                    // face ファイルの更新
                    var face: IPlainFace = {
                        name: faceName,
                        category: deviceType,
                        modules: moduleNames
                    };

                    let faceFileName = remoteId + ".face"
                    if (isMasterFace) {
                        faceFileName = "master_" + faceFileName;
                    }

                    var faceFilePath = path.join(this.huisFilesRoot_, remoteId, faceFileName);

                    //ファイルパスの指定がある場合、書き出し先を変更する。
                    if (outputDirPath != null) {
                        faceFilePath = path.join(outputDirPath, remoteId, faceFileName);
                    }

                    fs.outputJSONSync(faceFilePath, face, { spaces: 2 });

                    /* remotelist.ini ファイルを更新 */

                    // remoteList 内に、remoteId が含まれているかをチェック。
                    // 含まれていない場合はリストに追加する。
                    // 含まれているかどうかのチェックは、filter メソッドで追加しようとする remoteId である配列を抽出し、
                    // その配列の length が 1以上であるかで行う。
                    var count = this.remoteList_.filter((val: IRemoteId) => {
                        return val.remote_id === remoteId;
                    }).length;

                    if (count <= 0) {
                        this.remoteList_.push({ remote_id: remoteId });
                    }

                    try {
                        this.updateRemoteList();
                        df.resolve();
                    } catch (e) {
                        df.reject();
                    }
                }).fail(() => {
                    console.error(FUNCTION_NAME + "_resizeImages is fail");
                    df.reject();
                });

                if (cache != null) {
                    ButtonDeviceInfoCache.injectAllDeviceInfoFromHuisFiles(modules);
                    cache.save(modules);
                }


                return promise;

            }

            /**
             * remotelist.ini を更新する。
             * このとき、remotelist.ini に記述されていないリモコンのディレクトリーは削除される。
             * removeFace() で指定したリモコンの削除は、このメソッドが呼ばれたときに行われる。
             */
            updateRemoteList(): void {
                /* remotelist.ini の作成 */
                var remoteListIniPath = path.join(this.huisFilesRoot_, "remotelist.ini");
                var remoteListIniFile = "[General]\n";
                var remoteList = this.remoteList;
                var remoteListLength = remoteList.length;

                for (let i = 0; i < remoteListLength; i++) {
                    remoteListIniFile += i + "=" + remoteList[i].remote_id + "\n";     // 逆順に ∵ HUISでの表示順序は上から新しい順なので
                }
                remoteListIniFile += remoteListLength + "=end";
                fs.outputFileSync(remoteListIniPath, remoteListIniFile);

                /* remoteList に記述のないリモコンのディレクトリーを削除する */
                var files = fs.readdirSync(this.huisFilesRoot_);

                var removingRemoteDirectories = files.filter((file) => {
                    let fullPath = path.join(this.huisFilesRoot_, file);
                    // ディレクトリーであるかチェック
                    if (!fs.statSync(fullPath).isDirectory()) {
                        return false;
                    }

                    //let directoryName = path.basename(filePath);

                    // 以下のディレクトリーは削除対象外
                    switch (file) {
                        case REMOTE_IMAGES_DIRECTORY_NAME:
                        case "lost+found":
                            return false;

                        default:
                            /* jshint -W032:true */
                            ;
                        /* jshint -W032:false */
                    }

                    // remoteList に格納されている remoteId と同名のディレクトリーであるかチェック。
                    // 格納されていない remoteId のディレクトリーは削除対象とする。
                    for (let i = 0, l = remoteList.length; i < l; i++) {
                        if (file === remoteList[i].remote_id) {
                            return false;
                        }
                    }
                    return true;
                });

                // remoteList に記述されていない remoteId のディレクトリーを削除する
                removingRemoteDirectories.forEach((directory) => {
                    fs.removeSync(path.join(this.huisFilesRoot_, directory));
                });

                if (!fs.existsSync(HUIS_REMOTEIMAGES_ROOT)) {
                    return;
                }

                /* remoteList に記述のないリモコンの remoteimages ディレクトリー内の画像を削除する */
                let remoteimagesFiles = fs.readdirSync(HUIS_REMOTEIMAGES_ROOT);

                // 削除対象となるディレクトリーを列挙する
                let removingRemoteimagesDirectories = remoteimagesFiles.filter((file) => {
                    let fullPath = path.join(HUIS_REMOTEIMAGES_ROOT, file);
                    // ディレクトリーであるかチェック
                    if (!fs.statSync(fullPath).isDirectory()) {
                        return false;
                    }

                    for (let i = 0, l = remoteList.length; i < l; i++) {
                        if (file === remoteList[i].remote_id) {
                            return false;
                        }
                    }
                    return true;
                });

                // remoteimages の中にある、remoteList に記述されていない remoteId のディレクトリーを削除する
                removingRemoteimagesDirectories.forEach((directory) => {
                    fs.removeSync(path.join(HUIS_REMOTEIMAGES_ROOT, directory));
                });
            }


            /**
             * phnconfig.iniファイルを更新
             *
             * @param settings {IPhnConfig} 保存するphnconfigデータ
             * @return {CDP.IPromise<void>}
             */
            updatePhnConfigFile(settings: IPhnConfig): IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                PhnConfigFile.saveToFile(this.huisFilesRoot_, settings)
                    .then(() => {
                        let df = $.Deferred<void>();
                        let promise = CDP.makePromise(df);

                        let syncTask = new Util.HuisDev.FileSyncTask();

                        syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, false, null,
                            () => {
                            },
                            (err) => {
                                if (!err) {
                                    console.log('succeeded to sync after saving phnconfig.ini');
                                    df.resolve();
                                } else {
                                    console.error('failed to sync after saving phnconfig.ini: ' + err);
                                    df.reject();
                                }
                            });

                        return promise;
                    })
                    .then(() => {
                        console.log('reload phnconfig.ini');
                        this.phnConfig_ = PhnConfigFile.loadFromFile(this.huisFilesRoot_);
                        df.resolve();
                    },
                    () => {
                        console.log('no reloading phnconfig.ini');
                        df.reject();
                    });

                return promise;
            }

            /**
             * module ファイルを更新する。
             * 指定された module が存在しない場合は、新規作成する。
             * 返却される module は、HUIS ファイルに書き込むためにノーマライズされたもの。
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            private _updateModule(remoteId: string, module: Model.Module, outputDirPath?: string): { module: IModule, name: string } {
                // Model.Module に格納されているデータから、.module ファイルに必要なものを抽出する


                let iModule = module.convertToHuisData(remoteId, outputDirPath);

                var moduleFilePath = path.join(this.huisFilesRoot_, remoteId, "modules", module.name + ".module");

                //ファイルパスの指定がある場合、書き出し先を変更する。
                if (outputDirPath != null) {
                    moduleFilePath = path.join(outputDirPath, remoteId, "modules", module.name + ".module");
                }


                fs.outputJSONSync(moduleFilePath, iModule, { spaces: 2 });

                return {
                    name: module.name,
                    module: iModule
                };
            }

            /**
             * ページジャンプ設定の不正なデータを修正する
             *
             * @param jump {IJump} ページジャンプ設定
             * @return {IJump}
             */
            private _normalizeJump(jump: IJump): IJump {
                let remoteId: string = (jump.remote_id != null) ? jump.remote_id : "";
                let sceneNo: number = (jump.scene_no != null && jump.scene_no >= 0 && jump.scene_no <= 4) ? jump.scene_no : 0;

                return {
                    remote_id: remoteId,
                    scene_no: sceneNo
                }
            }

            /**
             * getter
             */
            get remoteList(): IRemoteId[] {
                return this.remoteList_;
            }

            get faces(): Model.Face[] {
                if (!_.isArray(this.remoteInfos_)) {
                    return null;
                }
                // remoteInfos から faces 情報を取り出す
                var faces: Model.Face[] = [];
                this.remoteInfos_.forEach((remoteInfo) => {
                    faces.push(remoteInfo.face);
                });
                return faces;
            }

            /**
             * remotelist.json から remoteList を取得する
             */
            private _loadRemoteList(): IRemoteId[] {
                var remoteListIniPath = path.resolve(path.join(this.huisFilesRoot_, "remotelist.ini"));
                if (!fs.existsSync(remoteListIniPath)) {
                    console.error(TAGS.HuisFiles + "_loadRemoteList() remotelist.ini is not found.");
                    return null;
                }
                // remotelist.ini を node-ini で parse
                var nodeIni = require("node-ini");
                var remoteListIni = nodeIni.parseSync(remoteListIniPath);
                if (!remoteListIni) {
                    console.error(TAGS.HuisFiles + "_loadRemoteList() [parseError] remotelist.ini");
                    return null;
                }
                // ini ファイルの [General] に remoteList の情報が記述されている
                var general: any = remoteListIni.General;
                if (!general) {
                    console.error(TAGS.HuisFiles + "_loadRemoteList() remotelist.ini is not found.");
                    return null;
                }

                // general のプロパティーキーを取得
                var generalProps: string[] = [];
                for (let prop in general) {
                    if (general.hasOwnProperty(prop)) {
                        generalProps.push(prop);
                    }
                }

                // general のプロパティーキーを昇順にソート
                var sortedGeneralProps = generalProps.sort((a, b) => {
                    let aNum = parseInt(a, 10),
                        bNum = parseInt(b, 10);
                    return aNum - bNum;
                });

                var remoteList: IRemoteId[] = [];
                // prop の数字が小さい順に remoteList に格納
                for (let i = 0, l = sortedGeneralProps.length; i < l; i++) {
                    let value = general[sortedGeneralProps[i]];
                    // "end" と遭遇したら終了
                    if (value === "end") {
                        break;
                    }

                    remoteList.push({ remote_id: value });
                }

                return remoteList;
            }

            /**
             * remoteList に記述された remoteId のすべての remote 情報 (face / masterface) を取得する
             */
            private _fetchRemoteInfos(): IRemoteInfo[] {
                if (!this.remoteList_) {
                    console.error(TAGS.HuisFiles + "_fetchRemoteInfos() remoteList is undefined");
                    return null;
                }

                var remoteInfos: IRemoteInfo[] = [];

                for (let i = 0, l = this.remoteList_.length; i < l; i++) {
                    let remoteId = this.remoteList_[i].remote_id;
                    let facePath = path.join(this.huisFilesRoot_, remoteId, remoteId + ".face");
                    let masterFacePath = path.join(this.huisFilesRoot_, remoteId, "master_" + remoteId + ".face");
                    let masterFace: Model.Face = this.parseFaceWithNumberingFuncName(masterFacePath, remoteId);

                    if (masterFace != undefined && remoteId != undefined) {
                        let face: Model.Face = this._parseFace(facePath, remoteId);

                        if (face != undefined) {

                            // MastarFaceの連番付き信号名をFaceに反映
                            // ただし、fullcustomは対象外とする。
                            if (face.category != DEVICE_TYPE_FULL_CUSTOM) {
                                HuisFiles.applyNumberedFunctionNameByModule(face.modules, masterFace.modules);
                            }

                            remoteInfos.push({
                                remoteId: remoteId,
                                face: face,
                                mastarFace: masterFace
                            });
                        }
                    } else {
                        // Masterが無い場合はFace自体で連番作成
                        let face: Model.Face = this.parseFaceWithNumberingFuncName(facePath, remoteId);

                        if (face != undefined) {
                            remoteInfos.push({
                                remoteId: remoteId,
                                face: face,
                            });
                        }
                    }

                }

                return remoteInfos;
            }

            /**
             * face を読み込み、信号名に連番を付与する
             *
             * @param facePath {string}
             * @param remoteId {string}
             * @param rootDirectory {string}
             * @return {Model.Face}
             */
            parseFaceWithNumberingFuncName(facePath: string, remoteId: string, rootDirectory?: string): Model.Face {
                let face: Model.Face = this._parseFace(facePath, remoteId, rootDirectory);

                if (face != null && face.modules != null && face.category != DEVICE_TYPE_FULL_CUSTOM) {
                    HuisFiles.numberFunctionNameInModules(face.modules);
                }

                return face;
            }

            /**
             * 指定したパスの face を parse する
             */
            _parseFace(facePath: string, remoteId: string, rootDirectory?: string): Model.Face {
                // face ファイルを読み込む
                if (!fs.existsSync(facePath)) {
                    return undefined;
                }

                var faceText: string = fs.readFileSync(facePath, "utf8");
                if (!faceText) {
                    console.warn(TAGS.HuisFiles + "_parseFace() cannot read " + facePath);
                    return undefined;
                }
                try {
                    // JSON.parse()はJSONが正しくない場合例外を投げるのでtry-catchで受ける
                    var plainFace: IPlainFace = JSON.parse(faceText.replace(/^\uFEFF/, ""));
                } catch (e) {
                    console.error("_parseFace: " + e);
                    console.log(plainFace);
                }

                // 読み込んだ face のチェック
                if (!plainFace) {
                    console.warn(TAGS.HuisFiles + "_parseFace() cannot read " + facePath + " as JSON");
                    return undefined;
                }
                if (!plainFace.modules || !_.isArray(plainFace.modules) || plainFace.modules.length < 1) {
                    console.warn(TAGS.HuisFiles + "_parseFace()  face of " + facePath + " is not valid");
                    return undefined;
                }

                var face: Model.Face = new Model.Face(remoteId, plainFace.name, plainFace.category);

                let heightSum: number = 0;

                // モジュール名に対応する .module ファイルから、モジュールの実体を引く
                for (var i = 0, l = plainFace.modules.length; i < l; i++) {
                    var moduleName: string = plainFace.modules[i];
                    var iModule: IModule = this._parseModule(moduleName, remoteId, rootDirectory);
                    if (iModule) {
                        heightSum += iModule.area.h;
                        let pageIndex = Math.floor((heightSum - 1) / HUIS_FACE_PAGE_HEIGHT);

                        let module = new Model.Module();
                        module.setInfoFromIModule(iModule, remoteId, pageIndex, moduleName);
                        face.modules.push(module);
                    }
                }

                //フルカスタムリモコンのモジュールがJsonが壊れるなどして、mosduleファイルが0個のとき、空のModuleFileを用意する
                if (plainFace.category == DEVICE_TYPE_FULL_CUSTOM &&
                    face.modules.length == 0) {

                    let module = new Model.Module();
                    module.setInfo(remoteId, 0);
                    face.modules.push(module);
                }

                return face;
            }

            /**
             * モジュール内において同一信号名にもかかわらず異なる信号が設定されているものに連番を付与する
             *
             * @param modules {Model.Module[]} 検査対象モジュール
             */
            private static numberFunctionNameInModules(modules: Model.Module[]) {
                let functionCodeHash: IStringStringHash = {};

                for (let mod of modules) {
                    if (mod.button == null) continue;
                    for (let button of mod.button) {
                        if (button.state == null) continue;
                        for (let state of button.state) {
                            if (state.action == null) continue;
                            for (let action of state.action) {
                                if (action.code_db == null || action.code_db.function == null) {
                                    continue; // 信号名が無い場合
                                }

                                if (action.code == null || action.code.length <= 0) {
                                    let code_db = action.code_db;
                                    if (code_db.db_codeset == " " && code_db.brand == " " && action.bluetooth_data == null) {
                                        // 信号が無く かつ プリセットやBluetoothでもない
                                        continue;
                                    }
                                }

                                let func = action.code_db.function;
                                let code = (action.code != null) ? action.code : "";

                                if (!(func in functionCodeHash)) {
                                    functionCodeHash[func] = code;
                                } else if (functionCodeHash[func] != code) {
                                    let numberedFunc = HuisFiles.findFuncNameOrCreateNumberedName(func, code, functionCodeHash);

                                    action.code_db.function = numberedFunc;
                                    functionCodeHash[numberedFunc] = code;
                                }

                            }
                        }
                    }
                }
            }

            /**
             * HuisFiles内の信号名を対象モジュールに反映する
             *
             * @param modules {Model.Module[]}
             */
            public applyNumberedFunctionName(modules: Model.Module[]) {

                for (let mod of modules) {
                    if (mod.button == null) continue;
                    for (let button of mod.button) {
                        if (button.state == null) continue;
                        for (let state of button.state) {
                            if (state.action == null) continue;
                            for (let action of state.action) {
                                if (action.code_db == null ||
                                    action.code_db.function == null) {
                                    continue;
                                }

                                let remoteId = this.traceOriginalRemoteIdByAction(action);
                                if (remoteId == null || remoteId == "") {
                                    // 基リモコンなしの場合、学習されたコードであればfunctionに"##"を付ける
                                    if (action.code_db != null && action.code != null) {
                                        // 既に#IDや#HASHが付いている場合には取り除く
                                        //   ※action.code_db.functionには#は使われない想定
                                        action.code_db.function = action.code_db.function.replace(/#.+$/, "");
                                        // 改めて##を付け直す
                                        action.code_db.function = action.code_db.function + FUNC_NUM_DELIMITER + FUNC_CODE_RELEARNED;
                                    } else {
                                        remoteId = null;
                                    }
                                } else {
                                    let numberedFunc = this.findFunctionKeyInHuisFilesByFunctionName(action.code_db.function, action.code, remoteId);
                                    action.code_db.function = numberedFunc;
                                }
                            }
                        }
                    }
                }
            }

            /**
             * 信号名をキャッシュから取得し設定
             *
             * @param modules {Model.Module[]} 更新対象のアイテムおよびキャッシュを含むモジュール
             */
            public applyCachedFunctionName(modules: Model.Module[]) {
                for (let mod of modules) {
                    if (mod.button == null) continue;
                    for (let button of mod.button) {
                        if (button.state == null) continue;
                        for (let state of button.state) {
                            if (state.action == null) continue;
                            for (let action of state.action) {
                                if (action.code == null ||
                                    action.code.length <= 0 ||
                                    action.code_db == null ||
                                    action.deviceInfo == null ||
                                    action.deviceInfo.functionCodeHash == null) {
                                    continue;
                                }

                                let remoteId = this.traceOriginalRemoteIdByAction(action);
                                if (this.remoteList.filter((remote) => { return remote.remote_id == remoteId }).length > 0) {
                                    // 基リモコンが存在する場合はそちらを優先するため、ここでは信号名を更新しない
                                    continue;
                                }

                                let existFunc = false;
                                if (action.deviceInfo.functionCodeHash != null) {
                                    let funcCodeHash = action.deviceInfo.functionCodeHash;
                                    for (let funcName of Object.keys(funcCodeHash)) {
                                        if (funcCodeHash[funcName] == action.code) {
                                            action.code_db.function = funcName;
                                            existFunc = true;
                                            break;
                                        }
                                    }
                                }

                            }
                        }
                    }
                }
            }

            traceOriginalRemoteIdByAction(action: IAction) {
                let FUNCTION_NAME = TAGS.HuisFiles + "getRemoteIdByAction";
                if (action == null) {
                    return;
                }
                let remoteId: string = undefined;

                if (action != null) {

                    // codeで検索
                    let code = action.code;
                    if (remoteId == null && code != null) {
                        remoteId = this.getRemoteIdByCode(code);
                    }

                    //DEVICE_TYPE_LEARNEDの場合、間違ったremoteIdを検索してしまうので防止する。
                    if (action.code_db.device_type !== DEVICE_TYPE_LEARNED) {

                        //deviceinfoでみつからない場合、bluetoothの情報で検索
                        if (remoteId == null &&
                            action.bluetooth_data &&
                            action.bluetooth_data.bluetooth_device &&
                            action.deviceInfo) {
                            remoteId = this.getRemoteIdByBluetoothDevice(action.bluetooth_data.bluetooth_device);
                        }

                        // それでもみつからない場合、code_dbで検索.ただし、ご検出のするので、Bluetooth_dataがあるときは使わない
                        if (remoteId == null && action.code_db && !action.bluetooth_data) {
                            let codeDb = action.code_db;
                            remoteId = this.getRemoteIdByCodeDbElements(codeDb.brand, codeDb.device_type, codeDb.db_codeset);
                        }
                    }

                    //remoteIdがみつからない場合、キャッシュからremoteIdを取得
                    if (remoteId == null && action.deviceInfo && action.deviceInfo.remoteName !== "Special") {
                        remoteId = action.deviceInfo.id;
                    }

                }

                return remoteId;

            }

            /**
             * 対象モジュール内の信号名を基モジュール内にある信号名に合わせる。
             * 基モジュールに同信号名別信号が存在する場合は連番を付与した新しい信号名に変更する。
             *
             * @param target {Model.Module[]} 更新対象を含むモジュール
             * @param original {Model.Module[]} 基にするモジュール
             */
            private static applyNumberedFunctionNameByModule(target: Model.Module[], original: Model.Module[]) {
                let funcCodeHash = HuisFiles.getFunctionCodeMapByModules(original);

                for (let mod of target) {
                    if (mod.button == null) continue;
                    for (let button of mod.button) {
                        if (button.state == null) continue;
                        for (let state of button.state) {
                            if (state.action == null) continue;
                            for (let action of state.action) {
                                if (action.code == null ||
                                    action.code_db == null ||
                                    action.code_db.function == null) {
                                    continue;
                                }

                                let funcName = HuisFiles.findFuncNameOrCreateNumberedName(action.code_db.function, action.code, funcCodeHash);
                                action.code_db.function = funcName;
                                funcCodeHash[funcName] = action.code;
                            }
                        }
                    }
                }
            }



            /**
             * 連番付き信号名リストを表示用データに変換
             *
             * @param functions {string[]}
             * @return {IFunctionLabel[]}
             */
            public static translateFunctions(functions: string[]): IFunctionLabel[] {
                let translatedFuncs = [];

                // 連番付与済みfunctionリスト
                let numberedFuncs: string[] = [];

                for (let func of functions) {
                    if (func == null) {
                        continue;
                    }
                    let plainName = Util.HuisFiles.getPlainFunctionKey(func);
                    if (plainName != func) {
                        let numCode = func.substring(func.indexOf(FUNC_NUM_DELIMITER) + 1);
                        if (numCode == FUNC_CODE_RELEARNED) {
                            // フルカスタム再学習ボタン（基リモコン有り）
                            translatedFuncs.push({
                                key: func,
                                label: $.i18n.t('button.function.' + plainName) + $.i18n.t('button.function.STR_REMOTE_BTN_LEARNED')
                            });
                        } else {
                            // 連番
                            let num = Number(numCode) + 2;
                            translatedFuncs.push({
                                key: func,
                                label: $.i18n.t('button.function.' + plainName) + ' (' + num + ')'
                            });
                            if (numberedFuncs.indexOf(plainName) < 0) {
                                // 連番付きの信号名のオリジナルを記憶しておく
                                numberedFuncs.push(plainName);
                            }
                        }

                    } else {
                        // 連番なし
                        translatedFuncs.push({
                            key: func,
                            label: $.i18n.t('button.function.' + plainName)
                        });
                    }
                }

                // 連番付きが存在する信号名のオリジナルに1番を付与
                for (let numberedFunc of numberedFuncs) {

                    for (let translated of translatedFuncs) {
                        if (translated.key === numberedFunc) {
                            translated.label += ' (1)';
                            break;
                        }
                    }
                }

                return translatedFuncs;
            }

            /**
             * 連番付き信号名から番号を抽出
             * 連番なしの場合は１、特殊コード付きの場合は0を返す
             *
             * @param funcKey {string} 信号名
             * @return {number} 番号
             */
            private static extractFuncNumber(funcKey: string): number {
                let delimiterIndex = funcKey.indexOf(FUNC_NUM_DELIMITER);
                if (delimiterIndex < 0) {
                    return 1;
                }

                let numCode = funcKey.substring(delimiterIndex + 1);

                if (numCode == FUNC_CODE_RELEARNED) {
                    return 0;
                }

                let num = Number(numCode);
                if (isNaN(num)) {
                    return 0;
                } else {
                    return num + 2;
                }
            }


            /**
             * module ファイルを parse する
             */
            private _parseModule(moduleName: string, remoteId: string, rootDirectory?: string): IModule {
                if (_.isUndefined(rootDirectory)) {
                    rootDirectory = this.huisFilesRoot_;
                }
                var moduleDirectory = path.join(rootDirectory, remoteId, "modules");
                if (!fs.existsSync(moduleDirectory)) {
                    console.error(TAGS.HuisFiles + "_parseModule() " + moduleDirectory + " is not found.");
                    return null;
                }
                var modulePath = path.join(moduleDirectory, moduleName + ".module");
                if (!fs.existsSync(modulePath)) {
                    console.error(TAGS.HuisFiles + "_parseModule() " + moduleName + " is not found.");
                    return null;
                }
                var moduleText: string = fs.readFileSync(modulePath, "utf8");
                if (!moduleText) {
                    return null;
                }
                try {
                    // JSON.parse()は失敗すると例外を投げるのでtry-catchで受ける
                    var modulePlain: IModule = JSON.parse(moduleText.replace(/^\uFEFF/, ""));
                } catch (e) {
                    console.error("_parseModule: " + e);
                    console.log(modulePlain);
                }

                if (!modulePlain) {
                    return null;
                }

                return modulePlain;
            }

            public addWaitingResizeImageList(image: IWaitingRisizeImage): boolean {
                this.watingResizeImages_.push(image);
                return true;
            }

            /**
             * リサイズ待機リストの画像をリサイズする。
             */
            private _resizeImages(): IPromise<void> {
                let FUNCTION_NAME = TAGS.HuisFiles + "_resizeImages : ";

                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let resizeImages = this.watingResizeImages_.slice();

                let proc = () => {
                    let resizeImage: IWaitingRisizeImage;
                    if (resizeImages.length <= 0) {
                        this.watingResizeImages_ = [];
                        df.resolve();
                    } else {
                        resizeImage = resizeImages.shift();

                        Model.OffscreenEditor.editImage(resizeImage.src, {
                            resize: resizeImage.params
                        }, resizeImage.dst)
                            .always(() => {
                                setTimeout(proc);
                            }).fail(() => {
                                console.error(FUNCTION_NAME + "editImage is fail");
                                this.watingResizeImages_ = [];
                                df.reject();
                            });
                    }
                };

                setTimeout(proc);

                return promise;
            }

            /**
             * face が参照している module 内で使用されていない画像を削除する
             */
            private _removeUnnecessaryImages(face: Model.Face) {
                let remoteImageDirectory = path.resolve(path.join(HUIS_REMOTEIMAGES_ROOT, face.remoteId)).replace(/\\/g, "/");
                if (!fs.existsSync(remoteImageDirectory)) {
                    return;
                }

                // 指定した remoteId のディレクトリー内のファイルを列挙する
                let fileList = [];
                fs.readdirSync(remoteImageDirectory)
                    .filter((file) => {
                        return fs.statSync(path.join(remoteImageDirectory, file)).isFile();
                    }).forEach((file) => {
                        fileList.push(path.join(remoteImageDirectory, file));
                    });

                // face が参照している module 内で参照されている画像を列挙
                let referredImageFiles = face.getAllImagePaths();

                // 参照されていない画像を削除
                fileList.forEach((file) => {
                    let relativePath = path.relative(HUIS_REMOTEIMAGES_ROOT, file).replace(/\\/g, "/");

                    if (referredImageFiles.indexOf(relativePath) < 0) {
                        console.warn(relativePath + " is not referred.");
                        fs.removeSync(file);
                    }
                });
            }

            isValidJumpSettings(jump: IJump): boolean {
                if (jump == null ||
                    jump.remote_id == null) {
                    return false;
                }

                // remote_id の検査
                let face = this.getFace(jump.remote_id);
                if (face == null ||
                    face.modules == null) {
                    return false;
                }

                // scene_no の検査
                if (jump.scene_no != null &&
                    jump.scene_no >= 0 &&
                    jump.scene_no < face.modules.length) {
                    return true;
                }

                return false;
            }
        }
    }
}
