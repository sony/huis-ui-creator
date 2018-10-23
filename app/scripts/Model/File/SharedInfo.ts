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

        const TAG: string = "[Garage.Model.SharedInfo] ";

        export namespace SettingColor {
            export const WHITE: string = "white";
            export const BLACK: string = "black";
        }

        export namespace ModelColor {
            export const WHITE: string = "white";
            export const BLACK: string = "black";
        }

        /**
         * HUISと共有する情報を格納するクラス。
         * 色情報、Version情報が主。
         */
        export class SharedInfo {

            // system
            private _version: string;
            private _winRequiredVersion: string;
            private _macRequiredVersion: string;
            private _isBtoB: boolean;

            // color
            private _modelColor: string;
            private _settingColor: string;

            // theme
            private _theme_state: boolean;
            private _theme_file_name: string;
            private _theme_path: string;
            private _theme_version: number;

            constructor(sharedInfo: ISharedInfo) {
                try {
                    this._version = sharedInfo.system.version;
                    this._winRequiredVersion = sharedInfo.system.win_required_version;
                    this._macRequiredVersion = sharedInfo.system.mac_required_version;
                    this._isBtoB = (sharedInfo.system.is_btob != null);

                    this._modelColor = sharedInfo.color.model_color;
                    this._settingColor = sharedInfo.color.setting_color;

                    this._theme_state = (sharedInfo.theme.theme_state === "true");
                    this._theme_file_name = sharedInfo.theme.theme_file_name;
                    this._theme_path = sharedInfo.theme.theme_path;
                    this._theme_version = sharedInfo.theme.version;
                } catch (error) {
                    // set default value
                    this._version = "0.0.0"
                    this._winRequiredVersion = "0.0.0";
                    this._macRequiredVersion = "0.0.0";
                    this._isBtoB = false;

                    this._modelColor = "white";
                    this._settingColor = "white";

                    this._theme_state = false;
                    this._theme_file_name = "";
                    this._theme_path = "";
                    this._theme_version = 0;

                    console.log("[sharedinfo] read error");
                }
            }

            get version(): string {
                return this._version;
            }

            get modelColor(): string {
                return this._modelColor;
            }

            /**
             * 白モデルかどうか確認する
             * @return {boolean} 白モデルのときtrueを返す
             */
            isWhiteModel(): boolean {
                return this.modelColor === Model.ModelColor.WHITE;
            }

            get settingColor(): string {
                return this._settingColor;
            }

            /**
             * UIが白設定どうか確認する
             * @return {boolean} 白モデルのときtrueを返す
             */
            isWhiteSetting(): boolean {
                return this.settingColor === Model.SettingColor.WHITE;
            }

            get isBtoB(): boolean {
                return this._isBtoB;
            }

            get requiredGarageVersion(): string {
                return Util.MiscUtil.isDarwin() ? this._macRequiredVersion : this._winRequiredVersion;
            }

            get themeState(): boolean {
                return this._theme_state;
            }

            get themeFileName(): string {
                return this._theme_file_name;
            }

            get themePath(): string {
                return this._theme_path;
            }

            get themeVersion(): number {
                return this._theme_version;
            }
        }
    }
}
