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
/// <reference path="../../modules/include/jquery.d.ts" />
/// <reference path="BasePage.ts" />
/// <reference path="PhnConfig.ts" />

module Garage {
    export module View {

        import Framework = CDP.Framework;
        import Tools = CDP.Tools;
        import UI = CDP.UI;

        var TAG: string = "[Garage.View.Home] ";

        /**
         * @class Home
         * @brief Home View class for Garage.
         */
        class Home extends BasePage {
            private selectedRemoteId: string = null;
            private remoteIdToDelete;

            private bindedLayoutPage = null;

            /**
             * construnctor
             */
            constructor() {
                super("/templates/home.html", "page-home", { route: "home" });
                this.remoteIdToDelete = null;
            }

            ///////////////////////////////////////////////////////////////////////
            // Override: UI.PageView

            //! page initialization event
            onInitialize(event: JQueryEventObject): void {
                super.onInitialize(event);
            }

            //! page show event
            onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
                super.onPageShow(event, data);
                this._initializeHomeView();
            }

            //! page before hide event
            onPageBeforeHide(event: JQueryEventObject, data?: Framework.HideEventData) {

                let FUNCTION_NAME = TAG + " : onPageBeforeHide : ";

                if (this.bindedLayoutPage == null) {
                    console.warn(FUNCTION_NAME + "this.bindedLayoutPage is null");
                    $(window).off("resize", this._pageLayout);
                } else {
                    $(window).off("resize", this.bindedLayoutPage);
                }

                let $faceContainer = $(".face-container");
                $faceContainer.off("click");

                super.onPageBeforeHide(event, data);
            }

            //! events binding
            events(): any {
                var events: any = {};
                events = super.events();
                events["click #create-new-remote"] = "_onCreateNewRemote";
                events["click #sync-pc-to-huis"] = "_onSyncPcToHuisClick";
                events["click #option-pulldown-menu"] = "_onOptionPullDownMenuClick";
                events["click #command-import-remote"] = "onOptionImport";
                events["contextmenu"] = "_onContextMenu";
                events["click .face-container." + FACE_TYPE_FULL_CUSTOM] = "onClickFullCustomFace";
                events["click .face-container." + FACE_TYPE_NOT_FULL_CUSTOM] = "onClickNotFullCustomFace";
                events["click #command-set-properties"] = "onOptionSetPropertiesClick";
                return events;
            }

            private onClickFullCustomFace(event: Event) {
                console.log("onClickFullCustomFace");
                let $clickedFace = $(event.currentTarget);
                let remoteId = $clickedFace.data("remoteid");
                if (remoteId) {
                    this._enterFullCustom(remoteId);
                }
            }

            private onClickNotFullCustomFace(event: Event) {
                console.log("onClickNotFullCustomFace");
                let $clickedFace = $(event.currentTarget);
                let remoteId = $clickedFace.data("remoteid");
                Util.MiscUtil.showGarageToast($.i18n.t("toast.STR_TOAST_CANT_EDIT"));
            }

            /*
             * ヘッダー上のオプションメニューボタンが押された際のイベントハンドリング
             */
            private _onOptionPullDownMenuClick(event: Event) {

                //表示するメニューのJQuery要素
                let $popup: JQuery = this.$page.find("#option-pulldown-menu-popup");
                //ビジネス仕向けの場合、表示するメニューを出しわける
                if (Util.MiscUtil.isBz()) {
                    $popup = this.$page.find("#option-pulldown-menu-popup-bz");
                }

                this.showOptionPullDownMenu($popup);
            }

            render(): Home {
                this._renderFaceList();
                $('body').trigger('create');
                return this;
            }


            /**
             * オプションの「詳細設定」を押した際の処理
             *
             * @param event {Event} クリックイベント
             */
            private onOptionSetPropertiesClick(event: Event) {
                let conf = new PhnConfig({ el: $('body'), model: new Model.PhnConfig(huisFiles.phnConfig, !storageLock.isReadyToLock()) });
                conf.$el.i18n();
                conf.updateHomeDestLabel();
                return;
            }

            /*
            * オプションの「リモコンをインポート」を押した際の処理
            */
            private onOptionImport(event: Event) {

                this.importRemote(() => {
                    //インポートが完了したら、再描画する。
                    huisFiles.init(HUIS_FILES_ROOT);
                    this._calculateFaceListWidth();
                    this._renderFaceList();

                    // インポート後は、インポートしたリモコンを表示するために一番左に移動する
                    this._moveWindowLeft();
                });
            }

