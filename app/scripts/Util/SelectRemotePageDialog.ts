 /// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        import Dialog = CDP.UI.Dialog;


        export class SelectRemotePageDialog {

            private static TAG = "[Garage.Util.SelectRemotePageDialog] ";

            /** 表示するダイアログ */
            private dialog: Dialog;

            /** タイトル */
            private title: string;

            /** 初期選択するリモコンページ設定 */
            private defaultJumpSettings: IJump;

            /** OK押下時のcallback */
            private onSubmit: (result: IJump) => void;

            /** Cancel押下時のcallback */
            private onCancel: () => void;

            /** 選択されているリモコンページ */
            private selectedSettings: IJump;

            /** 編集中の Face 情報 */
            private tmpFace: IGFace;

            /** face-container の scale */
            private faceContainerScale: number = 0.5;

            /** face-list の scale */
            private faceListScale: number = 0.8;


            /**
             * コンストラクタ
             *
             * @param title {string} ダイアログに表示するタイトル
             * @param defaultJumpSettings {IJump} 初期選択状態にするリモコンページ設定
             * @param tmpFace {IGFace} 編集中のリモコン設定（編集中のリモコンも一覧表示する場合に使用）
             */
            constructor(title: string, defaultJumpSettings: IJump, tmpFace?: IGFace) {
                this.title = title;
                this.defaultJumpSettings = defaultJumpSettings;
                if (huisFiles.isValidJumpSettings(this.defaultJumpSettings) ||
                    (tmpFace != null && this.defaultJumpSettings.remote_id == tmpFace.remoteId)) {
                    this.selectedSettings = this.defaultJumpSettings;
                }

                if (tmpFace) {
                    this.tmpFace = tmpFace;
                }

                let options: CDP.UI.DialogOptions = {
                    src: CDP.Framework.toUrl("/templates/dialogs.html"),
                    title: title,
                    anotherOption: {
                        label_ok: $.i18n.t('dialog.button.STR_DIALOG_BUTTON_OK'),
                        label_cancel: $.i18n.t('dialog.button.STR_DIALOG_BUTTON_CANCEL')
                    }
                };

                this.dialog = new Dialog("#common-dialog-remotelist", options);
            }


            /**
             * ダイアログを表示する
             *
             * @param onSubmit {(result: IJump)=>void} OK押下時のcallback
             */
            show(onSubmit: (result: IJump) => void, onCancel?: () => void) {
                this.onSubmit = onSubmit;
                this.onCancel = onCancel;
                let $dialog = this.dialog.show();
                this.updateSelectedFacePageLabel();

                $dialog.i18n();
                // jQuery mobile 適用
                $dialog.trigger('create');

                // Face の遅延ロード
                this.startRenderingFaceList();

                $dialog.on({
                    "click": SelectRemotePageDialog.onClick
                });

                $dialog.find("#remotelist-dialog-area .face-container").scroll();
                $dialog.find("#remotelist-button-ok").click(this.onOKClicked.bind(this));
                $dialog.find("#remotelist-button-cancel").click(this.onCancelClicked.bind(this));
            }


            /**
             * リモコン一覧の読み込み～描画を開始する
             */
            private startRenderingFaceList() {
                setTimeout(() => {
                    this.renderFaceList();
                    this.removeSpinner();
                    this.addMultiPagedFaceClass();
                    this.loadDomProperties();
                    $('#remotelist-dialog-area .face-container').scroll((event) => {
                        this.onScrollFaceContainer(event);
                    });
                    this.selectDefaultFacePage();
                }, 100);
            }

            private loadDomProperties() {
                this.faceContainerScale = JQueryUtils.getScale($('#remotelist-dialog-area .face-container'));
                this.faceListScale = JQueryUtils.getScale($('#remotelist-dialog-area #face-list'));
            }


            /**
             * リモコン一覧を描画
             *
             * @param dialog {SelectRemotePageDialog}
             */
            private renderFaceList() {
                var templateFile = CDP.Framework.toUrl("/templates/home.html");
                var faceItemTemplate = CDP.Tools.Template.getJST("#face-list-selector-template", templateFile);

                var faces = huisFiles.getFilteredFacesByCategories({});
                var faceList: { remoteId: string, name: string }[] = [];

                if (this.tmpFace) {
                    // HuisFiles に編集中の face があるか検査
                    let tmpFace = faces.filter((value: { remoteId: string; name: string; }) => {
                        return (this.tmpFace.remoteId == value.remoteId);
                    });
                    if (tmpFace.length < 1) {
                        // 編集中の face が HuisFiles に無い場合（新規の場合）はリストに追加
                        faceList.push({
                            remoteId: this.tmpFace.remoteId,
                            name: this.tmpFace.name
                        });
                    }
                }

                faces.forEach((face: IGFace) => {
                    let tmpFaceName: string;
                    if (this.tmpFace &&
                        this.tmpFace.remoteId == face.remoteId) {
                        tmpFaceName = this.tmpFace.name;
                    } else {
                        tmpFaceName = face.name;
                    }

                    //faceName がスペースでのみ構成されているとき、無視されるので表示上、全角スペースにする。
                    var regExp = new RegExp(" ", "g");
                    tmpFaceName = tmpFaceName.replace(regExp, "");
                    if (tmpFaceName == "") {
                        faceList.push({
                            remoteId: face.remoteId,
                            name: "　"
                        });
                    } else {
                        faceList.push({
                            remoteId: face.remoteId,
                            name: face.name
                        });
                    }

                });

                var numRemotes: number = faces.length;//ホームに出現するリモコン数

                if (numRemotes !== 0) {//リモコン数が0ではないとき、通常通り表示
                    var $faceList = $("#remotelist-dialog-area #face-list")
                    $faceList.find(".face").remove(); // 当初_renderFaceListは$faceListに要素がないことが前提で作成されていたためこの行を追加、ないとリモコンがダブって表示される
                    $faceList.append($(faceItemTemplate({ faceList: faceList })));
                    var elems: any = $faceList.children();
                    for (let i = 0, l = elems.length; i < l; i++) {
                        this.renderFace(this, $(elems[i]));
                    }
                    SelectRemotePageDialog.calculateFaceListWidth();
                    $faceList.find('#face-pages-area').click((event) => {
                        this.selectClickedFacePage(this, event);
                    });
                } else {
                    // リモコン数０
                    // ★★★★TODO
                }

            }


            /**
             * リモコンを描画
             *
             * @param dialog {SelectRemotePageDialog}
             * @param $face {JQuery}
             */
            private renderFace(dialog: SelectRemotePageDialog, $face: JQuery): void {
                var remoteId = $face.attr("data-remoteId");
                if (!remoteId) {
                    return;
                }

                let face: IGFace;
                if (dialog.tmpFace &&
                    dialog.tmpFace.remoteId == remoteId) {
                    // 編集中の face
                    face = dialog.tmpFace;
                } else {
                    face = huisFiles.getFace(remoteId);
                }

                var faceRenderer: View.FaceRenderer = new View.FaceRenderer({
                    el: $face.find(".face-container"),
                    attributes: {
                        face: face,
                        materialsRootPath: HUIS_FILES_ROOT
                    }
                });
                faceRenderer.render();
            }


            /**
             * リモコン一覧の幅を算出しDOMに設定する
             */
            private static calculateFaceListWidth() {
                let $faceList = $("#remotelist-dialog-area #face-list");
                let $items = $faceList.find(".face");
                let listWidth = 0;
                $items.each((index, item) => {
                    listWidth += $(item).outerWidth(true);
                });
                $faceList.width(listWidth);
            }


            /**
             * リモコン一覧読み込み中のスピナー表示を削除
             */
            private removeSpinner() {
                $('#spinner-container').remove();
            }


            /**
             * 複数ページを持つリモコンのDOMにクラスを設定し、グラデーション表示用DOMを追加する
             */
            private addMultiPagedFaceClass() {
                let $faces = $('#remotelist-dialog-area .face-container');
                $faces.each((index, elem) => {
                    let pages = $(elem).find('.face-page').length;
                    if (pages > 1) {
                        $(elem).addClass('multi-page');
                        SelectRemotePageDialog.addGradationArea($(elem));

                        $(elem).siblings('.face-selector').addClass('multi-page');
                    }
                });
            }


            /**
             * グラデーション表示用DOMを追加する
             *
             * @param $faceContainer {JQuery} 追加対象のface-container
             */
            private static addGradationArea($faceContainer: JQuery) {
                let $top = $('<div>').addClass('gradation-area').addClass('gradation-top');
                let $bottom = $('<div>').addClass('gradation-area').addClass('gradation-bottom');

                $faceContainer.after($bottom).after($top);

                SelectRemotePageDialog.controlGradationAreaDisplay($faceContainer);
            }



            /**
             * 初期選択対象のリモコンページを選択状態にする
             *
             * @param dialog {SelectRemotePageDialog}
             */
            private selectDefaultFacePage() {
                if (!this.defaultJumpSettings) {
                    return;
                }

                let $face = $('#remotelist-dialog-area .face-container[data-remoteid="' + this.defaultJumpSettings.remote_id + '"]');
                let $page = $face.find('.face-page[data-page-index="' + this.defaultJumpSettings.scene_no + '"]');

                if ($page.length != 1) {
                    return;
                }


                $page.addClass("selected");
                $face.siblings('.face-selector').children('.face-page-selector').addClass('selected');

                let $list = $('#remotelist-dialog-area #face-list-container');
                this.setScrollPosition($list, $face);

                // 選択中リモコンページ枠の位置を補正するためにスクロールイベントを呼ぶ
                setTimeout(() => {
                    $face.scroll();
                });
            }



            /**
             * スクロール位置を選択されたリモコンページに合わせる
             *
             * @param $faceListContainer {JQuery} face-list-container
             * @param $faceContainer {JQuery} 選択されたリモコンのface-container
             */
            private setScrollPosition($faceListContainer: JQuery, $faceContainer: JQuery) {
                this.setVerticalScrollPosition($faceListContainer);
                this.setHorizontalScrollPosition($faceContainer);
            }


            /**
             * 横スクロール位置を選択されたリモコンページに合わせる
             *
             * @param $faceListContainer {JQuery} face-list-container
             */
            private setVerticalScrollPosition($faceListContainer: JQuery) {
                if ($faceListContainer[0] == null ||
                    $faceListContainer[0].scrollWidth <= $faceListContainer[0].clientWidth) {
                    // スクロール不能
                    return;
                }

                let $faces = $faceListContainer.find('.face');
                let faceWidth = $faceListContainer[0].scrollWidth / $faces.length;

                let faceIndex: number = 0;
                $faces.each((index, elem) => {
                    if (this.defaultJumpSettings.remote_id === $(elem).data('remoteid')) {
                        faceIndex = index;
                    }
                });

                let scrollLeft = faceWidth * faceIndex - $faceListContainer.innerWidth() / 2 + faceWidth / 2;
                if (scrollLeft > 0) {
                    $faceListContainer.scrollLeft(scrollLeft);
                }
            }


            /**
             * 縦スクロール位置を選択されたリモコンページに合わせる
             *
             * @param $faceContainer {JQuery} 選択されたリモコンのface-container
             */
            private setHorizontalScrollPosition($faceContainer: JQuery) {
                if ($faceContainer[0] == null ||
                    $faceContainer[0].scrollHeight <= $faceContainer[0].clientHeight) {
                    // スクロール不能
                    return;
                }

                let $pages = $faceContainer.find('.face-page');
                let pageHeight = $faceContainer[0].scrollHeight / $pages.length;

                let scrollTop = pageHeight * this.defaultJumpSettings.scene_no;
                if (scrollTop > 0) {
                    $faceContainer.scrollTop(scrollTop);
                }
            }


            /**
             * クリックされたリモコンページを選択状態にする
             *
             * @param dialog {SelectRemotePageDialog}
             * @param event {Event} クリックイベント
             */
            private selectClickedFacePage(dialog: SelectRemotePageDialog, event: Event) {
                let $facePagesArea = $(event.currentTarget);
                let $selectedPage = this.getClickedPageFromFacePagesArea($facePagesArea, event);

                if ($selectedPage.hasClass("selected")) {
                    return;
                }

                dialog.selectedSettings = SelectRemotePageDialog.getRemotePageByFacePageJQuery($selectedPage);

                // selected クラスを削除
                let $facePages = $('.face-page');
                $facePages.each((index, elem) => {
                    $(elem).removeClass('selected');
                });
                let $selectors = $('.face-page-selector');
                $selectors.each((index, elem) => {
                    $(elem).removeClass('selected');
                });

                // selected クラスを付与
                $selectedPage.addClass('selected');

                let $faceContainer = $selectedPage.parents('.face-container');
                let $selector = $faceContainer.siblings('.face-selector').children('.face-page-selector');
                $selector
                    .addClass('selected')
                    .css('top', dialog.calcSelectorTop($faceContainer, $selectedPage));

                dialog.updateSelectedFacePageLabel();

                SelectRemotePageDialog.enableSubmitButton();
            }


            /**
             * クリックされたリモコンページのJQueryオブジェクトを取得
             *
             * @param $facePagesArea {JQuery}
             * @param event {Event}
             */
            private getClickedPageFromFacePagesArea($facePagesArea: JQuery, event: Event): JQuery {
                let origin = $(event.target);
                if (origin.is('#face-pages-area')) {
                    // face-pages-areaがクリックされた場合：クリック座標からページを算出
                    let $pages = $facePagesArea.find('.face-page');
                    let pageHeight = $facePagesArea.outerHeight() / $pages.length;
                    let pageNum = Math.floor(event['offsetY'] / pageHeight);
                    if (pageNum >= $pages.length) {
                        console.error('clicked face page not found');
                        return $pages.eq(0);
                    } else {
                        console.log('#face-pages-area clicked: ' + pageNum + '(' + event['offsetY'] + ' / ' + pageHeight + ')');
                        return $pages.eq(pageNum);
                    }
                } else if (origin.is('.face-page')) {
                    // face-pageがクリックされた場合
                    return origin;
                } else {
                    // face-pageの子孫がクリックされた場合
                    return $(event.target).parents('.face-page');
                }
            }


            /**
             * 選択中のリモコン情報表示を現在の状態に合わせて更新
             */
            private updateSelectedFacePageLabel() {
                let FUNCTION_NAME = SelectRemotePageDialog.TAG + "updateSelectedFacePageLabel ";
                if (this.selectedSettings == null) {
                    return;
                }

                let face = huisFiles.getFace(this.selectedSettings.remote_id);
                if (face == null) {
                    if (this.selectedSettings.remote_id == this.tmpFace.remoteId) {
                        face = this.tmpFace;
                    } else {
                        console.warn(FUNCTION_NAME + "face not found: " + this.selectedSettings.remote_id);
                        return;
                    }
                }

                let labelArea = $('#remotelist-label-selected');
                labelArea.text(
                    $.i18n.t('dialog.label.STR_DIALOG_LABEL_SELECTED_REMOTE') + face.name + " " +
                    $.i18n.t('dialog.label.STR_DIALOG_LABEL_SELECTED_PAGE') + (this.selectedSettings.scene_no + 1));
            }


            /**
             * OKボタンを有効化する
             */
            private static enableSubmitButton() {
                let $button = $('#remotelist-button-ok');
                if ($button.prop('disabled')) {
                    $button.prop('disabled', false);
                }
            }


            /**
             * リモコンページのJQueryオブジェクトからIJump設定を取得する
             *
             * @param $page {JQuery} リモコンページのDOMから生成されたJQueryオブジェクト
             * @return {IJump}
             */
            private static getRemotePageByFacePageJQuery($page: JQuery): IJump {
                let page = $page.data("page-index");

                let $faceContainer = $page.parents(".face-container");
                let remoteId = $faceContainer.data("remoteid");

                return {
                    remote_id: remoteId,
                    scene_no: page
                };
            }


            /**
             * face-containerスクロールイベント
             *
             * @param event {Event}
             */
            private onScrollFaceContainer(event: Event) {
                let $faceContainer = $(event.currentTarget);
                SelectRemotePageDialog.controlGradationAreaDisplay($faceContainer);
                this.scrollSelectorArea($faceContainer);
            }


            /**
             * 対象のスクロール位置を検査しグラデーションの表示/非表示を切り替える
             *
             * @param $faceContainer {JQuery} 検査対象のface-container
             */
            private static controlGradationAreaDisplay($faceContainer: JQuery) {
                let scrollTop = $faceContainer.scrollTop();
                let topArea = $faceContainer.siblings('.gradation-top');
                let btmArea = $faceContainer.siblings('.gradation-bottom');

                topArea.css('visibility', (scrollTop === 0) ? 'hidden' : 'visible');
                btmArea.css('visibility', (scrollTop >= ($faceContainer[0].scrollHeight - $faceContainer[0].clientHeight)) ? 'hidden' : 'visible');

            }


            /**
             * 選択中リモコンページ枠表示エリアをスクロールに合わせて移動させる
             *
             * @param $faceContainer {JQuery} スクロールされた face-container
             */
            private scrollSelectorArea($faceContainer: JQuery) {
                let $selectedPage = $faceContainer.find('.selected');
                if ($selectedPage.length != 1) {
                    return;
                }

                let $selector = $faceContainer.siblings('.face-selector').children('.face-page-selector');
                $selector.css('top', this.calcSelectorTop($faceContainer, $selectedPage));
            }


            /**
             * 選択中リモコンページ枠を表示するべき高さを算出する
             *
             * @param $faceContainer {JQuery} 選択中のページを含むface-container
             * @param $facePage {JQuery} 選択中のページ
             * @return {number}
             */
            private calcSelectorTop($faceContainer: JQuery, $facePage: JQuery): number {
                return ($facePage.position().top + JQueryUtils.getMarginTopPx($facePage) * (1 - this.faceContainerScale * this.faceListScale)) / this.faceListScale - $faceContainer.scrollTop() * this.faceContainerScale;
            }


            /**
             * ダイアログ全体のクリックイベント
             *
             * @param event {Event}
             */
            private static onClick(event: Event) {
                // ダイアログ内をクリックするだけで閉じてしまうのを防止
                event.stopPropagation();
            }


            /**
             * OKボタンのクリックイベント
             *
             * @param event {Event}
             */
            private onOKClicked(event: Event) {
                this.dialog.close();

                if (this.onSubmit != null) {
                    this.onSubmit(this.selectedSettings);
                }
            }


            /**
             * Cancelボタンのクリックイベント
             *
             * @param event {Event}
             */
            private onCancelClicked(event: Event) {
                this.dialog.close();

                if (this.onCancel != null) {
                    this.onCancel();
                }
            }
        }
    }
}