 /// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        import Dialog = CDP.UI.Dialog;


        export class SelectRemotePageDialog {

            /** 表示するダイアログ */
            private dialog: Dialog;

            /** タイトル */
            private title: string;

            /** 初期選択するリモコンページ設定 */
            private defaultJumpSettings: IJump;

            /** OK押下時のcallback */
            private onSubmit: (result: IJump) => void;

            /** 選択されているリモコンページ */
            private selectedSettings: IJump;

            /** 編集中の Face 情報 */
            private tmpFace: IGFace;


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
                if (huisFiles.isValidJumpSettings(this.defaultJumpSettings)) {
                    this.selectedSettings = this.defaultJumpSettings;
                }

                if (tmpFace) {
                    this.tmpFace = tmpFace;
                }

                let options: CDP.UI.DialogOptions = {
                    src: CDP.Framework.toUrl("/templates/dialogs.html"),
                    title: title,
                    anotherOption: {
                        label_ok: "OK",                 // ★★★★仮
                        label_cancel: "キャンセル"       // ★★★★仮
                    }
                };

                this.dialog = new Dialog("#common-dialog-remotelist", options);
            }


            /**
             * ダイアログを表示する
             *
             * @param onSubmit {(result: IJump)=>void} OK押下時のcallback
             */
            show(onSubmit: (result: IJump) => void) {
                this.onSubmit = onSubmit;
                let $dialog = this.dialog.show();

                // jQuery mobile 適用
                $dialog.trigger('create');

                // Face の遅延ロード
                this.startRenderingFaceList();

                $dialog.on({
                    "click": SelectRemotePageDialog.onClick
                });

                $dialog.find("#remotelist-button-ok").click(this.onOKClicked.bind(this));
                $dialog.find("#remotelist-button-cancel").click(this.onCancelClicked.bind(this));
            }


            /**
             * リモコン一覧の読み込み～描画を開始する
             */
            private startRenderingFaceList() {
                let self = this;
                setTimeout(() => {
                    SelectRemotePageDialog.renderFaceList(self);
                    self.selectDefaultFacePage(self);
                    SelectRemotePageDialog.removeSpinner();
                }, 100);
            }


            /**
             * リモコン一覧を描画
             *
             * @param dialog {SelectRemotePageDialog}
             */
            private static renderFaceList(dialog: SelectRemotePageDialog) {
                var templateFile = CDP.Framework.toUrl("/templates/home.html");
                var faceItemTemplate = CDP.Tools.Template.getJST("#face-list-template", templateFile);

                var faces = huisFiles.getFilteredFacesByCategories({});
                var faceList: { remoteId: string, name: string }[] = [];

                if (dialog.tmpFace) {
                    // HuisFiles に編集中の face があるか検査
                    let tmpFace = faces.filter((value: { remoteId: string; name: string; }) => {
                        return (dialog.tmpFace.remoteId == value.remoteId);
                    });
                    if (tmpFace.length < 1) {
                        // 編集中の face が HuisFiles に無い場合（新規の場合）はリストに追加
                        faceList.push({
                            remoteId: dialog.tmpFace.remoteId,
                            name: dialog.tmpFace.name
                        });
                    }
                }

                faces.forEach((face: IGFace) => {
                    let tmpFaceName: string;
                    if (dialog.tmpFace &&
                        dialog.tmpFace.remoteId == face.remoteId) {
                        tmpFaceName = dialog.tmpFace.name;
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
                    var $faceList = $("#face-list")
                    $faceList.find(".face").remove(); // 当初_renderFaceListは$faceListに要素がないことが前提で作成されていたためこの行を追加、ないとリモコンがダブって表示される
                    $faceList.append($(faceItemTemplate({ faceList: faceList })));
                    var elems: any = $faceList.children();
                    for (let i = 0, l = elems.length; i < l; i++) {
                        dialog.renderFace(dialog, $(elems[i]));
                    }
                    SelectRemotePageDialog.calculateFaceListWidth();
                } else {
                    // リモコン数０
                    // ★★★★TODO
                }

                //テキストのローカライズ
                //$("header h3").html($.i18n.t("home.STR_HOME_TITLE"));
                //$("#create-new-remote").attr("title", $.i18n.t("tooltip.STR_TOOLTIP_NEW_REMOTE"));

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

                $face.find(".face-page").on("click", (event) => {
                    dialog.selectClickedFacePage(dialog, event);
                });
            }


            /**
             * リモコン一覧の幅を算出しDOMに設定する
             */
            private static calculateFaceListWidth() {
                let $faceList = $("#face-list");
                let $items = $faceList.find(".face");
                let listWidth = 0;
                $items.each((index, item) => {
                    listWidth += $(item).outerWidth(true);
                });
                $faceList.width(listWidth * 0.8);
            }


            /**
             * リモコン一覧読み込み中のスピナー表示を削除
             */
            private static removeSpinner() {
                $('#spinner-container').remove();
            }


            /**
             * 初期選択対象のリモコンページを選択状態にする
             *
             * @param dialog {SelectRemotePageDialog}
             */
            private selectDefaultFacePage(dialog: SelectRemotePageDialog) {
                if (!dialog.defaultJumpSettings) {
                    return;
                }

                let $faceContainer = $('.face-container[data-remoteid="' + this.defaultJumpSettings.remote_id + '"]');
                let $facePage = $faceContainer.find('.face-page[data-page-index="' + this.defaultJumpSettings.scene_no + '"]');
                $facePage.addClass("selected");
            }


            /**
             * クリックされたリモコンページを選択状態にする
             *
             * @param dialog {SelectRemotePageDialog}
             * @param event {Event} クリックイベント
             */
            private selectClickedFacePage(dialog: SelectRemotePageDialog, event: Event) {
                let $selectedPage = $(event.currentTarget);

                if ($selectedPage.hasClass("selected")) {
                    return;
                }

                dialog.selectedSettings = SelectRemotePageDialog.getRemotePageByFacePageJQuery($selectedPage);

               //SelectRemotePageDialog.insertCursorDomAtSelectedFacePage($selectedPage);

                let $facePages = $(".face-page");
                $facePages.each((index, elem) => {
                    $(elem).removeClass("selected");
                });

                $(event.currentTarget).addClass("selected");
                SelectRemotePageDialog.enableSubmitButton();
            }

            /////////////////////
            private static insertCursorDomAtSelectedFacePage($facePage: JQuery) {
                let $cursor = $('#face-page-selector');
                if ($cursor.length > 0) {
                    $cursor.remove();
                }

                let $newCursor = $('<div>');
                $newCursor
                    .attr("id", "face-page-selector")
                    .css({
                        "width": $facePage.width(),
                        "height": $facePage.height()
                    });

                $facePage.before($newCursor);
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
                this.onSubmit(this.selectedSettings);
            }


            /**
             * Cancelボタンのクリックイベント
             *
             * @param event {Event}
             */
            private onCancelClicked(event: Event) {
                this.dialog.close();
            }
        }
    }
}