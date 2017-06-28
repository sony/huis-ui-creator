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

        export namespace Dirs {
            export const BLACK_DIR: string = "black";
            export const WHITE_DIR: string = "white";
        }

        export class PathManager {

            static getCommonImageRoot(): string {
                let colorSpecificDir = (Util.MiscUtil.isSettingColorBlack) ? "black" : "";
                return PathManager.resolve(path.join(HUIS_REMOTEIMAGES_ROOT, colorSpecificDir));
            }

            static getFullCustomImageRoot(): string {
                return HUIS_REMOTEIMAGES_ROOT;
            }

            private static _isRemoteDir(argPath): boolean {
                return argPath.match(/^\d{4}\//) != null;
            }

            static resolveImagePath(argPath: string): string {

                if (!PathManager._isRemoteDir(argPath)) {
                    let colorSpecificDir = Util.MiscUtil.isSettingColorBlack() ? Dirs.BLACK_DIR : Dirs.WHITE_DIR;
                    argPath = PathManager.join(colorSpecificDir, argPath);
                }
                return PathManager.joinAndResolve(HUIS_REMOTEIMAGES_ROOT, argPath);
            }

            static resolve(...argPath: string[]): string {
                return path.resolve(...argPath).replace(/\\/g, "/");
            }

            static join(...argPath: string[]): string {
                return path.join(...argPath).replace(/\\/g, "/");
            }

            static joinAndResolve(...argPaths: string[]): string {
                return PathManager.resolve(PathManager.join(...argPaths));
            }

        }
    }
}