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

            private _version: string;
            private _modelColor: string;
            private _settingColor: string;
            private _isBtoB: boolean;
            private _winRequiredVersion: string;
            private _macRequiredVersion: string;

            constructor(sharedInfo: ISharedInfo) {
                this._version = sharedInfo.system.version;
                this._modelColor = sharedInfo.color.model_color;
                this._settingColor = sharedInfo.color.setting_color;
                this._winRequiredVersion = sharedInfo.system.win_required_version;
                this._macRequiredVersion = sharedInfo.system.mac_required_version;

                this._isBtoB = (sharedInfo.system.is_btob != null);
            }

            get version(): string {
                return this._version;
            }

            get modelColor(): string {
                return this._modelColor;
            }

            get settingColor(): string {
                return this._settingColor;
            }

            get isBtoB(): boolean {
                return this._isBtoB;
            }

            get requiredGarageVersion(): string {
                return Util.MiscUtil.isDarwin() ? this._macRequiredVersion : this._winRequiredVersion;
            }
        }
    }
}
