/// <reference path="../../modules/include/frameworks.d.ts" />
/// <reference path="../../modules/include/node.d.ts" />
/// <reference path="../../modules/include/fs-extra.d.ts" />
/// <reference path="../../modules/include/pixi.d.ts" />

/// <reference path="../Util/HuisFiles.ts" />
/// <reference path="../Util/HuisDev.ts" />
/// <reference path="../Util/GarageFiles.ts" />
/// <reference path="../Util/ElectronDialog.ts" />
/// <reference path="../Util/JQueryUtils.ts" />
/// <reference path="../Model/OffscreenEditor.ts" />


interface IArea {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * 親の Area に対しての子要素の Area の比率。
 * button の state の image や label での使用を想定。
 */
interface IGAreaRatio {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface IAction {
    input: string;  /* conditions to output IR */
    code?: string; /* IR 信号情報 */
    code_db?: ICodeDB; /* データベースから引くためのIR信号 */
	[x: string]: any;
}
interface ICodeDB {
    function: string; /* コマンド種別 */
    brand: string; /* メーカー名 */
    device_type: string; /* カテゴリー名 */
	uei_db_codeset: string; /* 信号の種類 */
	uei_db_device_id?: number; /* DB に保存されているデバイスのインデックス */
    model_number?: string; /* 型番 */
}

interface IStateTranslate {
    input: string;  /* condition to translate the state */
    next: number;  /* next state's state.id */
}

interface IGState {
	id?: number;
    image?: IGImage[];
    label?: IGLabel[];
    action?: IAction[];
    translate?: IStateTranslate[];
	active?: boolean; /* アクティブな状態かどうか */
	stateId?: number;
	[x: string]: any;
}

interface IState {
    id?: number;
    image?: IImage[];
    label?: ILabel[];
    action?: IAction[];
    translate?: IStateTranslate[];
	active?: boolean;
}

interface IGButton {
	area: IArea;
	default?: number; // default の state.id
	state: IGState[];
    currentStateId: number;
	deviceInfo?: IButtonDeviceInfo; // ボタンがひも付けられている機器の情報
	[x: string]: any;
}

interface IButton {
    area: IArea;
    default?: number; // default の state.id
    state: IState[];
}

interface IButtonDeviceInfo {
	functions: string[]; // ボタンがひも付けられている機器で使用できる機能
	code_db: ICodeDB; // ボタンがひも付けられている機器の情報
}

interface IGLabel {
	area?: IArea;
    text: string;
    color?: number;
    font?: string;
    size?: number;
	areaRatio?: IGAreaRatio;
	resolvedColor?: string;
	[x: string]: any;
}

interface ILabel {
    area?: IArea;
    text: string;
    color?: number;
    font?: string;
    size?: number;
}

interface IGGarageImageExtensions {
	original: string; //<! 元画像のパス (remoteimages ディレクトリーからの相対パス)
	resolvedOriginalPath: string; //<! 元画像のパス (Garage を使用している PC の絶対パス)
	resizeMode: string; //<! 拡大・縮小の方法。"contain", "cover", "stretch" のいずれか
}

interface IGarageImageExtensions {
	original: string;
	resize_mode: string;
}

interface IGImage{
	area?: IArea;
    path: string;
	resolvedPath?: string;
	garageExtensions?: IGGarageImageExtensions;
	areaRatio?: IGAreaRatio;
	pageBackground?: boolean;
	resized?: boolean; //<!リサイズが行われたかどうか
	resizeMode?: string;
	resizeOriginal?: string;
	resizeResolvedOriginalPath?: string;
	[x: string]: any;
}

interface IImage {
    area?: IArea;
	path?: string;
	garage_extensions?: IGarageImageExtensions;
}

interface IGOutput {
    Module: IModule[];
}

interface IGModule {
	area: IArea;
	button?: IGButton[];
	label?: IGLabel[];
	image?: IGImage[];
	offsetY: number; // ページ内のモジュールの y 座標
	pageIndex: number; // ページ番号 (最初のページが 0 
	remoteId: string; // モジュールが属する face の ID
	name: string; // モジュールの名前
}

interface IModule {
    area: IArea;
    button?: IButton[];
    label?: ILabel[];
    image?: IImage[];
}

interface IGFace extends IFace {
	remoteId: string;
}

interface IFace {
	name: string;
	category: string;
	modules: IGModule[];
}

interface IRemoteId {
	remote_id: string;
}

interface IPosition {
	x: number;
	y: number;
}

interface Event {
	pageX: number;
	pageY: number;
}

interface ItemModel extends Backbone.Model {
	properties: string[];
	itemType: string;
	enabled: boolean;
}

interface DialogProps {
	id: string; //<! 表示するダイアログ DOM の id
	options: CDP.UI.DialogOptions;
}

declare const enum EFaceCategory {
	TV,
	AirConditioner,
	Light,
	BDDVDRecoder,
	BDDBDPlayer,
	Audio,
	Projector,
	SetTopBox,
	Fan,
	AirCleaner,
	PickUp,
	FullCustom,
	Unknown
}

declare module Garage {
	var electronDialog: Util.ElectronDialog;
	var huisFiles: Util.HuisFiles;
	var garageFiles: Util.GarageFiles;
	var HUIS_PAGE_BACKGROUND_AREA: IArea;
	var IMAGE_EDIT_PARAMS: Model.IImageEditParams;
	var IMAGE_EDIT_PAGE_BACKGROUND_PARAMS: Model.IImageEditParams;
}

declare var HUIS_FACE_PAGE_WIDTH: number;
declare var HUIS_FACE_PAGE_HEIGHT: number;
declare var GARAGE_FILES_ROOT: string;
declare var HUIS_FILES_ROOT: string; //! ローカル上の HUIS ファイルの置き場所 %appdata%
declare var HUIS_REMOTEIMAGES_ROOT: string //! ローカル上の HUIS ファイルディレクトリー内にある remoteimages のパス
declare var HUIS_VID: number;
declare var HUIS_PID: number;
declare var HUIS_ROOT_PATH: string; //! HUIS のデバイスのルートパス
declare var DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC: DialogProps;
declare var DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS: DialogProps;
declare var DIALOG_PROPS_CHECK_DIFF: DialogProps;

declare var Remote: any; // remote module
declare var Menu: any; // menu module
declare var MenuItem: any; // menu-item module
declare var app: any; // app module
