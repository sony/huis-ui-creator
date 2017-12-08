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
            import JQUtils = Util.JQueryUtils;
            var TAG = "[Garage.Model.VersionString] ";

            export class VersionString {
                protected major: number;
                protected minor: number;
                protected build: number;

                constructor(stringVersion: string) {
                    let FUNCTION_NAME = TAG + ": constructor : ";

                    if (!stringVersion) {
                        console.warn(FUNCTION_NAME + "stringVersion is undefined");
                        return;
                    }

                    let separateString: string[] = stringVersion.split(".");

                    const radix = Util.MiscUtil.isBz() ? 16 : 10;
                    this.major = parseInt(separateString[0], radix);
                    this.minor = parseInt(separateString[1], radix);
                    this.build = parseInt(separateString[2], radix);

                    if (!this.isValid()) {
                        console.warn(FUNCTION_NAME + "Version is invalid");
                    }
                }

                private _compare(counterPart: VersionString,
                    compareFunc: (selfVersionNum: number, counterVersionNum: number) => boolean): boolean {

                    let FUNCTION_NAME = TAG + ": _compare() : ";

                    if (!counterPart) {
                        console.warn(FUNCTION_NAME + "counterPart is undefined");
                        return false;
                    }

                    if (this.major !== counterPart.getMajor()) {
                        return compareFunc(this.major, counterPart.getMajor());
                    }

                    if (this.minor !== counterPart.getMinor()) {
                        return compareFunc(this.minor, counterPart.getMinor());
                    }

                    return compareFunc(this.build, counterPart.getBuild());
                }

                /**
                 * 引数として与えられたVersionより自身が古いVersionかどうかを判定する。
                 * @param {ModuleVersion} counterPart 比較対象のVersion
                 * @return {boolean} counterPartより古いVersionの場合はtrue、同じか新しいVersionのときはfalse
                 */
                public isOlderThan(counterPart: VersionString): boolean {
                    return this._compare(counterPart, (selfVersionNum: number, counterVersionNum: number) => {
                        return selfVersionNum < counterVersionNum;
                    })
                }

                /**
                 * 引数として与えられたVersionより自身が新しいVersionかどうかを判定する。
                 * @param {ModuleVersion} counterPart 比較対象のVersion
                 * @return {boolean} counterPartより新しいVersionの場合はtrue、同じか古いVersionのときはfalse
                 */
                public isNewerThan(counterPart: VersionString): boolean {
                    return this._compare(counterPart, (selfVersionNum: number, counterVersionNum: number) => {
                        return selfVersionNum > counterVersionNum;
                    })
                }

                /**
                 * 引数として与えられたVersionが自身が同じかどうかを判定する。
                 * @param {ModuleVersion} counterPart 比較対象のVersion
                 * @return {boolean} counterPartと同じVersionの場合はtrue、それ以外はfalse
                 */
                public isSame(counterPart: VersionString): boolean {
                    return this._compare(counterPart, (selfVersionNum: number, counterVersionNum: number) => {
                        return selfVersionNum === counterVersionNum;
                    })
                }

                public getMajor(): number {
                    return this.major;
                }

                public getMinor(): number {
                    return this.minor;
                }

                public getBuild(): number {
                    return this.build;
                }

                public isValid(): boolean {
                    if (!this.isValidVersionElement(this.major)) {
                        console.warn(TAG + ": major is invalid");
                        return false;
                    }

                    if (!this.isValidVersionElement(this.minor)) {
                        console.warn(TAG + ":minor is invalid");
                        return false;
                    }

                    if (!this.isValidVersionElement(this.build)) {
                        console.warn(TAG + ":build is invalid");
                        return false;
                    }

                    return true;
                }

                private isValidVersionElement(versionElement: number): boolean {
                    return !(JQUtils.isNaN(versionElement) || versionElement == null);
                }
            }
        }
    }
}
