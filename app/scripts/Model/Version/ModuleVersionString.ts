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
        export module Version {
            export class ModuleVersionString extends Model.Version.VersionString {
                private TAG: string = "[Garage.Model.Version.ModuleVersionString] ";

                constructor(stringVersion: string) {
                    super(stringVersion);

                    // TODO: 長さ２に対応させる
                }

                /**
                 * X.Yの形で、ModuleVersionの値を返す　ex) 1.2
                 */
                public getVersionString(): string {
                    let FUNCTION_NAME = this.TAG + ": getVersionString : ";

                    if (this.major == null) {
                        console.warn(FUNCTION_NAME + "major is null ");
                        return null;
                    }

                    if (this.minor == null) {
                        console.log(FUNCTION_NAME + "minor is null");
                        return null;
                    }

                    return this.major + "." + this.minor;
                }
            }
        }
    }
}
