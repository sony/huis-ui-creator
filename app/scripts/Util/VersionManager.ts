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

        namespace ConstValue {
            export const LAST_NOTIFIED_VERSION_TEXT_PATH: string = Util.PathManager.join(GARAGE_FILES_ROOT, "last_notified_version.txt");
        }

        export class VersionManager {

            private hasLastNotifiedVersionFile(): boolean {
                try {
                    fs.statSync(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH);
                    return true;
                } catch (err) {
                    return false;
                }
            }

            public getLastNotifiedVersion(): Model.Version.AppVersionString {
                if (fs.existsSync(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH)) {
                    return new Model.Version.AppVersionString(fs.readFileSync(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH).toString());
                }

                // first launch after installation
                console.warn(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH + " is not exist.");
                return new Model.Version.AppVersionString("0.0.0");
            }

            /**
             * check app installed newly
             * check if last_notified_version file exists.
             */
            public isInstalledNewly(): boolean {
                // LAST_NOTIFIED_FILE means has already app started, so not newly
                return !this.hasLastNotifiedVersionFile();
            }

            public isUpdated(): boolean {
                let currentVersion = new Model.Version.AppVersionString(APP_VERSION);

                try {
                    return currentVersion.isNewerThan(this.getLastNotifiedVersion());
                } catch (err) {
                    console.error("version check error : " + err);
                }
                return false;
            }

            public updateLastNotifiedVersionFile() {
                fs.outputFile(
                    ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH,
                    APP_VERSION,
                    function (err) {
                        console.log(err);
                    });
            }
        }
    }
}
