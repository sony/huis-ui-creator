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

/// <reference path="../../include/interfaces.d.ts" />

module Garage {
    export module Model {

        export namespace ConstValue {
            export const APP_INFO_FILE_NAME: string = "appinfo.ini";
        }

        export class AppInfo extends IniFile {
            private next_remote_id_: string;

            constructor() {
                super();
                this.next_remote_id_ = ConstValue.DEFAULT_NEW_REMOTE_ID.remote_id;
            }

            get next_remote_id(): string {
                return this.next_remote_id_;
            }

            set next_remote_id(newLastRemoteId: string) {
                this.next_remote_id_ = newLastRemoteId;
            }

            /**
             * @return {string} default AppInfo.ini path
             */
            public getDefaultAppInfoPath(): string {
                return Util.PathManager.join(GARAGE_FILES_ROOT, Model.ConstValue.APP_INFO_FILE_NAME);
            }

            /**
             * load ini file and update properties
             * @param {string} path ini file data path
             */
            public loadIniFile(path: string) {
                let appInfo: IAppInfo = super.loadIniFile(path);
                if (appInfo == null) {
                    console.warn("app info not found.  default value set");
                    return;
                }

                this.next_remote_id_ = appInfo.system.next_remote_id_;
            }

            public updateLastRemoteId(newRemoteId: RemoteId) {
                this.next_remote_id = newRemoteId.remote_id;
                this.save();
            }

            get section(): string {
                return "system";
            }
        }
    }
}
