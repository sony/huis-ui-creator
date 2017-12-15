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


/// <reference path="../../modules/include/frameworks.d.ts" />
/// <reference path="../../modules/include/node.d.ts" />
/// <reference path="../../modules/include/fs-extra.d.ts" />
/// <reference path="../../modules/include/pixi.d.ts" />
/// <reference path="../../modules/include/zip.js.d.ts" />

/// <reference path="../Util/HuisFiles.ts" />
/// <reference path="../Util/HuisDev.ts" />
/// <reference path="../Util/MiscUtil.ts" />
/// <reference path="../Util/ElectronDialog.ts" />
/// <reference path="../Util/SelectRemotePageDialog.ts" />
/// <reference path="../Util/JQueryUtils.ts" />
/// <reference path="../Util/ButtonDeviceInfoCache.ts" />
/// <reference path="../Util/ZipManager.ts" />
/// <reference path="../Util/StorageLock.ts" />
/// <reference path="../Model/OffscreenEditor.ts" />
/// <reference path="../Model/Module.ts" />
/// <reference path="../Model/File/PhnConfig.ts" />
/// <reference path="../Model/File/SharedInfo.ts" />
/// <reference path="../Model/Version/VersionString.ts" />
/// <reference path="../Model/Version/AppVersionString.ts" />
/// <reference path="../Model/Version/HuisVersionString.ts" />
/// <reference path="../Model/Version/ModuleVersionString.ts" />
/// <reference path="../Util/ExportManager.ts" />
/// <reference path="../Util/ImportManager.ts" />
/// <reference path="../Util/InformationDialog.ts" />
/// <reference path="../Util/ItemClipboard.ts" />
/// <reference path="../Util/PhnConfigFile.ts" />

/**
 * @interface IPhnConfig
 * @brief 
 */
interface IPhnConfig {
    home_id: string;
    scene_no: number;
    enable_vertical_remote_page_swipe: boolean;
    enable_horizontal_remote_page_swipe: boolean;
    display_remote_arrow: boolean;
    display_setting_button: boolean;
    display_add_button: boolean;
}

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

interface IAppInfo {
    system: {
        next_remote_id_: string;
    }
}

interface ISharedInfo {
    system: {
        version: string;
        win_required_version: string;
        mac_required_version: string;
        is_btob: boolean;
    },
    color: {
        model_color: string;
        setting_color: string;
    }
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
    interval?: number; // マクロ時の送信間隔。
    [x: string]: any;
    /**
     * Bluetooth通信用の情報
     */
    bluetooth_data?: IBluetoothData;
    /**
     * 任意リモコンページへの遷移機能情報
     */
    jump?: IJump;
    /**
     * ボタンがひも付けられている機器の情報
     */
    deviceInfo?: IButtonDeviceInfo;
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
 * @interface IBluetoothData
 */
interface IBluetoothData {
    /**
     * 通信相手のBluetooth機器の情報
     */
    bluetooth_device: IBluetoothDevice;
    /**
     * 通信するデータの内容（生データではなくfunction）
     */
    bluetooth_data_content: string;
}

/**
 * @interface IBluetoothDevice
 */
interface IBluetoothDevice {
    /**
     * 管理されているBluetoothペアリング機器リストのID
     */
    bluetooth_device_id: number;
    /**
     * Bluetoothデバイスのアドレス
     */
    bluetooth_address: string;
    /**
     * Bluetoothプロトコルの種類
     */
    bluetooth_device_type: string;
    /**
     * Bluetoothの機器の種類
     */
    bluetooth_device_product_type: string;
    /**
     * Bluetoothデバイスの名前
     */
    bluetooth_device_name: string;
}

/**
 * @interface IJump
 */
interface IJump {
    /**
     * 遷移先リモコンのremote_id
     */
    remote_id: string;
    /**
     * 遷移先のシーンNo.
     */
    scene_no: number;
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
    id: string; // ボタン識別子
    remoteName?: string;  // もともとのボタンのリモコン名
    functions: string[]; // ボタンがひも付けられている機器で使用できる機能
    code_db: ICodeDB; // ボタンがひも付けられている機器の情報
    bluetooth_data?: IBluetoothData; // Bluetooth通信用の情報
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
* @interface
* @brief ハッシュを疑似的に実現する
*/
interface IStringKeyValue {
    key: string;
    value: string;
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
     * テキストの色 (black, white, setting)
     */
    color: string;
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
 * @interface IImage
 * @brief HUIS の module ファイルにおける image にあたる
 */
interface IImage {
    area: IArea;
    path: string;
    garage_extensions?: IGarageImageExtensions;
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
    group?: IGroup;
}

/**
 * @interface IGroup
 * @brief HUIS の moduleのgroup情報
 */
interface IGroup {
    name: string;
    original_remote_id: number;
}

/**
 * HUIS の face ファイルの内容
 * @interface IFace
 */
interface IFace {
    name: string;
    category: string;
    modules: IModule[];
    color: string;
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
/*
* @inteface IRemoteInfo
* brief HuisFilesでおもに利用するリモコンの基礎情報
*/
interface IRemoteInfo {
    remoteId: string;
    face: Garage.Model.Face;
    mastarFace?: Garage.Model.Face;
}

declare module Garage {
    /*
    * HUIS UI CREATOR のバージョン
    */
    var APP_VERSION: string;
    /**
     * Util.ElectronDialog のインスタンス
     */
    var electronDialog: Util.ElectronDialog;
    /**
     * Util.StorageLock のインスタンス
     */
    var storageLock: Util.StorageLock;
    /**
     * Model.SharedInfo のインスタンス
     */
    var sharedInfo: Model.SharedInfo;
    /**
     * Util.HuisFiles のインスタンス
     */
    var huisFiles: Util.HuisFiles;
    /**
     * face のページの横サイズ
     */
    var HUIS_FACE_PAGE_WIDTH: number;
    /**
     * face のページの縦サイズ
     */
    var HUIS_FACE_PAGE_HEIGHT: number;
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
     * ローカル上の HUIS ファイルディレクトリー内にある画像用ディレクトリ名
     */
    var REMOTE_IMAGES_DIRECTORY_NAME: string;
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
     * 既存リモコンをコピーして編集を開始したときのダイアログパラメーター
     */
    var DIALOG_PROPS_COPY_AND_EDIT_REMOTE: DialogProps;
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
     * 処理が完了してから、ダイアログが消えるまでの時間
     */
    var DURATION_DIALOG_CLOSE: number;
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
     * アプリの名称
     */
    var PRODUCT_NAME: string;

