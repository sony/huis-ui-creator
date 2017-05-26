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
    export module Util {

        export const FILE_NAME_BUTTON_DEVICE_INFO_CACHE = "_buttondeviceinfo.cache";

        export class ButtonDeviceInfoCache {

            private filePath: string;

            constructor(huisFilesRoot: string, remoteId: string) {

                this.filePath = path.join(huisFilesRoot, remoteId, remoteId + FILE_NAME_BUTTON_DEVICE_INFO_CACHE);
            }

            /**
             * キャッシュファイルを読み込み、渡されたmoduleに設定
             */
            load(modules: Model.Module[]) {

                if (!fs.existsSync(this.filePath)) {
                    console.log("buttondeviceinfo.cache not found: " + this.filePath);
                    return;
                }

                let buttonDeviceInfoCache: IButtonDeviceInfo[];
                try {
                    buttonDeviceInfoCache = fs.readJSONSync(this.filePath);
                } catch (e) {
                    console.error("failed to read buttondeviceinfo.cache: " + e);
                    return;
                }

                for (let module of modules) {
                    if (!module.button) continue;

                    for (let button of module.button) {
                        if (!button.area || !button.state) continue;

                        for (let stateIndex = 0; stateIndex < button.state.length; stateIndex++) {
                            if (!button.state[stateIndex].action) continue;

                            for (let actionIndex = 0; actionIndex < button.state[stateIndex].action.length; actionIndex++) {
                                let cache = this.find(buttonDeviceInfoCache, module.pageIndex, button.area.x, button.area.y, stateIndex, actionIndex);

                                if (cache) {
                                    // 参照を直接更新
                                    button.state[stateIndex].action[actionIndex].deviceInfo = cache;
                                }
                            }
                        }
                    }
                }

            }

            /**
             * 全てのモジュールに対してHuisFilesから検索したDeviceInfoを設定する
             * @param modules {Model.Module[]} 対象とするモジュールオブジェクト
             */
            static injectAllDeviceInfoFromHuisFiles(modules: Model.Module[]) {
                for (let module of modules) {
                    if (!module.button) continue;

                    for (let button of module.button) {
                        if (!button.state) continue;

                        for (let stateIndex = 0; stateIndex < button.state.length; stateIndex++) {
                            let tmpState = button.state[stateIndex];
                            if (!tmpState.action) continue;

                            for (let actionIndex = 0; actionIndex < tmpState.action.length; actionIndex++) {
                                let tmpAction = tmpState.action[actionIndex];
                                if (tmpAction.deviceInfo && tmpAction.deviceInfo.functions) continue;

                                let deviceInfo = ButtonDeviceInfoCache.createDeviceInfo(
                                    module.pageIndex,
                                    module.area.x,
                                    module.area.y,
                                    stateIndex,
                                    actionIndex,
                                    tmpAction);

                                if (deviceInfo) {
                                    tmpAction.deviceInfo = deviceInfo;
                                }
                            }
                        }
                    }
                }
            }

            /**
             * 渡されたページ番号、x座標、y座標、stateインデックス番号、actionインデックス番号から一致するIButtonDeviceInfoを返却
             * 一致するものが無い場合はnullを返却
             */
            private find(cache: IButtonDeviceInfo[], page: number, x: number, y: number, stateIndex: number, actionIndex: number): IButtonDeviceInfo {
                for (let buttonDeviceInfo of cache) {
                    let searchId: string = ButtonDeviceInfoCache.createId(page, x, y, stateIndex, actionIndex);

                    if (buttonDeviceInfo.id === searchId) {
                        return buttonDeviceInfo;
                    }
                }

                return null;
            }


            /**
             * ButtonDeviceInfoCacheのIDを生成
             * @param page        {number} ボタンのあるページ番号
             * @param x           {number} ボタンのx座標
             * @param y           {number} ボタンのy座標
             * @param stateIndex  {number} stateのインデックス番号
             * @param actionIndex {number} actionのインデックス番号
             * @return IDの文字列
             */
            private static createId(page: number, x: number, y: number, stateIndex: number, actionIndex: number): string {
                return page + "-" + x + "-" + y + "-" + stateIndex + "-" + actionIndex;
            }


            /**
             * ボタンのデバイス情報オブジェクトを生成する
             * 生成に失敗した場合は null を返す
             *
             * @param page        {number}  ボタンのあるページ番号
             * @param x           {number}  ボタンのx座標
             * @param y           {number}  ボタンのy座標
             * @param stateIndex  {number}  stateのインデックス番号
             * @param actionIndex {number}  actionのインデックス番号
             * @param action      {IAction} actionオブジェクト
             * @return 新しく生成されたIButtonDeviceInfo
             */
            private static createDeviceInfo(
                page: number,
                buttonAreaX: number,
                buttonAreaY: number,
                stateIndex: number,
                actionIndex: number,
                action: IAction
            ): IButtonDeviceInfo {

                let remoteId = huisFiles.getRemoteIdByAction(action);
                if (remoteId == null) {
                    return null;
                }

                let id               = ButtonDeviceInfoCache.createId(page, buttonAreaX, buttonAreaY, stateIndex, actionIndex);
                let face             = huisFiles.getFace(remoteId);
                let functions        = huisFiles.getMasterFunctions(remoteId);
                let codeDb           = huisFiles.getMasterCodeDb(remoteId);
                let functionCodeHash = huisFiles.getAllFunctionCodeMap(remoteId);
                let bluetoothData    = huisFiles.getMasterBluetoothData(remoteId);

                if (face == null ||
                    functions == null ||
                    codeDb == null) {
                    // functionCodeHash, bluetoothDataは必須ではない
                    return null;
                }
                    
                return {
                    id              : id,
                    remoteName      : face.name,
                    functions       : functions,
                    code_db         : codeDb,
                    functionCodeHash: functionCodeHash,
                    bluetooth_data  : bluetoothData
                };
            }

            // TODO: JSDoc comment
            /**
             * 渡されたModel.Module内のボタン情報をキャッシュファイルに出力
             */
            save(modules: Model.Module[]) {
                let newList: IButtonDeviceInfo[] = [];

                for (let module of modules) {
                    if (!module.button) continue;

                    for (let button of module.button) {
                        if (!button.state) continue;

                        for (let stateIndex = 0; stateIndex < button.state.length; stateIndex++) {
                            if (!button.state[stateIndex].action) continue;

                            for (let actionIndex = 0; actionIndex < button.state[stateIndex].action.length; actionIndex++) {
                                let targetDeviceInfo = button.state[stateIndex].action[actionIndex].deviceInfo;
                                if (!targetDeviceInfo) continue;

                                if (targetDeviceInfo.code_db.function != null &&
                                    targetDeviceInfo.code_db.function.length > 0) {
                                    targetDeviceInfo.code_db.function = HuisFiles.getPlainFunctionKey(targetDeviceInfo.code_db.function);
                                }
                                targetDeviceInfo.id = ButtonDeviceInfoCache.createId(module.pageIndex, button.area.x, button.area.y, stateIndex, actionIndex);
                                newList.push(targetDeviceInfo);
                            }
                        }
                    }
                }

                try {
                    fs.outputJSONSync(this.filePath, newList, { spaces: 2 });
                } catch (e) {
                    console.error("failed to write buttondeviceinfo.cache: " + e);
                }
            }


        }

    }
}
