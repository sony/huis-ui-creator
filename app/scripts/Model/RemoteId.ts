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
        export class RemoteId implements IRemoteId{
            private remoteId_: string;

            constructor(remote_id: string) {
                this.remoteId_ = remote_id;
            }

            get remote_id(): string {
                return this.remoteId_;
            }

            /**
             * @return {boolean} this has same remote id with argument
             */
            public equals(remoteId: RemoteId): boolean {
                return this.remote_id == remoteId.remote_id;
            }

            /**
             * @return {RemoteId} RemoteId which id is this.remote_id + 1
             */
            public nextId(): RemoteId {
                let myInt = parseInt(this.remote_id, 10);
                return new RemoteId(RemoteId.paddingId(myInt + 1));
            }

            /**
             * @param {RemoteId} remoteId is checked
             * @return {boolean} return true is argument is this.remote_id +- 1
             */
            public isSequential(remoteId: RemoteId): boolean {
                let myInt: number = parseInt(this.remote_id, 10);
                let yourInt: number = parseInt(remoteId.remote_id, 10);
                return Math.abs(myInt - yourInt) === 1;
            }

            /**
             * @param {number} change to string
             * @return {string} four_characters id ex) "0000", "5432"
             */
            public static paddingId(newRemoteId: number): string {
                if (newRemoteId < 0) {
                    console.warn("remote id range erro : " + newRemoteId);
                    return null;
                }
                // 4 桁の 0 パディングで返却
                return ("000" + newRemoteId).slice(-4);
            }
        }
    }
}
