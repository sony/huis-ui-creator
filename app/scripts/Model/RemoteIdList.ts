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
        }
    }
}
