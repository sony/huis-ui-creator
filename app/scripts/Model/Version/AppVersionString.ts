﻿/*
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
            export class AppVersionString extends VersionString {
                private otherinfo: string;
                private TAG: string = "[Garage.Model.Version.AppVersionString] ";


                // 比較系のもので otherInfo の比較は行わない事に注意。

                constructor(stringVersion: string) {
                    super(stringVersion);

                    const FUNCTION_NAME: string = this.TAG + ": constructor : ";
                    if (!stringVersion) {
                        console.warn(FUNCTION_NAME + "stringVersion is undefined");
                        return;
                    }

                    let separateString: string[] = stringVersion.split(".");
                    const VERSION_BLOCK_NUM = 4;
                    if (separateString.length != VERSION_BLOCK_NUM) {
                        console.log(FUNCTION_NAME + "version block num is invalid : " + separateString.length);
                        return;
                    }
                    this.otherinfo = separateString[3];
                }
            }
        }
    }
}
