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

            static isRemoteDir(argPath: string, remoteId?: string): boolean {
                let regExp = (remoteId != null) ? new RegExp(remoteId + "\/") : /^\d{4}\//;
                return argPath.match(regExp) != null;
            }

            static resolveImagePath(argPath: string, color?: string): string {

                if (!PathManager.isRemoteDir(argPath)) {

                    let colorSpecificDir;
                    if (color == null) {
                        colorSpecificDir = Util.MiscUtil.isSettingColorBlack() ? Dirs.BLACK_DIR : Dirs.WHITE_DIR;
                    } else {
                        // For old exported remote support
                        colorSpecificDir = (color === Model.SettingColor.BLACK) ? Dirs.BLACK_DIR : Dirs.WHITE_DIR;
                    }
                    argPath = PathManager.join(colorSpecificDir, argPath);
                }
                return PathManager.joinAndResolve(HUIS_REMOTEIMAGES_ROOT, argPath);
            }

            static basename(argPath: string): string {
                return path.basename(argPath);
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