            /**
             * Home 画面の初期化
             */
            private _initializeHomeView() {
                // HUIS ファイルを再読み込みする
                // [TODO] 変更があったときのみ再読み込みすべき
                huisFiles.init(HUIS_FILES_ROOT);

                this._pageLayout();
                this.render();
                this.selectedRemoteId = null; // 選択されていたものがあったら忘れること

                //this._pageLayout.bind(this)をすると、新しいオブジェクトを返すので、off("resize", )の際にも使うため、メンバーに記憶する
                //bind(this)することで、thisを _pageLayout に渡せる。bindがないとが thisが他のポイントをさせる。
                this.bindedLayoutPage = this._pageLayout.bind(this);
                $(window).on("resize", this.bindedLayoutPage);

                this.currentWindow_ = Remote.getCurrentWindow();
                this.currentWindow_.setMinimumSize(1280, 768); // 最小ウィンドウサイズを指定
                // コンテキストメニュー
                this.contextMenu_ = new Menu();

                //お知らせダイアログを表示
                var informationDialog = new Util.InformationDialog();
                if (informationDialog.shouldNotify()) {
                    informationDialog.notify();
                }

            }

            /**
              * 画面を左端に移動させる
              */
            private _moveWindowLeft() {
                let $faceListContainer = $("#face-list-container");
                $faceListContainer.animate({ scrollLeft: 0 }, "normal");
            }

            /**
             * face リストのレンダリング
             * リモコンを削除した際にも呼び出してください。 
             */
            private _renderFaceList() {
                var templateFile = Framework.toUrl("/templates/home.html");
                var faceItemTemplate = Tools.Template.getJST("#face-list-template", templateFile);

                // HuisFiles から フルカスタムの face を取得。
                // face は新しいものから表示するため、取得した facelist を逆順にする→HuisFiles.tsで追加位置を末尾にしたのでreverse()が不要に
                var faces = huisFiles.getFilteredFacesByCategories({});
                var faceList: { remoteId: string, name: string, category: string }[] = [];
                faces.forEach((face: Model.Face) => {

                    //faceName がスペースでのみ構成されているとき、無視されるので表示上、全角スペースにする。
                    let tmpFaceName: string = face.name;
                    var regExp = new RegExp(" ", "g");
                    tmpFaceName = tmpFaceName.replace(regExp, "");

                    let faceName = (tmpFaceName == "") ? "　" : face.name;
                    let faceCategory = (face.category == DEVICE_TYPE_FULL_CUSTOM) ? FACE_TYPE_FULL_CUSTOM : FACE_TYPE_NOT_FULL_CUSTOM;

                    faceList.push({
                        remoteId: face.remoteId,
                        name: faceName,
                        category: faceCategory
                    });

                });

                var $faceList = $("#face-list")
                $faceList.find(".face").remove(); // 当初_renderFaceListは$faceListに要素がないことが前提で作成されていたためこの行を追加、ないとリモコンがダブって表示される
                $faceList.append($(faceItemTemplate({ faceList: faceList })));
                var elems: any = $faceList.children();
                for (let i = 0, l = elems.length; i < l; i++) {
                    this._renderFace($(elems[i]));
                }
                this._calculateFaceListWidth();


                //テキストのローカライズ
                $("#page-home").i18n();
            }



            private _renderFace($face: JQuery): void {
                var remoteId = $face.attr("data-remoteId");
                if (!remoteId) {
                    return;
                }
                var face: Model.Face = huisFiles.getFace(remoteId);
                var faceRenderer: FaceRenderer = new FaceRenderer({
                    el: $face.find(".face-container"),
                    attributes: {
                        face: face,
                        materialsRootPath: HUIS_FILES_ROOT
                    }
                });
                faceRenderer.render();
            }

            /**
              * 引数で与えたremoteIdを持つリモコンの編集画面に移動する。
              *
              * @param remoteId {string} 0埋め4桁の数字文字列。省略した場合は、新規リモコン作成画面に入る。
              */
            private _enterFullCustom(remoteId?: string) {
                let urlQueryParameter: string = "";
                if (remoteId != null) {
                    urlQueryParameter = "?remoteId=" + remoteId;
                }
                Framework.Router.navigate("#full-custom" + urlQueryParameter);
            }