    /**
    * Garageで表示するテキストの表示上の減衰率
    * Garageの30pxとHUISでの30pxでは見た目の大きさが大きく異なる。
    * RATIO_TEXT_SIZE_HUIS_GARAGE = HUISで表示するのと同じにみえる text_size / 実際のtext size(ex 23px / 30px
    *
    * 一定の値では、HUISと同じ見え方にはならないので、関数で、補正する。
    * そのための定数として、ここに定義する。
    *  MIN_TEXT_SIZE:テキストの最小サイズ
    *  GAIN_TEXT_SIZE_OFFSET_FUNC :関数の減少ゲイン
    */
    var RATIO_TEXT_SIZE_HUIS_GARAGE_BUTTON: number;
    var RATIO_TEXT_SIZE_HUIS_GARAGE_LABEL: number;
    var MIN_TEXT_SIZE: number;
    var GAIN_TEXT_BUTTON_SIZE_OFFSET_FUNC: number;
    var GAIN_TEXT_LABEL_SIZE_OFFSET_FUNC: number;

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
    var DEVICE_TYPE_CUSTOM: string;
    var DEVICE_TYPE_FULL_CUSTOM: string;
    var DEVICE_TYPE_BT: string;
    var DEVICE_TYPE_SPECIAL: string;
    /** デバイスタイプ 学習リモコン */
    var DEVICE_TYPE_LEARNED: string;
    var DEVICE_TYPE_AUTO_LAYOUT: string;

    var FACE_TYPE_FULL_CUSTOM: string;
    var FACE_TYPE_NOT_FULL_CUSTOM: string;
    var DEVICE_TYPE_COMMON: string;// macroやjumpボタン用。本来の意味でのdeviceTypeでない。

    /**
    * DetailAreaの機能に表示されないデバイスタイプ
    */
    var NON_SUPPORT_DEVICE_TYPE_IN_EDIT: string[];

    /**
     * PalletAreaで表示されないデバイスタイプ
     */
    var NON_SUPPORT_FACE_CATEGORY: string[];
    /**
     * Macroで利用できないデバイスタイプ
     */
    var NON_SUPPORT_DEVICE_TYPE_IN_MACRO: string[];
    /**
     * CanvasAreaのグリッドサイズ
     */
    var GRID_AREA_WIDTH: number;
    var GRID_AREA_HEIGHT: number;
    var BIAS_X_DEFAULT_GRID_LEFT: number  //デフォルトグリッドの際は左にあるマージン
    var BIAS_X_DEFAULT_GRID_RIGHT: number;//デフォルトグリッドの際は左にあるマージン    
    var DEFAULT_GRID: number; //デフォルトのグリッドサイズ

