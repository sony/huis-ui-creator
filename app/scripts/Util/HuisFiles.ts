/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {
        import IPromise = CDP.IPromise;
        //import makePromise = CDP.makePromise;
        //import OffscreenEditor = Model.OffscreenEditor;

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


        /** 信号名に付与されるIDの文字長 */
        const FUNC_ID_LEN: number = 4;

        /** 信号名と連番を分ける区切り文字 */
        const FUNC_NUM_DELIMITER: string = '#';

        /** 信号がフルカスタムで再学習されたことを示すコード */
        const FUNC_CODE_RELEARNED: string = '#';


        /**
         * @class HuisFiles
         * @brief HUIS 内のファイルの parse 等を行うユーティリティークラス
         */
        export class HuisFiles {

            private huisFilesRoot_: string;
            private remoteList_: IRemoteId[];
            private remoteInfos_: IRemoteInfo[];
            private commonRemoteInfo_: IRemoteInfo; //! Common (Label や Image 追加用のもの)
            private watingResizeImages_: IWaitingRisizeImage[];//export時、余計な画像を書き出さないために必要

            constructor() {
                if (!fs) {
                    fs = require("fs-extra");
                }
                if (!path) {
                    path = require("path");
                }
                this.huisFilesRoot_ = undefined;
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
                    let facePath = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces/common/common.face"));
                    console.log("facePath=" + facePath);

                    //// file:/// スキームがついていると fs モジュールが正常に動作しないため、file:/// がついていたら外す
                    let rootDirectory = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/faces"));
                    console.log("rootDirectory=" + rootDirectory);

                    let commonFace = this._parseFace(facePath, remoteId, rootDirectory);
                    this.commonRemoteInfo_ = {
                        remoteId: remoteId,
                        face: commonFace,
                    };
                }

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
             * @return {IGFace} face
             */
            getFace(remoteId: string, master?: boolean): IGFace {
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

            /**
             * 指定した category と「一致する」または「一致しない」face 群を取得する。
             * このメソッドを呼ぶ前に、init() を呼び出す必要がある。
             * 
             * @param condition {Object} [in] 取得したい face 群の category 条件
             * @return {IGFace[]} 指定した category 条件を満たした face 群
             */
            getFilteredFacesByCategories(condition: { matchingCategories?: string[], unmatchingCategories?: string[] }, master?: boolean) {
                if (!this.faces) {
                    return [];
                }

                var faces: IGFace[] = [];
                this.remoteInfos_.forEach((remoteInfo) => {
                    if (master) {
                        faces.push(remoteInfo.mastarFace);
                    } else {
                        faces.push(remoteInfo.face);
                    }
                });

                return faces.filter((face: IGFace) => {
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
             * @param modelNumber {string} 型番。機器によっては省略。
             * @return {string[]} 機能の一覧。取得できない場合は null
             */
            getMasterFunctions(brand: string, deviceType: string, modelNumber?: string): string[];

            getMasterFunctions(param1: string, param2?: string, param3?: string): string[] {
                // param2 が指定されている場合は、param1: メーカー名, param2: カテゴリー, param3: 型番

                if (param2) {
                    let brand = param1,
                        deviceType = param2,
                        modelNumber = param3;

                    return this._getMasterFunctions(this.getRemoteIdByCodeDbElements(brand,deviceType, modelNumber));

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

                    //deviceinfoでみつからない場合、bluetoothの情報で検索
                    if (remoteId == null &&
                        action.bluetooth_data &&
                        action.bluetooth_data.bluetooth_device &&
                        action.deviceInfo &&
                        action.deviceInfo.remoteName != null) {
                        remoteId = this.getRemoteIdByBluetoothDevice(action.bluetooth_data.bluetooth_device, action.deviceInfo.remoteName);
                    }


                    // codebluetoothでみつからない場合、code_dbで検索
                    if (remoteId == null &&
                        action.deviceInfo &&
                        action.deviceInfo.code_db) {
                        let codeDb = action.deviceInfo.code_db;
                        remoteId = this.getRemoteIdByCodeDbElements(codeDb.brand, codeDb.device_type, codeDb.model_number);
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
                if (code == undefined) {
                    console.warn(FUNCTION_NAME + "code is undefined");
                }

                for (let i = 0, l = this.remoteList_.length; i < l; i++) {
                    let remoteId = this.remoteList_[i].remote_id;
                    let face = this.getFace(remoteId);
                    if (!face) {
                        continue;
                    }
                    let codesMaster: string[] = this.getMasterCodes(remoteId);
                    let deviceType = face.category;

                    //サポート外のdeviceTypeだった場合、次のremoteIdへ
                    if (NON_SUPPORT_DEVICE_TYPE_IN_EDIT.indexOf(deviceType) != -1) {
                        continue;
                    }

                    if (codesMaster) {
                        //同一のコードを持つremoteがあった場合そのremoteId
                        for (let j = 0; j < codesMaster.length; j++) {
                            if (code == codesMaster[j] ) {
                                return remoteId;
                            }
                        }
                    }

                }

                return null;
            }

            /**
            * 同じbrand, deviceType, modelNumberをもつリモコンのremoteIdを取得する。
            * @param brand{string} 機器のブランド
            * @param deviceType{string} 機器のタイプ
            * @param modelNumber{string} 機器のモデルナンバー
            * @return remoteId{string}リモコンのID
            */
            getRemoteIdByCodeDbElements(brand, deviceType, modelNumber):string {
                let FUNCTION_NAME = TAGS.HuisFiles + " :getRemoteIdByCodeDb: ";
    
                for (let i = 0, l = this.remoteList_.length; i < l; i++) {
                    let remoteId = this.remoteList_[i].remote_id;
                    let codeDb = this.getMasterCodeDb(remoteId);
                    if (codeDb) {
                        if (codeDb.brand === brand &&
                            codeDb.device_type === deviceType &&
                            (!modelNumber || codeDb.model_number === modelNumber)) {
                            return remoteId;
                        }
                    }
                }

                return null;
            }


            /*
            * deviceInfoの情報から、remoteIdを特定して取得する
            * @param inputDeviceInfo{IButtonDecviceInfo}
            * @return {string} remoteId 見つからない場合、nullを返す。
            */
            getRemoteIdByButtonDeviceInfo(inputDeviceInfo: IButtonDeviceInfo): string {
                let FUNCTION_NAME = TAGS.HuisFiles + "getRemoteIdByButtonDeviceInfo : ";

                if (inputDeviceInfo == null) {
                    console.warn(FUNCTION_NAME + "inputDeviceInfo is null");
                    return null;
                    
                }

                // remtoeNameを取得
                if (inputDeviceInfo.remoteName == null) {
                    console.warn(FUNCTION_NAME + "inputDeviceInfo.remoteName is null");
                    return null;
                }
                let remoteName = inputDeviceInfo.remoteName;



                //bluetooth_dataがある場合
                if (inputDeviceInfo.bluetooth_data != null && 
                    inputDeviceInfo.bluetooth_data.bluetooth_device != null) {
                    return this.getRemoteIdByBluetoothDevice(inputDeviceInfo.bluetooth_data.bluetooth_device, remoteName);
                }


                if (inputDeviceInfo.code_db == null) {
                    console.warn(FUNCTION_NAME + "inputDeviceInfo.code_db is null");
                    return;
                }
                let codeDb = inputDeviceInfo.code_db;

                //brandを取得
                if (codeDb.brand == null) {
                    console.warn(FUNCTION_NAME + "codeDb.brand is null");
                    return;
                }
                let brand = codeDb.brand;

                //deviceTypeを取得
                if (codeDb.device_type == null) {
                    console.warn(FUNCTION_NAME + "codeDb.device_type is null");
                    return;
                }
                let deviceType = codeDb.device_type;

                //codesetを取得
                if (codeDb.db_codeset == null) {
                    console.warn(FUNCTION_NAME + "codeDb.db_codeset is null");
                    return;
                }
                let codeset = codeDb.db_codeset;

                //model_numberを取得
                if (codeDb.model_number == null) {
                    console.warn(FUNCTION_NAME + "codeDb.model_number is null");
                    return;
                }
                let modelNumber = codeDb.model_number;
                
                for (let i = 0, l = this.remoteInfos_.length; i < l; i++) {
                    let targetRemoteId = this.remoteInfos_[i].remoteId;
                    let targetRemoteName = this.remoteInfos_[i].face.name;
                    let codeDb = this.getMasterCodeDb(targetRemoteId);
                    if (codeDb) {
                        if (codeDb.brand === brand &&
                            codeDb.device_type === deviceType &&
                            (!modelNumber || codeDb.model_number === modelNumber) &&
                            remoteName == targetRemoteName) {
                            return targetRemoteId;
                        }
                    }
                }
            }



            


            /**
             * 該当するBluetooth機器を持つリモコンのremoteIdを取得する。
             * @param bluetoothDevice {IBluetoothDevice} Bluetooth機器情報
             * @param remoteName{string} リモコン名
             * @return {string} リモコンのID。該当リモコンが存在しない場合はnull。
             */
            getRemoteIdByBluetoothDevice(bluetoothDevice: IBluetoothDevice, remoteName : string): string {
                let FUNCTION_NAME = TAGS.HuisFiles + " :getRemoteIdByBluetoothDevice: ";

                if (bluetoothDevice == null) {
                    console.warn(FUNCTION_NAME + "bluetoothDevice is null");
                    return null;
                }

                if (remoteName == null) {
                    console.warn(FUNCTION_NAME + "remoteName is null");
                    return null;
                }

                for (let i = 0, l = this.remoteInfos_.length; i < l; i++) {
                    let targetRemoteId = this.remoteInfos_[i].remoteId;
                    let targetRemoteName = this.remoteInfos_[i].face.name;
                    let bluetoothData = this.getMasterBluetoothData(targetRemoteId);
                    if (bluetoothData &&
                        bluetoothData.bluetooth_device &&
                        bluetoothData.bluetooth_device.bluetooth_address === bluetoothDevice.bluetooth_address &&
                        remoteName == targetRemoteName
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
            private getMasterCodes(remoteId: string): string[] {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " :getMasterCode: ";
                if (remoteId == undefined) {
                    console.warn(FUNCTION_NAME + "remoteId is undefined");
                    return;
                }

                let masterFace = this._getFace(remoteId, true);
                if (!masterFace) {
                    console.warn(TAGS.HuisFiles + "getMasterCode() masterFace is not found.");
                    return null;
                }

                let resultCodes: string[] = [];

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

            private _getMasterFunctions(remoteId: string): string[] {
                let masterFace = this._getFace(remoteId, true);
                return HuisFiles.getFunctions(masterFace);
            }

            public getFaceFunctions(remoteId: string): string[] {
                let face = this._getFace(remoteId, false);
                return HuisFiles.getFunctions(face);
            }

            private static getFunctions(face: IGFace): string[] {
                if (!face) {
                    //console.warn(TAGS.HuisFiles + "getMasterFunctions() masterFace is not found.");
                    return null;
                }

                //var functions: string[] = [];
                let functionCodeHash: IStringStringHash = {};
                let faceModules = face.modules;

                var getFunctions_modules = function (modules: IModule[], functionCodeHash: IStringStringHash) {
                    if (!_.isArray(modules)) {
                        return;
                    }

                    modules.forEach((module: IModule) => {
                        let buttons = module.button;
                        getFunctions_buttons(buttons, functionCodeHash);
                    });

                };

                var getFunctions_buttons = function (buttons: IButton[], functionCodeHash: IStringStringHash) {
                    if (!_.isArray(buttons)) {
                        return;
                    }

                    buttons.forEach((button: IButton) => {
                        let states = button.state;
                        getFunctions_states(states, functionCodeHash);
                    });
                };

                var getFunctions_states = function (states: IState[], functionCodeHash: IStringStringHash) {
                    if (!_.isArray(states)) {
                        return;
                    }

                    states.forEach((state: IState) => {
                        let actions = state.action;
                        getFunctions_actions(actions, functionCodeHash);
                    });
                };

                var getFunctions_actions = function (actions: IAction[], functionCodeHash: IStringStringHash) {
                    let FUNCTION_NAME = TAGS + ": getFunctions_actions : ";

                    if (!_.isArray(actions)) {
                        return;
                    }

                    actions.forEach((action: IAction) => {
                        let code_db = action.code_db;
                        let code = action.code;
                        if (code_db && code_db.function) {

                            if (code != null && code != undefined && code != " ") {
                                //学習によって登録された用 codeがある場合
                                functionCodeHash[code_db.function] = action.code;
                            } else if (code_db.db_codeset != " " || code_db.brand != " " || action.bluetooth_data) {
                                //プリセット用 db_codeset と brand が空白文字で。
                                functionCodeHash[code_db.function] = "";
                            } else {
                                //db_codeset と brand もなく codeも空の場合. 学習して登録で、 学習されなかったボタンたちはここにはいる。
                                //console.warn(FUNCTION_NAME + "invalid code / codedb. action : " + action);
                            }
                        } else {
                            console.warn(FUNCTION_NAME + "invalid code_db / codedb.function action : " + action);
                        }

                         
                    });

                };

                // module にあるすべてのボタンの機能を取得する
                getFunctions_modules(faceModules, functionCodeHash);


                return Object.keys(functionCodeHash);
            }

            /**
             * 機器の master face に記述されている最初の code_db を取得する。
             * 取得した code_db は、機器の「ブランド」、「種類」等の情報のために使用されることを想定している。
             * 
             * @param remoteId {string} リモコンの remoteId
             * @return {ICodeDB} master face に記述されている最初の code_db。見つからない場合は null。
             */
            getMasterCodeDb(remoteId: string): ICodeDB {
                let masterFace = this._getFace(remoteId, true);
                if (!masterFace) {
                    console.warn(TAGS.HuisFiles + "getMasterCodeDb() masterFace is not found.");
                    return null;
                }

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
                                var codeDb = actions[l].code_db;
                                if (codeDb) {
                                    return $.extend(true, {}, codeDb);
                                }
                            }
                        }
                    }
                }

                return null;
            }

            /*
            * 機器の master face に記述されている最初の codeのうち、FuncitonNameが一致しているものを取得する。
            * @param remoteId : string リモコンの remoteId
            * @return functionのIDとcodenの対応表を返す
            */
            getMasterFunctionCodeMap(remoteId: string): IStringStringHash{
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

                let face: IGFace = this._getFace(remoteId, isMaster);
                if (!face) {
                    console.warn(TAGS.HuisFiles + "getMasterCodeDb() masterFace is not found.");
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
             * @param modules {IGModule[]}
             * @return {IStringSringHash}
             */
            private static getFunctionCodeMapByModules(modules: IGModule[]): IStringStringHash {
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
                                let learningCode = actions[l].code;
                                let functionName = actions[l].code_db.function;
                                if ((learningCode != null && learningCode != undefined && learningCode != " ") &&
                                    (functionName != null && functionName != undefined && functionName != " ")) {

                                    result[functionName] = learningCode;
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

                return HuisFiles.findFunctionKeyByFunctionName(funcName, code, functionCodeHash, false);
            }

            /**
             * 渡された信号名：信号の情報から設定すべき信号名を取得
             *
             * @param funcName {string} 対象信号名
             * @param code {string} 信号
             * @param funcCoeHash {IStringStringHash} 
             * @param continueNumbering {boolean} 連番を付与するかどうか
             * @return {string}
             */
            private static findFunctionKeyByFunctionName(funcName: string, code: string, funcCodeHash: IStringStringHash, continueNumbering: boolean): string {
                if (funcCodeHash == null || Object.keys(funcCodeHash).length <= 0) {
                    return funcName;
                }

                if (funcName in funcCodeHash) {
                    for (let key in funcCodeHash) {
                        if (HuisFiles.getPlainFunctionKey(key) === funcName &&
                            funcCodeHash[key] === code) {
                            // 既存codeと一致したらその信号名を返す
                            return key;
                        }
                    }

                    if (continueNumbering) {
                        // 連番を付与
                        return HuisFiles.createFunctionKeyName(funcName, Object.keys(funcCodeHash));
                    } else {
                        // そのボタンに再学習された信号として特殊コードを付与
                        return funcName + FUNC_NUM_DELIMITER + FUNC_CODE_RELEARNED;
                    }
                } else {
                    // 基ボタン消失
                    return funcName;
                }
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
             * 既存の信号名リストに対して対象信号を追加する際の信号名を生成
             *
             * @param functionName {string} 基にする信号名
             * @param keys {string[]} 既存の信号名リスト
             * @return {string} 追加すべき信号名
             */
            private static createFunctionKeyName(functionName: string, keys: string[]): string {
                if (keys.indexOf(functionName) < 0) {
                    // 新規の信号
                    return functionName;
                }

                // 既存信号なので連番を付与
                let i = 0;
                while (true) {
                    let numberedName = functionName + FUNC_NUM_DELIMITER + i++;

                    if (keys.indexOf(numberedName) < 0) {
                        return numberedName;
                    }
                }

            }

            /**
             * 機器の master face に記述されている最初の bluetooth_data を取得する。
             *
             * @param remoteId {string} リモコンの remoteId
             * @return {ICodeDB} master face に記述されている最初の bluetooth_data。見つからない場合は null。
             */
            getMasterBluetoothData(remoteId: string): IBluetoothData {
                let masterFace: IGFace = this._getFace(remoteId, true);
                if (!masterFace) {
                    console.warn(TAGS.HuisFiles + "getMasterCodeDb() masterFace is not found.");
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
            getCommonFace(): IGFace {
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
            getSupportedRemoteInfo(): IRemoteInfo[]{
                let FUNCTION_NAME = TAGS.HuisFiles + "getRemoteNameList :";

                if (this.remoteInfos_.length == 0) {
                    console.warn(FUNCTION_NAME + "remoteInfos_.length is 0");
                    return;
                }

                let result :IRemoteInfo[] = [];

                for (let i = 0; i < this.remoteInfos_.length; i++){
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

            /*
            * remoetIdをつかいIDeviceInfoを取得する。ただし、functionはnoneとする
            */
            getDeviceInfo(remoteId): IButtonDeviceInfo {
                let FUNCTION_NAME = TAGS.HuisFiles + "getDevieInfo:";

                if (remoteId == null) {
                    console.warn(FUNCTION_NAME + "remoteId is null");
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
            getNumVariableRemote(): number{
                let FUNCTION_NAME = TAGS + " : getNumVariableRmote : ";
                if (this.remoteInfos_ == undefined) {
                    console.warn(FUNCTION_NAME + "remoteInfos_ is undefined");
                    return 0;
                }

                if (this.remoteInfos_.length == 0) {
                    return 0;
                }

                let result = 0;

                for (let i: number = 0; i < this.remoteInfos_.length; i++){
                    //サポートされているdevice_type場合、result + 1
                    if (this.remoteInfos_[i].face){
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
                    .sort(function (val1:IRemoteId, val2:IRemoteId) {
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
                } else if (sortedRemoteId.length > 1){
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
             * @param remoteId {string} 更新または新規作成する face の remote ID
             * @param faceName {string} 更新または新規作成する face の名前 
             * @param gmodules {IGModule[]} face 内で参照する module のデータ
             * @param isToImportExport {bollean} importExport用に使われる場合true
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            updateFace(remoteId: string, faceName: string, gmodules: IGModule[], cache: ButtonDeviceInfoCache, isToImportExport: boolean = false, outputDirPath? : string): IPromise<void> {
                let FUNCTION_NAME = TAGS.HuisFiles + "updateFace : ";

                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                var moduleCount = gmodules.length;
                let modules: IModule[] = [];
                var moduleNames: string[] = [];
                // module ファイルの更新
                for (let i = 0; i < moduleCount; i++) {
                    let moduleInfo = this._updateModule(remoteId, gmodules[i], outputDirPath);
                    modules.push(moduleInfo.module);
                    moduleNames.push(moduleInfo.name);
                }

                // face ファイルの更新
                var face: IPlainFace = {
                    name: faceName,
                    category: "fullcustom",
                    modules: moduleNames
                };


                var faceFilePath = path.join(this.huisFilesRoot_, remoteId, remoteId + ".face");

                //ファイルパスの指定がある場合、書き出し先を変更する。
                if (outputDirPath != null) {
                    faceFilePath = path.join(outputDirPath, remoteId, remoteId + ".face");
                }

                fs.outputJSONSync(faceFilePath, face, { spaces: 2 });

                // サイズ変更を行った画像を一括でリサイズする
                this._resizeImages().always(() => {
                    // 不要な画像を削除
                    if (!isToImportExport) {
                        this._removeUnnecessaryImages(remoteId, modules);
                    }
    
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
                    ButtonDeviceInfoCache.injectAllDeviceInfoFromHuisFiles(gmodules);
                    cache.save(gmodules);
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
                //for (let i = remoteListLength - 1; i >= 0; i--) {
                //    remoteListIniFile += i + "=" + remoteList[i].remote_id + "\n";     // 逆順に ∵ HUISでの表示順序は上から新しい順なので
                //}
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
                        case REMOTE_IMAGES_DIRRECOTORY_NAME:
                        case "lost+found":
                        case "9999": // "9999" (special face) の扱いをどうするか要検討
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
             * module ファイルを更新する。
             * 指定された module が存在しない場合は、新規作成する。
             * 返却される module は、HUIS ファイルに書き込むためにノーマライズされたもの。
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            private _updateModule(remoteId: string, gmodule: IGModule, outputDirPath ? :string): {module: IModule, name: string} {
                // IGModule に格納されているデータから、.module ファイルに必要なものを抽出する

                
                var module: IModule = {
                    area: gmodule.area
                };

                let versionString: string = this.getModuleVersion(gmodule);
                if(versionString != null){
                    module = {
                        version: versionString,
                        area: gmodule.area,
                    };
                }

                if (gmodule.button) {
                    module.button = this._normalizeButtons(gmodule.button, remoteId, outputDirPath);
                }
                if (gmodule.image) {
                    module.image = this._normalizeImages(gmodule.image, remoteId, outputDirPath);
                }
                if (gmodule.label) {
                    module.label = this._normalizeLabels(gmodule.label);
                }

                var moduleFilePath = path.join(this.huisFilesRoot_, remoteId, "modules", gmodule.name + ".module");

                //ファイルパスの指定がある場合、書き出し先を変更する。
                if (outputDirPath != null) {
                    moduleFilePath = path.join(outputDirPath, remoteId, "modules", gmodule.name + ".module");
                }


                fs.outputJSONSync(moduleFilePath, module, { spaces: 2 });

                return {
                    name: gmodule.name,
                    module: module
                };
            }

            /*
            * gmoduleの構成要素(button,label,image)のバージョンから、最も古いバージョンを返す。
            * @param gModule : IGModule バージョン情報を内在した構成要素をもつGarageないで使われていたモジュール
            * @return oldestVersionString : string gModule内のもっとも古いバージョン情報。１つもバージョン情報を持ってない場合、nullを返す。
            */
            private getModuleVersion(gModule: IGModule) :string{
                let FUNCTION_NAME: string = TAGS.HuisFiles + " : getModuleVersion : ";

                if (gModule == undefined) {
                    console.warn(FUNCTION_NAME + "gModule is undefined");
                    return null;
                }

                let versions: Model.VersionString[] = this.getVersions(gModule.button, gModule.image, gModule.label);
                let oldestVersion: Model.VersionString= this.getOldestVersionOf(versions);

                if (oldestVersion != null) {
                    let oldestVersionString: string = oldestVersion.getVersionString();
                    return oldestVersionString;
                } else {
                    return null;
                }

            }

            /*
            * 入力された　最も古いバージョン情報値:string を返す
            * @param versions : string[]
            * return :string 最古のボタンバージョン
            */
            private getOldestVersionOf(versions: Model.VersionString[]): Model.VersionString {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " : getOldestVersionOfGButton : ";

                if (versions == undefined) {
                    console.warn(FUNCTION_NAME + "versions is undefined");
                    return;
                }

                let oldestVersion: Model.VersionString= null;

                for (let i = 0; i < versions.length; i++){
                    oldestVersion = this.getOlderVersionOf(oldestVersion, versions[i]);
                }

                return oldestVersion;
            }

            /*
            * IGButton, IGLabel, IGImageからバージョン情報を抽出する。
            * @param buttons ? : IGButtons
            * @param imagess ? : IGImages
            * @param labels ? : IGLabels
            * return 入力オブジェクトから集めたのバージョン情報の配列 : string[]
            */
            private getVersions(buttons?: IGButton[], images?: IGImage[], labels?: IGLabel[]): Model.VersionString[] {
                let FUNCTION_NAME: string = TAGS.HuisFiles + " : getVersions : ";
                if (!buttons && !images && !labels) {
                    console.warn(FUNCTION_NAME + "no inputs");
                    return;
                }
                let result: Model.VersionString[] = [];

                if (buttons) {
                    for (let i = 0; i < buttons.length; i++){
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
                let FUNCTION_NAME: string = TAGS.HuisFiles + " : getOlderVersion : ";

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


            /**
             * Button データから module 化に不要なものを間引く
             * @param outputDirPath? {string} faceファイルの出力先のディレクトリを指定したい場合入力する。
             */
            private _normalizeButtons(buttons: IGButton[], remoteId: string, outputDirPath?:string): IButton[] {
                var normalizedButtons: IButton[] = [];

                for (let i = 0, l = buttons.length; i < l; i++) {
                    let button: IGButton = buttons[i];
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
            private _normalizeButtonStates(states: IGState[], remoteId: string, outputDirPath? :string): IState[] {
                var normalizedStates: IState[] = [];

                states.forEach((state: IGState) => {
                    let normalizedState: IState = {
                        id: state.id
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
                            function: (action.code_db.function) ? HuisFiles.getPlainFunctionKey(action.code_db.function) : "none",
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
            private _normalizeImages(images: IGImage[], remoteId: string, outputDirPath? :string ): IImage[] {
                var normalizedImages: IImage[] = [];

                images.forEach((image) => {
                    //let image: IGImage = images[i];
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
                            newDirPath = path.join(outputDirPath, remoteId, REMOTE_IMAGES_DIRRECOTORY_NAME).replace(/\\/g, "/");;
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
                        this.watingResizeImages_.push({
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

            private _getFace(remoteId: string, isMaster: boolean): IGFace {
                if (!_.isArray(this.remoteInfos_)) {
                    return null;
                }

                // Commonの場合はMasterFaceがないので、faceを返す。
                if (remoteId == "common") {
                    return this.commonRemoteInfo_.face;
                }


                // 指定した remoteId の情報を取得する
                var targetRemoteInfos = this.remoteInfos_.filter((remoteInfo) => {
                    if (remoteInfo.remoteId === remoteId) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (!_.isArray(targetRemoteInfos) || targetRemoteInfos.length < 1) {
                    return null;
                }

                var face = isMaster ? targetRemoteInfos[0].mastarFace : targetRemoteInfos[0].face;
                if (!face) {
                    return null;
                }
                return face;
            }

            /**
             * getter
             */
            get remoteList(): IRemoteId[]{
                return this.remoteList_.filter((val: IRemoteId) => {
                    return (val.remote_id !== "9999");
                });
            }

            get faces(): IGFace[]{
                if (!_.isArray(this.remoteInfos_)) {
                    return null;
                }
                // remoteInfos から faces 情報を取り出す
                var faces: IGFace[] = [];
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
                    let face: IGFace = this._parseFace(facePath, remoteId);
                    let masterFace: IGFace = this.parseFaceWithNumberingFuncName(masterFacePath, remoteId);

                    if (masterFace != undefined && remoteId != undefined) {
                        let face: IGFace = this._parseFace(facePath, remoteId);

                        if (face != undefined) {
                            // MastarFaceの連番付き信号名をFaceに反映
                            HuisFiles.applyNumberedFunctionNameByModule(face.modules, masterFace.modules);

                            remoteInfos.push({
                                remoteId: remoteId,
                                face: face,
                                mastarFace: masterFace
                            });
                        }
                    } else {
                        // Masterが無い場合はFace自体で連番作成
                        let face: IGFace = this.parseFaceWithNumberingFuncName(facePath, remoteId);

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
             * 指定したパスの master face を読み込む
             *
             * @param facePath {string}
             * @param remoteId {string}
             * @param rootDirectory {string}
             * @return {IGFace}
             */
            parseFaceWithNumberingFuncName(facePath: string, remoteId: string, rootDirectory?: string): IGFace {
                let master: IGFace = this._parseFace(facePath, remoteId, rootDirectory);

                if (master != null && master.modules != null) {
                    HuisFiles.numberFunctionNameInModules(master.modules);
                }

                return master;
            }

            /**
             * 指定したパスの face を parse する
             */
            _parseFace(facePath: string, remoteId: string, rootDirectory?: string): IGFace {
                // face ファイルを読み込む
                if (!fs.existsSync(facePath)) {
                    //console.warn(TAGS.HuisFiles + "_parseFace() " + facePath + " is not found.");
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

                var face: IGFace = {
                    remoteId: remoteId,
                    name: plainFace.name,
                    category: plainFace.category,
                    modules: []
                };

                // モジュール名に対応する .module ファイルから、モジュールの実体を引く
                for (var i = 0, l = plainFace.modules.length; i < l; i++) {
                    var moduleName: string = plainFace.modules[i];
                    var module: IModule = this._parseModule(moduleName, remoteId, rootDirectory);
                    if (module) {
                        //let gmodule: IGModule = $.extend(true, { offsetY: 0, remoteId: remoteId, name: moduleName }, module);
                        let gmodule: IGModule = {
                            offsetY: 0,
                            remoteId: remoteId,
                            name: moduleName,
                            area: $.extend(true, {}, module.area),
                            pageIndex: 0
                        };
                        if (module.button) {
                            // [TODO] button.state.image.garage_extensions 対応
                            //gmodule.button = $.extend(true, [], module.button);
                            gmodule.button = this._buttons2gbuttons(module.button);
                            this.setVersionInfoToIGButton(module, gmodule.button);
                        }
                        if (module.image) {
                            gmodule.image = this._images2gimages(module.image);
                            this.setVersionInfoToIGImage(module, gmodule.image);
                        }
                        if (module.label) {
                            gmodule.label = $.extend(true, [], module.label);
                            this.setVersionInfoToIGLabel(module, gmodule.label);
                        }
                        face.modules.push(gmodule);
                    }
                }

                //フルカスタムリモコンのモジュールがJsonが壊れるなどして、mosduleファイルが0個のとき、空のModuleFileを用意する
                if (plainFace.category == DEVICE_TYPE_FULL_CUSTOM &&
                    face.modules.length == 0) {

                    let gmodule: IGModule = {
                        offsetY: 0,
                        pageIndex: 0,
                        remoteId: remoteId,
                        area: {
                            x: 0,
                            y: 0,
                            w: HUIS_FACE_PAGE_WIDTH,
                            h: HUIS_FACE_PAGE_HEIGHT
                        },
                        name: remoteId + "_page_0" // 暫定
                    }
                    face.modules.push(gmodule);
                }

                return face;
            }

            /**
             * モジュール内において同一信号名にもかかわらず異なる信号が設定されているものに連番を付与する
             *
             * @param modules {IGModule[]} 検査対象モジュール
             */
            private static numberFunctionNameInModules(modules: IGModule[]) {
                let functionCodeHash: IStringStringHash = {};

                for (let mod of modules) {
                    if (mod.button == null) continue;
                    for (let button of mod.button) {
                        if (button.state == null) continue;
                        for (let state of button.state) {
                            if (state.action == null) continue;
                            for (let action of state.action) {
                                if (action.code == null ||
                                    action.code === "" ||
                                    action.code_db == null) continue;

                                if (!(action.code_db.function in functionCodeHash)) {
                                    functionCodeHash[action.code_db.function] = action.code;
                                } else if (functionCodeHash[action.code_db.function] != action.code) {
                                    let numberedFunc = HuisFiles.createFunctionKeyName(action.code_db.function, Object.keys(functionCodeHash));

                                    action.code_db.function = numberedFunc;
                                    functionCodeHash[numberedFunc] = action.code;
                                }
                                    
                            }
                        }
                    }
                }
            }

            /**
             * HuisFiles内の信号名を対象モジュールに反映する
             *
             * @param modules {IGModule[]}
             */
            public applyNumberedFunctionName(modules: IGModule[]) {

                for (let mod of modules) {
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

                                let remoteId = this.getRemoteIdByAction(action);
                                if (remoteId == null) continue; // 基リモコンなし

                                let newFuncName = this.findFunctionKeyInHuisFilesByFunctionName(action.code_db.function, action.code, remoteId);
                                action.code_db.function = newFuncName;
                            }
                        }
                    }
                }
            }

            /**
             * 信号名をキャッシュから取得し設定
             *
             * @param modules {IGModule[]} 更新対象のアイテムおよびキャッシュを含むモジュール
             */
            public applyCachedFunctionName(modules: IGModule[]) {
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

                                let remoteId = this.getRemoteIdByAction(action);
                                if (this.remoteList.filter((remote) => { return remote.remote_id == remoteId }).length > 0) {
                                    // 基リモコンが存在する場合はそちらを優先するため、ここでは信号名を更新しない
                                    continue;
                                }

                                let existFunc = false;
                                let funcCodeHash = action.deviceInfo.functionCodeHash;
                                for (let funcName of Object.keys(funcCodeHash)) {
                                    if (funcCodeHash[funcName] == action.code) {
                                        action.code_db.function = funcName;
                                        existFunc = true;
                                        break;
                                    }
                                }

                                if (!existFunc) {
                                    // 基リモコン無し && キャッシュにも存在しなかった場合はIDを振る
                                    action.code_db.function = HuisFiles.getPlainFunctionKey(action.code_db.function) + FUNC_NUM_DELIMITER + this.createHashBySignalCode(action.code);
                                }
                            }
                        }
                    }
                }
            }

            /**
             * 対象モジュール内の信号名を基モジュール内にある信号名に合わせる
             *
             * @param target {IGModule[]} 更新対象を含むモジュール
             * @param original {IGModule[]} 基にするモジュール
             */
            private static applyNumberedFunctionNameByModule(target: IGModule[], original: IGModule[]) {
                let originalHash = HuisFiles.getFunctionCodeMapByModules(original);
                if (originalHash == null ||
                    Object.keys(originalHash).length < 1) {
                    return;
                }
                
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

                                let newFuncName = HuisFiles.findFunctionKeyByFunctionName(action.code_db.function, action.code, originalHash, true);
                                action.code_db.function = newFuncName;
                            }
                        }
                    }
                }
            }


            /**
             * 信号コードからIDとなるハッシュ値を生成
             *
             * @param code {string} 基にする信号
             * @return {string} 生成したハッシュ値
             */
            private createHashBySignalCode(code: string): string {
                const hash = node_crypt.createHash('sha1');
                hash.update(code, 'utf8');

                return parseInt(hash.digest('hex'), 16)
                    .toString(36)
                    .toUpperCase()
                    .substring(0, FUNC_ID_LEN);
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
                    let plainName = Util.HuisFiles.getPlainFunctionKey(func);
                    if (plainName != func) {
                        // 連番付き
                        let numCode = func.substring(func.indexOf(FUNC_NUM_DELIMITER) + 1);
                        if (numCode == FUNC_CODE_RELEARNED) {
                            // フルカスタム再学習ボタン（基リモコン有り）
                            translatedFuncs.push({
                                key: func,
                                label: $.i18n.t('button.function.' + plainName) + $.i18n.t('button.function.STR_REMOTE_BTN_LEARNED')
                            });
                        } else if (numCode.length == FUNC_ID_LEN) {
                            // 基リモコンなし＋フルカスタム再学習＋信号名重複（ID:XXXX）
                            translatedFuncs.push({
                                key: func,
                                label: $.i18n.t('button.function.' + plainName) + ' (' + $.i18n.t('button.function.STR_REMOTE_BTN_ID') +':' + numCode + ')'
                            });
                        } else {
                            // 連番
                            let num = Number(numCode) + 2;
                            translatedFuncs.push({
                                key: func,
                                label: $.i18n.t('button.function.' + plainName) + ' (' + num + ')'
                            });
                        }

                        if (numberedFuncs.indexOf(plainName) < 0) {
                            // 連番付きの信号名のオリジナルを記憶しておく
                            numberedFuncs.push(plainName);
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


            /*
            * モジュールにバージョン情報がある場合、Imageにその情報を引き継がせる
            * @param module :IModule 参照元のモジュール
            * @param gImages :IGImage[] 代入先のモジュール
            */
            private setVersionInfoToIGImage(iModule: IModule, gImages: IGImage[]) {
                let FUNCTION_NAME = TAGS.HuisFiles + " : setVersionInfoToIGIMage : ";

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
            
                for (let i = 0; i < gImages.length; i++){
                    gImages[i].version = iModule.version;
                }
            }


            /*
            * モジュールにバージョン情報がある場合、Buttonにその情報を引き継がせる
            * @param module :IModule 参照元のモジュール
            * @param gButtons :IGButton[] 代入先のモジュール
            */
            private setVersionInfoToIGButton(iModule: IModule, gButtons: IGButton[]) {
                let FUNCTION_NAME = TAGS.HuisFiles + " : setVersionInfoToIGButton : ";

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
                let FUNCTION_NAME = TAGS.HuisFiles + " : setVersionInfoToIGLabel : ";

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
             * module リストから使用している画像パスをすべて取得する
             */
            private _getImagePathsReferredInModules(modules: IModule[]): string[] {
                let results: string[] = [];
                if (!modules || !_.isArray(modules)) {
                    return [];
                }

                modules.forEach((module) => {
                    results = results.concat(this._getImagePathsReferredInModule(module));
                });

                return results;
            }

            /**
             * 指定したモジュール内で使用されている画像のパスを列挙する
             */
            private _getImagePathsReferredInModule(module: IModule): string[] {
                let results: string[] = [];
                if (!module || !_.isObject(module)) {
                    return[];
                }

                if (module.image) {
                    results = results.concat(this._getImagePathsReferredInImages(module.image));
                }
                if (module.button) {
                    results = results.concat(this._getImagePathsReferredInButtons(module.button));
                }

                return results;
            }

            /**
             * 指定したボタン内で使用されている画像のパスを列挙する
             */
            private _getImagePathsReferredInButtons(buttons: IButton[]): string[] {
                let results: string[] = [];
                if (!buttons || !_.isArray(buttons)) {
                    return [];
                }

                buttons.forEach((button) => {
                    if (button.state) {
                        results = results.concat(this._getImagePathsReferredInButtonStates(button.state));
                    }
                });

                return results;
            }

            /**
             * 指定したボタンの状態で使用されている画像のパスを列挙する
             */
            private _getImagePathsReferredInButtonStates(states: IState[]): string[] {
                let results: string[] = [];
                if (!states || !_.isArray(states)) {
                    return [];
                }

                states.forEach((state) => {
                    if (state.image) {
                        results = results.concat(this._getImagePathsReferredInImages(state.image));
                    }
                });
                return results;
            }

            /**
             * 指定した画像アイテム内で使用されている画像のパスを列挙する
             */
            private _getImagePathsReferredInImages(images: IImage[]): string[] {
                let results: string[] = [];
                if (!images || !_.isArray(images)) {
                    return [];
                }

                images.forEach((image) => {
                    if (image) {
                        if (_.isString(image.path)) {
                            results.push(image.path);
                        }
                        let garage_extensions = image.garage_extensions;
                        if (garage_extensions) {
                            if (_.isString(garage_extensions.original)) {
                                results.push(garage_extensions.original);
                            }
                        }
                    }

                });

                return results;
            }

            /**
             * face が参照している module 内で使用されていない画像を削除する
             */
            private _removeUnnecessaryImages(remoteId: string, modules: IModule[]) {
                //let remoteimagesDirectory = path.resolve(path.join(HUIS_FILES_ROOT, "remoteimages")).replace(/\\/g, "/");
                let remoteImageDirectory = path.resolve(path.join(HUIS_REMOTEIMAGES_ROOT, remoteId)).replace(/\\/g, "/");
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
                let referredImageFiles = this._getImagePathsReferredInModules(modules);

                // 参照されていない画像を削除
                fileList.forEach((file) => {
                    let relativePath = path.relative(HUIS_REMOTEIMAGES_ROOT, file).replace(/\\/g, "/");

                    if (referredImageFiles.indexOf(relativePath) < 0) {
                        console.warn(relativePath + " is not referred.");
                        fs.removeSync(file);
                    }
                });
            }
        }
    }
}