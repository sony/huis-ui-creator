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
            export const THEME_DIR_NAME: string = "theme";
        }

        export class ThemeInstaller {

            constructor() {
            }

            /**
             * Install theme file if needed.
             * unzip hth file.
             */
            installTheme(): CDP.IPromise<void> {
                if (!this._needInstall()) {
                    console.log("theme install not needed");
                    return null;
                }

                let hth_file_path: string = this._getThemeFilePath();
                if (!fs.existsSync(hth_file_path)) {
                    console.log("[ThemeInstaller] hth file: " + hth_file_path + " doesn't exist.");
                    return null;
                }
                console.log("[ThemeInstaller] hth file: " + hth_file_path + "  exists.");

                let appInfo: Model.AppInfo = new Model.AppInfo();
                appInfo.load();
                appInfo.updateTheme({
                    path: sharedInfo.themePath,
                    version: sharedInfo.themeVersion
                });
                appInfo.save();

                return this._decompress(hth_file_path);
            }

            private _needInstall(): boolean {
                let appInfo: Model.AppInfo = new Model.AppInfo();
                appInfo.load();

                if (!sharedInfo.themeState) {
                    return false;
                }
                return true;
            }

            private _getThemeFilePath(): string {
                return PathManager.joinAndResolve(HUIS_ROOT_PATH, ThemeInstaller.getThemePathName(), sharedInfo.themeFileName);
            }

            private _decompress(hth_file_path: string): CDP.IPromise<void> {
                let df: JQueryDeferred<void> = $.Deferred<void>();
                let promise: CDP.IPromise<void> = CDP.makePromise(df);

                ZipManager.decompress(hth_file_path, PathManager.getThemeDirPath())
                    .done(() => { df.resolve(); })
                    .fail(() => { df.reject(); });

                return promise;
            }

            static getThemePathName(): string {
                return ConstValue.THEME_DIR_NAME;
            }
        }
    }
}