            /**
              * 引数で与えられたfaceのコピーを作成し、その後その編集画面に入る。
              *
              * @param face {Model.Face} コピーを作成するリモコンのface。
              */
            private _copyAndEditRemote(face: Model.Face) {

                if (!this._checkCanCreateNewRemote()) {
                    return;
                }
                face = face.copy(huisFiles.createNewRemoteId());

                if (face.category != DEVICE_TYPE_FULL_CUSTOM) {
                    face.convertToFullCustomFace();
                }

                let buttonDeviceInfoCache = new Util.ButtonDeviceInfoCache(HUIS_FILES_ROOT, face.remoteId);
                huisFiles.updateFace(face, buttonDeviceInfoCache)
                    .always(() => {
                        if (HUIS_ROOT_PATH) {
                            let syncTask = new Util.HuisDev.FileSyncTask();
                            let syncProgress = syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, true, DIALOG_PROPS_COPY_AND_EDIT_REMOTE, () => {
                                huisFiles.init(HUIS_FILES_ROOT);
                                this._calculateFaceListWidth();
                                this._renderFaceList();

                                // 新規作成したリモコンを表示するために一番左に移動する
                                this._moveWindowLeft();
                            }, (err) => {
                                if (err) {
                                    // [TODO] エラー値のハンドリング
                                    electronDialog.showMessageBox({
                                        type: "error",
                                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SYNC_WITH_HUIS_ERROR"),
                                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                        title: PRODUCT_NAME,
                                    });
                                } else {
                                    this._enterFullCustom(face.remoteId);
                                }
                            });
                        } else {
                            console.error("HUIS_ROOT_PATH is empty");
                        }
                    }).fail(() => {
                        console.error("updateFace is fail");
                    });
            }

            /**
              * 新規にリモコンが作成できるかどうを確認し、必要であればエラーダイアログを出力する。
              *
              * @return {boolean} 新規にリモコンが作成できるかどうかを返す。
              */
            private _checkCanCreateNewRemote(): boolean {
                let canCreateResult = huisFiles.canCreateNewRemote();
                if (canCreateResult == 0) {
                    return true;
                } else if (canCreateResult == -2) {
                    electronDialog.showMessageBox({
                        type: "error",
                        message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ERROR_NO_REMOTE_IN_HUIS"),
                        buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                        title: PRODUCT_NAME,
                    });
                } else if (canCreateResult == -1) {
                    this.showErrorDialogRemoteNumLimit()
                } else {
                    console.warn("no alert dialog in _onCreateNewRemote()");
                }
                return false;
            }

            private _onCreateNewRemote() {
                if (this._checkCanCreateNewRemote()) {
                    this._enterFullCustom();
                }
            }

            /*
            * +ボタンにmouseOverしたときに呼び出される
            */
            private _onCreateNewRemoteHover(event: Event) {

                var $target = $(event.currentTarget);//＋ボタンのJquery
                this.centeringTooltip($target);
            }




