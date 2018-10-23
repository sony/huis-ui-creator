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
            export const THEME_FILE_NAME = "theme.ini";
        }
        export class Theme extends IniFile {
            private themeId_: string;
            private themeNameJp_: string;
            private themeNameEn_: string;
            private hasFavoriteScreen_: boolean;
            private version_: number;

            constructor() {
                super();
                this.themeId_ = "";
                this.themeNameJp_ = "";
                this.themeNameEn_ = "";
                this.hasFavoriteScreen_ = false;
                this.version_ = 0;
            }

            public load() {
                let theme: IThemeIni = super.loadIniFile(this.getFilePath());
                if (theme == null) {
                    console.log("[Theme] failed to load theme : " + this.getFilePath());
                    return;
                }
                this.themeId_ = theme.Theme.theme_id;
                this.themeNameJp_ = theme.Theme.theme_name_jp;
                this.themeNameEn_ = theme.Theme.theme_name_en;
                this.hasFavoriteScreen_ = (theme.Theme.has_favorite_screen == "true");
                this.version_ = theme.Theme.version;
            }

            get hasFavoriteScreen(): boolean {
                return this.hasFavoriteScreen_;
            }

            /**
             * @return {string} current Theme.ini path
             */
            public getFilePath(): string {
                return Util.PathManager.joinAndResolve(Util.PathManager.getThemeDirPath(), sharedInfo.themePath, ConstValue.THEME_FILE_NAME);
            }

            /**
             * check use theme default screensaver
             *
             * @return {boolean} true if need to use theme default screensaver
             */
            public useThemeScreensaver(): boolean {
                if (!sharedInfo.themeState) {
                    return false;
                }
                return this.hasFavoriteScreen;
            }
        }
    }
}
