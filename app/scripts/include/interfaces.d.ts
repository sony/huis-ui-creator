/// <reference path="../../modules/include/frameworks.d.ts" />
/// <reference path="../../modules/include/node.d.ts" />
/// <reference path="../../modules/include/fs-extra.d.ts" />
/// <reference path="../../modules/include/pixi.d.ts" />

/// <reference path="../Util/HuisFiles.ts" />
/// <reference path="../Util/HuisDev.ts" />
/// <reference path="../Util/MiscUtil.ts" />
/// <reference path="../Util/GarageFiles.ts" />
/// <reference path="../Util/ElectronDialog.ts" />
/// <reference path="../Util/JQueryUtils.ts" />
/// <reference path="../Model/OffscreenEditor.ts" />

/**
 * @interface IArea
 * @brief アイテムの領域
 */
interface IArea {
	/**
	 * x 座標
	 */
    x: number;
	/**
	 * y 座標
	 */
    y: number;
	/**
	 * 横の大きさ
	 */
    w: number;
	/**
	 * 縦の大きさ
	 */
    h: number;
}

/**
 * @interface IGAreaRatio
 * @brief 親の Area に対しての子要素の Area の比率。button の state の image や label での使用を想定。
 */
interface IGAreaRatio {
	/**
	 * 親の Area に対しての x の比率
	 */
	x: number;
	/**
	 * 親の Area に対しての y の比率
	 */
	y: number;
	/**
	 * 親の Area に対しての w の比率
	 */
	w: number;
	/**
	 * 親の Area に対しての h の比率
	 */
	h: number;
}

/**
 * @interface IAction
 * @brief HUIS の module ファイルにおける button.state.action にあたる
 */
interface IAction {
	/**
	 * conditions to output IR
	 */
    input: string;
	/**
	 * IR 信号情報
	 */
    code?: string;
	/**
	 * データベースから引くためのIR信号
	 */
    code_db?: ICodeDB;
	[x: string]: any;
}

/**
 * @interface ICodeDB
 * @brief HUIS の module ファイルにおける button.state.action.code_db にあたる
 */
interface ICodeDB {
	/**
	 * コマンド種別
	 */
    function: string;
	/**
	 * メーカー名
	 */
    brand: string;
	/**
	 * デバイスのカテゴリー名
	 */
    device_type: string;
	/**
	 * 信号の種類
	 */
	db_codeset: string;
	/**
	 * DB に保存されているデバイスのインデックス
	 */
	db_device_id?: number;
	/**
	 * 型番
	 */
    model_number?: string;
}

/**
 * @interface IStateTranslate
 * @brief HUIS の module ファイルにおける button.state.translate にあたる
 */
interface IStateTranslate {
	/**
	 * condition to translate the state
	 */
    input: string;
	/**
	 * next state's state.id
	 */
    next: number;
}

/**
 * @interface IGState
 * @brief IState に対して Garage で使用する情報を付加し、image や label を IGXxx に変換したもの
 */
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

/**
 * @interface IState
 * @brief HUIS の module ファイルにおける button.state にあたる
 */
interface IState {
	/**
	 * state ID
	 */
    id?: number;
	/**
	 * state 内に格納される画像
	 */
    image?: IImage[];
	/**
	 * state 内に格納されるラベル
	 */
    label?: ILabel[];
	/**
	 * state 内に格納されるアクション
	 */
    action?: IAction[];
	/**
	 * state 内に格納される遷移情報
	 */
    translate?: IStateTranslate[];
	/**
	 * state が有効であるか
	 */
	active?: boolean;
}

/**
 * @interface IGState
 * @brief IButton に対して Garage で使用する情報を付加し、state を IGState[] に変換したもの
 */
interface IGButton {
	version?: string;
	area: IArea;
	default?: number;
	state: IGState[];
	name?: string;
	/**
	 * 現在の state.id
	 */
	currentStateId: number;
	/**
	 * ボタンがひも付けられている機器の情報
	 */
	deviceInfo?: IButtonDeviceInfo;
	[x: string]: any;
}

/**
 * @interface IButton
 * @brief HUIS の module ファイルにおける button にあたる
 */
interface IButton {
	/**
	 * ボタンアイテムの領域
	 */
    area: IArea;
	/**
	 * デフォルトの state.id
	 */
    default?: number;
	/**
	 * 状態
	 */
    state: IState[];
	/**
	 * ボタンの名前
	 */
	name?: string;
}

/**
 * @interface IButtonDeviceInfo
 * @brief ボタンがひも付けられている機器の情報と使用できる機能
 */
interface IButtonDeviceInfo {
	functions: string[]; // ボタンがひも付けられている機器で使用できる機能
	code_db: ICodeDB; // ボタンがひも付けられている機器の情報
	functionCodeHash?: IStringStringHash; //ファンクション名とコードとの対応表
}

