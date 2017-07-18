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

/// <reference path="../include/interfaces.d.ts" />


module Garage {
    export module Model {
        import JQUtils = Util.JQueryUtils;
        var TAG = "[Garage.Model.VersionString] ";

        export class VersionString {
            private major: number;
            private minor: number;
            private build: number;
            private otherinfo: string;

            constructor(stringVersion: string) {
                let FUNCTION_NAME = TAG + ": constructor : ";

                if (!stringVersion) {
                    console.warn(FUNCTION_NAME + "stringVersion is undefined");
                    return;
                }

                let separateString: string[] = stringVersion.split(".");
                let major: number = parseInt(separateString[0]);
                let minor: number = parseInt(separateString[1]);
                let build: number = parseInt(separateString[2]);
                let otherInfo: string = separateString[3];


                if (JQUtils.isNaN(major) || major == null) {
                    console.warn(FUNCTION_NAME + "major is invalid");
                    return;
                }
                this.major = major;

                //minorを代入
                if (JQUtils.isNaN(minor) || minor == null) {
                    console.warn(FUNCTION_NAME + "minor is invalid");
                    return;
                }
                this.minor = minor;


                //build を代入
                if (build != null && !JQUtils.isNaN(build)) {
                    this.build = build;
                } else {
                    this.build = null;
                }

                //otherInfoを代入
                if (otherInfo != null) {
                    this.otherinfo = otherInfo;
                } else {
                    this.otherinfo = null;
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
             * otherInfoの比較は行わない事に注意。
             * @param {ModuleVersion} counterPart 比較対象のVersion
             * @return {boolean} counterPartより古いVersionの場合はtrue、同じか新しいVersionのときはfalse
             */
            public isOlderThan(counterPart: VersionString): boolean {
                return this._compare(counterPart, (selfVersionNum: number, counterVersionNum) => {
                    return selfVersionNum < counterVersionNum;
                })
            }

            /**
             * 引数として与えられたVersionより自身が新しいVersionかどうかを判定する。
             * otherInfoの比較は行わない事に注意。
             * @param {ModuleVersion} counterPart 比較対象のVersion
             * @return {boolean} counterPartより新しいVersionの場合はtrue、同じか古いVersionのときはfalse
             */
            public isNewerThan(counterPart: VersionString): boolean {
                return this._compare(counterPart, (selfVersionNum: number, counterVersionNum) => {
                    return selfVersionNum > counterVersionNum;
                })
            }

            /**
             * 引数として与えられたVersionが自身が同じかどうかを判定する。
             * otherInfoの比較は行わない事に注意。
             * @param {ModuleVersion} counterPart 比較対象のVersion
             * @return {boolean} counterPartと同じVersionの場合はtrue、それ以外はfalse
             */
            public isSame(counterPart: VersionString): boolean {
                return this._compare(counterPart, (selfVersionNum: number, counterVersionNum) => {
                    return selfVersionNum === counterVersionNum;
                })
            }

            /**
             * X.Yの形で、ModuleVersionの値を返す　ex) 1.2
             */
            public getVersionString(): string {
                let FUNCTION_NAME = TAG + ": getVersionString : ";

                if (this.major == null) {
                    console.warn(FUNCTION_NAME + "major is null ");
                    return null;
                }

                if (this.minor == null) {
                    console.log(FUNCTION_NAME + "minor is null");
                    return null;
                }

                if (this.build != null) {
                    return this.major + "." + this.minor + "." + this.build;
                } else {
                    return this.major + "." + this.minor;
                }

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


        }
    }
}
