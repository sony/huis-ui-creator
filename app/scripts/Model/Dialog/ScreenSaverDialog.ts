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
            export const DEFAULT_IMAGE_PATH: string = "./app/res/images/default_screensaver.png";
        }

        export class ScreensaverDialog extends Backbone.Model {
            /**
             * imagePath はデフォルト画像のパスを初期値として与えておく
             * @param {any} attributes
             * @param {any} options
             */
            constructor(attributes?: any, options?: any) {
                super(attributes, options);
                this.imagePath = Util.PathManager.resolve(ConstValue.DEFAULT_IMAGE_PATH);
            }

            get imagePath(): string {
                return this.get("imagePath");
            }

            set imagePath(path: string) {
                // change イベント発火のため、attribute で管理する
                this.set({ "imagePath": path });
            }

            /**
             * HUIS本体が持っている画像データの情報を取得する
             */
            loadHuisDevData(): void {
                console.log("TODO: load screensaver setting");
            }
        }
    }
}
