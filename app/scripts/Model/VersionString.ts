/// <reference path="../include/interfaces.d.ts" />


module Garage {
	export module Model {
        var TAG = "[Garage.Model.VersionString] ";

        export class VersionString {
            private majorVersion: number;
            private minorVersion: number;


            constructor(stringVersion: string) {
                let FUNCTION_NAME = TAG + ": constructor : ";

                if (!stringVersion) {
                    console.warn(FUNCTION_NAME + "stringVersion is undefined");
                    return;
                }

                let separateString: string[] = stringVersion.split(".");
                let majorVersionInput: number = parseInt(separateString[0]);
                let minorVersionInput: number = parseInt(separateString[1]);
                let otherInfo: number = parseInt(separateString[2]);

                if (otherInfo) {
                    console.warn(FUNCTION_NAME + "there is otherInfo");
                }

                this.majorVersion = majorVersionInput;
                this.minorVersion = minorVersionInput;
            }

			/*
			* 入力の ModelVersionより古いバージョンのとき、trueを返す。
			* @param counterPart : ModuleVersion 　比較対象のModelVersion
			* @return　counterPartより古いバージョンの場合：true, 新しいバージョンのときfalse
			*/
            public isOlderThan(counterPart: VersionString) {

                let FUNCTION_NAME = TAG + ": isOlderThan() : ";

                if (!counterPart) {
                    console.warn(FUNCTION_NAME + "counterPart is undefined");
                    return;
                }

                //majorバージョンが同じとき、minorバージョンで比べる。
                if (this.majorVersion === counterPart.getMajorVersion()) {

                    //minorバージョンで比べる。
                    if (this.minorVersion < counterPart.getMinorVersion()) {//minorVersion値が少ない　＝＝　古い
                        return true;
                    } else {
                        return false;
                    }

                } else {

                    //majorバージョンで比べる。
                    if (this.majorVersion < counterPart.getMajorVersion()) {//majorVersion値が少ない　＝＝　古い
                        return true;
                    } else {
                        return false;
                    }

                }
            }

			/*
			* X.Yの形で、ModuleVersionの値を返す　ex) 1.2
			*/
            public getVersionString(): string {
                let FUNCTION_NAME = TAG + ": getVersionString : ";

                if (this.majorVersion == null) {
                    console.warn(FUNCTION_NAME + "majorVersion is null ");
                    return null;
                }

                if (this.minorVersion == null) {
                    console.log(FUNCTION_NAME + "minorVersion is null");
                    return null;
                }

                return this.majorVersion + "." + this.minorVersion;
            }

            public getMajorVersion(): number {
                return this.majorVersion;
            }

            public getMinorVersion(): number {
                return this.minorVersion;
            }

        }
	}
}