            private _onSyncPcToHuisClick(noWarn?: Boolean) {

                if (!noWarn) {
                    //もう使われてない？
                    let response = electronDialog.showMessageBox({
                        type: "info",
                        message: "変更内容を HUIS に反映しますか？\n"
                        + "最初に接続した HUIS と異なる HUIS を接続している場合、\n"
                        + "HUIS 内のコンテンツが上書きされますので、ご注意ください。",
                        buttons: ["yes", "no"],
                        title: PRODUCT_NAME,
                        cancelId: 1,
                    });
                    if (response !== 0) {
                        huisFiles.updateRemoteList(); // HUIS更新せずにRemoteList更新
                        return;
                    }
                }

                huisFiles.removeFace(this.remoteIdToDelete);
                huisFiles.updateRemoteList();
                huisFiles.init(HUIS_FILES_ROOT);

                if (HUIS_ROOT_PATH) {
                    let syncTask = new Util.HuisDev.FileSyncTask();
                    syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, true, DIALOG_PROPS_DELTE_REMOTE, () => {
                        $(".face[data-remoteid=" + this.remoteIdToDelete + "]").remove();
                        this._calculateFaceListWidth();
                        this._renderFaceList();
                    }, (err) => {
                        if (err) {
                            // [TODO] エラー値のハンドリング
                            electronDialog.showMessageBox({
                                type: "error",
                                message: $.i18n.t("dialog.message.STR_DIALOG_INIT_SYNC_WITH_HUIS_ERROR"),
                                buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                                title: PRODUCT_NAME,
                            });
                        } else {
                        }
                    });
                }
            }

            private _onContextMenu() {
                event.preventDefault();
                this.rightClickPosition_.setPositionXY(event.pageX, event.pageY);

                // コンテキストメニューを作成する
                this.contextMenu_.clear();
                this.contextMenu_.items = [];

                var element = document.elementFromPoint(event.pageX, event.pageY);
                var $face = $(element).parents("#face-list .face");
                if ($face.length) {
                    this.remoteIdToDelete = $face.data("remoteid");
                    if (this.remoteIdToDelete) {

                        let remoteId = $face.data("remoteid");

                        // 対象がフルカスタムリモコンのときのみ表示
                        // 編集画面へ移動機能をコンテキストメニューに表示
                        if ($face.hasClass(FACE_TYPE_FULL_CUSTOM)) {
                            this.contextMenu_.append(new MenuItem({
                                label: $.i18n.t("context_menu.STR_CONTEXT_EDIT_REMOTE"),
                                click: () => {
                                    this._enterFullCustom(remoteId);
                                }
                            }));
                        }

                        // コピー機能をコンテキストメニューに表示
                        this.contextMenu_.append(new MenuItem({
                            label: $.i18n.t("context_menu.STR_CONTEXT_COPY_AND_EDIT_REMOTE"),
                            click: () => {
                                let face: Model.Face = huisFiles.getFace(remoteId);
                                this._copyAndEditRemote(face);
                            }
                        }));

                        //削除機能をコンテキストメニューに表示
                        this.contextMenu_.append(new MenuItem({
                            label: $.i18n.t("context_menu.STR_CONTEXT_DELETE_REMOTE"),
                            click: () => {
                                var response = electronDialog.showMessageBox({
                                    type: "warning",
                                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_DELETE_REMOTE"),
                                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_DELETE"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
                                    title: PRODUCT_NAME,
                                    cancelId: 1,
                                });
                                if (response === 0) {
                                    this._onSyncPcToHuisClick(true); // true で警告なし
                                }
                            }
                        }));

                        //エキスポート機能をコンテキストメニューに表示。
                        this.contextMenu_.append(new MenuItem({
                            label: $.i18n.t("context_menu.STR_CONTEXT_EXPORT_REMOTE"),
                            click: () => {
                                let face: Model.Face = huisFiles.getFace(remoteId);

                                //masterFaceを取得。
                                let isMaster: boolean = true;
                                let masterFace: Model.Face = huisFiles.getFace(remoteId, isMaster);

                                this.exportRemote(face, masterFace); // true で警告なし
                            }
                        }));


                    }

                }

                if (DEBUG_MODE) { // 要素を検証、はデバッグモード時のみコンテキストメニューに表示される
                    this.contextMenu_.append(new MenuItem({
                        label: $.i18n.t("context_menu.STR_CONTEXT_VALIDATE_ELEMENTS"),
                        click: () => {
                            this.currentWindow_.inspectElement(this.rightClickPosition_.x, this.rightClickPosition_.y);
                        }
                    }));
                }

                if (this.contextMenu_.items.length != 0) {
                    this.contextMenu_.popup(this.currentWindow_);
                }

            }

            private _pageLayout() {

                var windowWidth = innerWidth;
                var windowHeight = innerHeight;

                if (this != null) {
                    this.closeAllPopups();
                }

                var faceHistoryListContainerHeight = 0; // ヒストリー表示がなくなったので、暫定的にサイズ 0
                var scrollHeight = windowHeight - $(window).outerHeight(true);
                var faceListContainerHeight = innerHeight - $("#face-list-container").offset().top - faceHistoryListContainerHeight - scrollHeight;

                $("#face-list").css("height", faceListContainerHeight + "px");
                $("#home-introductions").css("height", faceListContainerHeight + "px");
            }

            /**
             * faceList の width を計算して設定する
             */
            private _calculateFaceListWidth() {
                let $faceList = $("#face-list");
                let $items = $faceList.find(".face");
                let listWidth = 0;
                $items.each((index, item) => {
                    listWidth += $(item).outerWidth(true);
                });
                $faceList.width(listWidth);
            }

        }

        var View = new Home();
    }
}
