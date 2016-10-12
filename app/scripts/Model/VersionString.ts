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
                let otherInfo: number = parseInt(separateString[3]);


                this.major = major;
                this.minor = minor;

                if (build != null) {
                    this.build = build;
                } else {
                    this.build = null;
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
                        if (this.build != null || counterPart.getBuild() != null) {

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