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

        export namespace ConstValue {
            export const DEFAULT_NEW_REMOTE_ID: RemoteId = new RemoteId("0000");
        }

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
             * check if this has target remote id
             *
             * @param {RemoteId} targetRemoteId remote id for check
             * @return return true if this has targetRemoteId
             */
            private has(targetRemoteId: RemoteId) {
                let has = this.some((remoteId: RemoteId) => {
                    return remoteId.equals(targetRemoteId);
                });

                return has;
            }

            /**
             * @return ascending sorted remote id list
             */
            private generateSortedList(): Model.RemoteIdList {
                return $.extend(true, [], this)
                    .sort(function (val1: Model.RemoteId, val2: Model.RemoteId) {
                        return parseInt(val1.remote_id, 10) - parseInt(val2.remote_id, 10);
                    });
            }

            /**
             * find new remote id
             * @return {Model.RemoteId] new remote id
             */
            private findNewGenerateId(): Model.RemoteId {
                if (this.length <= 0) {
                    return ConstValue.DEFAULT_NEW_REMOTE_ID;
                } else if (this.length === 1) {
                    if (this.has(ConstValue.DEFAULT_NEW_REMOTE_ID)) {
                        return ConstValue.DEFAULT_NEW_REMOTE_ID.nextId();
                    }
                    return ConstValue.DEFAULT_NEW_REMOTE_ID;
                }

                if (!this.has(ConstValue.DEFAULT_NEW_REMOTE_ID)) {
                    return ConstValue.DEFAULT_NEW_REMOTE_ID;
                }

                var sortedRemoteId: Model.RemoteIdList = this.generateSortedList();
                let l = sortedRemoteId.length;
                for (let i = 0; i < l - 1; i++) {
                    // 現在の index の remoteId と 次の index の remoteId との差が 2 以上なら、
                    // 現在の index の remoteId + 1 を新しい remoteId とする
                    let remoteId1: Model.RemoteId = sortedRemoteId[i];
                    let remoteId2: Model.RemoteId = sortedRemoteId[i + 1];
                    if (!remoteId1.isSequential(remoteId2)) {
                        return remoteId1.nextId();
                    }
                }
                // 適切な remoteId が見つからず。remoteList の終端に達したら、
                // リストの最後の remoteId + 1 を新しい remoteId とする
                return sortedRemoteId[l - 1].nextId();
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
            createNewRemoteId(): RemoteId {
                var newRemoteId: Model.RemoteId = this.findNewGenerateId();
                this.addRemoteId(newRemoteId);
                return newRemoteId;
            }

            /**
             * @param {RemoteId} remote id to add
             */
            addRemoteId(remoteId: RemoteId) {
                this.unshift(new Model.RemoteId(remoteId.remote_id));
            }
        }
    }
}
