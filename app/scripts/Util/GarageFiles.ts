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

        interface IRemoteHistory {
            deviceId: string; // デバイスID
            history: IRemoteId[]; // 編集した face のリスト
        }

        export class GarageFiles {

            constructor() {
                if (!fs) {
                    fs = require("fs-extra");
                }
                if (!path) {
                    path = require("path");
                }
            }

            /**
             * 編集した face のヒストリーを取得する。
             * 
             * @param deviceId {string} ヒストリーを取得したいデバイスの ID
             * @return {IRemoteId[]} 最近編集した face のリスト。ヒストリーが存在しない場合は null
             */
            getHistoryOfEditedFaces(deviceId: string): IRemoteId[] {
                // 編集した face のヒストリー情報を読み込む
                var editHistoryList = this._getHistoryList();
                if (!editHistoryList) {
                    return null;
                }

                // ヒストリーから指定した deviceId のものを取り出す
                var targetHistory: IRemoteHistory[] = editHistoryList.filter((value) => {
                    return value.deviceId === deviceId;
                });
                if (targetHistory.length < 1) {
                    return null;
                }

                // 指定した deviceId のヒストリーを返す
                return targetHistory[0].history;
            }

            /**
             * 編集した face のヒストリーに face を追加する
             * 
             * @param deviceId {string} 編集するヒストリーのデバイスID
             * @param remoteId {string} 追加する face の remoteId
             */
            addEditedFaceToHistory(deviceId: string, remoteId: string) {
                var editHistoryList = this._getHistoryList();
                if (!editHistoryList) {
                    editHistoryList = [];
                }

                var targetHistoryList = editHistoryList.filter((value) => {
                    return value.deviceId === deviceId;
                });
                var targetHistory: IRemoteHistory;
                if (targetHistoryList.length < 1) {
                    targetHistory = {
                        deviceId: deviceId,
                        history: []
                    };
                } else {
                    targetHistory = targetHistoryList[0];
                }
                // ヒストリーの先頭に指定した remoteId を追加
                targetHistory.history.unshift({ remote_id: remoteId });

                // 重複を削除
                targetHistory.history = targetHistory.history.filter((value, index, array) => {
                    let remoteId = value.remote_id;
                    let firstIndex = -1;
                    for (let i = 0, l = array.length; i < l && firstIndex < 0; i++) {
                        if (array[i].remote_id === remoteId) {
                            firstIndex = i;
                        }
                    }
                    return firstIndex === index;
                });

                // 指定したデバイスID のヒストリーが存在しない場合は、ヒストリーリストに追加
                if (targetHistoryList.length < 1) {
                    editHistoryList.push(targetHistory);
                } else { // 指定したデバイスID のヒストリーが存在する場合は、該当するヒストリーを更新
                    editHistoryList.forEach((value) => {
                        if (value.deviceId === deviceId) {
                            value.history = targetHistory.history;
                        }
                    });
                }

                // ヒストリー情報をファイル出力
                var editHistoryListPath = path.join(GARAGE_FILES_ROOT, "edithistory.json");
                fs.outputJSONSync(editHistoryListPath, editHistoryList, { space: 2 });
            }

            /**
             * edithistory.json からヒストリー情報を取得する
             */
            _getHistoryList(): IRemoteHistory[] {
                // 編集した face のヒストリー情報を読み込む
                var editHistoryListPath = path.join(GARAGE_FILES_ROOT, "edithistory.json");
                if (!fs.existsSync(editHistoryListPath)) {
                    return null;
                }

                var editHistoryListText = fs.readFileSync(editHistoryListPath, "utf8");
                if (!editHistoryListText) {
                    return null;
                }
                var editHistoryList: IRemoteHistory[];
                try {
                    editHistoryList = JSON.parse(editHistoryListText.replace(/^\uFEFF/, ""));
                } catch (e) {
                    return null;
                }

                if (!editHistoryList || !_.isArray(editHistoryList)) {
                    return null;
                }

                return editHistoryList;
            }
        }
    }
}
