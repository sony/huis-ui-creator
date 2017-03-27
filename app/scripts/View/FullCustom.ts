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
/// <reference path="FullCustomCommand.ts" />
/// <reference path="BasePage.ts" />
module Garage {
    export module View {

        import Framework = CDP.Framework;
        import UI = CDP.UI;
        import Tools = CDP.Tools;
        import JQUtils = Util.JQueryUtils;

        var TAG: string = "[Garage.View.FullCustom] ";
        var HUIS_FILES_DIRECTORY = "app/res/samples/materials";

        interface IActionList {
            touch: string;
            touch_top: string;
            touch_bottom: string;
            touch_right: string;
            touch_left: string;
            long_press: string;
            swipe_up: string;
            swipe_down: string;
            swipe_right: string;
            swipe_left: string;
            ring_right: string;
            ring_left: string;
        }

        interface IStateDetail extends Model.ButtonState {
            actionList?: IActionList;
            actionListTranslate?: IActionList;
        }

        /**
         * @class FullCustom
         * @brief FullCustom View class for Garage.
         */
        class FullCustom extends BasePage {
            private FILE_NAME = "FullCustom.ts";
            private faceRenderer_pallet_: FaceRenderer;
            private faceRenderer_canvas_: FaceRenderer;

            private templateFullCustomFile_: string;
            private templateItemDetailFile_: string;
            private itemResizerTemplate_: Tools.JST;
            private newRemote_: boolean; //<! リモコン新規作成かどうか

            private faceListScrollLeft_: number;
            private faceListTotalWidth_: number;
            private faceListContainerWidth_: number;

            private commandManager_: CommandManager;
            private $currentTarget_: JQuery;
            private $currentTargetDummy_: JQuery;
            private currentItem_: Model.Item;
            private currentTargetPageIndex_: number;
            private currentTargetButtonStates_: IStateDetail[];
            private currentTargetButtonStatesUpdated_: boolean;
            private selectedResizer_: string;
            private mouseMoveStartTargetPosition_: Model.Position;
            private mouseMoveStartPosition_: Model.Position;
            private mouseMoveStartTargetArea_: IArea;
            private mouseMoving_: boolean;
            private gridSize_: number;
            private minItemSize_: number;
            private isTextBoxFocused: Boolean;
            private isDragging: Boolean;
            private clipboard: Util.ItemClipboard;
            private delayedContextMenuEvent: Event;
            private isMouseDown: Boolean;

            private bindedLayoutPage = null;
            //マクロのプロパティView用
            private macroProperty: PropertyAreaButtonMacro;
            //通常ボタンのプロパティView用
            private buttonProperty: PropertyAreaButtonNormal;
            private jumpProperty: PropertyAreaButtonJump;

            private buttonDeviceInfoCache: Util.ButtonDeviceInfoCache;

            private palletItemMouseDownCount: number = 0;
            private clickedPalletItem: JQuery;
            private palletItemDoubleClickResetTimer;


            /**
             * construnctor
             */
            constructor() {
                super("/templates/full-custom.html", "page-full-custom", { route: "full-custom" });
            }

            ///////////////////////////////////////////////////////////////////////
            // Override: UI.PageView

            //! page initialization event
            onInitialize(event: JQueryEventObject): void {
                super.onInitialize(event);

                this.faceListScrollLeft_ = 0;
                this.faceListTotalWidth_ = 0;
                this.faceListContainerWidth_ = 0;
                this.gridSize_ = DEFAULT_GRID;
                this.minItemSize_ = DEFAULT_GRID;
                this.clipboard = new Util.ItemClipboard(this.gridSize_);
            }

            onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData) {
                requirejs(["garage.view.fullcustomcommand"], () => {

                    super.onPageShow(event, data);
                    this.macroProperty = null;
                    this.buttonProperty = null;
                    this.jumpProperty = null;
                    this.newRemote_ = false;

                    this.templateFullCustomFile_ = Framework.toUrl("/templates/full-custom.html");
                    this.templateItemDetailFile_ = Framework.toUrl("/templates/item-detail.html");

                    this._pageLayout();
                    this._listupFaces();

                    //書き出し待ち の画像リストを初期化する。
                    //(エクスポートの仕方によっては、前に編集した画面の書き出し待ちリストが残る可能性がある。)
                    huisFiles.initWatingResizeImages();

                    var remoteId = this._getUrlQueryParameter("remoteId");
                    this._renderCanvas(remoteId);

                    // ページ数が最大の場合はページ追加ボタンを無効化する
                    if (this.faceRenderer_canvas_.isPageNumMax()) {
                        this.setAddPageButtonEnabled(false);
                    }

                    var gmodules = this.faceRenderer_canvas_.getModules();

                    // ボタンに設定された信号名を基リモコンに合わせる
                    huisFiles.applyNumberedFunctionName(gmodules);

                    this.buttonDeviceInfoCache = new Util.ButtonDeviceInfoCache(HUIS_FILES_ROOT, this.faceRenderer_canvas_.getRemoteId());
                    this.buttonDeviceInfoCache.load(gmodules);
                    // ボタンに設定された信号名をキャッシュに合わせる
                    huisFiles.applyCachedFunctionName(gmodules);

                    this.itemResizerTemplate_ = Tools.Template.getJST("#template-item-resizer", this.templateFullCustomFile_);

                    //this._pageLayout.bind(this)をすると、新しいオブジェクトを返すので、off("resize", )の際にも使うため、メンバーに記憶する
                    //bind(this)することで、thisを _pageLayout に渡せる。bindがないとが thisが他のポイントをさせる。
                    this.bindedLayoutPage = this._pageLayout.bind(this);
                    $(window).on("resize", $.proxy(this.bindedLayoutPage, this));

                    this.currentWindow_ = Remote.getCurrentWindow();
                    // コンテキストメニュー
                    this.contextMenu_ = new Menu();

                    // CommandManager の初期化
                    if (this.commandManager_) {
                        this.commandManager_.reset();
                    } else {
                        this.commandManager_ = new CommandManager();
                    }

                    this.mouseMoveStartPosition_ = new Model.Position(0, 0);
                    this.mouseMoveStartTargetPosition_ = new Model.Position(0, 0);
                    this.clipboard.clear();

                    //テキストフィールドにフォーカス
                    var $remoteName: JQuery = $("#input-face-name");
                    this.setFocusAndMoveCursorToEnd($remoteName);

                    this.isTextBoxFocused = false;
                    this.isDragging = false;

                    this.isMouseDown = false;
                    this.delayedContextMenuEvent = null;

                    // NEW(remoteId === undefined)の場合ドロップダウンメニューの項目から
                    // 「このリモコンを削除」とセパレータを削除する
                    if (remoteId == undefined) {
                        $("li#command-delete-remote").remove();
                    }

                   

                    //html上の文言をローカライズ
                    $("#page-title-edit").html($.i18n.t("edit.STR_EDIT_TITLE"));
                    $("#button-add-page").html($.i18n.t("edit.canvas.STR_EDIT_CANVAS_NEW_PAGE_BTN"));

                });
            }

            onPageBeforeHide(event: JQueryEventObject, data?: Framework.HideEventData) {
                let FUNCTION_NAME = TAG + "onPageBeforeHide :";

                if (this.bindedLayoutPage == null) {
                    console.warn(FUNCTION_NAME + "this.bindedLayoutPage is null");
                    $(window).off("resize", this._pageLayout);
                } else {
                    $(window).off("resize", this.bindedLayoutPage);
                }
                
                super.onPageBeforeHide(event, data);
            }

            events(): any {
                var ret: any = {};
                ret = super.events();

                return $.extend(ret, {
                    // パレット内のアイテムのダブルクリック
                    //"dblclick #face-pallet .item": "onPalletItemDblClick",
                    "mousedown #face-pallet .item": "onPalletItemMouseDown",

                    "mousedown #face-pages-area .item": "onCanvasItemMouseDown",
                    "mousedown #face-pages-area": "onFacePagesAreaMouseDown",
                    "mousedown #face-item-detail-area": "onItemDetailAreaMouseDown",

                    // 画面内のマウスイベント
                    "mousedown #main": "onMainMouseDown",
                    "mousemove #main": "onMainMouseMove",
                    "mouseup #main": "onMainMouseUp",

                    // キャンバスのページスクロール
                    "scroll #face-canvas #face-pages-area": "onCanvasPageScrolled",
                    "scroll #face-pallet #face-pages-area": "onPalletPageScrolled",

                    // キャンバス内のページ追加ボタン
                    "click #button-add-page": "onAddPageButtonClicked",

                    //キャンバス内のボタンアイテムをhover
                    "mouseenter #face-canvas #face-pages-area .button-item ": "onHoverButtonItemInCanvas",
                    "mouseleave #face-canvas #face-pages-area .button-item ": "onHoverOutButtonItemInCanvas",
                    "mouseleave #canvas-tooltip" : "onHoverOutTooltip",

                    // 詳細編集エリアのイベント
                    "change #face-item-detail input": "onItemPropertyChanged",
                    'change #input-face-name ': "onRemoteNameTextFieldChanged",
                    "change #face-item-detail select": "onItemPropertySelectChanged",
                    "click #face-item-detail .custom-select": "onItemPropertySelectClicked",
                    "mousedown [id$='-listbox']": "onSelectMenuMouseDown",

                    "click #refer-image": "onReferImageClicked",
                    "click .refer-state-image": "onReferImageClicked",
                    "click #delete-background-image": "onDeleteImageClicked",
                    "click .delete-state-image": "onDeleteImageClicked",
                    "click #add-state": "onAddButtonStateClicked",
                    "click .remove-state": "onRemoveButtonStateClicked",

                    //画像変更用popup
                    "click #edit-image-or-text": "onEditImageButtonClicked",
                    "click #edit-image-background": "onEditImageBackgroundClicked",
                    "click #edit-image-non-button-image": "onEditImageNonButtonImageClicked",
                    "click #command-change-button-image": "onEditImageButtonInPopupClicked",
                    "click #command-change-button-text": "onEditTextButtonInPopupClicked",

                    //リモコン名編集用のテキストフィールド
                    "click #input-face-name" : "onRemoteNameTextFieldClicked",

                    // 編集完了ボタン
                    "click #button-edit-done": "onEditDoneButtonClicked",
                    // 戻るボタン
                    "click #button-edit-back": "onBackButtonClicked",
                    // ショートカットキー
                    "keydown": "_onKeyDown",
                    // プルダウンメニュー
                    "click #option-pulldown-menu": "_onOptionPullDownMenuClick",
                    // コンテキストメニュー
                    "contextmenu": "onContextMenu",

                    // プルダウンメニューのリスト
                    "click #command-export-remote": "_onCommandExportRemote",
                    "vclick #command-delete-remote": "_onCommandDeleteRemote",
                    "vclick #command-about-this": "_onCommandAboutThis",
                    "vclick #command-visit-help": "_onCommandVisitHelp",
                    


                    // テキストボックスへのfocusin/out　テキストボックスにfocusされている場合はBS/DELキーでの要素削除を抑制する
                    "focusin input[type='text']": "_onTextBoxFocusIn",
                    "focusout input[type='text']": "_onTextBoxFocusOut",
                });
            }

            /*
             * ヘッダー上のオプションメニューボタンが押された際のイベントハンドリング
             */
            private _onOptionPullDownMenuClick(event: Event) {
                 //表示するメニューのJQuery要素
                let $popup = this.$page.find("#option-pulldown-menu-popup"); 
                this.showOptionPullDownMenu($popup);
            }

            render(): FullCustom {
                // Please add your code
                return this;
            }

            /*
             * オプションメニューの「リモコンをエクスポート」を押したさいの処理

             */
            private _onCommandExportRemote(event: Event) {
                let remoteId = this.faceRenderer_canvas_.getRemoteId();
                let face: Model.Face = huisFiles.getFace(remoteId);

                //errorハンドリング
                let errorOccur: boolean = this._isErrorOccurBeforeSave(true);
                if (errorOccur) {
                    return;
                }

                this.exportRemote(face);
            }


            /*
            * テキストエリアにフォーカスを移し、カーソルを末尾に移動する。
            */
            private setFocusAndMoveCursorToEnd($target) {
                var FUNCTION_NAME = "setFocusAndMoveCursorToEnd";

                if (_.isUndefined($target)) {
                    console.log(FUNCTION_NAME + ": $target is Undefined");
                    return;
                }

                if ($target.attr('type') !== "text") {
                    console.log(FUNCTION_NAME + ": $target is not input[text]");
                    return;
                }

                var remoteName: string = $target.val();
                $target.val("");
                $target.focus();
                $target.val(remoteName);

                this.isTextBoxFocused = true;
            }


            /**
             * 画面のレイアウト。
             * ウィンドウリサイズされたときも呼び出される。
             */
            private _pageLayout() {
                const PALLET_AREA_WIDTH_MIN = 320;
                const PALLET_AREA_WIDTH_MAX = 640;
                const PALLET_AREA_HEIGHT_MIN = 640;
                const EDIT_AREA_WIDTH_MIN = 640;
                const EDIT_AREA_HEIGHT_MIN = 640;
                var windowWidth = innerWidth;
                var windowHeight = innerHeight;

                var mainHeight = innerHeight - $("#main").offset().top;

                if (this != null) {
                    this.closeAllPopups();
                }

                let facePalletArea = {
                    width: PALLET_AREA_WIDTH_MIN,
                    height: PALLET_AREA_HEIGHT_MIN < mainHeight ? mainHeight : PALLET_AREA_HEIGHT_MIN
                };
                // パレットエリアの width はウィンドウの width の 40% とするが、
                // 最大サイズと最小サイズを考慮する
                let windowWidth40per = Math.round(windowWidth * 0.4);
                if (PALLET_AREA_WIDTH_MIN < windowWidth40per) {
                    if (windowWidth40per < PALLET_AREA_WIDTH_MAX) {
                        facePalletArea.width = windowWidth40per;
                    } else {
                        facePalletArea.width = PALLET_AREA_WIDTH_MAX;
                    }
                }

                // エディットエリアの width はウィンドウの width からパレットエリアの width を引いたもの
                // ただし、エディットエリアの　width の最小サイズを考慮する
                let faceEditArea = {
                    width: EDIT_AREA_WIDTH_MIN < windowWidth - facePalletArea.width ? windowWidth - facePalletArea.width : EDIT_AREA_WIDTH_MIN,
                    height: EDIT_AREA_HEIGHT_MIN < mainHeight ? mainHeight : EDIT_AREA_HEIGHT_MIN
                };

                $("#main").css({
                    width: innerWidth + "px",
                    height: mainHeight + "px"
                });

                /* キャンバス部分の座標の指定 */
                let faceCanvasAreaWidth = $("#face-canvas-area").width();
                let faceCanvasAreaLeft = (windowWidth/2) - (faceCanvasAreaWidth/2);
                $("#face-canvas-area").css({
                    left: faceCanvasAreaLeft + "px"
                });

                /* 詳細編集部分 */
                //詳細編集エリアのY座標
                let PROPATY_AREA_MARGIN_RIGHT = 100;
                let detailWidth = $("#face-item-detail-area").outerWidth();

                let detailLeft = faceCanvasAreaLeft - (PROPATY_AREA_MARGIN_RIGHT + detailWidth);
                $("#face-item-detail-area").css({
                    left: detailLeft + "px",
                });

                //パレットエリアのY座標
                let PALLET_AREA_MARGIN_LRFT = 44;
                let palletAreaLeft = faceCanvasAreaLeft + faceCanvasAreaWidth + PALLET_AREA_MARGIN_LRFT; 
                /* パレットエリア */
                $("#face-pallet-area").css({
                    left: palletAreaLeft + "px",
                });

                var facePalletMaxHeight = facePalletArea.height - 120;
                // pallet部分(pallet areaの中の、参照元のリモコンが表示されるエリア)は
               // パレットエリア内で左右均等に配置できるように。
                var $facePallet = $("#face-pallet");
                let facePalletWidth = $facePallet.width();
                let facePalletAreaWidth = $("#face-pallet-area").width();
                let facePalletLeft = (facePalletAreaWidth / 2) - (facePalletWidth / 2);
                $facePallet.css({
                    left: facePalletLeft
                });

                // faceList の更新
                if (this != null) {
                    this._layoutFacesList();
                }

                
            }

            /**
             * face canvas を作成する。
             */
            private _renderCanvas(remoteId?: string) {
                var $faceCanvasArea = $("#face-canvas-area");
                var face = remoteId ? huisFiles.getFace(remoteId) : null;
                if (face) {
                    this.faceRenderer_canvas_ = new FaceRenderer({
                        el: $faceCanvasArea,
                        attributes: {
                            face: face,
                            type: "canvas",
                            materialsRootPath: HUIS_FILES_DIRECTORY
                        }
                    });
                } else {
                    this.faceRenderer_canvas_ = new FaceRenderer({
                        el: $faceCanvasArea,
                        attributes: {
                            remoteId: huisFiles.createNewRemoteId(),
                            type: "canvas",
                            materialsRootPath: HUIS_FILES_DIRECTORY
                        }
                    });
                    this.newRemote_ = true;
                }

                this.faceRenderer_canvas_.render();

                this._setGridSize(this.gridSize_);


                this.currentTargetPageIndex_ = 0;

                // [TODO] Canvas 内の page scroll
                $faceCanvasArea.find("#face-pages-area").scroll((event: JQueryEventObject) => {
                    this.onCanvasPageScrolled(event);
                });
            }

            /**
             * HUIS 内の face の一覧を表示する
             */
            private _listupFaces() {
                // fullcustom と "Air conditioner" を除いた face 一覧を取得する
                // "Air conditioner" のボタンの形式が Garage では扱えないもののため 
                var faces = huisFiles.getFilteredFacesByCategories({ unmatchingCategories: Garage.NON_SUPPORT_FACE_CATEGORY });
                // faces データから face 一覧を作成し、face list に追加する
                var faceItemTemplate = Tools.Template.getJST("#template-face-item", this.templateFullCustomFile_);
                $("#face-item-list").append($(faceItemTemplate({ faces: faces })));

                // face list の左スクロールボタン
                var $listScrollLeft = $("#face-item-list-scroll-left");
                // face list の右スクロールボタン
                var $listScrollRight = $("#face-item-list-scroll-right");

                $listScrollLeft.addClass("disabled");
                $listScrollRight.addClass("disabled");


                // face list から face を選択すると、選択した face をパレットにをレンダリングする
                var $faceItem = $(".face-item");
                var $faceItemList = $("#face-item-list");

                $faceItem.on("click", (event: JQueryEventObject) => {
                    this._onFaceItemSelected($(event.currentTarget));
                });


                // face list のスクロール (左方向)
                $listScrollLeft.click(() => {
                    if ($listScrollLeft.hasClass("disabled")) {
                        return;
                    }
                    let faceItemListContainerWidth: number = $("#face-item-list-container").outerWidth();
                    //ヘッダー幅の半分移動する。
                    this.faceListScrollLeft_ -= faceItemListContainerWidth / 2;
                    this.disableScrollLeftButton();
                    $listScrollRight.removeClass("disabled");
                    $faceItemList.css("transform", "translateX(" + ((-1) * this.faceListScrollLeft_)+ "px)");
                });

                // face list のスクロール (右方向)
                $listScrollRight.click(() => {
                    if ($listScrollRight.hasClass("disabled")) {
                        return;
                    }

                    let faceItemListContainerWidth:number = $("#face-item-list-container").outerWidth();
                    //ヘッダー幅の半分移動する。
                    this.faceListScrollLeft_ += faceItemListContainerWidth/2;
                    this.disableScrollRightButton();                    
                    $listScrollLeft.removeClass("disabled");
                    $faceItemList.css("transform", "translateX(" + ((-1)*this.faceListScrollLeft_) + "px)");
                });

                this._layoutFacesList();

            }

            /*
            * パレットエリアの初期選択リモコンを設定
            */
            private selectFirstRemtoeInFaceList() {
                let $faceItems = $(".face-item");
                if (!$faceItems.hasClass("active")) {
                    //アニメの秒数を一度0にする
                    var animeValueTmp = $("#face-item-list").css("transition-duration");
                    $("#face-item-list").css("transition-duration", "0s");
                    if ($faceItems.length !== 1) {//初期状態で、一番左のリモコンを選択。
                        this._onFaceItemSelected($($faceItems[1]));
                    } else {//リモコンが一つもない場合はcommonを選択。
                        this._onFaceItemSelected($($faceItems[0]));
                    }
                    //アニメの秒数を戻す。
                    $("#face-item-list").css("transition-duration", animeValueTmp);
                }
            }

            /**
            * パレットエリアのface-itemが選択された際の処理
            * @ $clickedFaceItem 選択されたface-item:jQuery
            **/
            private _onFaceItemSelected($clickedFaceItem: JQuery) {
                var $faceItem = $(".face-item");
                var $faceItemList = $("#face-item-list");
                //選択したfaceItemを移動。
                this._moveSelectedFaceItemToCenterOfFaceList($clickedFaceItem);
                let remoteId: string = "" + JQUtils.data($clickedFaceItem, "remoteId"); //$clickedFaceItem.data("remoteId");
                $faceItem.removeClass("active");
                $clickedFaceItem.addClass("active");
                this._renderFacePallet(remoteId);
            }

            /**
            * 選択したfaceItemがfaceListの中央になるように移動
            * @ $clickedFaceItem 選択されたface-item:jQuery
            **/
            private _moveSelectedFaceItemToCenterOfFaceList($clickedFaceItem : JQuery) {
                var $faceItem = $(".face-item");
                var $faceItemList = $("#face-item-list");
                var $faceItemListContainer = $("#face-item-list-container");
                
                
                var FaceListWidth = $faceItemListContainer.width();

                //face-itemの現在の位置を取得する。
                var positionLeft: any = $clickedFaceItem.css("left").replace('px', '');
                //face-item-llistの中央の値との差分を算出
                this.faceListScrollLeft_ = positionLeft - (FaceListWidth / 2) + ($clickedFaceItem.outerWidth() / 2);
                var fineTuneLeft = $("#face-item-list-scroll-margin-left").width()/2; 
                this.faceListScrollLeft_ += fineTuneLeft;//face-listで隠れてる部分があるため、そのぶんずらす必要がある。
                this.disableScrollRightButton();
                this.disableScrollLeftButton();

                //差分分、移動する。
                $faceItemList.css("transform", "translateX(" + ((-1) * this.faceListScrollLeft_) + "px)");
            }

            /**
            * 右スクロールボタンの非表示判定
            */
            private disableScrollRightButton() {
                // face list の右スクロールボタン
                let $listScrollRight = $("#face-item-list-scroll-right");
                let faceListWidth = $("#face-item-list-container").width();
                let fineTuneLeft = $("#face-item-list-scroll-margin-left").width() / 2; //face-listで隠れてる部分があるため、そのぶんずらす必要がある。
                

                let $faceItems : JQuery= $("#face-item-list").find(".face-item");
                let $lastFaceItem : JQuery = $($faceItems[$faceItems.length - 1]);
                let lastFaceItemWidth = $lastFaceItem.outerWidth();

                let MAX_SCROLL_RIGHT = this.faceListTotalWidth_ - (faceListWidth / 2) + fineTuneLeft - (lastFaceItemWidth/2);//右端は最後のfacelist要素のが中央になる
                if (this.faceListScrollLeft_ >= MAX_SCROLL_RIGHT){
                    this.faceListScrollLeft_ = MAX_SCROLL_RIGHT;
                    $listScrollRight.addClass("disabled");
                } else {
                    $listScrollRight.removeClass("disabled");
                }
            }


            /**
           * 左スクロールボタンの非表示判定
           */
            private disableScrollLeftButton() {
                // face list の左スクロールボタン
                var faceListWidth = $("#face-item-list-container").width();
                var faceItemCommonWidth = $('.face-item[data-remote-id="common"]').outerWidth();
                var fineTuneLeft = $("#face-item-list-scroll-margin-left").width()/2; //face-listで隠れてる部分があるため、そのぶんずらす必要がある。

                var MIN_SCROLL_LEFT = -(faceListWidth / 2) + (faceItemCommonWidth / 2) + fineTuneLeft;//左端はCOMMONが中央になる
                var $listScrollLeft = $("#face-item-list-scroll-left");
                if (this.faceListScrollLeft_ <= MIN_SCROLL_LEFT) {
                    this.faceListScrollLeft_ = MIN_SCROLL_LEFT;
                    $listScrollLeft.addClass("disabled");
                } else {
                    $listScrollLeft.removeClass("disabled");
                }
            }

            /**
             * face list のレイアウトを行う
             */
            private _layoutFacesList() {
                // list の width を設定する
                setTimeout(() => {
                    let totalWidth = 0;
                    let $faceItems = $(".face-item");
                    let $listScrollLeft = $("#face-item-list-scroll-left");
                    let $listScrollRight = $("#face-item-list-scroll-right");
                    $faceItems.each((index: number, elem: Element) => {
                        $(elem).css("left", totalWidth + "px");
                        totalWidth += $(elem).outerWidth();
                        if ($faceItems.length - 1 <= index) {
                            $("#face-item-list").width(totalWidth);
                            this.faceListTotalWidth_ = totalWidth;
                            this.faceListContainerWidth_ = $("#face-item-list-container").width();
                            if (this.faceListContainerWidth_ < this.faceListTotalWidth_
                                && this.faceListContainerWidth_ != undefined
                                    && this.faceListTotalWidth_ != undefined ) {
                                $listScrollRight.removeClass("disabled");
                            }
                                
                            this.disableScrollLeftButton();
                            this.disableScrollRightButton();
                            $("#face-item-list").css("transform", "translateX(" +((-1)* this.faceListScrollLeft_ )+ "px)");
                            
                        }
                    }
                    );
                    this.selectFirstRemtoeInFaceList();
                }, 0);
            }