/**
 * @interface IStringStringHash
 * @brief keyもValueもStringのハッシュ
 */
interface IStringStringHash {
	[key: string]: string;
}

/**
 * @interface IGLabel
 * @brief ILabel に対して Garage で使用する情報を付加したもの
 */
interface IGLabel {
	version?: string;
	area?: IArea;
    text: string;
    color?: number;
    font?: string;
    size?: number;
    font_weight?: FontWeight;//normal | bold
	/**
	 * 親要素の area に対してのこのアイテムの area の比率
	 */
	areaRatio?: IGAreaRatio;
	/**
	 * 16階調のグレイスケールを rgb() 表記したものが格納される
	 */
	resolvedColor?: string;
	[x: string]: any;
}

/**
 * @interface ILabel
 * @brief HUIS の module ファイルにおける label にあたる
 */
interface ILabel {
	/**
	 * ラベルアイテムの領域
	 */
    area?: IArea;
	/**
	 * ラベルアイテムに表示するテキスト
	 */
    text: string;
	/**
	 * テキストの色 (16階調グレイスケール)
	 */
    color?: number;
	/**
	 * テキストのフォント
	 */
    font?: string;
	/**
	 * テキストのフォントサイズ
	 */
    size?: number;
    /**
	 * テキストの太さ
	 */
    font_weight?: FontWeight;
}


/**
 * @interface IGGarageImageExtensions
 * @brief IGarageImageExtensions に対して、Garage で使用する情報を付加したもの
 */
interface IGGarageImageExtensions {
	original: string; // <! 元画像のパス (remoteimages ディレクトリーからの相対パス)
	resolvedOriginalPath: string; //<! 元画像のパス (Garage を使用している PC の絶対パス)
	resizeMode: string; // <! 拡大・縮小の方法。"contain", "cover", "stretch" のいずれか
}

/**
 * @interface IGarageImageExtensions
 * @brief HUIS の module ファイルにおける image.garage_extensions にあたる Garage が拡張した領域
 */
interface IGarageImageExtensions {
	/**
	 * 転送する画像のリサイズ前の画像のパス
	 */
	original: string;
	/**
	 * リサイズモード
	 */
	resize_mode: string;
}

/**
 * @interface IGImage
 * @brief IImage に Garage で使用する情報を付加したもの
 */
interface IGImage {
	version?: string;
	area?: IArea;
    path: string;
	resolvedPath?: string; //<!image.path を絶対パスに変換したもの
	garageExtensions?: IGGarageImageExtensions;
	areaRatio?: IGAreaRatio;
	pageBackground?: boolean;
	resized?: boolean; //<!リサイズが行われたかどうか
	resizeMode?: string;
	resizeOriginal?: string;
	resizeResolvedOriginalPath?: string;
	[x: string]: any;
}

/**
 * @interface IImage
 * @brief HUIS の module ファイルにおける image にあたる
 */
interface IImage {
    area?: IArea;
	path?: string;
	garage_extensions?: IGarageImageExtensions;
}

interface IGOutput {
    Module: IModule[];
}

/**
 * @interface IGModule
 * @brief IModule に対して Garage で使用する情報を付加したもの
 */
interface IGModule {
	version?: string;
	area: IArea;
	button?: IGButton[];
	label?: IGLabel[];
	image?: IGImage[];
	offsetY: number; //!< ページ内のモジュールの y 座標
	pageIndex: number; //!< ページ番号 (最初のページが 0
	remoteId: string; //!< モジュールが属する face の ID
    name: string; //!< モジュールの名前
}

/**
 * @interface IModule
 * @brief HUIS の module ファイルの内容にあたる
 */
interface IModule {
    area: IArea;
	version?: string;
    button?: IButton[];
    label?: ILabel[];
    image?: IImage[];
}

/**
 * @interface IGFace
 * @brief IFace に対して Garage で使用する情報を付加したもの
 */
interface IGFace extends IFace {
	remoteId: string;
}

/**
 * @interface IFace
 * @breif HUIS の face ファイルの内容にあたる
 */
interface IFace {
	/**
	 * face の名前
	 */
	name: string;
	/**
	 * face のカテゴリー
	 */
	category: string;
	/**
	 * face が参照する module (module ファイルを展開したもの)
	 */
	modules: IGModule[];
}

/**
 * @interface IRemoteId
 * @brief HUIS の remote.ini ファイルの内容
 */
interface IRemoteId {
	remote_id: string;
}

/**
 * @interface IPosition
 * @brief 座標情報
 */
interface IPosition {
	x: number;
	y: number;
}

/**
 * @interface Event
 * @brief Event に pageX と pageY を付加
 */
