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


class EnumBase<TValue> {
    constructor(private _index: number, private _value: TValue) { }
    public get index(): number { return this._index; }
    public get value(): TValue { return this._value; }
}

class FaceCategory extends EnumBase<string> {
    static TV: FaceCategory = new FaceCategory(0, "tv");
    static AirConditioner = new FaceCategory(1, "airconditioner");
    static Light = new FaceCategory(0, "light");
    static BDDVDRecoder = new FaceCategory(0, "bddvdrecoder");
    static BDDBDPlayer = new FaceCategory(0, "bddvdplayer");
    static Audio = new FaceCategory(0, "audio");
    static Projector = new FaceCategory(0, "projector");
    static SetTopBox = new FaceCategory(0, "settopbox");
    static Fan = new FaceCategory(0, "fan");
    static AirCleaner = new FaceCategory(0, "aircleaner");
    static RobotCleaner = new FaceCategory(0, "robotcleaner");
    static PickUp = new FaceCategory(0, "pickup");
    static FullCustom = new FaceCategory(0, "fullcustom");
    static Unknown = new FaceCategory(0, "unknown");
}

class FontWeight {
    public static FONT_BOLD: string = "bold";
    public static FONT_NORMAL: string = "normal";

    public static exchangeStringToFontWeight(input: any): FontWeight {
        if (input == "normal") {
            return FontWeight.FONT_NORMAL;
        } else if (input == "bold") {
            return FontWeight.FONT_BOLD;
        }
        return;
    }
}

class IMAGE_TYPE {
    public static BUTTON_IMAGE: string = "button";
    public static NON_BUTTON_IMAGE: string = "image";
    public static BACKGROUND_IMAGE: string = "background-image";
};
