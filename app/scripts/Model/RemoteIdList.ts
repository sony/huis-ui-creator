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
            export const MAX_REMOTE_NUM = 30;
            export const DEFAULT_NEW_REMOTE_ID: RemoteId = new RemoteId("5000");
            export const MAX_REMOTE_ID: RemoteId = new RemoteId("9999");
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
             * @param {RemoteId} idToRemove remove id by this
             * @return if remove something
             */
            public removeById(idToRemove: Model.RemoteId): boolean {
                // 該当する remoteId を取り除いたリストを作成
                var removedRemoteList = this.filter((remote) => {
                    return !remote.equals(idToRemove);
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
             * find new remote id
             * @return {Model.RemoteId} new remote id
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

                let appInfo: AppInfo = new AppInfo();
                appInfo.loadIniFile(appInfo.getDefaultAppInfoPath());
                let nextRemoteId: RemoteId = new RemoteId(appInfo.next_remote_id);
                return this.nextNewRemoteId(nextRemoteId);
            }

            /**
             * @param {RemoteId} next id saved in AppInfo
             * @return {RemoteId} next new remote id
             */
            private nextNewRemoteId(nextRemoteId: RemoteId): RemoteId {
                if (nextRemoteId.less(ConstValue.DEFAULT_NEW_REMOTE_ID)) {
                    console.warn("Manage of new RemoteId may be wrong : " + nextRemoteId.remote_id);
                    return ConstValue.DEFAULT_NEW_REMOTE_ID;
                }

                if (!this.has(nextRemoteId)) {
                    return nextRemoteId;
                }

                let newRemoteId: RemoteId = nextRemoteId.equals(ConstValue.MAX_REMOTE_ID)
                    ? ConstValue.DEFAULT_NEW_REMOTE_ID
                    : nextRemoteId.nextId();
                for (let i = 0; i < ConstValue.MAX_REMOTE_NUM; i++) {
                    if (!this.has(newRemoteId)) {
                        break;
                    }
                    newRemoteId = newRemoteId.nextId();
                }
                return newRemoteId;
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

                let appInfo: AppInfo = new AppInfo();
                appInfo.loadIniFile(appInfo.getDefaultAppInfoPath());
                appInfo.updateLastRemoteId(newRemoteId.nextId());

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