interface Event {
	/**
	 * touch イベントの x 座標
	 */
	pageX: number;
	/**
	 * touch イベントの y 座標
	 */
	pageY: number;
}

/**
 * @interface ItemModel
 * @brief
 */
interface ItemModel extends Backbone.Model {
	properties: string[];
	itemType: string;
	enabled: boolean;
}

/**
 * @interface DialogProps
 * @brief CDP.UI.Dialog の
 */
interface DialogProps {
	id: string; //<! 表示するダイアログ DOM の id
	options: CDP.UI.DialogOptions;
}

//declare const enum EFaceCategory {
//	TV,
//	AirConditioner,
//	Light,
//	BDDVDRecoder,
//	BDDBDPlayer,
//	Audio,
//	Projector,
//	SetTopBox,
//	Fan,
//	AirCleaner,
//	PickUp,
//	FullCustom,
//	Unknown
//}

declare module Garage {
	/*
	* HUIS UI CREATOR のバージョン
	*/
	var APP_VERSION:string;
	/**
	 * Util.ElectronDialog のインスタンス
	 */
	var electronDialog: Util.ElectronDialog;
	/**
	 * Util.HuisFiles のインスタンス
	 */
	var huisFiles: Util.HuisFiles;
	/**
	 * Util.GarageFiles のインスタンス
	 */
	var garageFiles: Util.GarageFiles;

	/**
	 * face のページの横サイズ
	 */
	var HUIS_FACE_PAGE_WIDTH: number;
	/**
	 * face のページの縦サイズ
	 */
	var HUIS_FACE_PAGE_HEIGHT: number;
	/**
	 * HUIS が扱える face の最大数
	 */
	var MAX_HUIS_FILES: number;
	/**
	 * ローカル上の HUIS UI CREATOR のファイルの置き場所 (%appdata%/Garage/)
	 */
	var GARAGE_FILES_ROOT: string;
	/**
	 * ローカル上の HUIS ファイルの置き場所: (GARAGE_FILES_ROOT/HuisFiles)
	 */
	var HUIS_FILES_ROOT: string;
	/**
	 * ローカル上の HUIS ファイルディレクトリー内にある remoteimages のパス
	 */
	var HUIS_REMOTEIMAGES_ROOT: string;
	/**
	 * HUIS の VID
	 */
	var HUIS_VID: number;
	/**
	 * HUIS の PID
	 */
	var HUIS_PID: number;
	/**
	 * HUIS のデバイスのルートパス
	 */
    var HUIS_ROOT_PATH: string;
    /**
	 * PC から HUIS への同期時のダイアログのパラメーター完了時のダイアログつき
	 */
    var DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS_WITH_DONE: DialogProps;
    /**
     * 新規リモコンが追加されたときのダイアログパラメーター
    */
    var DIALOG_PROPS_CREATE_NEW_REMOTE: DialogProps;
    /**
     * リモコンを削除した際のダイアログパラメーター
    */
    var DIALOG_PROPS_DELTE_REMOTE: DialogProps;
	/**
	 * HUIS から PC への同期時のダイアログのパラメーター
	 */
	var DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC: DialogProps;
	/**
	 * PC から HUIS への同期時のダイアログのパラメーター
	 */
	var DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS: DialogProps;
	/**
	 * HUIS と PC の差分チェック中のダイアログのパラメーター
	 */
	var DIALOG_PROPS_CHECK_DIFF: DialogProps;
	/**
	 * Util.MiscUtilのインスタンス
	 */
	var miscUtil: Util.MiscUtil;

