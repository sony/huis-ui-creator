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

            /*
            * 入植したVersionStringと同じMajorバージョンのときtrueを返す。違う場合はfalseを返す。
            */
            public isSameMajorVersion(counterPart: VersionString) {

                let FUNCTION_NAME = TAG + ": isSameMajorVersion() ";

                if (!counterPart) {
                    console.warn(FUNCTION_NAME + "counterPart is undefined");
                    return false;;
                }

                if (this.major === counterPart.getMajor()) {
                    return true;
                } else {
                    return false;
                }
            }

            /*
            * 入力の ModelVersionより古いバージョンのとき、trueを返す。同じ場合はfalse
            * @param counterPart : ModuleVersion 　比較対象のModelVersion
            * @return　counterPartより古いバージョンの場合：true, 新しいバージョンのときfalse。同じバージョンのとき,false;
            */
            public isOlderThan(counterPart: VersionString) {

                let FUNCTION_NAME = TAG + ": isOlderThan() : ";

                if (!counterPart) {
                    console.warn(FUNCTION_NAME + "counterPart is undefined");
                    return;
                }

                //majorバージョンが同じとき、minorバージョンで比べる。
                if (this.major === counterPart.getMajor()) {

                    if (this.minor === counterPart.getMinor()) {

                        //majorバージョンも、minorバージョンも同じとき、ビルド番号を比べる。
                        if (this.build != null && counterPart.getBuild() != null) {

                            if (this.build < counterPart.getBuild()) {//buildNumber値が少ない　＝＝　古い
                                return true;
                            } else {
                                return false;
                            }

                        } else {
                            //ビルド番号がないとき、同じバージョンと扱う。
                            return false;//同じバージョンのときはfalse 
                        }

                    }else if (this.minor < counterPart.getMinor()) {//minorVersion値が少ない　＝＝　古い
                        return true;
                    } else {
                        return false;
                    }

                } else {   
                    //majorバージョンで比べる。
                    if (this.major < counterPart.getMajor()) {//majorVersion値が少ない　＝＝　古い
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
                }else{
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