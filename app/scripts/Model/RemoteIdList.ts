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

        /**
         * no redundant ids
         */
        export class RemoteIdList extends Array<Model.RemoteId> {
            constructor() {
                super();
            }

            /**
             * remove element which has same id with an argument
             *
             * @param {string] idToRemove remove id by this
             * @return if remove something
             */
            public removeById(idToRemove: string): boolean {
                // 該当する remoteId を取り除いたリストを作成
                var removedRemoteList = this.filter((remote) => {
                    return remote.remote_id !== idToRemove;
                });

                if (removedRemoteList.length > this.length) {
                    return false;
                }

                // remoteList の更新
                this.length = 0;
                removedRemoteList.forEach((id: RemoteId) => {
                    this.push(id);
                });
                return true;
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
                var sortedRemoteId: Model.RemoteIdList = $.extend(true, [], this)
                    .sort(function (val1: Model.RemoteId, val2: Model.RemoteId) {
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
                    this.unshift(new Model.RemoteId(newRemoteIdStr));

                    return newRemoteIdStr;
                } else {
                    return null;
                }
            }
        }
    }
}