            /**
             * 指定した remoteId の face をパレットにレンダリングする
             */
            private _renderFacePallet(remoteId: string) {
                var $facePallet = $("#face-pallet");
                $facePallet.find("#face-pages-area").remove();

                var face: IGFace;
                if (remoteId === "common") {
                    face = huisFiles.getCommonFace();
                    $facePallet.addClass("common-parts");
                } else {
                    face = huisFiles.getFace(remoteId);
                    $facePallet.removeClass("common-parts");
                }

                this.faceRenderer_pallet_ = new FaceRenderer({
                    el: $facePallet,
                    attributes: {
                        face: face,
                        materialsRootPath: HUIS_FILES_DIRECTORY
                    }
                });
                this.faceRenderer_pallet_.render();

                //マスターフェースを表示する。Commonの場合は、無視
                let isMasterFace: boolean = true;
                let masterFace: IGFace = huisFiles.getFace(remoteId, isMasterFace);
                if (masterFace != null && remoteId != "common") {

                    //マスターフェースとの境界線にセパレーターを描画
                    let templateFile = CDP.Framework.toUrl("/templates/face-items.html");
                    let template: Tools.JST = Tools.Template.getJST("#template-separator-face-and-master", templateFile);
                    let $separator = $(template());
                    $facePallet.find("#face-pages-area").append($separator);

                    this.faceRenderer_pallet_.addFace(masterFace);

                    //テキストをローカライズ
                    $facePallet.i18n();
                }

                //それぞれのボタンにtitleを追加
                this.addTitleToEachItemInPallet();

                this._pageLayout();
                //スクロールイベント
                $facePallet.find("#face-pages-area").scroll((event: JQueryEventObject) => {
                    this.onPalletPageScrolled(event);
                });
                
                this.displayGradationInPalletArea(0, $facePallet.find("#face-pages-area"));
            }


            /**
             * PalletArea内のitemに、title要素を追加する。
             * 
             */
            private addTitleToEachItemInPallet() {
                var $itemsInPallet = $("#face-pallet").find(".face-page").find(".item");
                var STR_TOOLTIP_IN_PALLET = $.i18n.t("tooltip.STR_TOOLTIP_PALLET_ITEMS");
                $itemsInPallet.each((index: number, element: Element) => {
                    var $element = $(element);
                    $element.attr("title", STR_TOOLTIP_IN_PALLET);
                });
            }


            /**
             * URL クエリーパラメーターを取得する
             * 
             * @param key {string} URL クエリーパラメーターから取得したい値のキー
             * @return {string} 指定したキーの値。取得できない場合は undefined
             */
            private _getUrlQueryParameter(key: string): string {
                var urlParams = window.location.href.split("?");
                if (urlParams.length < 2) {
                    return undefined;
                }
                var search = urlParams[1];
                var queryParams = search.split("&");
                for (let i = 0, l = queryParams.length; i < l; i++) {
                    let paramElements = queryParams[i].split("=");
                    let paramKey = decodeURIComponent(paramElements[0]);
                    if (paramKey === key) {
                        return decodeURIComponent(paramElements[1]);
                    }
                }

                return undefined;
            }

            /**
             * パレット内のアイテムをダブルクリック
             */
            private onPalletItemDblClick() {
                let newItem: ItemModel = this.setPalletItemOnCanvas(this.clickedPalletItem, this.faceRenderer_pallet_);

                if (!newItem) {
                    console.error("failed to add new PalletItem");
                    return;
                }
                // model 状態を有効にする
                var memento: IMemento = {
                    target: newItem,
                    previousData: {
                        enabled: false
                    },
                    nextData: {
                        enabled: true
                    }
                };
                var mementoCommand = new MementoCommand([memento]);
                let updatedItem: ItemModel[] = this.commandManager_.invoke(mementoCommand);

                this._updateItemElementsOnCanvas(updatedItem);
                this._loseTarget();
            }

            /*
             * #face-item-detail-areaがクリックされた時のイベントハンドラ。
             */
            private onItemDetailAreaMouseDown(event: Event) {
                this.isMouseDown = true;
                // call stopPropagation so sa not to call loseTarget in onMainMouseDown
                event.stopPropagation();
            }

            /*
             * face-pages-area内のItem要素以外の部分がクリックされた時のイベントハンドラ。
             */
            private onFacePagesAreaMouseDown(event: Event) {
                this.isMouseDown = true;
                this._loseTarget();

                var mousePosition = new Model.Position(event.pageX, event.pageY);
                // マウスポインター位置にアイテムが存在しない場合で、
                // canvas 上のページモジュールを選択した場合は、ページの背景編集を行う
                let $page = this._getTargetPageModule(mousePosition);
                if ($page) {
                    // ページ背景の model の作成、もしくは既存のものを取得する
                    let backgroundImageModel: Model.ImageItem = this._resolvePageBackgroundImageItem($page);
                    this.currentItem_ = backgroundImageModel;
                    $("#face-item-detail-area").addClass("active");
                    // ページの背景の detail エリアを作成する
                    this._showDetailItemAreaOfPage($page);
                }
                event.stopPropagation();
            }

            /*
             * Canvas内のItem要素がクリックされた時のイベントハンドラ。
             */
            private onCanvasItemMouseDown(event: Event) {
                this.isMouseDown = true;

                this.selectedResizer_ = null;

                var mousePosition = new Model.Position(event.pageX, event.pageY);

                // 直前に選択していたものと同一のアイテムを選択しているかチェック
                var remainsTarget = this._remainsTarget(mousePosition);
                // 選択しているリサイザーをチェック
                var selectedResizer = this._checkResizerSelected(mousePosition);

                // マウスポインター位置が、選択中のターゲット上は、
                // ターゲットを外す
                if (!remainsTarget && !selectedResizer) {
                    // 直前に選択されていたボタンの状態更新があれば行う
                    this._updateCurrentModelButtonStatesData();

                    // 現在のターゲットを外す
                    this._loseTarget();

                    //CanvasのFacePagesArea上でない場合は反応しない
                    if (this.isOnCanvasFacePagesArea(mousePosition)) {
                        // マウスポインター位置にアイテムがあれば取得する
                        let $target = this._getTarget(mousePosition);
                        if ($target) {
                            this.setDragTarget($target);
                        }

                    }
                }
                if (remainsTarget) {
                    // 選択中のアイテムがボタンの場合、状態の更新を行う
                    this._updateCurrentModelButtonStatesData();
                }
                if (selectedResizer) {
                    this.selectedResizer_ = selectedResizer;
                    console.log(this.selectedResizer_);
                }

                this.startDraggingCanvasItem(mousePosition);
                event.stopPropagation();
            }

            /**
             * パレット内のアイテム上でマウス押下
             * 対象アイテムをCanvasに追加しドラッグ状態にする
             */
            private onPalletItemMouseDown(event: Event) {
                this.isMouseDown = true;
                this.countPalletItemClick(event);

                this.selectedResizer_ = null;

                // 直前に選択されていたボタンの状態更新があれば行う
                this._updateCurrentModelButtonStatesData();

                // 現在のターゲットを外す
                this._loseTarget();

                let item = $(event.currentTarget);
                let newItem: ItemModel = this.setPalletItemOnCanvas(item, this.faceRenderer_pallet_, this.getPointFromCanvas({ x: item.offset().left, y: item.offset().top }));
                if (!newItem) {
                    console.error("Failed to add the pallet item to the canvas.");
                    return;
                }
                this._updateItemElementOnCanvas(newItem);
                
                var mousePosition: Model.Position = new Model.Position(event.pageX, event.pageY);
                let target = this._getTarget(mousePosition);
                if (target) {
                    this.setDragTarget(target, false);
                    this.startDraggingCanvasItem(mousePosition, true);
                    // onMainMouseDown呼び出しの防止
                    event.stopPropagation();
                } else {
                    console.log("target not found. mousePosition: " + mousePosition.x + ", " + mousePosition.y);
                }
            }

            /**
             * パレットアイテムのクリック数を計測する。
             * @param event {Event} パレットアイテムのイベントオブジェクト
             */
            private countPalletItemClick(event: Event) {
                if (event.type === "mousedown") {
                    let currentTarget: JQuery = $(event.currentTarget);
                    if (!this.clickedPalletItem ||                                                              // クリック対象未設定 または
                        JQUtils.data(this.clickedPalletItem, "cid") !== JQUtils.data(currentTarget, "cid")) {   // 直前のクリックと対象が異なる場合
                        // ダブルクリック判定を初期化して開始
                        this.startPalletItemClickCount(currentTarget);
                    }

                    this.palletItemMouseDownCount++;
                }
            }

            /**
             * イベントがダブルクリックかどうか検査する。
             * @param event {Event} イベントオブジェクト
             * @return ダブルクリックの場合はtrue、そうでない場合はfalse
             */
            private isDoubleClick(event: Event): boolean {
                if (event.type === "mouseup") {
                    if (this.palletItemMouseDownCount >= 2) {
                        return true;
                    }
                }

                return false;
            }


            /**
             * パレットアイテムのダブルクリック検知用クリック数カウンタを初期化し、カウントを開始する。
             * @param target {JQuery} パレットアイテムのJQueryオブジェクト
             */
            private startPalletItemClickCount(target: JQuery) {
                this.clearPalletItemClickCount(this);
                this.clickedPalletItem = target;
                this.palletItemDoubleClickResetTimer = setTimeout(this.clearPalletItemClickCount, DOUBLE_CLICK_TIME_MS, this);
            }

            /**
             * パレットアイテムのダブルクリック検知関連変数を初期状態にする。
             * @param fullCustom {FullCustom} FullCustomオブジェクト
             */
            private clearPalletItemClickCount(fullCustom: FullCustom) {
                // setTimeout から呼ばれた場合スコープが異なるため this は使用しない

                if (fullCustom.palletItemDoubleClickResetTimer) {
                    clearInterval(fullCustom.palletItemDoubleClickResetTimer);
                    fullCustom.palletItemDoubleClickResetTimer = null;
                }
                fullCustom.palletItemMouseDownCount = 0;
                fullCustom.clickedPalletItem = null;
            }

            /**
             * 対象キャンバスから指定位置までの相対座標を取得。
             * 起点とするキャンバスIDを指定しなかった場合は現在のページを使用する。
             * @param position 画面上の座標
             * @param moduleId 起点にするキャンバスの module ID。未指定の場合は現在のページのキャンバスを使用する。
             */
            private getPointFromCanvas(position: IPosition, moduleId?: string): IPosition {
                let selector = "#face-canvas .module-container[data-cid=" + ((moduleId) ? moduleId : this._getCanvasPageModuleId()) + "]";
                let targetCanvasModule = $(selector);

                return {
                    x: (position.x - targetCanvasModule.parent().offset().left) * 2,
                    y: (position.y - targetCanvasModule.parent().offset().top) * 2
                };
            }

           /**
             * PalletからCanvasにコピーするButtonItemにstate情報をセットする
             *
             * @param buttonItem {Model.ButtonItem} state情報をセットするターゲットとなるButtonItem
             * @return state情報がセットされたButtonItem
             */
            private setButtonItemState(buttonItem: Model.ButtonItem): Model.ButtonItem {
                console.log("button model: " + buttonItem.area.x + "-" + buttonItem.area.y);

                // ボタンの配置元のマスターリモコンから、ボタンがひも付けられている機器を設定する
                let remoteId = this.faceRenderer_pallet_.getRemoteId();
                let functions = huisFiles.getMasterFunctions(remoteId);
                let codeDb = huisFiles.getMasterCodeDb(remoteId);
                let functionCodeHash = huisFiles.getAllFunctionCodeMap(remoteId);
                let bluetoothData = huisFiles.getMasterBluetoothData(remoteId);
                let remoteName = huisFiles.getFace(remoteId).name;

                let deviceInfo: IButtonDeviceInfo = {
                    id: "",
                    functions: functions,
                    remoteName: remoteName,
                    code_db: codeDb
                };
                if (bluetoothData != null) {
                    deviceInfo.bluetooth_data = bluetoothData;
                }
                if (functionCodeHash != null) {
                    deviceInfo.functionCodeHash = functionCodeHash;
                }

                // 機器情報を全てのactionにセット
                for (let state of buttonItem.state) {
                    if (!state.action) continue;

                    for (let action of state.action) {
                        action.deviceInfo = deviceInfo;
                    }
                }
                return buttonItem;
            }

            /**
             * Pallet上のItemをCanvasに追加
             * 
             * @param target {JQuery} 追加するアイテム
             * @param renderer {FaceRenderer} 基にするアイテムがあるレンダラー
             * @param position {IPosition} 追加位置
             * @return 追加したItemのモデル
             */
            private setPalletItemOnCanvas(target: JQuery, renderer: FaceRenderer, position?: IPosition): Model.Item {
                var $target = target;
                var $parent = $target.parent();
                var item: Model.Item = this._getItemModel($target, renderer);
                if (!item) {
                    return;
                }
                var moduleOffsetY_pallet: number = parseInt(JQUtils.data($parent, "moduleOffsetY"), 10);


                //ボタンの場合、palletエリア選択されているリモコンから、データを引き継ぐ
                //この処理はsetItemOnCanvasで同様の判定があるので無駄。修正したほうがいい。
                let itemSetted: Model.Item = item;
                if (item instanceof Model.ButtonItem) {
                    itemSetted = this.setButtonItemState(item);
                }

                return this.setItemOnCanvas(item, moduleOffsetY_pallet, position);
            }

         
            
            private setItemOnCanvas(item: Model.Item, moduleOffsetY_pallet, position?: IPosition): Model.Item {
                item = item.clone();

                // 現在ターゲットとなっているページを追加先とする
                var moduleId_canvas: string = this._getCanvasPageModuleId();

                if (position != null) {
                    this._setTargetModelArea(item, position.x, position.y - moduleOffsetY_pallet, null, null);
                }

                if (item instanceof Model.ButtonItem) {
                    //ペースト時にもこの関数は呼ばれるため、setPalletItemOnCanvasにある setButtonItemStateを呼ぶとバグを起こす。
                    return this.faceRenderer_canvas_.addButton(item, moduleId_canvas, moduleOffsetY_pallet);
                } else if (item instanceof Model.LabelItem) {
                    return this.faceRenderer_canvas_.addLabel(item, moduleId_canvas, moduleOffsetY_pallet);

                } else if (item instanceof Model.ImageItem) {
                    return this.faceRenderer_canvas_.addImageWithoutCopy(item, moduleId_canvas, moduleOffsetY_pallet);

                } else {
                    console.error(TAG + "unknown item type");
                }

                return null;
            }

            /**
             * アイテムをキャンバスに追加
             *
             * @param item {TargetModel} 追加するアイテムのモデル
             * @param canvasModuleId {string} 追加するキャンバスの moduleID
             * @param moduleOffsetY {number} module の y 座標の offset
             */
            private setNewItemOnCanvas(item: Model.Item, canvasModuleId: string, moduleOffsetY: number): ItemModel {
                if (item instanceof Model.ButtonItem) {
                    return this.faceRenderer_canvas_.addButton(item, canvasModuleId, moduleOffsetY);
                } else if (item instanceof Model.LabelItem) {
                    return this.faceRenderer_canvas_.addLabel(item, canvasModuleId, moduleOffsetY);
                } else if (item instanceof Model.ImageItem) {
                    return this.faceRenderer_canvas_.addImageWithoutCopy(item, canvasModuleId, moduleOffsetY);
                } else {
                    console.error(TAG + "[setNewItemOnCanvas] unknown item type");
                }
            }

            /**
             * フルカスタム編集画面での mousedown イベントのハンドリング
             */
            private onMainMouseDown(event: Event) {
                this.isMouseDown = true;
                this._loseTarget();
            }

            /**
             * Canvas上のドラッグ対象を設定
             *
             * @param target {JQuery} ドラッグ対象
             * @param showDetailItemArea {boolean} 詳細編集エリアを表示するかどうか
             */
            private setDragTarget(target: JQuery, showDetailItemArea: boolean = true) {
                target.focus();
                console.log("target " + JQUtils.data(target, "cid")); //$target.data("cid"));
                this.$currentTarget_ = target;
                
                // target に紐付くモデルを取得
                this.currentItem_ = this._getItemModel(this.$currentTarget_, this.faceRenderer_canvas_);

                // 選択状態にする
                this.$currentTarget_.addClass("selected");

                //ツールチップを非表示にする。
                this.disableButtonInfoTooltip();

                // リサイザーを追加
                this._setResizer(this.$currentTarget_);

                if (showDetailItemArea) {
                    // 詳細編集エリアを表示
                    $("#face-item-detail-area").addClass("active");
                    this._showDetailItemArea(this.currentItem_);
                }
            }

            /**
             * 対象アイテムのドラッグ中表示用ダミーを生成
             */
            private setCurrentTargetDummy() {
                if (!this.$currentTarget_ ||
                    this.$currentTargetDummy_) {
                    return;
                }

                let dummyArea = $('#face-dummy-area');
                let dummy = this.createDragItemDummy(this.$currentTarget_, dummyArea);
                dummyArea.append(dummy);

                this.$currentTargetDummy_ = dummy;
            }

            /**
             * ドラッグ対象アイテムのCanvas外表示用ダミーを生成
             * @param target ドラッグ対象アイテム
             * @param dummyArea ダミー表示エリア
             */
            private createDragItemDummy(target: JQuery, dummyArea: JQuery): JQuery {
                let dummy: JQuery = target.clone();

                dummy
                    .attr('id', 'canvas-item-dummy')
                    .css({
                        'left': (target.offset().left - dummyArea.offset().left) * 2 + 'px',
                        'top' : (target.offset().top  - dummyArea.offset().top ) * 2 + 'px',
                        'border': target.css('border'),
                    });

                this._setResizer(dummy);

                return dummy;
            }

            private _getCurrentTargetArea(): IArea {
                return {
                    x: parseInt(this.$currentTarget_.css("left"), 10),
                    y: parseInt(this.$currentTarget_.css("top"), 10),
                    w: parseInt(this.$currentTarget_.css("width"), 10),
                    h: parseInt(this.$currentTarget_.css("height"), 10)
                };
            }

            /**
             * ドラッグドロップのドラッグ開始における初期処理を行い、ドラッグ中の状態にする
             *
             * @param mousePosition {Model.Position} マウス座標
             * @param forceStart {boolean} マウスがキャンバス上になくても強制的にドラッグ中にするかどうか
             */
            private startDraggingCanvasItem(mousePosition: Model.Position, forceStart: boolean = false) {
                this.isDragging = true;
                if (this.$currentTarget_ && (this.isOnCanvasFacePagesArea(mousePosition) || forceStart)) {

                    // ドラッグ開始位置の保存
                    this.mouseMoveStartPosition_.setPosition(mousePosition);
                    this.mouseMoveStartTargetPosition_.setPositionXY(
                        parseInt(this.$currentTarget_.css("left"), 10),
                        parseInt(this.$currentTarget_.css("top"), 10)
                    );

                    this.mouseMoveStartTargetArea_ = this._getCurrentTargetArea();

                    if (!this.selectedResizer_) {
                        // サイズ変更でなければダミーを表示
                        this.setCurrentTargetDummy();
                    }

                    if (!this._checkDetailItemAreaPosition(mousePosition)) {
                        this.mouseMoving_ = true;
                        if (this.$currentTargetDummy_) {
                            this.$currentTargetDummy_.addClass("moving-item");
                        }
                        this.$currentTarget_.addClass("moving-item");
                        event.preventDefault();

                        //preventDefaultしてしまうと、すべてのフォーカスがはずれてKeydownが働かなくなってしまう。
                        //そのため、preventDefault直後にフォーカスを設定しなおす。
                        this.$el.focus();
                        if (this.macroProperty != null) {
                            //フォーカスの寿命の関係で、このタイミングでもフォーカスする必要がある。
                            this.macroProperty.focusFirstPulldown();
                        } else if (this.jumpProperty != null) {
                            this.jumpProperty.focusFirstPulldown();
                        }
                    }
                }
            }

            /*
            * 入力のマウスポインター位置が、CanvasエリアのFacePagesAreaの上か判定する。
            *
            * @param mousePosition : Model.Position マウスポインター
            * @return result : boolean  CanvasAreaのFacePagesAreaの上の場合true, 違う場合false
            */
            private isOnCanvasFacePagesArea(mousePosition: Model.Position):boolean {
                let FUNCTION_NAME: string = TAG + " : isOnCanvasFacePagesArea :";
                if (mousePosition == undefined) {
                    console.warn(FUNCTION_NAME + "mousePosition is undefined");
                    return false;
                }

                let $facePagesAreaOnCanvas: JQuery = $("#face-canvas").find("#face-pages-area");

                if ($facePagesAreaOnCanvas == undefined) {
                    console.warn(FUNCTION_NAME + "$facePagesAreaOnCanvas is undefined");
                    return false;
                }

                let canvasFacePagesArea = {
                    x: $facePagesAreaOnCanvas.offset().left,
                    y: $facePagesAreaOnCanvas.offset().top,
                    w: $facePagesAreaOnCanvas.width() / 2,
                    h: $facePagesAreaOnCanvas.height() / 2,

                }

                return mousePosition.isInArea(canvasFacePagesArea);
            }

            /**
             * フルカスタム編集画面での mousemove イベントのハンドリング
             */
            private onMainMouseMove(event: Event) {
                
                if (event.type !== "mousemove") {
                    console.error(TAG + "onMainMouseMove() Invalid event type: " + event.type);
                    return;
                }
                if (!this.$currentTarget_ || !this.mouseMoving_) {
                    return;
                }

                
                //マウスがWindowSizeよりはみ出していた場合、フォーカスを外す
                if (event.pageX < 0 + MARGIN_MOUSEMOVABLE_LEFT || event.pageX > innerWidth - MARGIN_MOUSEMOVABLE_RIGHT
                    || event.pageY < 0 + MARGIN_MOUSEMOVALBE_TOP || event.pageY > innerHeight - MARGIN_MOUSEMOVALBE_BOTTOM) {
                    event.type = "mouseup";
                    this.delayedContextMenuEvent = null;
                    this.onMainMouseUp(event);
                    return;
                }

                // リサイザーが選択されている場合は、アイテムのリサイズを行う
                if (this.selectedResizer_) {
                    this._resizeItemWithMouse({ x: event.pageX, y: event.pageY }, false);
                } else {
                    var newPosition = this._getGriddedDraggingItemPosition({ x: event.pageX, y: event.pageY });

                    this.$currentTarget_.css({
                        "left": newPosition.x + "px",
                        "top": newPosition.y + "px"
                    });

                    //currentTargetの重なり判定
                    this.changeColorOverlapedButtonsWithCurrentTargetButton();

                    this.moveCurrentTargetDummy();
                }
            }

            

            private moveCurrentTargetDummy() {
                if (!this.$currentTargetDummy_) return;

                let faceEditArea = $('#face-dummy-area');
                let dummyPosition: IPosition = {
                    x: (this.$currentTarget_.offset().left - faceEditArea.offset().left) * 2,
                    y: (this.$currentTarget_.offset().top - faceEditArea.offset().top) * 2
                };

                this.$currentTargetDummy_.css({
                    "left": dummyPosition.x + 'px',
                    "top": dummyPosition.y + 'px',
                    "border-color": this.$currentTarget_.css("border-color")
                });
            }



            /**
             * フルカスタム編集画面での mouseup イベントのハンドリング
             */
            private onMainMouseUp(event: Event) {
                this.isMouseDown = false;
                this.isDragging = false;

                if (this.delayedContextMenuEvent != null) {
                    this.onContextMenu(this.delayedContextMenuEvent);
                    this.delayedContextMenuEvent = null;
                }

                if (this.$currentTargetDummy_) {
                    this.$currentTargetDummy_.remove();
                    this.$currentTargetDummy_ = null;
                }

                if (event.type !== "mouseup") {
                    console.error(TAG + "onMainMouseUp() Invalid event type: " + event.type);
                    return;
                }
                if (!this.$currentTarget_ || !this.mouseMoving_) {
                    return;
                }

                var position: Model.Position = new Model.Position(event.pageX, event.pageY);

                // リサイザーが選択されている場合は、アイテムのリサイズを行う
                if (this.selectedResizer_) {
                    this._resizeItemWithMouse(position, true);
                } else { // それ以外の場合は、アイテムの移動
                    this._moveItemWithMouse(position);
                }

                this.$currentTarget_.removeClass("moving-item");
                this.mouseMoving_ = false;
                if (this.isDoubleClick(event)) {
                    this.onPalletItemDblClick();
                    this.clearPalletItemClickCount(this);
                }

            }

            private _moveItemGrid(ungriddedPosition: IPosition) {
                let canvas = this.$currentTarget_.parent();
                let newPosition: IPosition = this._getGriddedItemPosition(ungriddedPosition, canvas, true);
                this._moveItem(newPosition);
            }

            private _moveItem(newPosition: IPosition) {
                let newArea: IArea = this._validateArea({ x: newPosition.x, y: newPosition.y });
                this._updateCurrentModelData("area", newArea, false);
            }

            private isOutsideOfCanvas(position: Model.Position): boolean {
                return !(this._getTargetPageModule(position));
            }