	/**
	 * face のページの横サイズ
	 */
	var HUIS_FACE_PAGE_WIDTH: number;
	/**
	 * face のページの縦サイズ
	 */
	var HUIS_FACE_PAGE_HEIGHT: number;
	/**
	 * HUIS が扱える face の最大数
	 */
	var MAX_HUIS_FILES: number;
	/**
	 * ローカル上の HUIS UI CREATOR のファイルの置き場所 (%appdata%/Garage/)
	 */
	var GARAGE_FILES_ROOT: string;
	/**
	 * ローカル上の HUIS ファイルの置き場所: (GARAGE_FILES_ROOT/HuisFiles)
	 */
	var HUIS_FILES_ROOT: string;
	/**
	 * ローカル上の HUIS ファイルディレクトリー内にある remoteimages のパス
	 */
	var HUIS_REMOTEIMAGES_ROOT: string;
	/**
	 * HUIS の VID
	 */
	var HUIS_VID: number;
	/**
	 * HUIS の PID
	 */
	var HUIS_PID: number;
	/**
	 * HUIS のデバイスのルートパス
	 */
    var HUIS_ROOT_PATH: string;
    /**
	 * PC から HUIS への同期時のダイアログのパラメーター完了時のダイアログつき
	 */
    var DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS_WITH_DONE: DialogProps;
    /**
     * 新規リモコンが追加されたときのダイアログパラメーター
    */
    var DIALOG_PROPS_CREATE_NEW_REMOTE: DialogProps;
    /**
     * リモコンを削除した際のダイアログパラメーター
    */
    var DIALOG_PROPS_DELTE_REMOTE: DialogProps;
	/**
	 * HUIS から PC への同期時のダイアログのパラメーター
	 */
	var DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC: DialogProps;
	/**
	 * PC から HUIS への同期時のダイアログのパラメーター
	 */
	var DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS: DialogProps;
	/**
	 * HUIS と PC の差分チェック中のダイアログのパラメーター
	 */
	var DIALOG_PROPS_CHECK_DIFF: DialogProps;
	/**
	 * ページの背景の領域
	 */
	var HUIS_PAGE_BACKGROUND_AREA: IArea;
	/**
	 * 画像アイテムとして画像を追加するときの編集パラメーター
	 */
	var IMAGE_EDIT_PARAMS: Model.IImageEditParams;
	/**
	 * ページの背景として画像を追加するときの編集パラメーター
	 */
    var IMAGE_EDIT_PAGE_BACKGROUND_PARAMS: Model.IImageEditParams;
	/**
	 * ヘルプサイトのURL
	 */
    var HELP_SITE_URL: string;
    /**
     * Debug Modeかどうかのフラグ
     */
    var DEBUG_MODE: Boolean;
	/**
	 * HUISが接続されているかどうかのフラグ
	 */
    var isHUISConnected: Boolean;
	/**
	 * アプリの名称
	 */
	var PRODUCT_NAME: string;

	/*
	* EDITの詳細編集エリア プレビューの高さの最小
	*/
	var MIN_HEIGHT_PREVIEW: number;
	/**
	* Garageで表示するテキストの表示上の減衰率
	* Garageの30pxとHUISでの30pxでは見た目の大きさが大きく異なる。
	* RATIO_TEXT_SIZE_HUIS_GARAGE = HUISで表示するのと同じにみえる text_size / 実際のtext size(ex 23px / 30px
	*/
	var RATIO_TEXT_SIZE_HUIS_GARAGE_BUTTON: number;
	var RATIO_TEXT_SIZE_HUIS_GARAGE_LABEL: number;

	/**
	* HUISで利用されているデバイスタイプ
	*/
	var DEVICE_TYPE_TV: string; 
	var DEVICE_TYPE_AC: string;
	var DEVICE_TYPE_LIGHT: string;
	var DEVICE_TYPE_AUDIO: string;
	var DEVICE_TYPE_PLAYER: string;
	var DEVICE_TYPE_RECORDER: string;
	var DEVICE_TYPE_PROJECTOR: string;
	var DEVICE_TYPE_STB: string;
	var DEVICE_TYPE_FAN: string;
	var DEVICE_TYPE_AIR_CLEANER: string;
	var DEVICE_TYPE_CUSOM: string;
	var DEVICE_TYPE_FULL_CUSTOM: string;
	var DEVICE_TYPE_BT: string;

	/**
	* PalletAreaで表示されないデバイスタイプ
	*/
	var NON_SUPPORT_DEVICE_TYPE_IN_EDIT: string[];

	/*
	* CanvasAreaのグリッドサイズ
	*/
	var GRID_AREA_WIDTH: number;
	var GRID_AREA_HEIGHT: number;
	var BIAS_X_DEFAULT_GRID_LEFT :number  //デフォルトグリッドの際は左にあるマージン
    var BIAS_X_DEFAULT_GRID_RIGHT :number;//デフォルトグリッドの際は左にあるマージン	
    var DEFAULT_GRID: number; //デフォルトのグリッドサイズ

	/*
	* Windowの最小幅・高さ
	*/
	var WINDOW_MIN_WIDTH: number;
	var WINDOW_MIN_HEIGHT: number;
	/*
	* リモコンの背景の大きさ
	*/
	var REMOTE_BACKGROUND_WIDTH: number;
	var REMOTE_BACKGROUND_HEIGHT: number;
	/*
	* 設定できる画像の容量の最大値[byte]
	*/
	var MAX_IMAGE_FILESIZE: number;
	/*
	* EDIT画面で、マウスを動かせる範囲。
	* Windowの端から何ピクセルか
	*/
	var MARGIN_MOUSEMOVALBE_TOP: number;
	var MARGIN_MOUSEMOVABLE_LEFT: number;
	var MARGIN_MOUSEMOVABLE_RIGHT: number;
	var MARGIN_MOUSEMOVALBE_BOTTOM: number;
	

}


declare var Remote: any; //! remote module
declare var Menu: any; //! menu module
declare var MenuItem: any; //! menu-item module
declare var app: any; //! app module