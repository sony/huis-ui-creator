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
            export const LAST_NOTIFIED_BZ_VERSION_TEXT_PATH: string = Util.PathManager.join(GARAGE_FILES_ROOT, "last_notified_bz_version.txt");
        }

        export class VersionManager {

            private hasLastNotifiedVersionFile(): boolean {
                try {
                    fs.statSync(VersionManager.getLastNotifiedVersionVersionFilePath());
                    return true;
                } catch (err) {
                    return false;
                }
            }

            public getLastNotifiedVersion(): Model.Version.AppVersionString {
                const file_path: string = VersionManager.getLastNotifiedVersionVersionFilePath();
                if (fs.existsSync(file_path)) {
                    return new Model.Version.AppVersionString(fs.readFileSync(file_path).toString());
                }

                // first launch after installation
                console.warn(file_path + " is not exist.");
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
                    VersionManager.getLastNotifiedVersionVersionFilePath(),
                    APP_VERSION,
                    function (err) {
                        console.log(err);
                    });
            }

            public static getLastNotifiedVersionVersionFilePath(): string {
                return Util.MiscUtil.isBz()
                    ? ConstValue.LAST_NOTIFIED_BZ_VERSION_TEXT_PATH
                    : ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH;
            }

            /**
             * UI CREATOR の要求する、HUIS本体の最低限のバージョン。
             * 基本的に、前回アップデートのバージョン + 0.0.1
             */
            public static getHuisRcRequiredVersion(): string {
                if (Util.MiscUtil.isBz()) {
                    return "A.3.1";
                }
                return "4.6.1";
            }

            /**
             * ユーザーに表示する、HUIS本体の要求バージョン。評価用に実際にチェックする値とは別に値を用意。
             * 基本的に、前回アップデートのバージョン + 0.1.0
             */
            public static getDisplayHuisRcRequiredVersion(): string {
                if (Util.MiscUtil.isBz()) {
                    return "A.4.0";
                }
                return "5.0.0";
            }
        }
    }
}
