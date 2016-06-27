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

class FontWeight extends EnumBase<string>{
    static FONT_BOLD: FontWeight = new FaceCategory(0, "bold");
    static FONT_NORMAL: FontWeight = new FaceCategory(0, "normal");

}