            /**
             * アイテムの移動を行い、位置を確定する
             */
            private _moveItemWithMouse(position: IPosition) {
                let fromPageModuleId: string = JQUtils.data(this.$currentTarget_.parent(), "cid");
                let toPageModuleId  : string = JQUtils.data(this._getCanvasPageByDraggingPosition(position.y), "cid");
                let isCrossPageMoving: boolean = (fromPageModuleId != toPageModuleId);

                let newPosition: IPosition = this._getGriddedDraggingItemPosition(position, isCrossPageMoving);
                let newArea: IArea = this._validateArea({ x: newPosition.x, y: newPosition.y });

                let isFromPallet: boolean = this.isOutsideOfCanvas(this.mouseMoveStartPosition_);

                if (isFromPallet) {
                    // 開始位置がキャンバス外の場合＝パレットからの配置の場合

                    if ((newPosition.x + newArea.w <= BIAS_X_DEFAULT_GRID_LEFT || newPosition.x >= GRID_AREA_WIDTH) ||
                        (newPosition.y + newArea.h <= 0 || newPosition.y >= GRID_AREA_HEIGHT)) {
                        // 現在位置がキャンバス外の場合はアイテム破棄

                        let delMemento = this._deleteCurrentTargetItem(false);
                        let delCommand = new MementoCommand([delMemento]);
                        // 履歴に登録せずに実行
                        let delModel = delCommand.invoke();
                        this._updateItemElementsOnCanvas(delModel);
                        return;
                    }
                }

                let newUngriddedPosition = this._getDraggingItemPosition(position);
                if (this.mouseMoveStartTargetPosition_.isSame(newUngriddedPosition)) {
                    // 位置に変更がない（アイテム選択のみ）の場合は何もしない
                    // この判定はパレットから配置されたアイテムかどうかの判定より後でなければならない
                    return;
                }

                if (!isCrossPageMoving) {
                    // ページを跨がない場合は位置を更新して完了
                    this._updateCurrentModelData("area", newArea, isFromPallet);
                    this._showDetailItemArea(this.currentItem_);
                    return;
                }

                // 元ページのモデルをコピーし移動先ページに追加
                let newModel = this.currentItem_.clone();
                this._setTargetModelArea(newModel, newArea.x, newArea.y, null, null);
                //移動先キャンバスページに追加
                let newItem = this.setNewItemOnCanvas(newModel, toPageModuleId, 0);

                let mementoList: IMemento[] = [];
                var addMemento: IMemento = {
                    target: newItem,
                    previousData: {
                        enabled: false
                    },
                    nextData: {
                        enabled: true
                    }
                };

                //元キャンバスページから削除
                let delMemento = this._deleteCurrentTargetItem(false);
                if (isFromPallet) {
                    // パレットからの場合は履歴に登録せずに削除
                    let delCommand = new MementoCommand([delMemento]);
                    let delModel = delCommand.invoke();
                    this._updateItemElementsOnCanvas(delModel);
                } else {
                    // キャンバス内ページ跨ぎの場合は履歴に登録して削除
                    mementoList.push(delMemento);
                }

                mementoList.push(addMemento);

                //追加と削除を1アクションとしてRedo･Undo履歴に追加
                var mementoCommand = new MementoCommand(mementoList);
                var updatedItems = this.commandManager_.invoke(mementoCommand);

                // 新しいItemの詳細エリア表示
                this._setTarget(newItem);
                this._updateItemElementsOnCanvas(updatedItems);
                this._showDetailItemArea(this.currentItem_);
            }

            private _resizeItem(newArea: IArea, update?: boolean) {

                this.$currentTarget_.css({
                    left: newArea.x + "px",
                    top: newArea.y + "px",
                    width: newArea.w + "px",
                    height: newArea.h + "px",
                    lineHeight: newArea.h + "px"
                });

                //currentTargetの重なり判定
                this.changeColorOverlapedButtonsWithCurrentTargetButton();

                if (this.currentItem_ instanceof Model.ButtonItem) {
                    this._resizeButtonStateItem(this.$currentTarget_, newArea);
                }
                if (update) {
                    let validateArea = this._validateArea(newArea);
                    this._updateCurrentModelData("area", validateArea);

                }
                this._setResizer(this.$currentTarget_);
            }

            /**
             * アイテムのリサイズを行う
             */
            private _resizeItemWithMouse(position: IPosition, update?: boolean) {

                this.$currentTarget_.removeClass("moving-item");
                var calculateNewArea = (baseArea: IArea, deltaX: number, deltaY: number): IArea => {
                    var newArea: IArea = $.extend(true, {}, baseArea);

                    switch (this.selectedResizer_) {
                        case "left-top":
                            if (deltaX >= baseArea.w - this.minItemSize_) {
                                newArea.w = this.minItemSize_;
                                newArea.x += (baseArea.w > this.minItemSize_) ? baseArea.w - this.minItemSize_ : 0;
                            } else {
                                newArea.x += deltaX;
                                newArea.w -= deltaX;
                            }

                            if (deltaY >= baseArea.h - this.minItemSize_) {
                                newArea.h = this.minItemSize_;
                                newArea.y += (baseArea.h > this.minItemSize_) ? baseArea.h - this.minItemSize_ : 0;
                            } else {
                                newArea.y += deltaY;
                                newArea.h -= deltaY;
                            }

                            break;

                        case "right-top":
                            if (-deltaX >= baseArea.w - this.minItemSize_) {
                                newArea.w = this.minItemSize_;
                            } else {
                                newArea.w += deltaX;
                            }

                            if (deltaY >= baseArea.h - this.minItemSize_) {
                                newArea.h = this.minItemSize_;
                                newArea.y += (baseArea.h > this.minItemSize_) ? baseArea.h - this.minItemSize_ : 0;
                            } else {
                                newArea.y += deltaY;
                                newArea.h -= deltaY;
                            }

                            break;

                        case "right-bottom":
                            if (-deltaX >= baseArea.w - this.minItemSize_) {
                                newArea.w = this.minItemSize_;
                            } else {
                                newArea.w += deltaX;
                            }

                            if (-deltaY >= baseArea.h - this.minItemSize_) {
                                newArea.h = this.minItemSize_;
                            } else {
                                newArea.h += deltaY;
                            }
                            break;

                        case "left-bottom":
                            if (deltaX >= baseArea.w - this.minItemSize_) {
                                newArea.w = this.minItemSize_;
                                newArea.x += (baseArea.w > this.minItemSize_) ? baseArea.w - this.minItemSize_ : 0;
                            } else {
                                newArea.x += deltaX;
                                newArea.w -= deltaX;
                            }

                            if (-deltaY >= baseArea.h - this.minItemSize_) {
                                newArea.h = this.minItemSize_;
                            } else {
                                newArea.h += deltaY;
                            }
                            break;

                        default:
                            ;
                    }



                    //グリッドがデフォルトの場合は、左右にBIAS_Xの利用不能エリアがある。
                    if (this.gridSize_ === DEFAULT_GRID) {
                        // グリッドスナップ用に調整
                        
                        newArea.w = this.getGridCordinate(newArea.w);
                        newArea.h = this.getGridCordinate(newArea.h);

                        //widthに変化がない場合は、xは変更しない。
                        //xが変化する場合(left-top/left-bottom)の場合のみxは変更
                        if (newArea.w != baseArea.w && newArea.x != baseArea.x) {
                            let deltaW: number = newArea.w - baseArea.w;
                            newArea.x = baseArea.x - deltaW ;
                            newArea.x = this.getGridCordinate(newArea.x) + BIAS_X_DEFAULT_GRID_LEFT; 
                            //newArea.x = this.getGridCordinate(newArea.x) + BIAS_X_DEFAULT_GRID_LEFT;
                        } else {
                            newArea.x = baseArea.x;
                        }

                        //hwightに変化がない場合は、yは変更しない。
                        if (newArea.h != baseArea.h && newArea.y != baseArea.y) {
                            let deltaH: number = newArea.h - baseArea.h;
                            newArea.y = baseArea.y - deltaH;
                            newArea.y = this.getGridCordinate(newArea.y);
                        } else {
                            newArea.y = baseArea.y;
                        }
                        

                    } else {
                        // グリッドスナップ用に調整
                        newArea.x = this.getGridCordinate(newArea.x);
                        newArea.y = this.getGridCordinate(newArea.y);
                        newArea.w = this.getGridCordinate(newArea.w);
                        newArea.h = this.getGridCordinate(newArea.h);
                    }

                    return newArea;
                };

                var deltaX = position.x - this.mouseMoveStartPosition_.x;
                var deltaY = position.y - this.mouseMoveStartPosition_.y;

                if (deltaX === 0 && deltaY === 0) {
                    return;
                }

                //canvasAreaは実際の大きさの1/2に表示されているため、mouseの移動量は2倍にする。
                var newArea = calculateNewArea(this.mouseMoveStartTargetArea_, deltaX*2, deltaY*2);

                this._resizeItem(newArea, update);
            }


            /**
             * グリッドに沿うように座標を変換.
             * input:face-page上の座標値　: number
             * return : グリッドに沿った　face-page上の座標値 : number
             */
            private getGridCordinate (inputCordinate :number):number{
                return inputCordinate = Math.round(inputCordinate / this.gridSize_) * this.gridSize_;
            }

            /**
             * button.state にある label. image のリサイズ (canvas 上における表示のリサイズ)
             */
            private _resizeButtonStateItem($button: JQuery, newArea: IArea) {
                var $states = $button.find(".button-state");
                $states.each((index: number, element: Element) => {
                    let $element = $(element);
                    $element.children().each((index: number, child: Element) => {
                        let $child = $(child);
                        let areaRatioX = parseFloat(JQUtils.data($child, "ratioX")); //$child.data("ratio-x");
                        let areaRatioY = parseFloat(JQUtils.data($child, "ratioY")); //$child.data("ratio-y");
                        let areaRatioW = parseFloat(JQUtils.data($child, "ratioW")); //$child.data("ratio-w");
                        let areaRatioH = parseFloat(JQUtils.data($child, "ratioH")); //$child.data("ratio-h");
                        // areaRatio の全プロパティーが揃っている場合は、ボタンの area に areaRatio を掛け合わせる
                        if (!_.isUndefined(areaRatioX) && !_.isUndefined(areaRatioY) && !_.isUndefined(areaRatioW) && !_.isUndefined(areaRatioH)) {
                            $child.css({
                                left: newArea.w * areaRatioX + "px",
                                top: newArea.h * areaRatioY + "px",
                                width: newArea.w * areaRatioW + "px",
                                height: newArea.h * areaRatioH + "px",
                                lineHeight: newArea.h * areaRatioH + "px"
                            });
                        } else {
                            $child.css({
                                left: 0,
                                top: 0,
                                width: newArea.w + "px",
                                height: newArea.h + "px",
                                lineHeight: newArea.h + "px"
                            });
                        }
                    });
                });
            }