    /**
     * Windowの最小幅・高さ
     */
    var WINDOW_MIN_WIDTH: number;
    var WINDOW_MIN_HEIGHT: number;
    /**
     * リモコンの背景の大きさ
     */
    var REMOTE_BACKGROUND_WIDTH: number;
    var REMOTE_BACKGROUND_HEIGHT: number;
    /**
     * 設定できる画像の容量の最大値[byte]
     */
    var MAX_IMAGE_FILESIZE: number;
    /**
     * EDIT画面で、マウスを動かせる範囲。
     * Windowの端から何ピクセルか
     */
    var MARGIN_MOUSEMOVALBE_TOP: number;
    var MARGIN_MOUSEMOVABLE_LEFT: number;
    var MARGIN_MOUSEMOVABLE_RIGHT: number;
    var MARGIN_MOUSEMOVALBE_BOTTOM: number;
    /**
     * ステートの内容を変更する際の特殊 ID
     */
    var TARGET_ALL_STATE: number;
    /**
     * ダブルクリックの待ち受け時間
     */
    var DOUBLE_CLICK_TIME_MS: number;
    /**
     * マクロに登録できる信号の最大数
     */
    var MAX_NUM_MACRO_SIGNAL: number;
    /**
     * 設定できるアクションリスト
     */
    var ACTION_INPUTS: IStringKeyValue[];
    var ACTION_INPUTS_MACRO: IStringKeyValue[]; //macro用
    var ACTION_INPUTS_JUMP: IStringKeyValue[]; //jump用
    var ACTION_INPUT_TAP_KEY: string;
    var ACTION_INPUT_LONG_PRESS_KEY: string;
    var ACTION_INPUT_LONG_PRESS_KEY_SINGLE: string;
    var ACTION_INPUT_FLICK_UP_KEY: string;
    var ACTION_INPUT_FLICK_RIGHT_KEY: string;
    var ACTION_INPUT_FLICK_LEFT_KEY: string;
    var ACTION_INPUT_FLICK_DOWN_KEY: string;
    var ACTION_INPUT_TAP_VALUE: string;
    var ACTION_INPUT_LONG_PRESS_VALUE: string;
    var ACTION_INPUT_FLICK_UP_VALUE: string;
    var ACTION_INPUT_FLICK_RIGHT_VALUE: string;
    var ACTION_INPUT_FLICK_LEFT_VALUE: string;
    var ACTION_INPUT_FLICK_DOWN_VALUE: string;
    var ACTION_INPUT_SWIPE_UP_VALUE: string;
    var ACTION_INPUT_SWIPE_RIGHT_VALUE: string;
    var ACTION_INPUT_SWIPE_LEFT_VALUE: string;
    var ACTION_INPUT_SWIPE_DOWN_VALUE: string;

    /**
     * マクロボタンの順番交換アニメの長さ[ms]
     */
    var DURATION_ANIMATION_EXCHANGE_MACRO_SIGNAL_ORDER: number;
    /**
     * 信号を削除する際のアニメの長さ[ms]
     */
    var DURATION_ANIMATION_DELTE_SIGNAL_CONTAINER: number;
    /**
     * 信号を追加する際のアニメの長さ[ms]
     */
    var DURATION_ANIMATION_ADD_SIGNAL_CONTAINER: number;
    /**
     * ボタン追加時、削除・並び替えボタンを一時表示する期間[ms]
     */
    var DURATION_ANIMATION_SHOW_SIGNAL_CONTAINER_CONTROLL_BUTTONS: number;
    /**
     * インポート・エクスポート する際に仕様する拡張子
     */
    var EXTENSION_HUIS_IMPORT_EXPORT_REMOTE: string;
    /**
     * インポート・エクスポート する際に仕様する拡張子（BtoB版）
     */
    var EXTENSION_HUIS_IMPORT_EXPORT_REMOTE_B2B
    /**
     * インポート・エクスポート用拡張子の日本語の説明
     */
    var DESCRIPTION_EXTENSION_HUIS_IMPORT_EXPORT_REMOTE: string;
    /**
     * リモコンが見つからない場合を表す定数
     */
    var UNKNOWN_REMOTE: string;
    var UNKNOWN_REMOTE_TV: string;
    var UNKNOWN_REMOTE_AC: string;
    var UNKNOWN_REMOTE_LIGHT: string;
    var UNKNOWN_REMOTE_AUDIO: string;
    var UNKNOWN_REMOTE_PLAYER: string;
    var UNKNOWN_REMOTE_RECORDER: string;
    var UNKNOWN_REMOTE_PROJECTOR: string;
    var UNKNOWN_REMOTE_STB: string;
    var UNKNOWN_REMOTE_FAN: string;
    var UNKNOWN_REMOTE_BT: string;

    /** 信号名と連番を分ける区切り文字 */
    var FUNC_NUM_DELIMITER: string;

    /** 信号がフルカスタムで再学習されたことを示すコード */
    var FUNC_CODE_RELEARNED: string;
}


declare var Remote: any; //! remote module
declare var Menu: any; //! menu module
declare var MenuItem: any; //! menu-item module
declare var app: any; //! app module
declare var node_crypt: any;