            /**
             * コンテキストメニュー
             */
            private onContextMenu(event: Event) {
                // darwin platform fire onContextMenu just after mousedown,
                // so delay it until mouseup event occurs
                if (Util.MiscUtil.isDarwin() && this.isMouseDown) {
                    this.delayedContextMenuEvent = event;
                    return;
                }
                event.preventDefault();
                this.rightClickPosition_.setPositionXY(event.pageX, event.pageY);

                // コンテキストメニューを作成する
                this.contextMenu_.clear();
                this.contextMenu_.items = [];
                let dictionaryPathOffset = "context_menu.";
                var menuItem_inspectElement = new MenuItem({
                    label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_VALIDATE_ELEMENTS"),
                    click: () => {
                        this.currentWindow_.inspectElement(this.rightClickPosition_.x, this.rightClickPosition_.y);
                    }
                });

                var $facePages = $("#face-canvas").find(".face-page");

                var menuItem_gridSize = new MenuItem({   // 当面使わなくなったが将来用に残しておきます
                    label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE"),
                    type: "submenu",
                    submenu: Menu.buildFromTemplate([
                        {
                            label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE_NON"), type: "checkbox", checked: this.gridSize_ === 2 ? true : false, click: () => {
                                this._setGridSize(2);
                            }
                        }, {
                            label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE_8PX"), type: "checkbox", checked: this.gridSize_ === 8 ? true : false, click: () => {
                                this._setGridSize(8);
                            }
                        }, {
                            label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE_16PX"), type: "checkbox", checked: this.gridSize_ === 16 ? true : false, click: () => {
                                this._setGridSize(16);
                            }
                        }, {
                            label: DEFAULT_GRID + "px", type: "checkbox", checked: this.gridSize_ === DEFAULT_GRID ? true : false, click: () => {
                                this._setGridSize(DEFAULT_GRID);
                            }
                        }, {
                            label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE_32PX"), type: "checkbox", checked: this.gridSize_ === 32 ? true : false, click: () => {
                                this._setGridSize(32);
                            }
                        }, {
                            label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_GRID_SIZE_64PX"), type: "checkbox", checked: this.gridSize_ === 64 ? true : false, click: () => {
                                this._setGridSize(64);
                            }
                        }
                    ])
                });


                // カーソルがアイテムの上にある場合
                if (this.$currentTarget_) {
                    let menuItem_copyItem = new MenuItem({
                        label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_COPY_ITEM"),
                        accelerator: "CmdOrCtrl+C",
                        click: () => {
                            this.setClipboadToItem();
                        }
                    });
                    this.contextMenu_.append(menuItem_copyItem);
                }

                // アイテム選択/未選択にかかわらず「貼り付け」は表示
                let menuItem_pasteItem = new MenuItem({
                    label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_PASTE_ITEM"),
                    accelerator: "CmdOrCtrl+V",
                    enabled: this.clipboard.hasItem(),
                    click: () => {
                        this.pasteItemFromClipboard();
                    }
                });
                this.contextMenu_.append(menuItem_pasteItem);

                // カーソルがアイテムの上にある場合
                if (this.$currentTarget_) {
                    let menuItem_deleteItem = new MenuItem({
                        label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_DELETE_ITEM"),
                        accelerator: "Delete",
                        click: () => {
                            // 現在のターゲットとなっているアイテムを削除する
                            this._deleteCurrentTargetItem();
                        }
                    });
                    this.contextMenu_.append(menuItem_deleteItem);
                }
                this.contextMenu_.append(new MenuItem({ type: "separator" }));

                if (!this.$currentTarget_) {
                    let $targetPageModule = this._getTargetPageModule(this.rightClickPosition_);
                    if ($targetPageModule) {
                        if (1 < this.faceRenderer_canvas_.getPageCount()) {
                            var menuItem_deletePage = new MenuItem({
                                label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_DELETE_PAGE"),
                                click: () => {
                                    // ページを削除する
                                    this._deletePage($targetPageModule);
                                }
                            });
                            this.contextMenu_.append(menuItem_deletePage);
                            this.contextMenu_.append(new MenuItem({ type: "separator" }));
                        }
                    }
                }


                var menuItem_undo = new MenuItem({
                    label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_UNDO"),
                    accelerator: "CmdOrCtrl+Z",
                    enabled: this.commandManager_.canUndo() ? true : false,
                    click: () => {
                        var targetModels = this.commandManager_.undo();
                        this._updateItemElementsOnCanvas(targetModels);
                        // 現在のターゲットを外す
                        this._loseTarget();
                    }
                });

                var menuItem_redo = new MenuItem({
                    label: $.i18n.t(dictionaryPathOffset + "STR_CONTEXT_REDO"),
                    accelerator: "CmdOrCtrl+Y",
                    enabled: this.commandManager_.canRedo() ? true : false,
                    click: () => {
                        var targetModels = this.commandManager_.redo();
                        this._updateItemElementsOnCanvas(targetModels);
                        // 現在のターゲットを外す
                        this._loseTarget();
                    }
                });

                this.contextMenu_.append(menuItem_undo);
                this.contextMenu_.append(menuItem_redo);

                if (DEBUG_MODE) {
                    this.contextMenu_.append(new MenuItem({ type: "separator" }));
                    this.contextMenu_.append(menuItem_inspectElement);
                }

                if (this.contextMenu_.items.length != 0) {
                    this.contextMenu_.popup(this.currentWindow_);
                }
            }

            /**
             * キャンバス内のスクロールイベントのハンドリング
             */
            private onCanvasPageScrolled(event: Event) {
                var $target: JQuery = $(event.currentTarget);
                var scrollTop: number = $target.scrollTop();

                var $children = $target.children();

                var scaledFaceHeight = HUIS_FACE_PAGE_HEIGHT / 2;
                var checked = false;
                $children.each((index, elem) => {
                    if (checked) {
                        return;
                    }

                    var $elem = $(elem);
                    let position = $elem.position();
                    if (-(scaledFaceHeight / 2) <= position.top && position.top < (scaledFaceHeight / 2)) {
                        this.currentTargetPageIndex_ = parseInt(JQUtils.data($elem, "pageIndex"), 10); //$elem.data("page-index");
                        $("#page-index").text((this.currentTargetPageIndex_ + 1) + "");
                    }
                });
            }

            /**
             * パレット内のスクロールイベントのハンドリング
             */
            private onPalletPageScrolled(event: Event) {
                var $target: JQuery = $(event.currentTarget);
                var scrollTop: number = $target.scrollTop();
                this.displayGradationInPalletArea(scrollTop, $target);

                var $children = $target.children();
                var scaledFaceHeight = HUIS_FACE_PAGE_HEIGHT / 2;
              
            }


            private displayGradationInPalletArea(scrollTop: number, $target :JQuery) {

                //最上段の場合、グラデーションを非表示に。それ以外は表示
                if (scrollTop === 0) {
                    $("#pallet-area-gradation-top").css("visibility", "hidden");
                } else {
                    $("#pallet-area-gradation-top").css("visibility", "visible");
                }

                var height: number = $target.height();

                var totalHeight: number = 0;

                $target.children().each((index, elem) => {
                    totalHeight += $(elem).outerHeight();
                }
                );

                if (height < totalHeight) {
                    height = totalHeight;
                }

                var palletHeight = $("#face-pallet").outerHeight();
               
                if (scrollTop > height - palletHeight*2) {
                    $("#pallet-area-gradation-bottom").css("visibility", "hidden");
                } else {
                    $("#pallet-area-gradation-bottom").css("visibility", "visible");
                }

                var maxHeightTargetPx:any = $target.css("max-height");
                var maxHeightTarget:any = maxHeightTargetPx.replace("px", "");
                if (height < maxHeightTarget) {//長さがpalletarea 以下なら、非表示
                    $("#pallet-area-gradation-bottom").css("visibility", "hidden");
                }
            }

            /**
             * ページ追加ボタンのEnable/Disableを設定する
             *
             * @param enabled {boolean}: trueはenable, falseはdisable
             */
            private setAddPageButtonEnabled(enabled: boolean) {
                let $addPageButton = this.$el.find("#button-add-page");
                if (enabled) {
                    $addPageButton.removeClass("disabled");
                } else {
                    $addPageButton.addClass("disabled");
                }
            }

            /**
             * キャンバス内のページ追加ボタンのハンドリング
             */
            private onAddPageButtonClicked(event: Event) {
                // ページを追加する
                this.faceRenderer_canvas_.addPage();
                this._setGridSize(this.gridSize_);

                // ページ数が最大の場合はページ追加ボタンを無効化する
                if (this.faceRenderer_canvas_.isPageNumMax()) {
                    this.setAddPageButtonEnabled(false);
                }
            }

            /**
             * キャンバス内のボタンアイテムがHoverされたときのハンドリング
             */
            private onHoverButtonItemInCanvas(event : Event) {
                var $target = $(event.currentTarget);//Jquery

                this.showButtonInfoTooltip($target);
            }

            /**
             * キャンバス内のボタンアイテムのHoverが外されたときのハンドリング
             */
            private onHoverOutButtonItemInCanvas(event: Event) {
                let FUNCTION_NAME = TAG + " : onHoverOutButtonItemInCanvas : ";
                if (event == null) {
                    console.warn(FUNCTION_NAME+"event is null");
                    return;
                }

                //tooltipの上にいる かつ ボタンの上にいるときは 非表示にしない
                var mousePosition: IPosition = {
                    x: event.pageX,
                    y: event.pageY
                };
                let $tooltip: JQuery = $("#canvas-tooltip");
                var $target = $(event.currentTarget);//Jquery
                if (!this.isMousePositionOn($tooltip, mousePosition)) {

                    //tooltipを非表示にする。
                    this.disableButtonInfoTooltip();
                }

                

            }

            //tooltipから離れたとき呼び出されるイベントハンドラ
            private onHoverOutTooltip(event: Event) {
                //tooltiopを非表示にする
                this.disableButtonInfoTooltip();
            }

            /*
            * キャンバス内のボタンの情報表示用ToolTipを非表示にする。
            */
            private disableButtonInfoTooltip() {
                let FUNCTION_NAME = TAG + " : disableButtonInfoTooltip : ";

                let $tooltip = $("#canvas-tooltip");

                if ($tooltip == undefined) {
                    console.warn(FUNCTION_NAME + "$tooltip is undefined");
                    return;
                }

                $tooltip.addClass("disable");
            }



            /*
            * キャンバス内のボタンの情報表示用ToolTipを表示する。
            * @param $button : JQuery ツールチップを表示するボタンの JQuery要素
            */
            private showButtonInfoTooltip($button : JQuery) {
                let FUNCTION_NAME = TAG + " : showButtonInfoTooltip : ";

                if ($button == undefined) {
                    console.warn(FUNCTION_NAME + "$target is undefined");
                    return;
                }

                let $tooltip: JQuery= $("#canvas-tooltip");
                if ($tooltip == undefined) {
                    console.warn(FUNCTION_NAME + "$tooltip is undefined");
                    return;
                }

                let item = this._getItemModel($button, this.faceRenderer_canvas_);
                if (item instanceof Model.ButtonItem) {
                    var buttonModel: Model.ButtonItem = item;
                }

                if (_.isUndefined(buttonModel)) {
                    console.warn(FUNCTION_NAME + "buttonModel is Undefined");
                    return;
                }

                if (!(buttonModel instanceof Model.ButtonItem)) {
                    console.warn(FUNCTION_NAME + "$buttonModel is not button model");
                    return;
                }

                //ファンクションが取得できるかチェック
                let functions: string[] = this.getFunctions($button);

                if (functions == undefined || functions.length == 0) {
                    functions = [];
                    functions.push("none");
                }

                //Hoverしたボタンが選択状態だった場合、表示しない。
                if ($button.hasClass("selected")) {
                    this.disableButtonInfoTooltip();
                    return;
                }
                $tooltip.removeClass("disable");

                //ツールチップ内の文言を代入

                let deviceInfo: IButtonDeviceInfo = this.getButtonDeviceInfo($button);

                // リモコン名を取得できない場合、デバイスタイプを表示する。(ver1.3対策)
                let remoteInfo: string = this.getButtonDeviceType($button);
                if (deviceInfo) {
                    if (deviceInfo.remoteName) {
                        remoteInfo = deviceInfo.remoteName;
                    }
                }

                //マクロボタンの場合、リモコン名を特殊表記
                if (this.isMacroButton(buttonModel)) {
                    remoteInfo = $.i18n.t("button.macro.STR_REMOTE_BTN_MACRO");
                } else if (this.isJumpButton(buttonModel)) {
                    remoteInfo = $.i18n.t("button.jump.STR_REMOTE_BTN_JUMP");
                }
                

                $tooltip.find(".remote-info").text(remoteInfo);

                //ファンクション情報をローカライズ
                let outputFunctionName = Util.HuisFiles.getPlainFunctionKey(functions[0]);
                let $functionName:JQuery= $tooltip.find(".function-name");
                $functionName.text(outputFunctionName);
                var localizedString = null;

                if (outputFunctionName !== "none") {
                    localizedString = $.i18n.t("button.function." + outputFunctionName);
                } else {
                    // ジャンプボタンは跳び先を表示
                    outputFunctionName = this.createJumpTooltip(buttonModel);
                }

                var localizedString = null;
                if (outputFunctionName === "none") {
                    localizedString = $.i18n.t("button.none.STR_REMOTE_BTN_NONE");
                } else if (this.isJumpButton(buttonModel)) {
                    // ジャンプボタンは機能ではなく跳び先が格納されるのでローカライズしない
                    localizedString = outputFunctionName;
                } else {
                    localizedString = $.i18n.t("button.function." + outputFunctionName);
                }
                
                var outputString = localizedString;
                if (functions.length > 1) {
                    outputString = outputString + " etc.";
                }
                $functionName.text(outputString);

                //#face-pages-areaのscale率を取得
                let buttonTransform = $("#face-pages-area").css("transform").split(",");
                let buttonScale: number = +(buttonTransform[3].replace(" ", ""));

                //ボタンに対して水平センタリング
                this.layoutTargetOnCenterOfBase($tooltip, $button, 1.0, buttonScale);

                //ボタンのしたにレイアウト
                this.layoutTargetOnButtomOfBase($tooltip, $button, 1.0, buttonScale);

                //マイナスマージンを設定
                let tooltipTopMargin: number = +($tooltip.css("margin-top").replace("px", ""));
                $tooltip.offset({ left: $tooltip.offset().left, top: $tooltip.offset().top + tooltipTopMargin });

            }




            /*
            * ボタンのファンクションを取得
            * $button : buttonItemのJQuery要素
            */
            private getFunctions($button: JQuery) : string[]{
                var FUNCTION_NAME = this.FILE_NAME + " getFunctions :";
                if (_.isUndefined($button)) {
                    console.warn(FUNCTION_NAME + "$button is Undefined");
                    return;
                }

                let item: Model.Item = this._getItemModel($button, this.faceRenderer_canvas_);
                if (item instanceof Model.ButtonItem) {
                    var buttonModel: Model.ButtonItem = item;
                } else {
                    console.warn(FUNCTION_NAME + "$buttonModel is not button model");
                    return;
                }

                if (_.isUndefined(buttonModel)) {
                    console.warn(FUNCTION_NAME + "buttonModel is Undefined");
                    return;
                }

                var functionNum = 0;

                //ボタンの中の、すべてのstate,actionに設定されているfunctionを収集する。
                var stateNum = buttonModel.state.length;
                var fucntions: string[] = [];
                for (let state of buttonModel.state) {
                    for (let action of state.action) {
                        if (action && action.code_db && action.code_db.function) {
                            fucntions.push(action.code_db.function.toString());
                        }
                    }
                }
                return fucntions;

            }

            /*
            * ボタンの先頭に設定されている操作のデバイスタイプを取得
            * 操作が一つも設定されていない場合は空文字を返す
            * @ $button : JQuery デバイスタイプを取得したいボタンのJquery要素
            * @ return : string  デバイスタイプ
            */
            private getButtonDeviceType($button: JQuery): string{
                var FUNCTION_NAME = this.FILE_NAME + " getButtonDeviceType :";

                if (_.isUndefined($button)) {
                    console.warn(FUNCTION_NAME + "$button is Undefined");
                    return;
                }

                let item = this._getItemModel($button, this.faceRenderer_canvas_);
                if (item instanceof Model.ButtonItem) {
                    var buttonModel: Model.ButtonItem = item;
                } else {
                    console.warn(FUNCTION_NAME + "$buttonModel is not button model");
                    return;
                }

                if (_.isUndefined(buttonModel)) {
                    console.warn(FUNCTION_NAME + "buttonModel is Undefined");
                    return;
                }

                if (buttonModel &&
                    buttonModel.state &&
                    buttonModel.state[0] &&
                    buttonModel.state[0].action &&
                    buttonModel.state[0].action[0] &&
                    buttonModel.state[0].action[0].code_db &&
                    buttonModel.state[0].action[0].code_db.device_type) {
                    return buttonModel.state[0].action[0].code_db.device_type.toString();
                } else {
                    return "";
                }
            }


            /**
            * ボタンの機器情報を取得。
            * ボタンに複数の機器情報が設定されていても、state、actionの最初に設定されているdeviceInfoを返す。
            * @ $button : JQuery ボタンのJquery要素
            * @ return : string  リモコン名
            */
            private getButtonDeviceInfo($button: JQuery): IButtonDeviceInfo {
                var FUNCTION_NAME = this.FILE_NAME + " getButtonRemoteName :";

                if (_.isUndefined($button)) {
                    console.warn(FUNCTION_NAME + "$button is Undefined");
                    return;
                }

                var buttonModel: Model.ButtonItem = this.castToButton(this._getItemModel($button, this.faceRenderer_canvas_));

                if (_.isUndefined(buttonModel)) {
                    console.warn(FUNCTION_NAME + "buttonModel is Undefined");
                    return;
                }

                if (!(buttonModel instanceof Model.ButtonItem)) {
                    console.warn(FUNCTION_NAME + "$buttonModel is not button model");
                    return;
                }

                if (buttonModel &&
                    buttonModel.state &&
                    buttonModel.state[0] &&
                    buttonModel.state[0].action &&
                    buttonModel.state[0].action[0] &&
                    buttonModel.state[0].action[0].deviceInfo) {
                    return buttonModel.state[0].action[0].deviceInfo;
                } else {
                    return;
                }
            }


            /**
             * ジャンプボタンのツールチップに表示する文言を生成。
             * 無効な設定がされている場合は"none"を返す。
             *
             * @param jumpButton {Model.ButtonItem} 対象のジャンプボタン
             * @return {string} ツールチップ表示文言
             */
            private createJumpTooltip(jumpButton: Model.ButtonItem): string {
                var FUNCTION_NAME = this.FILE_NAME + " createDestTooltip :";

                if (jumpButton == null ||
                    jumpButton.state == null ||
                    jumpButton.state.length <= 0 ||
                    jumpButton.state[0].action == null ||
                    jumpButton.state[0].action.length <= 0 ||
                    jumpButton.state[0].action[0].jump == null) {
                    console.warn(FUNCTION_NAME + "invalid jump button.");
                    return "none";
                }
                let target = jumpButton.state[0].action[0].jump;

                let faceLabel: string;
                let total: number;
                if (target.remote_id === this.faceRenderer_canvas_.getRemoteId()) {
                    // 編集中ページの場合
                    faceLabel = $.i18n.t('edit.property.STR_EDIT_PROPERTY_PULLDOWN_CURRENT_REMOTE');

                    // ページ数は現在の状態から取得
                    total = this.faceRenderer_canvas_.getPageCount();

                } else {
                    let face: Model.Face = huisFiles.getFace(target.remote_id);
                    if (face == null) {
                        console.warn(FUNCTION_NAME + "face not found: " + target.remote_id);
                        return "none";
                    }
                    faceLabel = face.name;

                    total = face.getTotalPageNum();
                }

                let pageLabel = (target.scene_no >= 0 && target.scene_no < total)
                                    ? target.scene_no + 1   // ページ番号
                                    : 1;                    // 存在しないページの場合は 1ページ目

                return faceLabel + $.i18n.t('dialog.label.STR_DIALOG_LABEL_SELECTED_PAGE') + pageLabel;
            }


            /*
            * リモコン名のテキストフィールドの値が変わったときに呼び出される
            */
            private onRemoteNameTextFieldChanged(event: Event) {
                var $target = $(event.currentTarget);
                var value: any = $target.val();
                //禁則文字がある場合、表示を取り消す。
                let filteredString: string = this.getRemovedInhibitionWords(value);
                if (filteredString != value) {
                    $target.val(filteredString);
                    value = filteredString;
                }
            }

            /**
             * 詳細編集エリア内のフォームで値の変更があったときに呼び出される。
             */
            private onItemPropertyChanged(event: Event) {
                var $target = $(event.currentTarget);
                var $parent = $target.parent();

                var key: string = JQUtils.data($parent, "property"); //$parent.data("property");
                if (!key) {
                    key = JQUtils.data($target, "property");
                }
                var value: any = $target.val();

                
                //禁則文字がある場合、表示を取り消す。
                let filteredString: string = this.getRemovedInhibitionWords(value);
                if (filteredString != value) {
                    $target.val(filteredString);
                    value = filteredString;
                }

                if (key.indexOf("state-") === 0) {
                    //let stateId = parseInt(JQUtils.data($target, "stateId"), 10); //$target.data("state-id");
                    //このバージョンでは、すべての画像を変更する。
                    this._updateCurrentModelStateData(TARGET_ALL_STATE, key.slice("state-".length), value);
                } else {
                    this._updateCurrentModelData(key, value);
                }
            }

            /**
             * 詳細編集エリア内の select メニューに値の変更があったときに呼び出される。
             */
            private onItemPropertySelectChanged(event: Event) {
                var $target = $(event.currentTarget);
                if ($target.hasClass("image-resize-mode") || $target.hasClass("state-image-resize-mode")) {
                    this._setImageResizeModeBySelect($target);
                } else if ($target.hasClass("property-state-text-size") || $target.hasClass("property-text-size")) {
                    this.onItemPropertyChanged(event);//テキストの大きさを変える際の処理
                }
            }

            /**
             * 詳細編集(ボタン)エリア内の プレビュー内の画像編集ボタンがクリックされたときに呼び出される
             **/
            private onEditImageButtonClicked(event: Event) {
                //popupメニューのテキスト 今後別のファイルにすべき。
                var STR_PROPATY_AREA_EDIT_IMAGE_POPUP_IMAGE = $.i18n.t("edit.property.STR_EDIT_PROPERTY_ITEM_TYPE_IMAGE_BUTTON");
                var STR_PROPATY_AREA_EDIT_IMAGE_POPUP_TEXT = $.i18n.t("edit.property.STR_EDIT_PROPERTY_ITEM_TYPE_TEXT_BUTTON");

                //押下されたボタンのJquery
                var $target = $(event.currentTarget);

                //popのJquery
                var $overflow = this.$page.find("#edit-image-popup"); // ポップアップのjQuery DOMを取得
                var previewBorderWidth :number = +(this.$page.find(".property-state-image-preview").css("border-width").replace("px",""));
                var $editImageBtn = $overflow.find("#command-change-button-image");
                var $editTextBtn = $overflow.find("#command-change-button-text");

                //popupのテキストを更新
                $editImageBtn.find(".menu-item-text").text(STR_PROPATY_AREA_EDIT_IMAGE_POPUP_IMAGE);
                $editTextBtn.find(".menu-item-text").text(STR_PROPATY_AREA_EDIT_IMAGE_POPUP_TEXT);

                var overFlowWidth = $overflow.find(".popup-list").outerWidth(true);

                var popupY = $target.offset().top + $target.height();
                var popupX = $target.offset().left - overFlowWidth + $target.outerWidth()+ previewBorderWidth;

                var options: PopupOptions = {
                    x: 0,
                    y: 0,
                    tolerance: popupY + ",0,0," + popupX,
                    corners: false,
                    afterclose: (event, ui) => { this.$el.focus(); }
                };


                $overflow.popup(options).popup("open").on("vclick", () => {
                    $overflow.popup("close");
                });
            }

            /**
             * 詳細編集(背景)エリア内の プレビュー内の画像編集ボタンがクリックされたときに呼び出される
             **/
            private onEditImageBackgroundClicked(event: Event) {
                var $target = $(event.currentTarget);
                var imageType: IMAGE_TYPE = IMAGE_TYPE.BACKGROUND_IMAGE;
                this.startEditButtonImage($target, imageType);
            }

            /**
             * 詳細編集(画像)エリア内の プレビュー内の画像編集ボタンがクリックされたときに呼び出される
             **/
            private onEditImageNonButtonImageClicked(event: Event) {
                var $target = $(event.currentTarget);
                var imageType: IMAGE_TYPE = IMAGE_TYPE.NON_BUTTON_IMAGE;
                this.startEditButtonImage($target, imageType);
            }

            /**
             * 詳細編集(ボタン)エリア内の プレビュー内の画像編集ボタンで、
             * 出現したポップアップの中の画像編集ボタンがクリックされたときに呼び出される
             **/
            private onEditImageButtonInPopupClicked(event: Event) {
                var FUNCTION_NAME = "onEditImageButtonInPopupClicked";
                var $target = $(event.currentTarget);
                var imageType: IMAGE_TYPE = IMAGE_TYPE.BUTTON_IMAGE;

                //stateID付きのJQueryObjectをわたす
                var $editButton = this.$page.find("#edit-image-or-text");

                this.startEditButtonImage($editButton, imageType);
            }

            /**
             * 詳細編集エリア内の プレビュー内の画像編集ボタンで、
             * 出現したポップアップの中のテキスト編集ボタンがクリックされたときに呼び出される
             **/
            private onEditTextButtonInPopupClicked(event: Event) {
                var FUNCTION_NAME = "onEditTextButtonInPopupClicked";
                var $target = $(event.currentTarget);
                var $editButton = this.$page.find("#edit-image-or-text");
                let stateId = parseInt(JQUtils.data($editButton, "stateId"), 10); //$target.data("state-id");

                //画像を削除 procDeleteをつかうと、無駄な履歴が残るので使わない。
                let targetState = this._getCurrentTargetState(stateId);
                if (!targetState) {
                    return;
                }
                // 状態内の image を削除
                targetState.image = null;
                $(".property-state-image .propery-state-image-src input[data-state-id=\"" + stateId + "\"]").val("");
                $(".property-state-image-preview[data-state-id=\"" + stateId + "\"]").css("background-image", "");
                let $textField: JQuery = $(".property-state-text-value[data-state-id=\"" + stateId + "\"]");

                let textInTextFiled: string = $textField.val();
                
                if (textInTextFiled == null || textInTextFiled == "") {
                    textInTextFiled = $.i18n.t("button.text_button.STR_REMOTE_BTN_TEXT_BTN_DEFAULT");
                    $textField.val(textInTextFiled);
                }

                this._updateCurrentModelStateData(TARGET_ALL_STATE,
                    {
                        "text": textInTextFiled,
                        "path": null,
                        "resolved-path": null
                    });
                // TODO: Temporary comment out for workaround
                //this.setFocusAndMoveCursorToEnd($textField);
            }


            /**
             * 詳細編集エリア内の select メニューがクリックされたときに呼び出される。
             */
            private onItemPropertySelectClicked(event: Event) {
                var $target = $(event.currentTarget);
                var selectId = $target.find("select").attr("id");
                var $selectMenu = $("#" + selectId + "-listbox");

                var targetWidth = $target.width();
                var targeHeight = $target.height();
                var popupMenuWidth = $selectMenu.outerWidth(true);
                var popupMenuHeight = $selectMenu.outerHeight(true);

                var popupMenuY = $target.offset().top + targeHeight;//popup menuの出現位置は、selectの真下。

                $selectMenu.outerWidth(Math.max(popupMenuWidth, targetWidth));

                var options: PopupOptions = {
                    x: 0,
                    y: 0,
                    tolerance: popupMenuY + ",0,0," + $target.offset().left,
                    corners: false
                };

                if ((popupMenuY + popupMenuHeight) > innerHeight) { //popup menguがはみ出すとき
                    popupMenuY = innerHeight - $target.offset().top;

                    options = {
                        x: 0,
                        y: 0,
                        tolerance: "0,0," + popupMenuY + "," + $target.offset().left,
                        corners: false
                    };
                }

                $selectMenu.popup(options);
            
            }

            /**
             * 詳細編集エリアの select メニュー上で mousedown されたときに呼び出される。
             * @param event {Event} mousedownイベント
             */
            private onSelectMenuMouseDown(event: Event) {
                event.preventDefault();
            }

            /**
             * 画像参照ボタンをクリックしたときに呼び出される。
             */
            private onReferImageClicked(event: Event) {
                var $target = $(event.currentTarget);
                var ImageType: IMAGE_TYPE= null;

                if ($target.hasClass("refer-state-image")) {// ボタン内の state の場合
                    ImageType = IMAGE_TYPE.BUTTON_IMAGE;
                } else if ($target.hasClass("page-background-src")) { // ページ背景の場合
                    ImageType = IMAGE_TYPE.BACKGROUND_IMAGE;
                } else { // 通常の image の場合
                    ImageType = IMAGE_TYPE.NON_BUTTON_IMAGE;
                }
                this.startEditButtonImage($target, ImageType);
            }

            /*
            * アイテムの画像変更処理
            * @param $target:Jquery 呼び出した側のJquery
            */
            private startEditButtonImage($target :JQuery, imageType:IMAGE_TYPE) {
                var options: Util.ElectronOpenFileDialogOptions = {
                    properties: ["openFile"],
                    filters: [
                        { name: "画像", extensions: ["jpg", "png", "jpeg"] },
                    ],
                    title: PRODUCT_NAME, // Electron uses Appname as the default title
                };

                // 画像ファイルを開く
                electronDialog.showOpenFileDialog(
                    options,
                    (imageFiles: string[]) => {
                        if (!imageFiles || !imageFiles.length) {
                            return;
                        }

                        //画像ファイルダイアログが表示されると、すべてのフォーカスがはずれてKeydownが働かなくなってしまう。
                        //そのため、直後にフォーカスを設定しなおす。
                        this.$el.focus();

                        let imageFilePath = imageFiles[0];
                        let remoteId = this.faceRenderer_canvas_.getRemoteId();
                        let imageFileExt = path.extname(imageFilePath).toLowerCase();
                        if (!((imageFileExt === ".jpg") || (imageFileExt === ".png") || (imageFileExt === ".jpeg"))) {
                            // 警告を出す
                            console.warn("ONLY jpg, png, jpeg are supported"); 
                            let response = electronDialog.showMessageBox({
                                type: "error",
                                message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_NON_SUPPORTED_FILE"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                title: PRODUCT_NAME,
                            });
                            return;
                        }

                        if (Util.MiscUtil.checkFileSize(imageFilePath) === Util.MiscUtil.ERROR_SIZE_TOO_LARGE) { // ファイルが大きすぎる
                            let response = electronDialog.showMessageBox({
                                type: "error",
                                message: $.i18n.t("dialog.message.STR_DIALOG_ERROR_IMAGE_FILE_TOO_LARGE_1") + (MAX_IMAGE_FILESIZE / 1000000) + $.i18n.t("dialog.message.STR_DIALOG_ERROR_IMAGE_FILE_TOO_LARGE_2"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                title: PRODUCT_NAME,
                            });
                            console.warn("Image file too large");
                            return;
                        }

                        if ((imageFileExt === ".jpg") || (imageFileExt === ".jpeg")) {
                            let result = Util.MiscUtil.checkJPEG(imageFilePath);
                            if ((result === Util.MiscUtil.ERROR_TYPE_JPEG2000) || (result === Util.MiscUtil.ERROR_TYPE_JPEGLOSSLESS)) {
                                // JPEG2000及びJPEG Losslessはサポートしていない警告を出す
                                let response = electronDialog.showMessageBox({
                                    type: "error",
                                    message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_JPEG2000_JPEG_LOSSLESS_FILE"),
                                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                    title: PRODUCT_NAME,
                                });
                                console.warn("JPEG lossless or JPEG2000 are not supported");
                                return;
                            }
                            else if (result === Util.MiscUtil.ERROR_TYPE_NOT_JPEG) { // 拡張子はJPG/JPEGだが中身がJPEGでないものが指定された
                                let response = electronDialog.showMessageBox({
                                    type: "error",
                                    message: $.i18n.t("dialog.message.STR_DAIALOG_ERROR_MESSAGE_LOAD_BROKEN_FILE"),
                                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                    title: PRODUCT_NAME,
                                });
                                console.warn("This type of JPEG is not supported");
                                return;
                            }
                            else if (result === Util.MiscUtil.ERROR_FILE_ACCESS) { // 何らかのトラブルでファイルが読めない                                
                                console.warn("Imega file not found"); // 普通はこないので特にダイアログは出さないで、編集画面にも何も起きない状態に
                                return;
                            }
                        }
                        
                        if (imageType === IMAGE_TYPE.BUTTON_IMAGE) {// ボタン内の state の場合
                            this._reflectImageToButtonState(remoteId, $target, imageFilePath);
                        } else if (imageType === IMAGE_TYPE.BACKGROUND_IMAGE) { // ページ背景の場合
                            this._reflectImageToImageItem(remoteId, imageFilePath, true);
                        } else { // 通常の image の場合
                            this._reflectImageToImageItem(remoteId, imageFilePath);
                        }
                    }
                );
            }


            /**
             * 詳細編集エリア内の画像削除ボタンを押したときに呼ばれる。
             */
            private onDeleteImageClicked(event: Event) {
                var $target = $(event.currentTarget);
                this.procDeleteImage($target);
                this._updatePreviewInDetailArea("none", $("#property-image-preview"));
            }

            /*
            * 画像の削除処理
            */
            private procDeleteImage($target: JQuery) {

                if ($target.hasClass("delete-state-image") || $target.hasClass("property-state-value")) {
                    let stateId = parseInt(JQUtils.data($target, "stateId"), 10);
                    if (_.isUndefined(stateId)) {
                        return;
                    }
                    let targetState = this._getCurrentTargetState(stateId);
                    if (!targetState) {
                        return;
                    }
                    // 状態内の image を削除
                    targetState.image = null;
                    this._updateCurrentModelStateData(stateId, {
                        "path": null,
                        "resolved-path": null
                    });

                    $(".property-state-image .propery-state-image-src input[data-state-id=\"" + stateId + "\"]").val("");
                    $(".property-state-image-preview[data-state-id=\"" + stateId + "\"]").css("background-image", "");
                } else if ($target.attr("id") === "delete-background-image") {
                    // 背景画像の削除
                    $(".property-value.page-background-src").val("");
                    $("#property-image-preview").css("background-image", "none");
                    this._updateCurrentModelData("path", "");
                    this._updateCurrentModelData("enabled", false);
                }
                
            }

            /**
             * 画像アイテムに指定した画像を反映させる
             */
            private _reflectImageToImageItem(remoteId: string, imageFilePath: string, pageBackground?: boolean) {
                let imageFileName = path.basename(imageFilePath);

                /* model の更新 */

                // 画像は remoteimages/[remoteId]/ 以下に配置される。
                // image.path には remoteimages 起点の画像パスを指定する。
                var imagePath = path.join(remoteId, imageFileName).replace(/\\/g, "/");
                // face ディレクトリ内に配置されるべき画像のパスを取得
                let resolvedPath = path.resolve(path.join(HUIS_FILES_ROOT, REMOTE_IMAGES_DIRECTORY_NAME, imagePath)).replace(/\\/g, "/");
                // 画像を face ディレクトリ内にコピー
                // 画像のリサイズとグレースケール化
                Model.OffscreenEditor.editImage(imageFilePath, pageBackground ? IMAGE_EDIT_PAGE_BACKGROUND_PARAMS : IMAGE_EDIT_PARAMS, resolvedPath)
                    .done((editedImage) => {
                        // 画像編集後に出力パスが変わる場合があるので、再度 model 更新
                        let editedImageName = path.basename(editedImage.path);
                        let editedImagePath = path.join(remoteId, editedImageName).replace(/\\/g, "/");
                        if (pageBackground) {
                            // pageBackground の場合、画像の指定がないときは disabled になっているので enabled にする
                            this._updateCurrentModelData({
                                "enabled": true,
                                "path": editedImagePath,
                                "resizeOriginal": editedImagePath,
                                "resized": true
                            });
                        } else {
                            this._updateCurrentModelData({
                                "path": editedImagePath,
                                "resizeOriginal": editedImagePath,
                                "resized": true
                            });
                        }
                        
                    });
            }

            private _reflectImageToButtonState(remoteId: string, $target: JQuery, imageFilePath: string) {
                let imageFileName = path.basename(imageFilePath);
                let stateId = parseInt(JQUtils.data($target, "stateId"), 10); //$target.data("state-id");
                if (_.isUndefined(stateId)) {
                    return;
                }

                let targetState = this._getCurrentTargetState(stateId);
                if (!targetState) {
                    return;
                }
                if (!targetState.image) {
                    targetState.image = [];
                }
                if (targetState.image.length < 1) {
                    targetState.image.push(new Model.ImageItem({
                        areaRatio: {
                            x: 0, y: 0, w: 1, h: 1
                        },
                        path: ""
                    }));
                }
                // 画像は remoteimages/[remoteId]/ 以下に配置される。
                // image.path には remoteimages 起点の画像パスを指定する。
                var image = targetState.image[0];
                image.path = path.join(remoteId, imageFileName).replace(/\\/g, "/");
                let resolvedPath = path.resolve(path.join(HUIS_FILES_ROOT, REMOTE_IMAGES_DIRECTORY_NAME, image.path)).replace(/\\/g, "/");
                // 画像のリサイズとグレースケール化
                Model.OffscreenEditor.editImage(imageFilePath, IMAGE_EDIT_PARAMS, resolvedPath)
                    .done((editedImage) => {
                        // 画像編集後に出力パスが変わる場合があるので、再度 model 更新
                        let editedImageName = path.basename(editedImage.path);
                        let editedImagePath = path.join(remoteId, editedImageName).replace(/\\/g, "/");
                        let resolvedPath = editedImage.path.replace(/\\/g, "/");
                        image.path = editedImagePath;
                        image.resizeOriginal = editedImagePath;
                        image.resolvedPath = resolvedPath;

                        //このバージョンでは、すべてのステートの画像を変更する。
                        this._updateCurrentModelStateData(TARGET_ALL_STATE, {
                            "path": editedImagePath,
                            "resolved-path": resolvedPath,
                            "resizeOriginal": editedImagePath,
                            "text":""
                        });

                        // テキストエリアの文字表示をアップデート
                        $(".property-state-text-value[data-state-id=\"" + stateId + "\"]").val("");


                        //previewを更新する
                        let inputURL = JQUtils.enccodeUriValidInCSS(resolvedPath);
                        let $preview = $(".property-state-image-preview[data-state-id=\"" + stateId + "\"]");
                        this._updatePreviewInDetailArea(inputURL, $preview);
                        
                    });
            }

            /**
             * ボタンアイテムの詳細編集エリア内の状態追加ボタンを押したときに呼び出される
             */
            private onAddButtonStateClicked(event: Event) {
                if (!this.currentItem_) {
                    return;
                }

                let button = this.currentItem_;
                if (button instanceof Model.ButtonItem) {
                    var states = button.state;
                    var newStateId = 0;
                    if (states) {
                        // 未使用の stateId を探す
                        let sortedStates = states.sort((state1, state2) => {
                            return state1.id - state2.id;
                        });
                        sortedStates.forEach((state) => {
                            if (newStateId === state.id) {
                                newStateId++;
                            }
                        });
                    }
                    var newState: IState = {
                        id: newStateId
                    };

                    if (!this.currentTargetButtonStates_) {
                        this.currentTargetButtonStates_ = [];
                    }
                    this.currentTargetButtonStates_.push(new Model.ButtonState({
                        id: newStateId
                    }));
                    this.currentTargetButtonStatesUpdated_ = true;

                    this._updateCurrentModelButtonStatesData();
                    this._showDetailItemArea(this.currentItem_);
                }
            }

            /**
             * ボタンアイテムの詳細編集エリア内の状態削除ボタンを押したときに呼び出される
             */
            private onRemoveButtonStateClicked(event: Event) {
                if (!this.currentItem_ || !(this.currentItem_ instanceof Model.ButtonItem) || !this.currentTargetButtonStates_) {
                    return;
                }

                var $target = $(event.currentTarget);
                var stateId = parseInt(JQUtils.data($target, "stateId"), 10); //$target.data("state-id");
                if (_.isUndefined(stateId)) {
                    return;
                }

                // stateId と一致する state を検索し、削除する
                var targetStateIndex = -1;
                for (let i = 0, l = this.currentTargetButtonStates_.length; i < l && targetStateIndex < 0; i++) {
                    let state = this.currentTargetButtonStates_[i];
                    if (state.id === stateId) {
                        targetStateIndex = i;
                    }
                }
                if (targetStateIndex < 0) {
                    return;
                }

                this.currentTargetButtonStates_.splice(targetStateIndex, 1);
                this.currentTargetButtonStatesUpdated_ = true;

                this._updateCurrentModelButtonStatesData();
                this._showDetailItemArea(this.currentItem_);

            }

            /**
            * 戻るボタンが押されたときに呼び出される
            */
            private onBackButtonClicked(event: Event) {
                $("#button-edit-back").prop("disabled", true);    // 二度押し対策

                let response = electronDialog.showMessageBox(
                    {
                        type: "warning",
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_NONSAVE"),
                        buttons: [
                            $.i18n.t("dialog.button.STR_DIALOG_BUTTON_SAVE"),
                            $.i18n.t("dialog.button.STR_DIALOG_BUTTON_NOT_SAVE"),
                            $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL"),
                        ],
                        cancelId: 2,
                        title: PRODUCT_NAME,
                    });

                if (response === 0) {// positiveなボタンの場合,Saveと同じ処理
                    $("#button-edit-back").prop("disabled", false); // 二度押し対策の解除
                    this.onEditDoneButtonClicked(event);
                } else if (response === 1) {
                    $("#button-edit-back").prop("disabled", false); // 二度押し対策の解除
                    Framework.Router.back();//negative なボタンの場合、homeに戻る
                } else {//キャンセル処理の場合、なにもしない。
                }

                $("#button-edit-back").prop("disabled", false); // 二度押し対策の解除
           }

            /*
            * リモコン名編集用のテキストフィールドをクリックした際に呼び出し
            */
            private onRemoteNameTextFieldClicked(event: Event) {
                //リモコン名編集するときには、ほかのターゲットをはずす。
                this._loseTarget();
                $(event.currentTarget).focus();
            }

            /**
             * 編集完了ボタンを押したときに呼び出される
             */
            private onEditDoneButtonClicked(event: Event) {
                let FUNCTION_NAME = TAG + "onEditDoneButtonClicked : ";

                $("#button-edit-done").prop("disabled", true); // 二度押し対策
                // 直前に選択されていたボタンの状態更新があれば行う
                this._updateCurrentModelButtonStatesData();

                //doneボタンの非活性タイマー
                let durationTimerDoneButtonEnable = 5000;
                setTimeout(() => {
                    //二度押し対策が裏目にならないように、ある程度 時間がたつと非活性解除
                    $("#button-edit-done").prop("disabled", false); // 二度押し対策の解除
                }, durationTimerDoneButtonEnable)

                // 現在のターゲットを外す
                this._loseTarget();

                //エラーハンドリング
                let errorOccur: boolean = this._isErrorOccurBeforeSave();
                if (errorOccur) {
                    $("#button-edit-done").prop("disabled", false); // 二度押し対策の解除
                    return;
                }

                let gmodules = this.faceRenderer_canvas_.getModules((area) => { return !this.isCompletelyOutOfCanvas(area); });
                let remoteId = this.faceRenderer_canvas_.getRemoteId();
                let faceName: string = $("#input-face-name").val();

                let dialogProps = DIALOG_PROPS_CREATE_NEW_REMOTE;

                let dialog = new CDP.UI.Dialog(dialogProps.id, {
                    src: CDP.Framework.toUrl("/templates/dialogs.html"),
                    title: dialogProps.options.title,
                });
                dialog.show().css("color", "white");

                let inputFace: Model.Face = new Model.Face(remoteId, faceName, DEVICE_TYPE_FULL_CUSTOM,gmodules);

                huisFiles.updateFace(inputFace, this.buttonDeviceInfoCache)
                    .always(() => {
                        garageFiles.addEditedFaceToHistory("dev" /* deviceId は暫定 */, remoteId);
                        if (HUIS_ROOT_PATH) {
                            let syncTask = new Util.HuisDev.FileSyncTask();
                            let syncProgress = syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, true, DIALOG_PROPS_CREATE_NEW_REMOTE, null, (err) => {
                                if (err) {
                                    // [TODO] エラー値のハンドリング
                                    electronDialog.showMessageBox({
                                        type: "error",
                                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SYNC_WITH_HUIS_ERROR"),
                                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                        title: PRODUCT_NAME,
                                    });
                                } else {
                                    Framework.Router.back();
                                }
                                $("#button-edit-done").prop("disabled", false); // 二度押し対策の解除

                            });
                        } else {
                            Framework.Router.back();
                            $("#button-edit-done").prop("disabled", false);
                    }
                    }).fail(() => {
                        console.error(FUNCTION_NAME + "updateFace is fail");
                        $("#button-edit-done").prop("disabled", false); // 二度押し対策の解除
                    });
            }

            /**
             * 保存前のバリデーションエラーダイアログを表示
             * @param errorMessage ダイアログに表示する文言
             * @return {number} ダイアログでクリックされたボタンのインデックス
             */
            private _showSaveErrorDialog(errorMessage: string): number {
                let result = electronDialog.showMessageBox({
                    type: "error",
                    message: errorMessage,
                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                    title: PRODUCT_NAME,
                });
                return result;
            }



            /*
             * エクスポート・編集終了時の警告ダイアログを表示などのエラー処理をする。
             * @param isForExport {boolean} エクスポート時に使う場合、true, なにも入力がない場合、false
             * @return {boolean} エラーが発生しているか否か エラーが発生している場合 true,それ以外はfalse
             */
            private _isErrorOccurBeforeSave(isForExport :boolean= false) :boolean{

                var options: Util.ElectronMessageBoxOptions = {

                };

                let faceName: string = $("#input-face-name").val();

                


                //名前がない場合のエラー
                if (!faceName) {
                    let errorMessage: string = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_NO_REMOTE_NAME");
                    if (isForExport) {
                        errorMessage  = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_NO_REMOTE_NAME_EXPORT");
                    }

                    let response = this._showSaveErrorDialog(errorMessage);
                    if (response === 0) {
                        //テキストフィールドにフォーカス
                        var $remoteName: JQuery = $("#input-face-name");
                        this.setFocusAndMoveCursorToEnd($remoteName);
                    }
                    return true;
                }


                //ボタン重なり時のエラー
                let overlapButtonError = this._overlapButtonsExist();
                if (overlapButtonError) {
                    let errorMessage: string = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_OVERLAP");
                    if (isForExport) {
                        errorMessage = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_OVERLAP_EXPORT");
                    }
                    this._showSaveErrorDialog(errorMessage + overlapButtonError);
                    return true;
                }


                // Bluetoothデバイスが複数設定されている場合はエラー
                let multipleBluetoothDevError = this._checkMultipleBluetoothDevicesExist(isForExport);
                if (multipleBluetoothDevError) {
                    this._showSaveErrorDialog(multipleBluetoothDevError);
                    return true;
                }

            }

            /**
             * 現在のターゲットとなるモデルに対して、データをセットする。
             * 
             * @param key {string} データのキー
             * @param value {any} 値
             * @param disablePrevData {boolean} Undoとしてモデルの無効化を設定するかどうか
             * @return {any} 現在のターゲットとなるモデル
             */
            private _updateCurrentModelData(key: string, value: any, disablePrevData?: boolean): ItemModel;

            /**
             * 現在のターゲットとなるモデルに対して、データをセットする。
             * 
             * @param properties {Object} データのキーとバリューのセット
             * @return {any} 現在のターゲットとなるモデル
             */
            private _updateCurrentModelData(properties: any): ItemModel;

            private _updateCurrentModelData(param1: any, param2?: any, param3: boolean = false): ItemModel {
                if (!this.currentItem_) {
                    console.warn(TAG + "_updateCurrentModelData() target model not found");
                    return;
                }
                var model = this.currentItem_;

                /**
                 * undo / redo 対応のために、CommandManager 経由で model の更新を行う
                 */
                var previousData = {};
                var nextData = {};
                if (_.isString(param1)) {
                    let key = param1;
                    let value = param2;

                    if (param3) {
                        // UndoでModel無効化/Redoで有効化（Palletからのドラッグ＆ドロップ追加時）
                        previousData["enabled"] = false;
                        nextData["enabled"] = true;
                    } else {
                        previousData[key] = model[key];
                    }

                    nextData[key] = value;
                } else if (_.isObject(param1)) {
                    let properties: Object = param1;
                    let keys = Object.keys(properties);
                    keys.forEach((key) => {
                        previousData[key] = model[key];
                        nextData[key] = properties[key];
                    });
                }

                var memento: IMemento = {
                    target: model,
                    previousData: previousData,
                    nextData: nextData
                };

                var mementoCommand = new MementoCommand([memento]);
                this.commandManager_.invoke(mementoCommand);

                // 更新内容を DOM に反映
                this._updateItemElementOnCanvas(model);

                return model;

            }

            /**
             * canvas 上にあるアイテムの要素に対して、表示の更新を行う
             * 
             * @param targetModel {ItemModel} アイテム要素の表示更新の対象となる model
             */
            private _updateItemElementOnCanvas(targetModel: ItemModel) {

                let FUNCTION_NAME = TAG + " : _updateItemElementOnCanvas : ";

                let $target = this._getItemElementByModel(targetModel);
                if (targetModel.enabled) {
                    $target.removeClass("disabled");
                } else {
                    $target.addClass("disabled");
                }

                //backgroundImageか否か
                let isBackground: boolean = $target.hasClass("background");

                // model の各プロパティーに対して、CSS 設定等で表示を更新する
                let itemType = targetModel.itemType;
                let keys = targetModel.properties;
                keys.forEach((key) => {
                    var value = targetModel[key];
                    if (!value) {
                        return;
                    }

                    switch (key) {
                        case "text":
                            $target.find(".label-value").text(value);
                            break;

                        case "size":
                            //HUISに表示したとき、Garageでみるより小さく表示されるため、Garageでの表示に補正を加える。
                            if (itemType == "button") {
                                value = JQUtils.getOffsetTextButtonSize(value);
                            } else if (itemType == "label") {
                                value = JQUtils.getOffsetTextLabelSize(value);
                            }
                            
                            $target.css("font-size", value + "pt");
                            break;

                        case "color":
                            // 16階調グレースケールを RGB 変換して CSS に設定
                            var resolvedColor = targetModel["resolvedColor"];
                            if (resolvedColor) {
                                $target.css("color", resolvedColor);
                            }
                            break;

                        case "path":
                            {
                                // 設定された background-image をリセットしておく
                                $target.css("background-image", "none");

                                // image.garageExtension.original のパスを優先的に使う。
                                // 存在しない場合は、image.path を使う。
                                let resolvedPath = this.getValidPathOfImageItemForCSS(targetModel);

                                
                                // 画像のロードが完了してから表示を更新する
                                let img = new Image();
                                img.src = resolvedPath;
                                img.onload = () => {
                                    this.setBackgroundImageUrlInCSS($target, resolvedPath);
                                    // 詳細編集エリアのプレビュー部分の更新
                                    this._updatePreviewInDetailArea(resolvedPath, $("#property-image-preview"));

                                    try {
                                        this.$currentTargetDummy_.css("background-image", $target.css("background-image"));
                                    } catch (e) {
                                        // ロード中にダミーが消される可能性を考慮
                                    }
                                };
                            }
                            break;

                        case "area":
                            {
                                // 座標とサイズを変更
                                let cssParams: any = {
                                    left: value.x + "px",
                                    top: value.y + "px",
                                    width: value.w + "px",
                                    height: value.h + "px"
                                };
                                if (itemType === "label") {
                                    cssParams.lineHeight = value.h + "px";
                                }
                                $target.css(cssParams);

                                // ターゲットがボタンの場合、state 内にある画像・ラベルのリサイズを行う
                                if (itemType === "button") {
                                    this._resizeButtonStateItem($target, value);
                                }
                            }
                            break;

                        case "resizeMode":
                            {
                                switch (value) {
                                    case "contain":
                                        $target.removeClass("image-stretch")
                                            .removeClass("image-cover");
                                        break;

                                    case "cover":
                                        $target.addClass("image-cover")
                                            .removeClass("image-stretch");
                                        break;

                                    case "stretch":
                                        $target.addClass("image-stretch")
                                            .removeClass("image-cover");
                                        break;

                                    default:
                                        $target.removeClass("image-stretch")
                                            .removeClass("image-cover");
                                }
                            }
                            break;

                        case "resizeOriginal":
                            {
                                let resolvedOriginalPath = targetModel["resizeResolvedOriginalPathCSS"];

                                //CSS対応のresizeResolvedOriginalPathCSSがない場合
                                if (resolvedOriginalPath == null) {
                                    resolvedOriginalPath = targetModel["resizeResolvedOriginalPath"];
                                }

                                if (resolvedOriginalPath) {
                                    // 画像のロードが完了してから表示を更新する
                                    let img = new Image();
                                    if ($("#property-image-preview").css("background-image") !== "none") { // 削除されている場合はそのまま
                                        img.src = resolvedOriginalPath;
                                    }
                                    img.onload = () => {
                                        this.setBackgroundImageUrlInCSS($target, resolvedOriginalPath);


                                        // プレビュー部分の更新
                                        this._updatePreviewInDetailArea(resolvedOriginalPath, $("#property-image-preview"));
                                    };
                                    
                                }
                            }
                            break;
                        case "state": //ボタンの画像などを変更した際の、変更
                            {
                                if (itemType === "button") {
                                    let targetButton: Model.ButtonItem;
                                    if (targetModel instanceof Model.ButtonItem) {
                                        targetButton = targetModel.clone();
                                    }
                                    var states = value;

                                    //ターゲットのstateIdはモデルに記載されているdefault値、もし値がない場合0に。
                                    let stateId: number = targetButton.default;

                                    var currentStates: Model.ButtonState[] = $.extend(true, [], states);

                                    let targetStates: Model.ButtonState[];
                                    if (_.isUndefined(stateId)) {
                                        // stateId が指定されていない場合は、全 state を更新
                                        targetStates = states;
                                    } else {
                                        targetStates = states.filter((state) => {
                                            return state.id === stateId;
                                        });
                                    }

                                    if (!targetStates || targetStates.length < 1) {
                                        console.warn(FUNCTION_NAME + "state id is not found");
                                        return;
                                    }

                                    // state id は重複することはないが、もし複数の state が見つかった場合は、最初の state をターゲットとする
                                    var $targetStateElem = $target.find(".button-state").filter((index: number, elem: Element) => {
                                        return parseInt(JQUtils.data($(elem), "stateId"), 10) === stateId;
                                    });
                                    if (!$targetStateElem || $targetStateElem.length < 1) {
                                        console.warn(FUNCTION_NAME + "target state elem is not found");
                                        return;
                                    }

                                    let buttonW = targetButton.area.w;
                                    if (buttonW == null) {
                                        console.warn(FUNCTION_NAME + "buttonW is null");
                                        return;
                                    }

                                    let buttonH = targetButton.area.h;
                                    if (buttonH == null) {
                                        console.warn(FUNCTION_NAME + "buttonH is null");
                                        return;
                                    }

                                    

                                    targetStates.forEach((targetState: Model.ButtonState) => {

                                        //"text", "size", "path", "resolved-path", "resizeMode"すべてが変化したとみなす。
                                        let props = {};

                                        let label = targetState.label;
                                        props["text"] = "";
                                        if (label != null) {
                                            if (label[0] != null){
                                                let text = label[0].text;
                                                if (text != null) {
                                                    props["text"] = text;
                                                }

                                                let size = label[0].size;
                                                if (size != null) {
                                                    props["size"] = size;
                                                }
                                            }
                                        }

                                        let image = targetState.image;
                                        props["resolved-path"] = "null";
                                        if (image != null) {
                                            if (image[0] != null) {
                                                //resizeResolvedOriginalPathCSS,resolved-patCSSをいれるとupdateButtonOnCanvasでさらに変換されてしまう。
                                                //originalPathを優先。ない場合は、resolved-pathを仕様。
                                                let resizeOriginal = image[0].resizeResolvedOriginalPath;
                                                if (resizeOriginal != null) {
                                                    props["resizeResolvedOriginalPath"] = resizeOriginal;
                                                } else {
                                                    let resolvedPath = image[0].resolvedPath;
                                                    if (resolvedPath != null) {
                                                        props["resolved-path"] = resolvedPath;
                                                    }
                                                }

                                                

                                                let resizeMode = image[0].resizeMode;
                                                if (resizeMode != null) {
                                                    props["resizeMode"] = resizeMode;
                                                }

                                                
                                            }
                                            
                                        }

                                        let keys = Object.keys(props);
                                        keys.forEach((key) => {
                                            let value = props[key];
                                            this.updateButtonOnCanvas(stateId, key, value, targetState, $targetStateElem, buttonW, buttonH);
                                        });
                                    });
                                }
                            }
                            break;
                    }

                    
                });

                this._overlapButtonsExist();
            }

            /**
             * canvas 上にあるアイテムの要素に対して、表示の更新を行う
             * @param targetModel {ItemModel[]} アイテム要素の表示更新の対象となる model の配列
             */
            private _updateItemElementsOnCanvas(targetModels: ItemModel[]) {
                if (!targetModels) {
                    return;
                }

                for (let targetModel of targetModels) {
                    this._updateItemElementOnCanvas(targetModel);
                }
            }

            /**
             * 詳細設定エリアのプレビューの画像を更新する
             * このとき、resolvedImagePathForCSSは、CSSに対して、resolvedされていなければならない。
             *
             * @param {string} resolvedImagePathForCSS 画像パス
             * @param {JQeury} $preview プレビュー
             */
            private _updatePreviewInDetailArea(resolvedImagePathForCSS: string, $preview: JQuery) {
                if (resolvedImagePathForCSS == undefined) {
                    console.log("FullCustom.ts:_updatePreviewInDetailArea:imagePath is Undefined");
                    return;
                }

                if ($preview == undefined) {
                    console.log("FullCustom.ts:_updatePreviewInDetailArea:$previewId is Undefined");
                    return;
                }

                if (this._isValidResolvedImagePathForCSS(resolvedImagePathForCSS)) {
                    this.setBackgroundImageUrlInCSS($preview, resolvedImagePathForCSS);
                    let previewWidth = $preview.width();
                    let img = new Image();
                    img.src = resolvedImagePathForCSS;
                }
            }

            /**
             * パスが画像パスとして有効か確認する
             *
             * @param resolvedImagePathForCSS {string} 画像パス
             * @return {boolean} 画像パスが有効かどうか
             */
            private _isValidResolvedImagePathForCSS(resolvedImagePathForCSS: string): boolean {
                return resolvedImagePathForCSS != HUIS_REMOTEIMAGES_ROOT
                    && resolvedImagePathForCSS != ""
                    && resolvedImagePathForCSS != "none";
            }

            /**
             * データとして持っている state のリストを Button Model に更新する
             */
            private _updateCurrentModelButtonStatesData() {
                if (!this.currentItem_ || !(this.currentItem_ instanceof Model.ButtonItem) || !this.currentTargetButtonStates_) {
                    return;
                }
                // 更新がない場合は何もしない
                if (!this.currentTargetButtonStatesUpdated_) {
                    return;
                }
                // this.currentTargetButtonStatesUpdated_ を true にするルートが現状存在しないため
                // 以下のコードが実行されることはないはず
                console.error("unexpected path to _updateCurrentModelButtonStateData()");
                this.currentTargetButtonStatesUpdated_ = false;
            }

            /**
             * 現在ターゲットとなっているボタン内の「状態」にデータをセットする
             *
             * @param stateId {number} データをセットする状態の ID。undefined の場合は、全 state を更新。
             * @param key {string} データのキー
             * @param value {any} 値
             */
            private _updateCurrentModelStateData(stateId: number, key: string, value);

            /**
             * 現在ターゲットとなっているボタン内の「状態」にデータをセットする
             *
             * @param stateId {number} データをセットする状態の ID。undefined の場合は、全 state を更新。 
             * @param properties {Object} キーと値のセット
             */
            private _updateCurrentModelStateData(stateId: number, properties: any);

            private _updateCurrentModelStateData(stateId: number, param1: any, param2?: any) {

                if (!this.currentItem_) {
                    console.warn(TAG + "_updateCurrentModelStateData() target model is not found");
                    return;
                }
                if (!(this.currentItem_ instanceof Model.ButtonItem)) {
                    console.warn(TAG + "_updateCurrentModelStateData() target model is not button item");
                    return;
                }

                /**
                 * state 内に label が存在しない場合に、補完する
                 */
                var solveLabel = function (state: Model.ButtonState) {
                    var defaltTextSize = 30;
                    let localStateId = state.id;

                    var $targetTextSizePullDown: JQuery = $(".property-state-text-size[data-state-id=\"" + localStateId + "\"]");

                    if ($targetTextSizePullDown.length == 0) {//DOMが存在しないとき(長さが0のとき)stateId=0の際のDOMを読み込み
                        $targetTextSizePullDown = $(".property-state-text-size[data-state-id=\"0\"]");
                    }

                    if ($targetTextSizePullDown) {
                        defaltTextSize = +($targetTextSizePullDown.val());
                    }

                    if (!state.label || !state.label.length) {
                        state.label = [new Model.LabelItem({
                            areaRatio: {
                                x: 0, y: 0, w: 1, h: 1
                            },
                            text: "",
                            size: defaltTextSize,
                            font_weight: FontWeight.FONT_BOLD
                        })];
                    }
                };

                /**
                 * state 内に image が存在しない場合に、補完する
                 */
                var solveImage = function (state: Model.ButtonState) {
                    if (!state.image || !state.image.length) {
                        state.image = [new Model.ImageItem({
                            areaRatio: {
                                x: 0, y: 0, w: 1, h: 1
                            },
                            path: ""
                        })];
                    }
                };

                let props: Object;
                if (_.isString(param1)) {
                    props = {};
                    props[param1] = param2;
                } else if (_.isObject(param1)) {
                    props = param1;
                } else {
                    console.warn(TAG + "_updateCurrentModelStateData() unknown type param");
                    return;
                }

                var button = this.castToButton(this.currentItem_);
                var states = button.state;
                if (!states) {
                    console.warn(TAG + "_updateCurrentModelStateData() state is not found in button");
                    return;
                }
                var currentStates: Model.ButtonState[] = $.extend(true, [], states);

                let targetStates: Model.ButtonState[];
                if (_.isUndefined(stateId) ) {
                    // stateId が指定されていない場合は、全 state を更新
                    targetStates = states;
                } else if (stateId === TARGET_ALL_STATE) {
                    // stateIdがTARGET_ALL_STATEの場合、全stateを更新
                    targetStates = states;
                } else {
                    targetStates = states.filter((state) => {
                        return state.id === stateId;
                    });
                }

                if (!targetStates || targetStates.length < 1) {
                    console.warn(TAG + "_updateCurrentModelStateData() state id is not found");
                    return;
                }

                // state id は重複することはないが、もし複数の state が見つかった場合は、最初の state をターゲットとする
                var targetState = targetStates[0];
                var $targetStateElem = this.$currentTarget_.find(".button-state").filter((index: number, elem: Element) => {
                    let tmpStateId = stateId;
                    if (_.isUndefined(stateId)) {
                        // stateId が指定されていない場合は、state:0のDOMを利用する。
                        tmpStateId = 0;
                    } else if (stateId === TARGET_ALL_STATE) {
                        // stateId がTARGET_ALL_STATEの場合は、state:0のDOMを利用する。
                        tmpStateId = 0;
                    }
                    return parseInt(JQUtils.data($(elem), "stateId"), 10) === tmpStateId;
                });
                if (!$targetStateElem || $targetStateElem.length < 1) {
                    console.warn(TAG + "_updateCurrentModelStateData() target state elem is not found");
                    return;
                }

                targetStates.forEach((targetState: Model.ButtonState) => {

                    let keys = Object.keys(props);
                    keys.forEach((key) => {
                        let value = props[key];
                        // データの更新
                        switch (key) {
                            case "text":
                                solveLabel(targetState);
                                targetState.label[0].text = value;
                                break;

                            case "size":
                                solveLabel(targetState);
                                
                                if (isFinite(value)) {//numberでない場合、numberに変換。
                                    value =+ (value);
                                }

                                targetState.label[0].size = value;
                                break;

                            case "path":
                                if (value) {
                                    solveImage(targetState);
                                    targetState.image[0].path = value;
                                } else {// 未指定の場合は削除
                                    targetState.image = null;
                                }
                                break;

                            case "resolved-path":
                                if (value) {
                                    solveImage(targetState);
                                    targetState.image[0].resolvedPath = value;
                                } else {
                                    targetState.image = null;
                                }
                                break;

                            case "resizeOriginal":
                                if (value) {
                                    solveImage(targetState);
                                    targetState.image[0].resizeOriginal = value;
                                }
                                break;

                            case "resizeMode":
                                if (value) {
                                    solveImage(targetState);
                                    targetState.image[0].resizeMode = value;
                                }
                                break;

                            case "resized":
                                if (value) {
                                    solveImage(targetState);
                                    targetState.image[0].resized = true;
                                }
                                break;

                            default:

                        }
                        let currentStateId = targetState.id;
                        this.updateButtonOnCanvas(currentStateId, key, value, targetState, $targetStateElem, button.area.w, button.area.h);

                    
                    });
                });

                var memento: IMemento = {
                    target: button,
                    previousData: { "state": currentStates },
                    nextData: { "state": states }
                };
                var mementoCommand = new MementoCommand([memento]);
                this.commandManager_.invoke(mementoCommand);


                //propertyArea用のクラス内のモデルを更新する。
                if (states != null) {
                    
                    if (this.buttonProperty != null) {
                        this.buttonProperty.setStates(states);
                    }

                    if (this.macroProperty != null) {
                        this.macroProperty.setStates(states);
                    }

                    if (this.jumpProperty != null) {
                        this.jumpProperty.setStates(states);
                    }
                }


            }

            /*
            *  button のcanvas 上のスタイルと詳細エリアの更新する
            *  @param stateId {number} buttonのステートID
            *  @param key{string} update対象の種類 "text", "size" など
            *  @param value 変更量
            *  @$targetStateElem {JQuery} 対象のJQuery要素
            *  @buttonAreaW{number} 変更対象のボタンのW
            *  @buttonAreaH{number} 変更対象のボタンのH
            */
            private updateButtonOnCanvas(stateId: number, key: string, value, targetState: Model.ButtonState, $targetStateElem:JQuery, buttonAreaW : number, buttonAreaH :number) {
                    // canvas 上のスタイルと詳細エリアの更新
                        switch (key) {
                            case "text":
                            case "size":
                                {
                                
                                    let $labelElement = $targetStateElem.find(".state-label");
                                    let label = targetState.label[0];
                                    let text = (label && label.text) ? label.text : "";
                                    let size = (label && label.size) ? label.size : 0;
                                    $labelElement.text(text);
                                    $labelElement.css({
                                        left: "0",
                                        top: "0",
                                        width: buttonAreaW + "px",
                                        height: buttonAreaH + "px",
                                        lineHeight: buttonAreaH + "px",
                                        color: "rgb(0,0,0)",
                                        fontSize: JQUtils.getOffsetTextButtonSize(size) + "pt"
                                    });

                                    //画像が存在するとき、テキストEdit機能を非表示にする
                                    this.toggleImagePreview(stateId);
                                }
                                break;

                            case "path":
                                {
                                    // 詳細エリアの画像パス名を更新
                                    let $input = $(".refer-state-image[data-state-id=\"" + stateId + "\"]");
                                    $input.val(value);
                                }
                                break;

                            case "resizeResolvedOriginalPath":
                            case "resolved-path":
                                {
                                    let $imageElement = $targetStateElem.find(".state-image");
                                    $imageElement.css({
                                        left: "0",
                                        top: "0",
                                        width: buttonAreaW + "px",
                                        height: buttonAreaH + "px",
                                    });

                                    let inputUrl: string = null;
                                   
                                    inputUrl = JQUtils.enccodeUriValidInCSS(value);
                                    


                                    if (inputUrl == null) {
                                        inputUrl = "none";
                                    }    

                                    this.setBackgroundImageUrlInCSS($imageElement, inputUrl);


                                    // 画像のロードが完了してから表示を更新する
                                    let img = new Image();
                                    img.src = inputUrl;
                                    img.onload = () => {
                                        this.setBackgroundImageUrlInCSS($imageElement, inputUrl);
                                        // 詳細エリアのプレビュー更新
                                        let $preview = $(".property-state-image-preview[data-state-id=\"" + stateId + "\"]");

                                        //画像が存在するとき、テキストEdit機能を非表示にする
                                        this.toggleImagePreview(stateId);

                                    };
                                    
                                    
                                }
                                break;
                            case "resizeMode":
                                {
                                    let $imageElement = $targetStateElem.find(".state-image");
                                    switch (value) {
                                        case "contain":
                                            $imageElement.removeClass("image-stretch")
                                                .removeClass("image-cover");
                                            break;
                                        case "cover":
                                            $imageElement.addClass("image-cover")
                                                .removeClass("image-stretch");
                                            break;
                                        case "stretch":
                                            $imageElement.addClass("image-stretch")
                                                .removeClass("image-cover");
                                            break;
                                        default:
                                            $imageElement.removeClass("image-stretch")
                                                .removeClass("image-cover");
                                    }
                                }
                                break;
                        }
            }


            /*
            * ボタン画像がある場合、テキストエリアを表示に。する
            */
            private toggleImagePreview(stateId: number) {
                let FUNCTION_NAME = TAG + " :toggleImagePreview: ";

                var $preview = $(".property-state-image-preview[data-state-id=\"" + stateId + "\"]");
                if ($preview == null) {
                    //redo, undoの際に、previewが表示されていない場合がある。
                    return;
                }

                var $textFieldInPreview = $preview.find(".text-field-in-preview");
                if ($textFieldInPreview == null) {
                    console.warn(FUNCTION_NAME + "$textFieldInPreview is undefined");
                    return;
                }

                //cssのbackgroundImage要素から、画像名を抽出
                let previceBagroundCSS: string = $preview.css("background-image");
                if (previceBagroundCSS == null) {
                    return;
                }

                let decodePath = JQUtils.extractBackgroundImagePathFromCss(previceBagroundCSS);

                var backgroundImageCssArray = decodePath.split("/");
                var pathArray = backgroundImageCssArray[backgroundImageCssArray.length - 1].split('"');
                var path = pathArray[0];

                //なぜか、background-imageにfull-custom.htmlが紛れることがある。
                if (path != "null" && path != "full-custom.html" && path != "none" && Util.MiscUtil.existsFile(decodePath)) {
                    $textFieldInPreview.css("visibility", "hidden");
                } else {//画像が存在しないとき、テキストEdit機能を表示する。
                    this._updatePreviewInDetailArea("none", $preview);
                    $textFieldInPreview.css("visibility", "visible");
                    
                }
            }

            /**
             * 現在ターゲットとなっているボタンの state を取得する
             * 
             * @param stateId {number} 現在ターゲットとなっているボタンから取得する state の ID
             * @return {IStateDetail} 取得した state の情報。存在しない場合は undefined
             */
            private _getCurrentTargetState(stateId: number): IStateDetail {
                if (!this.currentTargetButtonStates_) {
                    return undefined;
                }
                var targetStates = this.currentTargetButtonStates_.filter((state) => {
                    return state.id === stateId;
                });
                if (!targetStates || !targetStates.length) {
                    return undefined;
                }

                return targetStates[0];
            }

            /**
             * 現在選択中のアイテムをアイテム用クリップボードに記憶する
             */
            private setClipboadToItem() {
                if (this.$currentTarget_ == null) {
                    return;
                }
                let currentItemCenterPosition = this._getCurrentTargetCenterPosition();
                if (this.isOutsideOfCanvas(currentItemCenterPosition)) {
                    return;
                }

                this.clipboard.clear();
                this.clipboard.setItem(
                    this._getCanvasPageModuleId(),
                    this._getItemModel(this.$currentTarget_, this.faceRenderer_canvas_).clone(),
                    parseInt(JQUtils.data(this.$currentTarget_.parent(), 'moduleOffsetY'), 10)
                );
            }

            /**
             * アイテム用クリップボードに記憶されているアイテムを Canvas に張り付ける
             */
            private pasteItemFromClipboard() {
                if (!this.clipboard.hasItem()) {
                    return;
                }

                let mementoList: IMemento[] = [];
                for (let target of this.clipboard.getItems(this._getCanvasPageModuleId())) {
                    if (target.item == null ||
                        target.item.area == null ||
                        target.position == null) {
                        continue;
                    }

                    let newPos: IPosition = this.validateItemArea({
                        x: target.position.x,
                        y: target.position.y,
                        w: target.item.area.w,
                        h: target.item.area.h
                    });
                    let newItem: ItemModel = this.setItemOnCanvas(target.item, target.moduleOffsetY, newPos);

                    if (!newItem) {
                        console.error("failed to add new PalletItem");
                        return;
                    }

                    // model 状態を有効にする
                    mementoList.push({
                        target: newItem,
                        previousData: {
                            enabled: false
                        },
                        nextData: {
                            enabled: true
                        }
                    });
                }

                var mementoCommand = new MementoCommand(mementoList);
                let updatedItem: ItemModel[] = this.commandManager_.invoke(mementoCommand);

                this._updateItemElementsOnCanvas(updatedItem);

                this._loseTarget();

            }

            /**
             * 現在ターゲットとなっているアイテムを削除する
             * @param doInvoke 削除処理を実行するかどうか。falseの場合は削除処理は行わず、そのコマンドのみを返す
             */
            private _deleteCurrentTargetItem(doInvoke: boolean = true): IMemento {
                if (!this.$currentTarget_) {
                    console.error(TAG + "[FullCutsom._deleteCurrentTargetItem] target item is not found.");
                    return;
                }

                var model: ItemModel = this.currentItem_;

                // model 状態を無効にする
                var memento: IMemento = {
                    target: model,
                    previousData: {
                        enabled: true
                    },
                    nextData: {
                        enabled: false
                    }
                };

                if (doInvoke) {
                    var mementoCommand = new MementoCommand([memento]);
                    this.commandManager_.invoke(mementoCommand);

                    this._updateItemElementOnCanvas(model);
                }

                var $detail = $("#face-item-detail");
                $detail.children().remove();

                this._updateItemElementOnCanvas(model);
                return memento;
            }

            

            /**
             * 画像の resizeMode を設定する。
             * 
             * @param $select {JQuery} 
             */
            private _setImageResizeModeBySelect($select: JQuery) {
                let resizeMode: string = $select.val();
                if ($select.hasClass("button-state-property")) {
                    let stateId = parseInt(JQUtils.data($select, "stateId"), 10);
                    this._updateCurrentModelStateData(stateId, "resizeMode", resizeMode);
                } else {
                    this._updateCurrentModelData("resizeMode", resizeMode);
                }
            }

            /**
             * ページを削除する。
             * 
             * @param $pageModule {JQuery} 削除するページ
             */
            private _deletePage($pageModule: JQuery) {
                
                let response = electronDialog.showMessageBox({
                    type: "warning",
                    message: $.i18n.t("dialog.message.STR_DAIALOG_ALERT_DELTE_PAGE"),
                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_DELETE"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
                    title: PRODUCT_NAME,
                    cancelId: 1,
                });
                if (response == 0) {//
                    let pageIndex = parseInt(JQUtils.data($pageModule, "modulePageIndex"), 10);
                    this.faceRenderer_canvas_.deletePage(pageIndex);
                    let $pageContainer = $pageModule.parent();
                    $pageContainer.remove();

                    // ページが削除された場合、ページ追加ボタンを操作可能にする。
                    this.setAddPageButtonEnabled(true);

                    // 現在のターゲットを外す
                    this._loseTarget();

                    
                    // CommandManager の初期化
                    if (this.commandManager_) {
                        this.commandManager_.reset();
                    } else {
                        this.commandManager_ = new CommandManager();
                    }

                    return;
                } else {
                    return;
                }

                
            }

            private _getDraggingItemPosition(mousePosition: IPosition) {
                var ungriddedPosition = {
                    x: this.mouseMoveStartTargetPosition_.x + (mousePosition.x - this.mouseMoveStartPosition_.x) * 2,
                    y: this.mouseMoveStartTargetPosition_.y + (mousePosition.y - this.mouseMoveStartPosition_.y) * 2
                };
                return ungriddedPosition;
            }

            private _getGriddedItemPosition(position: IPosition, newCanvas: JQuery, baseNewCanvas: boolean = false) {

                var pointedCid = JQUtils.data(newCanvas, "cid");
                var newX;
                var newY;

                //グリッドがデフォルトの場合は、左右にBIAS_Xの利用不能エリアがある。
                if (this.gridSize_ === DEFAULT_GRID) {
                    var BIAS_X = BIAS_X_DEFAULT_GRID_LEFT;
                    var BIAS_Y = 0

                    newX = Math.round((position.x-BIAS_X) / this.gridSize_) * this.gridSize_ + BIAS_X;
                    newY = Math.round((position.y-BIAS_Y) / this.gridSize_) * this.gridSize_ + BIAS_Y;

                } else {
                    newX = Math.round(position.x / this.gridSize_) * this.gridSize_;
                    newY = Math.round(position.y / this.gridSize_) * this.gridSize_;
                }

                // アイテム元座標のキャンバス
                var fromCanvas = this.$currentTarget_.parent();
                var fromCid = JQUtils.data(fromCanvas, "cid");
                if (fromCid && pointedCid && fromCid != pointedCid) {
                    // ページを跨ぐ場合グリッドのずれを補正
                    newY += ((newCanvas.offset().top - fromCanvas.offset().top) * 2) % this.gridSize_;

                    if (baseNewCanvas) {
                        newY -= (newCanvas.offset().top - fromCanvas.offset().top) * 2;
                    }
                }

                return { x: newX, y: newY };
            }

            /**
             * 元のアイテム座標からグリッド位置に合わせて補正されたアイテム座標を返す
             * @param mousePosition
             * @param baseNewCanvas アイテムがページを跨いで移動する際に移動後のキャンバスページを基準にするかどうか。falseの場合はドラッグ開始時のキャンバスを基準にした座標を返す。
             */
            private _getGriddedDraggingItemPosition(mousePosition: IPosition, baseNewCanvas: boolean = false): IPosition {
                // グリッドに合わせる前のアイテム座標
                var ungriddedPosition: IPosition = this._getDraggingItemPosition(mousePosition);

                // グリッド位置補正前の対象アイテムが乗っているキャンバス
                var pointedCanvas = this._getCanvasPageByDraggingPosition(mousePosition.y);

                return this._getGriddedItemPosition(ungriddedPosition, pointedCanvas, baseNewCanvas);
            }

            /**
             * 指定した area を検証し、妥当な area の値を返す。
             * チェック項目は、画面範囲外チェックと重なっていないかどうかのチェック (ボタンのみ)
             * 
             * @param area {IArea} 現在の target となるアイテムの新しい area。ただし、すべてのプロパティが揃わなくてもよい。
             * @return {IArea} 妥当性が確認された area 
             */
            private _validateArea(area: { x?: number, y?: number, w?: number, h?: number }): IArea {
                if (!this.currentItem_) {
                    console.warn(TAG + "_validateArea() target model not found.");
                    return null;
                }

                let copiedArea = $.extend(true, {}, this.currentItem_.area, area)
                return this.validateItemArea(copiedArea);
            }

            private validateItemArea(area: IArea): IArea {
                var complementedArea: IArea = $.extend(true, {}, area);

                this._normalizeArea(complementedArea);

                return complementedArea;
            }

            /**
             * アイテムが HUIS の画面からはみ出さないように位置やサイズを正規化する。
             * 
             * @param area {IArea} [in,out] アイテムのエリア
             */
            private _normalizeArea(area: IArea) {
                if (area.x < BIAS_X_DEFAULT_GRID_LEFT) {
                    area.x = BIAS_X_DEFAULT_GRID_LEFT;
                }
                if (area.y < 0) {
                    area.y = 0;
                }
                if (area.w <= 0) {
                    area.w = this.gridSize_;
                }
                if (area.h <= 0) {
                    area.h = this.gridSize_;
                }

                let maxX = GRID_AREA_WIDTH + BIAS_X_DEFAULT_GRID_LEFT;

                if (maxX < area.x + area.w) {
                    if (GRID_AREA_WIDTH < area.w) {
                        area.w = GRID_AREA_WIDTH;
                        area.x = BIAS_X_DEFAULT_GRID_LEFT;
                    } else {
                        area.x = maxX - area.w;
                    }
                }
                if (GRID_AREA_HEIGHT < area.y + area.h) {
                    if (GRID_AREA_HEIGHT < area.h) {
                        area.h = GRID_AREA_HEIGHT;
                        area.y = 0;
                    } else {
                        area.y = GRID_AREA_HEIGHT - area.h;
                    }
                }
            }

            /**
             * 対象エリアが完全にキャンバスの外にあるか検査する
             * 一部でもキャンバス内に含まれる場合はfalseを返す
             * @param area {IArea} 検査対象のエリア
             * @return {boolean} エリアが完全にキャンバス外の場合はtrue、そうでない場合はfalse
             */
            private isCompletelyOutOfCanvas(area: IArea): boolean {
                if (area.x + area.w < BIAS_X_DEFAULT_GRID_LEFT ||
                    area.x > GRID_AREA_WIDTH + BIAS_X_DEFAULT_GRID_LEFT ||
                    area.y + area.h < 0 ||
                    area.y > GRID_AREA_HEIGHT) {

                    return true;
                }

                return false;
            }

            private castToButton(item: Model.Item) {
                if (item instanceof Model.ButtonItem) {
                    var buttonModel: Model.ButtonItem = item;
                    return buttonModel;
                } else {
                    return null;
                }
            }

            /*
             * 現在のターゲットのCSSが、ボタンと重なっていた場合、警告色に変化させる
             */
            private changeColorOverlapedButtonsWithCurrentTargetButton() {

                let FUNCTION_NAME: string = TAG + " : checkOverlayCurrentTarget : ";

                //currentTargetがボタンでなかった場合、無視する
                var buttonItem = this.castToButton(this.currentItem_);
                if (buttonItem == null) {
                    return;
                }

                //currentTargetのエリアを取得
                if (this.$currentTarget_ == undefined) {
                    console.warn(FUNCTION_NAME + "$currentTarget_ is undefined");
                    return;
                }
                let currentTargetArea: IArea = {
                    x: parseInt(this.$currentTarget_.css("left"), 10),
                    y: parseInt(this.$currentTarget_.css("top"), 10),
                    w: parseInt(this.$currentTarget_.css("width"), 10),
                    h: parseInt(this.$currentTarget_.css("height"), 10)
                }

                // 検査したボタン
                let buttons: Model.ButtonItem[] = [];
                // 重なっていたボタン
                let overlapButtons: Model.ButtonItem[] = [];

                let currentCanvas = this.$currentTarget_.parent();
                let currentCanvasId = JQUtils.data(currentCanvas, "cid");
                let hoverCanvas = this._getCanvasPageByItemArea(this.$currentTarget_.parent().offset().top, currentTargetArea.y, currentTargetArea.h);
                let hoverCanvasId = JQUtils.data(hoverCanvas, "cid");
                if (currentCanvasId != hoverCanvasId) {
                    // 移動中のボタンは移動前にいたキャンバス上の座標なので
                    // 現在位置のキャンバス上の座標を設定するために高さを調整
                    currentTargetArea.y = currentTargetArea.y - (hoverCanvas.offset().top - currentCanvas.offset().top) * 2;
                }

                $('#face-canvas .module-container').each((index, elm) => {
                    let canvasModuleId = JQUtils.data($(elm), "cid");
                    if (!canvasModuleId) {
                        return true; // JQuery.each()でのcontinue
                    }

                    let tmpButtons: Model.ButtonItem[] = this.faceRenderer_canvas_.getButtons(canvasModuleId);
                    if (!tmpButtons) {
                        return true;
                    }

                    if (currentCanvasId != hoverCanvasId && canvasModuleId == hoverCanvasId) {
                        // 移動中のボタンの元ページと現在位置のページが異なる場合、現在ページにモデルを仮追加する
                        tmpButtons.push(buttonItem);
                    }

                    // 移動中のボタンの元ページと現在位置のページが異なる場合、元ページのモデルを無視する
                    let ignoreCurrentModel = (currentCanvasId != hoverCanvasId && canvasModuleId == currentCanvasId);

                    let tmpOverlapButtons: Model.ButtonItem[] = this.getOverlapButtonItems(tmpButtons, currentTargetArea, ignoreCurrentModel);

                    if (currentCanvasId != hoverCanvasId && canvasModuleId == hoverCanvasId) {
                        // 仮追加していたモデルを削除
                        tmpButtons.pop();
                    }

                    $.merge(buttons, tmpButtons);
                    $.merge(overlapButtons, tmpOverlapButtons);
                });

                //overlapButtonsがundefinedのとき、重なっているボタン数が0のとき、currentTargetModelを通常色に
                if (overlapButtons == null || overlapButtons.length === 0) {
                    this.changeButtonFrameColorNormal(buttonItem,true);
                }

                this.changeOverlapButtonsFrame(overlapButtons, buttons);
            }

            /**
            * 重なっているボタン配列をかえす。
            * @param buttons {Model.ButtonItem} 対象となるボタンたち
            * @param currentTargetArea? {IArea} currentTargetは特殊なボタンとして扱う。
            * @param ignoreCurrentTarget {boolean} currentTargetを検査対象外とするかどうか
            * @return {Model.ButtonItem}
            */
            private getOverlapButtonItems(buttons:Model.ButtonItem[], currentTargetArea? :IArea, ignoreCurrentTarget: boolean = false) {
                let FUNCTION_NAME = TAG + "getOverlapButtonItems";
                let overlapButtons: Model.ButtonItem[] = []; 
                
                if (!buttons) {
                    return overlapButtons;
                }

                let buttonCount = buttons.length;
                if (buttonCount < 2) {
                    return overlapButtons;
                }


                // 後で重なっていないボタンを通常色に戻すボタンを判定するため、重なっているボタンを格納。
                
                for (let i = 0; i < buttonCount - 1; i++) {
                    if (ignoreCurrentTarget && buttons[i].cid == this.currentItem_.cid) {
                        continue;
                    }

                    for (let j = i + 1; j < buttonCount; j++) {
                        if (ignoreCurrentTarget && buttons[j].cid == this.currentItem_.cid) {
                            continue;
                        }

                        let button1Area = buttons[i].area,
                            button2Area = buttons[j].area;

                        //もし、currentTargetのbuttonの場合、areaはcurrentTargetAreaをつかう。
                        if (currentTargetArea) {
                            if (buttons[i].cid == this.currentItem_.cid) {
                                button1Area = currentTargetArea;
                            }

                            if (buttons[j].cid == this.currentItem_.cid) {
                                button2Area = currentTargetArea;
                            }
                        }


                        // 両方のボタンが enabled 状態かつキャンバス内のときのみ判定
                        if (buttons[i].enabled && buttons[j].enabled &&
                            !this.isCompletelyOutOfCanvas(button1Area) && !this.isCompletelyOutOfCanvas(button2Area)) {
                            // 当たり判定
                            if (this.isOverlap(button1Area, button2Area)) {
                                //例外対象でなかったら配列に追加
                                overlapButtons.push(buttons[i]);
                                overlapButtons.push(buttons[j]);
                            }
                        }
                    }
                }

                return overlapButtons;

            }

            /*
            * 重なっているボタンを警告色に変える。
            * @param overlapedButtons :{Model.ButtonItem[]} 重なっているボタンの配列
            * @param buttons:{Model.ButtonItem[]} 対象となるボタン配列
            */
            private changeOverlapButtonsFrame(overlapButtons:Model.ButtonItem[], buttons:Model.ButtonItem[]) {
                let FUNCTION_NAME = TAG + "changeNotOverlapButtonFrame";

                if (overlapButtons == null) {
                    console.warn(FUNCTION_NAME + "overlapButtons is null");
                    return;
                }

                if (buttons == null) {
                    console.warn(FUNCTION_NAME + "buttons is null");
                    return;
                }

                //すべてのボタンの色を通常にもどす。
                if (buttons.length === 0) {
                    return;
                }
                for (let i = 0; i < buttons.length; i++) {
                    this.changeButtonFrameColorNormal(buttons[i]);
                }

                //重なっているボタンを警告色にする
                if (overlapButtons.length === 0) {
                    return;
                }               
                for (let j = 0; j < overlapButtons.length; j++){
                    this.changeButtonFrameColorWarn(overlapButtons[j]);
                }
                    
            }


    
        
            /*
            * 重なりあったボタンの枠線を警告色に変える
            * @param overlayedButton{ Model.buttonItem } 枠の色を変える対象のbutton model
            * @param isCurrentTarget{boolean} 対象がcurrentTargetだった場合true
            */
            private changeButtonFrameColorWarn(overlayedButton: Model.ButtonItem,isCurrentTarget? : boolean) {
                let FUNCTION_NAME = TAG + " : changeButtonFrameColorWarn : ";
                if (overlayedButton == null) {
                    console.warn(FUNCTION_NAME + "overlayedButton is null");
                }
                let $button: JQuery = this._getItemElementByModel(overlayedButton);

                if (isCurrentTarget) {
                    this.$currentTarget_.addClass("overlayed");
                }else if ($button) {
                    $button.addClass("overlayed");
                }
                
            }

            /*
             * ボタンの枠線をもとに戻す
             * @param overlayedButton{ Model.buttonItem } 枠の色を変える対象のbutton model
             * @param isCurrentTarget{boolean} 対象がcurrentTargetだった場合true
             */
            private changeButtonFrameColorNormal(normalButton: Model.ButtonItem, isCurrentTarget ? : boolean) {
                let FUNCTION_NAME = TAG + " : changeButtonFrameColorNormal : ";
                if (normalButton == null) {
                    console.warn(FUNCTION_NAME + "normalButton is null");
                }
                let $button: JQuery = this._getItemElementByModel(normalButton);

                if (isCurrentTarget) {
                    this.$currentTarget_.removeClass("overlayed");
                }else if ($button) {
                    $button.removeClass("overlayed");
                }
            }



            /**
             * キャンバス内に重なり合っているボタンがないかをチェックする。
             * 
             * @return {string} エラー文言。重なり合ったボタンがなかったら空文字が返る。
             */
            private _overlapButtonsExist(): string {
                let result: string = "";
                let pageCount = this.faceRenderer_canvas_.getPageCount();
                for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    // ページにある button を取得
                    let    pageModuleId = this._getCanvasPageModuleId(pageIndex);

                    if (!pageModuleId) {
                        continue;
                    }
                    let buttons = this.faceRenderer_canvas_.getButtons(pageModuleId);

                    let overlapButtons: Model.ButtonItem[] = this.getOverlapButtonItems(buttons);

                    if (0 < overlapButtons.length) {
                        result += $.i18n.t("dialog.message.STR_DIALOG_WARN_OVERLAP_MESSAGE_DETAIL_INFO_1") + (pageIndex + 1) + $.i18n.t("dialog.message.STR_DIALOG_WARN_OVERLAP_MESSAGE_DETAIL_INFO_2");
                    }

                    this.changeOverlapButtonsFrame(overlapButtons, buttons);


                }

                return result;
            }

            /**
             * 複数のBluetoothデバイスが使用されていないかをチェックし、
             * 使用されている場合はエラー文言を、そうでない場合は空文字を返す。
             * @param isForExport{boolean} : エクスポート時に使うダイアログの場合true
             * @return {string} エラー文言。１つ以下のBluetoothデバイスしか存在しない場合は空文字が返る。
             */ 
            private _checkMultipleBluetoothDevicesExist(isForExport: boolean = false): string {
                let bluetoothDevices: IBluetoothDevice[] = this._getBluetoothDevicesInAllButtons();

                let errorMassage: string = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_MULTIPLE_BLUETOOTH_DEVICES_1") + bluetoothDevices.length + $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_MULTIPLE_BLUETOOTH_DEVICES_2");
                if (isForExport) {
                    errorMassage = $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_MULTIPLE_BLUETOOTH_DEVICES_1") + bluetoothDevices.length + $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_WARN_MULTIPLE_BLUETOOTH_DEVICES_2_EXPORT");
                }

                if (bluetoothDevices.length <= 1) {
                    return "";
                } else {
                    return errorMassage;
                }
            }

            /**
             * 全ボタンに対して登録されているBluetoothデバイスのリストを返す
             */
            private _getBluetoothDevicesInAllButtons(): IBluetoothDevice[] {
                // bluetooth_deviceを含むボタンのリスト
                // 現在は使われていないが、後に該当するボタンの色変更などが必要になった場合に備えて残す
                let bluetoothButtons: Model.ButtonItem[] = [];
                // 含まれている bluetooth_device のリスト
                let bluetoothDevices: IBluetoothDevice[] = [];

                let pageCount = this.faceRenderer_canvas_.getPageCount();
                // 全ページの全ボタンを走査
                for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    let pageModuleId = this._getCanvasPageModuleId(pageIndex);

                    if (!pageModuleId) {
                        continue;
                    }
                    let buttons = this.faceRenderer_canvas_.getButtons(pageModuleId);
                    if (!buttons) {
                        continue;
                    }

                    for (let button of buttons) {
                        if (!button.state ||
                            !button.enabled) {
                            continue;
                        }

                        for (let state of button.state) {
                            if (!state.action) {
                                continue;
                            }

                            for (let action of state.action) {
                                if (action.deviceInfo &&
                                    action.deviceInfo.bluetooth_data &&
                                    action.deviceInfo.bluetooth_data.bluetooth_device) {
                                    // bluetoothを含む場合とりあえず登録
                                    bluetoothButtons.push(button);

                                    let target: IBluetoothDevice = action.deviceInfo.bluetooth_data.bluetooth_device;
                                    if (!this._containsBluetoothDevice(bluetoothDevices, target)) {
                                        bluetoothDevices.push(target);
                                    }
                                }
                            }
                        }
                    }
                }

                return bluetoothDevices;
            }

            /**
             * Bluetoothデバイスのリストに対象Bluetoothデバイスが含まれているか検査する
             *
             * @param devices Bluetoothデバイスのリスト
             * @param target 検査対象のBluetoothデバイス
             * @return {boolean} devices内にtargetと同一のBluetoothデバイスが含まれている場合はtrue、そうでない場合はfalse
             */
            private _containsBluetoothDevice(devices: IBluetoothDevice[], targetDevice: IBluetoothDevice): boolean {
                for (let device of devices) {
                    // bluetooth_addressが同じならば同一デバイスと見なす
                    if (device.bluetooth_address == targetDevice.bluetooth_address) {
                        return true;
                    }
                }

                console.log("New BluetoothDevice. address: " + targetDevice.bluetooth_address);
                return false;
            }

            /**
             * 画面上の位置にあるアイテムを取得する。
             * 
             * @param position {IPosition} 位置
             * @return {JQuery} 指定した位置にあるアイテムを返す。見つからない場合は null を返す。
             */
            private _getTarget(position: Model.Position): JQuery {

                //label >> button >> images の優先順位
                //この順番は、_base.cssで定義されている z-indexの高い順  

                let $labels = $("#face-canvas .label-item");
                let $legelTarget = this._getTargetIn(position, $labels);
                if ($legelTarget != null) {
                    return $legelTarget;
                }

                let $buttons = $("#face-canvas .button-item");
                let $buttonTarget = this._getTargetIn(position, $buttons);
                if ($buttonTarget != null) {
                    return $buttonTarget;
                }

                let $images = $("#face-canvas .image-item");
                let $imageTarget = this._getTargetIn(position, $images);
                if ($imageTarget != null) {
                    return $imageTarget;
                }
                
                return null;
            }


            /*
            * @param item :JQuery 位置
            * @param position {IPosition} 位置
            * @return {JQuery} 指定した位置にあるアイテムを返す。見つからない場合は null を返す。
            */
            private _getTargetIn(position: Model.Position, $items: JQuery): JQuery {
                let FUNCTION_NAME: string = TAG + " : _getTargetIn : ";
                if (position == undefined) {
                    console.warn(FUNCTION_NAME + "position is undefined");
                    return null;
                }

                if ($items == undefined) {
                    console.warn(FUNCTION_NAME + "$item is undefined");
                    return null;
                }

                var l = $items.length;
                for (let i = l - 1; 0 <= i; i--) {
                    let $item = $items.eq(i);
                    // 背景画像の場合は除外
                    if ($item.hasClass("background")) {
                        continue;
                    }

                    let item_area = {
                        x: $item.offset().left,
                        y: $item.offset().top,
                        w: $item.width() / 2,
                        h: $item.height() / 2,
                    };

                    if (position.isInArea(item_area)) {
                        return $item;
                    }
                }

                return null;
            }

            /**
             * 画面上の指定した位置にあるページを取得する。
             */
            private _getTargetPageModule(position: Model.Position): JQuery {
                var $modules = $("#face-canvas .module-container");

                for (let i = 0, l = $modules.length; i < l; i++) {
                    let $module = $modules.eq(i);

                    let moduleArea = {
                        x: $module.offset().left,
                        y: $module.offset().top,
                        w: $module.width() / 2,
                        h: $module.height() / 2,
                    }

                    if (position.isInArea(moduleArea)) {
                        return $module;
                    }
                }

                return null;
            }

            /**
             * pageModule の背景画像に相当する model を取得する。存在しない場合は作成する。
             * 
             * @param $pageModule {JQuery} pageModule の要素の jQuery オブジェクト
             * @return {Model.ImageItem} pageModule の背景画像に相当する model 
             */
            private _resolvePageBackgroundImageItem($pageModule: JQuery): Model.ImageItem {
                if (!$pageModule) {
                    return null;
                }
                let moduleId: string = JQUtils.data($pageModule, "cid"); //$pageModule.data("cid");
                if (!moduleId) {
                    console.warn(TAG + "_resolvePageBackgroundImageItem() moduleId is undefined.");
                    return null;
                }
                let backgroundModel: Model.ImageItem = null;

                // page module 内の background を探す
                let $pageBackgound = $pageModule.find(".background");
                if (0 < $pageBackgound.length) {
                    let itemId: string = JQUtils.data($pageBackgound, "cid"); //$pageBackgound.data("cid");
                    if (itemId) {
                        backgroundModel = this.faceRenderer_canvas_.getImage(moduleId, itemId);
                    }
                }
                // 既存の backgroundModel が見つからない場合は作成する
                if (!backgroundModel) {
                    backgroundModel = this.faceRenderer_canvas_.addImage("", moduleId);
                    backgroundModel.enabled = false;
                    this._updateItemElementOnCanvas(backgroundModel);
                }

                return backgroundModel;
            }

            /**
             * 指定した位置に、現在のターゲットとなるアイテムがあるかどうかをチェックする。
             * 
             * @param position {IPosition} 位置
             * @return {boolean} 指定した位置に現在のターゲットとなるアイテムがあったら true を返却。それ以外は false を返却。
             */
            private _remainsTarget(position: Model.Position): boolean {
                if (!this.$currentTarget_) {
                    return false;
                }

                let targetArea = {
                    x: this.$currentTarget_.offset().left,
                    y: this.$currentTarget_.offset().top,
                    w: this.$currentTarget_.width() / 2,
                    h: this.$currentTarget_.height() / 2,
                }

                return position.isInArea(targetArea);
            }

            /**
             * 指定した位置に、詳細編集エリアがあるかどうかをチェックする。
             * 
             * @param position {IPosition} 位置
             * @return {boolean} 指定した位置に詳細編集エリアがあれば true を返却。それ以外は false を返却。
             */
            private _checkDetailItemAreaPosition(position: Model.Position): boolean {
                var $detailArea = $("#face-item-detail-area");

                let detailArea = {
                    x: $detailArea.offset().left,
                    y: $detailArea.offset().top,
                    w: $detailArea.width(),
                    h: $detailArea.height(),
                }

                return position.isInArea(detailArea);
            }

            /**
             * 指定した座標上に、アイテムのリサイザーがあるかどうかをチェックする
             */
            private _checkResizerSelected(position: IPosition): string {
                var result: string = null;

                var element = document.elementFromPoint(position.x, position.y);
                if (element) {
                    let $element = $(element);
                    if ($element.hasClass("item-resizer")) {
                        if ($element.hasClass("left-top")) {
                            result = "left-top";
                        } else if ($element.hasClass("right-top")) {
                            result = "right-top";
                        } else if ($element.hasClass("right-bottom")) {
                            result = "right-bottom";
                        } else if ($element.hasClass("left-bottom")) {
                            result = "left-bottom";
                        }
                    }
                }

                return result;
            }

            /**
             * 指定したアイテムにリサイザーを追加する。
             * 
             * @param $item {JQuery} リサイザーを追加するアイテム
             */
            private _setResizer($item: JQuery) {
                var $itemResizer = $item.find(".item-resizer");
                if ($itemResizer.length < 1) {
                    $itemResizer = $(this.itemResizerTemplate_());
                    $item.append($itemResizer);
                }
                // リサイザーの位置を設定
                const RESIZER_SIZE_HALF = 20 / 2;
                var itemWidth: number = $item.width();
                var itemHeight: number = $item.height();
                var itemThicknessHalf: number = ($item.outerWidth() - $item.innerWidth()) / 8;

                $item.find(".left-top").css({
                    left: "-" + (RESIZER_SIZE_HALF + itemThicknessHalf) + "px",
                    top: "-" + (RESIZER_SIZE_HALF + itemThicknessHalf) + "px"
                });
                $item.find(".right-top").css({
                    left: (itemWidth - RESIZER_SIZE_HALF + itemThicknessHalf) + "px",
                    top: "-" + (RESIZER_SIZE_HALF + itemThicknessHalf) + "px"
                });
                $item.find(".right-bottom").css({
                    left: (itemWidth - RESIZER_SIZE_HALF + itemThicknessHalf) + "px",
                    top: (itemHeight - RESIZER_SIZE_HALF + itemThicknessHalf) + "px"
                });
                $item.find(".left-bottom").css({
                    left: "-" + (RESIZER_SIZE_HALF + itemThicknessHalf) +"px",
                    top: (itemHeight - RESIZER_SIZE_HALF + itemThicknessHalf) + "px"
                });
            }

            /**
             * 現在の操作対象アイテムを設定
             */
            private _setTarget(target: ItemModel) {
                this.$currentTarget_ = this._getItemElementByModel(target);
                this.currentItem_ = this._getItemModel(this.$currentTarget_, this.faceRenderer_canvas_);

                // 選択状態にする
                this.$currentTarget_.addClass("selected");

                //ツールチップを非表示にする。
                this.disableButtonInfoTooltip();

                // リサイザーを追加
                this._setResizer(this.$currentTarget_);

                // 詳細編集エリアを表示
                $("#face-item-detail-area").addClass("active");
                this._showDetailItemArea(this.currentItem_);
            }

            /**
             * ターゲットを外す
             */
            private _loseTarget() {
                $("#face-canvas .item").removeClass("selected");
                $("#face-item-detail-area").removeClass("active");
                // リサイザーを削除
                $(".item-resizer").remove();

                //テキストエリアのフォーカスを外しfull-customページにフォーカス
                $("input[type='text']").blur();
                $('article#page-full-custom').focus();

                // detail エリアの削除
                let $detail = $("#face-item-detail");
                $detail.children().remove();

                this.$currentTarget_ = null;
                this.currentItem_ = null;
                this.currentTargetButtonStates_ = null;
                this.currentTargetButtonStatesUpdated_ = false;


                //ボタン用のプロパティのインスタンスを削除
                if (this.buttonProperty != null) {
                    this.buttonProperty.unbind("updateModel", this.updateNormalButtonItemModel, this);
                    this.buttonProperty.remove();
                    this.buttonProperty = null
                }

                //マクロ用のプロパティのインスタンスを削除
                if (this.macroProperty != null) {
                    this.macroProperty.unbind("updateModel", this.updateMacroButtonItemModel, this);
                    this.macroProperty.remove();
                    this.macroProperty = null
                }

                //ページジャンプ用のプロパティのインスタンスを削除
                if (this.jumpProperty != null) {
                    this.jumpProperty.unbind("updateModel", this.updateJumpButtonItemModel, this);
                    this.jumpProperty.remove();
                    this.jumpProperty = null;
                }
            }

            /**
             * グリッドを設定する
             */
            private _setGridSize(gridSize: number) {
                var $facePages = $("#face-canvas").find(".face-page");
                switch (gridSize) {
                    case 8:
                        this.gridSize_ = 8;
                        $facePages.css("background-image", "url(../res/icons/grid_08.png)");
                        break;

                    case 16:
                        this.gridSize_ = 16;
                        $facePages.css("background-image", "url(../res/icons/grid_16.png)");
                        break;

                    case DEFAULT_GRID:
                        this.gridSize_ = DEFAULT_GRID;
                        $facePages.css("background-image", "url(../res/images/img_huis_remote_area.png)");
                        break;

                    case 32:
                        this.gridSize_ = 32;
                        $facePages.css("background-image", "url(../res/icons/grid_32.png)");
                        break;

                    case 64:
                        this.gridSize_ = 64;
                        $facePages.css("background-image", "url(../res/icons/grid_64.png)");
                        break;

                    default:
                        this.gridSize_ = 2;
                        $facePages.css("background-image", "url(../res/icons/nogrid.png)");
                }
            }

            /*
            * マクロボタンか否か判定する。
            * @param buttonModel{Model.ButtonItem} :判定対象のモデル
            */
            private isMacroButton(button: Model.ButtonItem): boolean{
                let FUNCTION_NAME = TAG + "isMacroButton : ";

                if (button == null) {
                    console.warn(FUNCTION_NAME + "button is null");
                    return false;
                }
            
                if (button.state[0].action[0].interval !== undefined) {
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * ジャンプボタンか否か判定する。
             * @param button {Model.ButtonItem} 判定対象のモデル
             */
            private isJumpButton(button: Model.ButtonItem): boolean {
                let FUNCTION_NAME = TAG + "isJumpButton : ";

                if (button == null) {
                    console.warn(FUNCTION_NAME + "button is null");
                    return false;
                }

                try {
                    if (button.state[0].action[0].jump !== undefined) {
                        return true;
                    }
                } catch (e) { }

                return false;
            }

            /**
             * 詳細編集エリアを表示する。
             * 
             * @param targetModel {TagetModel} 詳細編集エリアに表示するモデル
             */
            private _showDetailItemArea(item: Model.Item) {
                var $detail = $("#face-item-detail");
                $detail.children().remove();

                if (!item) {
                    return;
                }

                var templateArea = Tools.Template.getJST("#template-property-area", this.templateItemDetailFile_);

                if (item instanceof Model.ButtonItem) {
                    if (this.isMacroButton(item)) {
                        // マクロボタンアイテムの詳細エリアを表示
                        this._renderMacroButtonItemDetailArea(item, $detail);
                    } else if (this.isJumpButton(item)) {
                        // ジャンプボタンアイテムの詳細エリアを表示
                        this._renderJumpButtonItemDetailArea(item, $detail);
                    } else {
                        // ボタンアイテムの詳細エリアを表示
                        this._renderButtonItemDetailArea(item, $detail);
                    }
                } else if (item instanceof Model.ImageItem) {
                    // 画像アイテムの詳細エリアを表示
                    let templateImage = Tools.Template.getJST("#template-image-detail", this.templateItemDetailFile_);
                    let $imageDetail = $(templateImage(item));
                    let $areaContainer = $imageDetail.nextAll("#area-container");
                    $areaContainer.append($(templateArea(item)));
                    $detail.append($imageDetail);

                    // リサイズモードの反映
                    let resizeMode = item.resizeMode;
                    if (resizeMode) {
                        $(".image-resize-mode").val(resizeMode);
                    }

                    //オリジナルのパスがある場合は、そちらを表示。
                    //resolvedPathの場合、アスペクト比が変更されている可能性があるため。
                    let inputURL = this.getValidPathOfImageItemForCSS(item);
                    this._updatePreviewInDetailArea(inputURL, $("#property-image-preview"));

                    //テキストをローカライズ
                    $("#face-item-detail-title").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_TITLE_IMAGE"));

                } else if (item instanceof Model.LabelItem) {
                    // ラベルアイテムの詳細エリアを表示
                    let templateLabel = Tools.Template.getJST("#template-label-detail", this.templateItemDetailFile_);
                    let $labelDetail = $(templateLabel(item));
                    let $areaContainer = $labelDetail.nextAll("#area-container");
                    $areaContainer.append($(templateArea(item)));
                    $detail.append($labelDetail);
                    var $labelTextSize = $labelDetail.find(".property-text-size");
                    $labelTextSize.val(item.size.toString());

                    //テキストをローカライズ
                    $("#face-item-detail-title").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_TITLE_LABEL"));
                    $("#text-title-edit-label").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_LABEL_EDIT_TEXT_LABEL"));
                } else {
                    console.warn(TAG + "_showDetailItemArea() unknown type item");
                }

                //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する
                $('.custom-select').trigger('create');
                
            }

            /**
             * ページの背景の詳細編集エリアの表示
             */
            private _showDetailItemAreaOfPage($pageModule: JQuery) {
                let FUNCTION_NAME = TAG + " : _showDetailItemAreaOfPage : ";

                let $detail = $("#face-item-detail");
                $detail.children().remove();
                if (!$pageModule) {
                    return;
                }

                let templatePageBackground = Tools.Template.getJST("#template-page-background-detail", this.templateItemDetailFile_);

                let backgroundModel: Model.ImageItem = null;

                // page module 内に background 
                let $pageBackground = $pageModule.find(".background");
                if (0 < $pageBackground.length) {
                    let moduleId: string = JQUtils.data($pageModule, "cid");
                    let itemId: string = JQUtils.data($pageBackground, "cid");
                    if (moduleId && itemId) {
                        backgroundModel = this.faceRenderer_canvas_.getImage(moduleId, itemId);
                    }
                }
                if (backgroundModel && backgroundModel.enabled) {

                    let $pageBackgroundDetail = $(templatePageBackground(backgroundModel));
                    $detail.append($pageBackgroundDetail);
                    let resizeMode = backgroundModel.resizeMode;
                    if (resizeMode) {
                        $(".image-resize-mode").val(resizeMode);
                    }
                    let inputURL = JQUtils.enccodeUriValidInCSS(backgroundModel.resolvedPath);
                    this._updatePreviewInDetailArea(inputURL, $("#property-image-preview"));
                } else {
                    let $pageBackgroundDetail = $(templatePageBackground({}));
                    $detail.append($pageBackgroundDetail);
                }

                $("#face-item-detail-title").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_TITLE_BACKGROUND"));
            }


            /*
            *  ボタンの中のコード(学習して登録した際の信号)をすべて返す
            */
            private getCodesFrom(button: Model.ButtonItem): string[]{
                let FUNCTION_NAME: string = TAG + "getCodesFrom";

                if (button == undefined) {
                    console.warn(FUNCTION_NAME + "button is undefined");
                    return;
                }

                let result: string[] = [];

                for (let state of button.state) {
                    for (let action of state.action) {
                        if (action.code != undefined) {
                            result.push(action.code);
                        }
                    }
                }

                if (result.length == 0) {
                    return null;
                }

                return result;

            }


            /*
            * マクロボタンアイテムの詳細情報エリアのレンダリング
            * 
            */
            private _renderMacroButtonItemDetailArea(button: Model.ButtonItem, $detail: JQuery) {
                let FUNCTION_NAME = TAG + "_renderMacroButtonItemDetailArea: ";

                if (!button) {
                    console.warn(FUNCTION_NAME + "button is null");
                    return;
                }

                if (!$detail) {
                    console.warn(FUNCTION_NAME + "$detail is null");
                    return;
                }

                var templateButton = Tools.Template.getJST("#template-macro-button-detail", this.templateItemDetailFile_);
                var $buttonDetail = $(templateButton(button));
                $detail.append($buttonDetail);


                if (this.macroProperty == null) {
                    this.macroProperty = new PropertyAreaButtonMacro({
                        el: $buttonDetail,
                        model: button,
                    });
                    //モデルが更新されたときfullcustom側のmodelも更新する
                    this.macroProperty.bind("updateModel", this.updateMacroButtonItemModel,this);
                } else {
                    //ボタンを移動して、Propertyを再表示する際、elを更新する必要がある。
                    this.macroProperty.undelegateEvents();
                    this.macroProperty.$el = $buttonDetail;
                    this.macroProperty.delegateEvents();
                }

                $detail.append(this.macroProperty.renderView())

                //previewの情報を別途更新。
                let $preview = this.$el.find(".property-state-image-preview[data-state-id=\"" + button.default + "\"]");
                var resolvedPath = this._extractUrlFunction($preview.css("background-image"));
                this._updatePreviewInDetailArea(resolvedPath, $preview);
                //テキストボタン、あるいは画像のどちらかを表示する。
                this.toggleImagePreview(button.default);

                //ボタンステートを入力
                this.currentTargetButtonStates_ = button.state;


                //初期状態の場合、最初のプルダウンをフォーカス。
                this.macroProperty.focusFirstPulldown();

                $detail.i18n();
            }

            //マクロボタンのモデルが変更された際に呼び出される
            private updateMacroButtonItemModel(event: JQueryEventObject) {
                let button: Model.ButtonItem = this.macroProperty.getModel();
                if (button != null) {
                    this.updateButtonItemModel(button);
                }
            }


            //通常のボタンのモデルが変更された際に呼び出される
            private updateNormalButtonItemModel(event: JQueryEventObject) {
                let button: Model.ButtonItem = this.buttonProperty.getModel();
                if (button != null) {
                    this.updateButtonItemModel(button);
                }
            }

            private updateJumpButtonItemModel(event: JQueryEventObject) {
                let button: Model.ButtonItem = this.jumpProperty.getModel();
                if (button != null) {
                    this.updateButtonItemModel(button);
                }
            }

           /*
            * propertyエリアの情報が更新された際、ボタンのモデルを更新する
            * @param button {Model.ButtonItem}
            */
            private updateButtonItemModel(button: Model.ButtonItem) {
                let FUNCTION_NAME = TAG + "updateButtonItemModel : ";

                if (button == null) {
                    console.warn(FUNCTION_NAME + "button is null");
                    return;
                }

                let currentButtonState = this.currentTargetButtonStates_;
                let newButtonState = button.state;

                // 状態を更新する
                var memento: IMemento = {
                    target: button,
                    previousData: { "state": currentButtonState },
                    nextData: { "state": newButtonState }
                };
                var mementoCommand = new MementoCommand([memento]);
                this.commandManager_.invoke(mementoCommand);

                //this.currentTargetButtonStates_を更新する。 commandManagerの状態と一致するようにする。
                this.currentTargetButtonStates_ = newButtonState;

                this.$el.focus();
            }


            /**
             * ボタンアイテムの詳細情報エリアのレンダリング
             */
            private _renderButtonItemDetailArea(button: Model.ButtonItem, $detail: JQuery) {
                if (!button || !$detail) {
                    return;
                }

                let codes: string[] = this.getCodesFrom(button);

                // masterFunctions が未取得の場合は取得する
                for (let state of button.state) {
                    if (!state.action) continue;

                    for (let action of state.action) {
                        if (!action.deviceInfo) continue;

                        let deviceInfo: IButtonDeviceInfo = action.deviceInfo;

                        if (!deviceInfo.functions || deviceInfo.functions.length < 1) {
                            let codeDb = deviceInfo.code_db;

                            if (codeDb.brand != " " && codeDb.brand != undefined &&
                                codeDb.device_type != " " && codeDb.device_type != undefined &&
                                codeDb.model_number != " " && codeDb.device_type != undefined) {
                                //codeDbの情報がそろっている場合、codeDbからfunctionsを代入
                                let remoteId = huisFiles.getRemoteIdByCodeDbElements(codeDb.brand, codeDb.device_type, codeDb.model_number);

                                let face = huisFiles.getFace(remoteId);
                                if (face != null) {
                                    deviceInfo.remoteName = face.name;
                                } else {
                                    deviceInfo.remoteName = null;
                                }
                                
                                deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);

                            } else if (codes != null) {
                                //codeDbの情報がそろっていない、かつcode情報がある場合、codeからfunctionsを代入
                                let remoteId = huisFiles.getRemoteIdByCode(codes[0]);
                                if (remoteId != null) {

                                    let face = huisFiles.getFace(remoteId);
                                    if (face != null) {
                                        deviceInfo.remoteName = face.name;
                                    } else {
                                        deviceInfo.remoteName = null;
                                    }


                                    deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);
                                    deviceInfo.functionCodeHash = huisFiles.getAllFunctionCodeMap(remoteId);
                                }
                            } else if (deviceInfo.bluetooth_data != null) {
                                //Bluetooth情報しかない場合
                                let remoteId = this.faceRenderer_pallet_.getRemoteId();
                                if (remoteId != null) {
                                    deviceInfo.functions = huisFiles.getMasterFunctions(remoteId);
                                    deviceInfo.bluetooth_data = huisFiles.getMasterBluetoothData(remoteId);
                                }
                            }

                            action.deviceInfo = deviceInfo;

                        }
                    }
                }

                // ボタン情報の外枠部分をレンダリング
                var templateButton = Tools.Template.getJST("#template-button-detail", this.templateItemDetailFile_);

                var $buttonDetail = $(templateButton(button));

                //信号用のViewの初期化・更新
                if (this.buttonProperty == null) {
                    this.buttonProperty = new PropertyAreaButtonNormal({
                        el: $buttonDetail,
                        model: button,
                    });
                    //モデルが更新されたときfullcustom側のmodelも更新する
                    this.buttonProperty.bind("updateModel", this.updateNormalButtonItemModel, this);
                } else {
                    //ボタンを移動して、Propertyを再表示する際、elを更新する必要がある。
                    this.buttonProperty.undelegateEvents();
                    this.buttonProperty.$el = $buttonDetail;
                    this.buttonProperty.delegateEvents();
                }

                // ボタンの state 情報を付加
                var $statesContainer = $buttonDetail.nextAll("#states-container");
                this.currentTargetButtonStates_ = button.state;
                if (this.currentTargetButtonStates_) {
                    let templateState: Tools.JST = null;

                    if (button.isAirconButton()) {
                    // エアコンのパーツはひとつのパーツに複数の要素(例えば温度には19℃～29℃、±0, 1, 2,...など)が登録されている。
                        // エアコンのパーツはファイル名変更等の編集作業を受け付けない(位置変更のみ)
                        templateState = Tools.Template.getJST("#template-property-button-state-ac", this.templateItemDetailFile_);
                    } else {
                        templateState = Tools.Template.getJST("#template-property-button-state", this.templateItemDetailFile_);
                    }


                    // HUIS本体で「デフォルト指定が間違っていて要素のレンジ外を指している」ケースがあり得るのでその対策
                    // もしレンジ外を指している場合はレンジ内の最初に見つかった要素をdefaultとして一時的に設定し直す
                    // HUIS本体のデータ異常は解消されるわけではないので要注意

                    var checkedArray: IStateDetail[] = [];

                    checkedArray = this.currentTargetButtonStates_.filter((state: IStateDetail, i: number, arr: IStateDetail[]) => {
                        return (
                            (button.default == state.id) &&
                            (((state.image != null) && (state.image[0] != null)) ||
                                ((state.label != null) && (state.label[0] != null)))
                        );
                    });
                   
                    if (checkedArray.length === 0) { // レンジ内をdefaultが指していなかった(チェック用配列が空)
                        button.default = this.currentTargetButtonStates_[0].id; // 先頭のをdefault値として設定
                    }



                    this.currentTargetButtonStates_.forEach((state: IStateDetail) => {
                        let stateData: any = {};

                        stateData.id = state.id;
                        let resizeMode: string;
                        if (state.image) {
                            stateData.image = state.image[0];
                            let garageImageExtensions = state.image[0].garageExtensions;
                            if (garageImageExtensions) {
                                resizeMode = garageImageExtensions.resizeMode;
                            }
                        }
                        if (state.label) {
                            stateData.label = state.label[0];
                        }

                        if (state.action &&
                            state.action[0] &&
                            state.action[0].deviceInfo &&
                            state.action[0].deviceInfo.functions) {
                            stateData.functions = state.action[0].deviceInfo.functions;
                        }

                        this._setActionListToState(state);

                        if (this.currentTargetButtonStates_.length > 1) { // Stateが２つ以上あるとき、default値に一致したパーツのみ表示する
                            if (state.id != button.default) return;
                        }

                        let $stateDetail = $(templateState(stateData));
                        $statesContainer.append($stateDetail);


                        //テキストラベルの大きさの設定値を反映する。
                        var $textSize = $stateDetail.find(".property-state-text-size[data-state-id=\"" + stateData.id + "\"]");
                        if (!_.isUndefined(stateData.label)) {
                            var textSizeString: string = stateData.label.size;
                            $textSize.val(textSizeString);
                        }

                        //信号コンテナを描画
                        $statesContainer.append(this.buttonProperty.renderViewState(state.id));

                        // 文言あて・ローカライズ
                        $statesContainer.i18n();



                    });
                    
                }
                
                $detail.append($buttonDetail);
               
                //previewの情報を別途更新。
                let $preview = $detail.find(".property-state-image-preview[data-state-id=\"" + button.default + "\"]");
                var inputURL = this._extractUrlFunction($preview.css("background-image"));
                this._updatePreviewInDetailArea(inputURL, $preview);
                //テキストボタン、あるいは画像のどちらかを表示する。
                this.toggleImagePreview(button.default);

                //テキストをローカライズ
                $("#face-item-detail-title").find(".title-label").text($.i18n.t("edit.property.STR_EDIT_PROPERTY_TITLE_BUTTON"));
                $("#button-state-label-action").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_LABEL_ACTION"));
                $("#text-title-edit-label").html($.i18n.t("edit.property.STR_EDIT_PROPERTY_LABEL_EDIT_TEXT_LABEL"));

            }

            /**
             * ページジャンプボタンの詳細エリアをレンダリング
             *
             * @param button {Model.ButtonItem} ページジャンプボタンのモデル
             * @param $detail {JQuery} 
             */
            private _renderJumpButtonItemDetailArea(button: Model.ButtonItem, $detail: JQuery) {
                if (!button || !$detail) {
                    return;
                }

                // ボタン情報の外枠部分をレンダリング
                var templateButton = Tools.Template.getJST("#template-button-detail", this.templateItemDetailFile_);
                var $buttonDetail = $(templateButton(button));
                $buttonDetail.find(".title-label").text($.i18n.t("edit.property.STR_EDIT_PROPERTY_TITLE_JUMP"));
                $detail.append($buttonDetail);

                //信号用のViewの初期化・更新
                if (this.jumpProperty == null) {
                    this.jumpProperty = new PropertyAreaButtonJump(
                        this.faceRenderer_canvas_.getRemoteId(),
                        $("#input-face-name").val(),
                        this.faceRenderer_canvas_.getModules(),
                        {
                            el: $buttonDetail,
                            model: button,
                        });
                    //モデルが更新されたときfullcustom側のmodelも更新する
                    this.jumpProperty.bind("updateModel", this.updateJumpButtonItemModel, this);
                } else {
                    //ボタンを移動して、Propertyを再表示する際、elを更新する必要がある。
                    this.jumpProperty.undelegateEvents();
                    this.jumpProperty.$el = $buttonDetail;
                    this.jumpProperty.delegateEvents();
                }

                $detail.append(this.jumpProperty.renderView());

                //previewの情報を別途更新。
                let $preview = $detail.find(".property-state-image-preview[data-state-id=\"" + button.default + "\"]");
                var inputURL = this._extractUrlFunction($preview.css("background-image"));
                this._updatePreviewInDetailArea(inputURL, $preview);
                //テキストボタン、あるいは画像のどちらかを表示する。
                this.toggleImagePreview(button.default);

                //ボタンステートを入力
                this.currentTargetButtonStates_ = button.state;

                this.jumpProperty.focusFirstPulldown();

                $detail.i18n();
            }


            


            /*
            * url("***");から、***を抽出する
            */
            private _extractUrlFunction(urlFunctionString:string):string {
                if (urlFunctionString === undefined) {
                    console.log("FullCustom.ts:urlFunctionString urlFunctionString is undefined");
                    return;
                }
                var result:string =  urlFunctionString.substring(5, urlFunctionString.length - 2)//最初の5文字と　最後の２文字を取り除く。
                return result;

            }


            /**
             * フルカスタムリモコン編集画面で扱いやすくするために、button.state 内の action と translate を
             * input に対して1対1になるように格納する
             */
            private _setActionListToState(state: IStateDetail) {
                var actionList: IActionList = {
                    touch: "none",
                    touch_top: "none",
                    touch_bottom: "none",
                    touch_right: "none",
                    touch_left: "none",
                    long_press: "none",
                    swipe_up: "none",
                    swipe_down: "none",
                    swipe_right: "none",
                    swipe_left: "none",
                    ring_right: "none",
                    ring_left: "none"
                };

                var actionListTranslate: IActionList = {
                    touch: "none",
                    touch_top: "none",
                    touch_bottom: "none",
                    touch_right: "none",
                    touch_left: "none",
                    long_press: "none",
                    swipe_up: "none",
                    swipe_down: "none",
                    swipe_right: "none",
                    swipe_left: "none",
                    ring_right: "none",
                    ring_left: "none"
                };

                var actions: IAction[] = state.action;
                if (actions) {
                    actions.forEach((action) => {
                        let codeDb = action.code_db;
                        if (codeDb) {
                            actionList[action.input] = codeDb.function;
                        }
                        //actionList[action.input] = action.code;
                    });
                }

                
                var translates: IStateTranslate[] = state.translate;
                if (translates) {
                    translates.forEach((translate) => {
                        actionListTranslate[translate.input] = "translate-state-" + translate.next;
                    });
                }

                state.actionList = actionList;
                state.actionListTranslate = actionListTranslate;
            }


            /**
             * 指定した要素にひも付けられている model を取得
             * 
             * @param $item {JQuery} 取得する model の要素
             * @param render {FaceRenderer} $item が存在するレンダラー
             * 
             * @return {Model.Item} 取得した model
             */
            private _getItemModel($item: JQuery, renderer: FaceRenderer): Model.Item {
                // item の要素の data 属性から item の id を取得
                var itemId = JQUtils.data($item, "cid"); //$item.data("cid");
                // item の親要素の data 属性から item が所属する module の id を取得
                var moduleId = JQUtils.data($item.parent(), "cid"); // $item.parent().data("cid");

                // item の種類に応じた model を取得
                if ($item.hasClass("button-item")) {
                    return renderer.getButton(moduleId, itemId);
                } else if ($item.hasClass("label-item")) {
                    return renderer.getLabel(moduleId, itemId);
                } else if ($item.hasClass("image-item")) {
                    return renderer.getImage(moduleId, itemId);
                } else {
                    return null;
                }
            }

            /**
             * 対象モデルのAreaをtypeによらず変更する
             * 有効でない値(undefinedなど)が設定されたパラメータは無視され、更新されない
             *
             * @param model {TargetModel}
             * @param x {number} x座標
             * @param y {number} y座標
             * @param w {number} width
             * @param h {number} height
             */
            private _setTargetModelArea(item: Model.Item, x: number, y: number, w: number, h: number) {
                let target: IArea = item.area;

                if (_.isNumber(x)) target.x = x;
                if (_.isNumber(y)) target.y = y;
                if (_.isNumber(w)) target.w = w;
                if (_.isNumber(h)) target.h = h;
            }

            /**
             * 指定した model にひも付けられた canvas 上の要素を返す。
             * 
             * @param model {any} 
             */
            private _getItemElementByModel(model): JQuery {
                if (!model || !model.cid) {
                    return null;
                }

                var $element = $(".item[data-cid='" + model.cid + "']");

                return 0 < $element.length ? $element : null;
            }

            /**
             * 指定したキャンバスページの module ID を取得する。
             * pageIndex を指定しない場合は、現在のページの module ID を返す。
             */
            private _getCanvasPageModuleId(pageIndex?: number): string {
                // 引数が未指定の場合は、現在のページindex を使用する
                if (_.isUndefined(pageIndex)) {
                    pageIndex = this.currentTargetPageIndex_;
                }
                if (_.isUndefined(pageIndex) || pageIndex < 0) {
                    return "";
                }
                var $targetPageOnCanvas = $("#face-canvas .face-page").eq(pageIndex);
                var $targetModuleOnCanvas = $targetPageOnCanvas.find(".module-container");
                var moduleId = JQUtils.data($targetModuleOnCanvas, "cid"); //$targetModuleOnCanvas.data("cid");
                if (!moduleId) {
                    return "";
                }
                return moduleId;

            }

            /**
             * ドラッグ中のマウス座標から対応するキャンバスのJQueryオブジェクトを返す
             * @param positionY マウスのY座標
             * @return キャンバスのJQueryオブジェクト
             */
            private _getCanvasPageByDraggingPosition(positionY: number): JQuery {
                // 移動後のアイテム座標（元キャンバスページ基準）
                let itemPositionY = this.mouseMoveStartTargetPosition_.y + (positionY - this.mouseMoveStartPosition_.y) * 2;
                return this._getCanvasPageByItemArea(this.$currentTarget_.parent().offset().top, itemPositionY, this.$currentTarget_.height());
            }

            /**
             * アイテムの情報から該当するキャンバスのJQueryオブジェクトを返す
             *
             * @param baseCanvasPositionY アイテムの置かれているキャンバスのY座標
             * @param itemRelPositionY アイテムの置かれているキャンバス上での相対Y座標
             * @param itemHeight アイテムの縦幅
             * @return キャンバスのJQueryオブジェクト
             */
            private _getCanvasPageByItemArea(baseCanvasPositionY: number, itemRelPositionY: number, itemHeight: number): JQuery {
                let itemCenterY = baseCanvasPositionY + (itemRelPositionY + (itemHeight / 2)) / 2;

                return this._getCanvasPageByPointY(itemCenterY);
            }

            /**
             * 指定のY座標がどのキャンバスページに該当する検査し、該当するキャンバスのJQueryオブジェクトを返す
             * @param pointY {number} Y座標
             * @return キャンバスのJQueryオブジェクト
             */
            private _getCanvasPageByPointY(pointY: number): JQuery {
                let canvas;
                $('#face-canvas .face-page').each(function (index) {
                    if (pointY >= $(this).offset().top &&
                        pointY <= $(this).offset().top + $(this).height()) {
                        canvas = $(this);
                        return;
                    }
                });

                if (canvas) {
                    return canvas.find(".module-container");
                } else {
                    // 該当なしの場合は現在のキャンバスを返す
                    return this.$currentTarget_.parent();
                }
            }

            private _syncPcToHuisAndBack(noWarn?: Boolean) {
                if (!noWarn) {
                    let response = electronDialog.showMessageBox({
                        type: "info",
                        message: "変更内容を HUIS に反映しますか？\n"
                        + "最初に接続した HUIS と異なる HUIS を接続している場合、\n"
                        + "HUIS 内のコンテンツが上書きされますので、ご注意ください。",
                        buttons: ["yes", "no"],
                        title: PRODUCT_NAME,
                        cancelId:1,
                    });
                    if (response !== 0) {
                        huisFiles.updateRemoteList(); // Remoteのリストを更新
                        Framework.Router.back(); // HUISにセーブしないままHOME画面に戻る
                        return;
                    }
                }

                huisFiles.updateRemoteList();
                if (HUIS_ROOT_PATH) {
                    let syncTask = new Util.HuisDev.FileSyncTask();
                    syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, true, DIALOG_PROPS_DELTE_REMOTE, null, (err) => {
                        if (err) {
                            // [TODO] エラー値のハンドリング
                            electronDialog.showMessageBox({
                                type: "error",
                                message: "HUIS と同期できませんでした。\n"
                                + "HUIS が PC と接続されていない可能性があります。\n"
                                + "HUIS が PC に接続されていることを確認して、再度同期をお試しください。",
                                buttons: ["ok"],
                                title: PRODUCT_NAME,
                            });
                        } else {
                            Framework.Router.back();
                        }
                    });
                }
            }


            /**
             * このリモコンを削除する
             */
            private _onCommandDeleteRemote() {
                var response = electronDialog.showMessageBox({
                    type: "warning",
                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_DELETE_REMOTE"),
                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_DELETE"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
                    title: PRODUCT_NAME,
                    cancelId:1,
                }); 
                if (response === 0) {
                    huisFiles.removeFace(this._getUrlQueryParameter("remoteId"));
                    this._syncPcToHuisAndBack(true); // 警告なしに
                }
            }

            private _onTextBoxFocusIn() {
                this.isTextBoxFocused = true;
            }

            private _onTextBoxFocusOut() {
                this.isTextBoxFocused = false;
            }

            private _getCurrentTargetPosition(): IPosition {
                return {
                    x: this.$currentTarget_.offset().left,
                    y: this.$currentTarget_.offset().top,
                }
            }

            private _getCurrentTargetCenterPosition(): Model.Position {
                return new Model.Position(
                    this.$currentTarget_.offset().left + this.$currentTarget_.width() / 2,
                    this.$currentTarget_.offset().top + this.$currentTarget_.height() / 2);
            }

            private _getCurrentCanvasPosition(): IPosition {
                if (this.$currentTarget_ == null) {
                    console.error(TAG + "currentTarget is null in _getCurrentCanvasPosition");
                    return null;
                }
                return {
                    x: this.$currentTarget_.parent().offset().left,
                    y: this.$currentTarget_.parent().offset().top,
                }
            }

            private _getCurrentTargetPositionInCanvas(): IPosition {
                if (this.$currentTarget_ == null) {
                    console.error(TAG + "currentTarget is null in _getCurrentTargetPositionInCanvas");
                    return null;
                }

                let targetPosition: IPosition = this._getCurrentTargetPosition();
                let canvasPosition: IPosition = this._getCurrentCanvasPosition();
                return {
                    x: targetPosition.x - canvasPosition.x,
                    y: targetPosition.y - canvasPosition.y,
                }
            }

            private _heightenCurrentItemGrid(gridNum: number) {
                this._heightenItemGrid(gridNum);
            }

            private _heightenItemGrid(gridNum: number) {
                this._heightenItem(gridNum * this.gridSize_);
            }

            private _heightenItem(px: number) {
                let currentTargetArea = this._getCurrentTargetArea();
                // check item doesn't become smaller than minItemSize_
                if (currentTargetArea.h + px*2 < this.minItemSize_) {
                    px = (this.minItemSize_ - currentTargetArea.h) / 2;
                }

                let newY = Math.max(currentTargetArea.y - px, 0);

                let newLowerY = currentTargetArea.y + currentTargetArea.h + px;
                newLowerY = Math.min(newLowerY, GRID_AREA_HEIGHT);
                let newH = newLowerY - newY;

                let newArea = {
                    x: currentTargetArea.x,
                    y: newY,
                    w: currentTargetArea.w,
                    h: newH,
                }
                this._resizeItem(newArea, true);
            }

            private _widenItemGrid(gridNum: number) {
                this._widenItem(gridNum * this.gridSize_);
            }

            private _widenItem(px: number) {
                let currentTargetArea = this._getCurrentTargetArea();

                // check item doesn't become smaller than minItemSize_
                if (currentTargetArea.w + px*2 < this.minItemSize_) {
                    px = (this.minItemSize_ - currentTargetArea.w) / 2;
                }

                let newX = Math.max(currentTargetArea.x - px, BIAS_X_DEFAULT_GRID_LEFT);

                let newRightX = currentTargetArea.x + currentTargetArea.w + px;
                newRightX = Math.min(newRightX, BIAS_X_DEFAULT_GRID_LEFT + GRID_AREA_WIDTH);
                let newW = newRightX - newX;

                let newArea = {
                    x: newX,
                    y: currentTargetArea.y,
                    w: newW,
                    h: currentTargetArea.h,
                }

                this._resizeItem(newArea, true);
            }

            /**
             * Mac OS XのメタキーをWindows環境で対応付けたキーに変更する。
             * @param: JQueryEventObject onKeyDownに渡されたイベントオブジェクト
             * @return: JQueryEventObject 変更されたイベントオブジェクト
             */
            private _translateDarwinMetaKeyEvent(event: JQueryEventObject): JQueryEventObject {
                //   <win>        <darwin>
                //  control   <--  command
                let winCtrlKey = event.metaKey;

                //   <win>       <darwin>
                //    alt    <--  option
                let winAltKey = event.altKey;

                //   <win>         <darwin>
                //   shift     <--  shift
                let winShiftKey = event.shiftKey;

                //  ウィンドウズキーは win,darwin 両方で使わない
                let winMetaKey = false;

                event.ctrlKey = winCtrlKey;
                event.metaKey = winMetaKey;
                event.altKey = winAltKey;
                event.shiftKey = winShiftKey;
                return event;
            }

            private _onKeyDown(event: JQueryEventObject) {

                if (this.isDragging) {
                    event.preventDefault();
                    return;
                }

                if (event.keyCode == 9) {//tabの場合は無視
                    event.preventDefault();
                    return;
                }

                if (!this.isTextBoxFocused) {
                    if (Util.MiscUtil.isDarwin()) {
                        event = this._translateDarwinMetaKeyEvent(event);
                    }
                    switch (event.keyCode) {
                        case 37: {// LeftKey
                            if (this.$currentTarget_ == null) {
                                break;
                            }
                            let currentTargetPositionInCanvas: IPosition = this._getCurrentTargetPositionInCanvas();
                            let moveSize: number;
                            let css_margin: number = parseInt(this.$currentTarget_.css("margin"), 10);
                            if (event.ctrlKey) {
                                if (event.shiftKey) {
                                    this._widenItem(-1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin - 1,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin,
                                    }
                                    this._moveItem(newPosition);
                                }
                            } else {
                                if (event.shiftKey) {
                                    this._widenItemGrid(-1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin - this.gridSize_,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin,
                                    }
                                    this._moveItemGrid(newPosition);
                                }
                            }
                            break;
                        } case 38: {// UpKey
                            if (this.$currentTarget_ == null) {
                                break;
                            }
                            let currentTargetPositionInCanvas: IPosition = this._getCurrentTargetPositionInCanvas();
                            let moveSize: number;
                            let css_margin: number = parseInt(this.$currentTarget_.css("margin"), 10);
                            if (event.ctrlKey) {
                                if (event.shiftKey) {
                                    this._heightenItem(1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin - 1,
                                    }
                                    this._moveItem(newPosition);
                                }
                            } else {
                                if (event.shiftKey) {
                                    this._heightenItemGrid(1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin - this.gridSize_,
                                    }
                                    this._moveItemGrid(newPosition);
                                }
                            }
                            break;
                        } case 39: {// RightKey
                            if (this.$currentTarget_ == null) {
                                break;
                            }
                            let currentTargetPositionInCanvas: IPosition = this._getCurrentTargetPositionInCanvas();
                            let moveSize: number;
                            let css_margin: number = parseInt(this.$currentTarget_.css("margin"), 10);
                            if (event.ctrlKey) {
                                if (event.shiftKey) {
                                    this._widenItem(1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin + 1,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin,
                                    }
                                    this._moveItem(newPosition);
                                }
                            } else {
                                if (event.shiftKey) {
                                    this._widenItemGrid(1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin + this.gridSize_,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin,
                                    }
                                    this._moveItemGrid(newPosition);
                                }
                            }
                            break;
                        } case 40: {// DownKey
                            if (this.$currentTarget_ == null) {
                                break;
                            }
                            let currentTargetPositionInCanvas: IPosition = this._getCurrentTargetPositionInCanvas();
                            let moveSize: number;
                            let css_margin: number = parseInt(this.$currentTarget_.css("margin"), 10);
                            if (event.ctrlKey) {
                                if (event.shiftKey) {
                                    this._heightenItem(-1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin + 1,
                                    }
                                    this._moveItem(newPosition);
                                }
                            } else {
                                if (event.shiftKey) {
                                    this._heightenItemGrid(-1);
                                } else {
                                    let newPosition: IPosition = {
                                        x: currentTargetPositionInCanvas.x * 2 - css_margin,
                                        y: currentTargetPositionInCanvas.y * 2 - css_margin + this.gridSize_,
                                    }
                                    this._moveItemGrid(newPosition);
                                }
                            }
                            break;
                        }
                        case 8: // BackSpace
                        case 46: // DEL
                            this._deleteCurrentTargetItem();
                            break;
                        case 67: // c Copy Ctrl+C / Command+C
                            if (event.ctrlKey) {
                                this.setClipboadToItem();
                            }
                            break;
                        case 86: // v Paste
                            if (event.ctrlKey) {
                                this.pasteItemFromClipboard();
                            }
                            break;
                        case 90: // z Undo
                            if (event.ctrlKey) {
                                var targetModels = this.commandManager_.undo();
                                this._updateItemElementsOnCanvas(targetModels);
                                // 現在のターゲットを外す
                                this._loseTarget();
                                event.preventDefault();
                            }
                            break;
                        case 89: // y Redo
                            if (event.ctrlKey) {
                                var targetModels = this.commandManager_.redo();
                                this._updateItemElementsOnCanvas(targetModels);
                                // 現在のターゲットを外す
                                this._loseTarget();
                                event.preventDefault();
                            }
                        default:
                            break;
                    }
                }
            }

         

        }

        


        var View = new FullCustom();


    }
}