/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />
/// <reference path="BasePage.ts" />

module Garage {
	export module View {

		import Framework = CDP.Framework;
		import Tools = CDP.Tools;
        import UI = CDP.UI;
        import Dialog = CDP.UI.Dialog;

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
                var ret:any = {};
                ret = super.events();
				return $.extend(ret,{
					//"dblclick header .ui-title": "_onHeaderDblClick",
					"click #create-new-remote": "_onCreateNewRemote",
					"mouseover #create-new-remote": "_onCreateNewRemoteHover",
                    "click #sync-pc-to-huis": "_onSyncPcToHuisClick",
                    "click #option-pulldown-menu": "_onOptionPullDownMenuClick",
                    // ショートカットキー
                    //"keydown": "_onKeyDown",
					// コンテキストメニュー
                    "contextmenu": "_onContextMenu",
				});
			}

			render(): Home {
				this._renderFaceList();
				return this;
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


                

                if (!fs) {
                    fs = require("fs-extra");
                }

                function isExistFile(file) {
                    try {
                        fs.statSync(file);
                        return true;
                    } catch (err) {
                        return false;
                    }
                }

                if (!isExistFile('./notified_flag_file')) {
                    fs.outputFile('./notified_flag_file', "this file is a flag", function (err) { console.log(err); });

                    var dialog: Dialog = null;
                    var props: DialogProps = null;
                    var informationList: { date: string, text: string }[] = [];
                    informationList.push({ date: "2016.01.01", text: "お知らせ１" });
                    informationList.push({ date: "2016.01.02", text: "お知らせ２" });
                    informationList.push({ date: "2016.01.03", text: "お知らせ３" });


                    dialog = new CDP.UI.Dialog("#common-dialog-information", {
                        src: CDP.Framework.toUrl("/templates/dialogs.html"),
                        title: "お知らせ",// [TODO]titleの外部化 $.i18n.t("app.name") + $.i18n.t("about.STR_ABOUT_TITLE"),
                        informationList: informationList,
                        dismissible: true,
                    });
                    dialog.show();
                }
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
				var faces = huisFiles.getFilteredFacesByCategories({ matchingCategories: ["fullcustom"] });
				var faceList: { remoteId: string, name: string }[] = [];
				faces.forEach((face: IGFace) => {

					//faceName がスペースでのみ構成されているとき、無視されるので表示上、全角スペースにする。
					let tmpFaceName: string =face.name;
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

                var numRemotes:number = faces.length;//ホームに出現するリモコン数

                if (numRemotes !== 0) {//リモコン数が0ではないとき、通常通り表示
                    var $faceList = $("#face-list")
                    $faceList.find(".face").remove(); // 当初_renderFaceListは$faceListに要素がないことが前提で作成されていたためこの行を追加、ないとリモコンがダブって表示される
                    $faceList.append($(faceItemTemplate({ faceList: faceList })));
                    var elems: any = $faceList.children();
                    for (let i = 0, l = elems.length; i < l; i++) {
                        this._renderFace($(elems[i]));
                    }
                    this._calculateFaceListWidth();
                } else {//リモコン数が0のとき導入画面を表示。
                    console.log("numRemotes : " + numRemotes);
                    //導入画面は初期状態は非表示なのでここで表示する。
                    this._renderIntroduction();
                }

				//テキストのローカライズ
				$("header h3").html($.i18n.t("home.STR_HOME_TITLE"));
				$("#create-new-remote").attr("title", $.i18n.t("tooltip.STR_TOOLTIP_NEW_REMOTE"));
				
			}


            /*
            *　導入画面をレンダリング
            */

            private _renderIntroduction() {
                var STR_HOME_INTRODUCTION_TEXT_1: string = $.i18n.t("home.STR_HOME_INTRODUCTION_1");
                var STR_HOME_INTRODUCTION_TEXT_2: string = $.i18n.t("home.STR_HOME_INTRODUCTION_2");
                var STR_HOME_INTRODUCTION_TEXT_3: string = $.i18n.t("home.STR_HOME_INTRODUCTION_3");

                var $indtroductionHome = $("#home-introductions");
                $indtroductionHome.css("visibility", "visible");
                $indtroductionHome.find("#home-introduction-text-1").html(STR_HOME_INTRODUCTION_TEXT_1);
                $indtroductionHome.find("#home-introduction-text-2").html(STR_HOME_INTRODUCTION_TEXT_2);
                $indtroductionHome.find("#home-introduction-text-3").html(STR_HOME_INTRODUCTION_TEXT_3);
          }


			private _renderFace($face: JQuery): void {
				var remoteId = $face.attr("data-remoteId");
				if (!remoteId) {
					return;
				}
				var face: IGFace = huisFiles.getFace(remoteId);
				var faceRenderer: FaceRenderer = new FaceRenderer({
					el: $face.find(".face-container"),
					attributes: {
						face: face,
						materialsRootPath: HUIS_FILES_ROOT
					}
				});
                faceRenderer.render();

                $face.find(".face-container").on("click", (event) => {
					let $clickedFace = $(event.currentTarget);
                    let remoteId = $clickedFace.data("remoteid");
 					if (remoteId) {
						Framework.Router.navigate("#full-custom?remoteId=" + remoteId);
					}
                });
                //// シングルクリックしたら「選択状態」になる
                //$face.find(".face-container").on("click", (event) => {
                //    let $clickedFace = $(event.currentTarget);
                //    this.selectedRemoteId = $clickedFace.data("remoteid");
                //    this._fringeFaceList();
                //});
            }

            /**
            * this.selectedRemoteIdで選択されているRemoteに縁をつけ、選択中であることを示す
            */
            //private _fringeFaceList() {
            //    var templateFile = Framework.toUrl("/templates/home.html");
            //    var faceItemTemplate = Tools.Template.getJST("#face-list-template", templateFile);
            //    var $faceList = $("#face-list");

            //    var elems: any = $faceList.children();
            //    for (let i = 0, l = elems.length; i < l; i++) {
            //        var remoteId = $(elems[i]).attr("data-remoteId");
            //        if (remoteId === this.selectedRemoteId) {
            //            $(elems[i]).find(".face-container").css("border", "10px solid rgb(10,10,10)"); // 縁をつける(仮)
            //        } else {
            //            $(elems[i]).find(".face-container").css("border", "1px solid rgb(221,221,221)");
            //        }
            //    }
            //}

			private _onCreateNewRemote() {
				let canCreateResult = huisFiles.canCreateNewRemote();
				if (canCreateResult == 0) {
					Framework.Router.navigate("#full-custom");
				} else if (canCreateResult == -2) {
					electronDialog.showMessageBox({
						type: "error",
						message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ERROR_NO_REMOTE_IN_HUIS"),
						buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
						title: PRODUCT_NAME,
					});
				} else if (canCreateResult == -1) {
					electronDialog.showMessageBox({
						type: "error",
						message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_LIMIT_1") + MAX_HUIS_FILES + $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_LIMIT_2"),
						buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
						title: PRODUCT_NAME,
					});
				} else {
					console.warn("no alert dialog in _onCreateNewRemote()");
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
						cancelId:1,
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
				this.rightClickPosition_ = {
					x: event.pageX,
					y: event.pageY
				};

				// コンテキストメニューを作成する
				this.contextMenu_.clear();
				this.contextMenu_.items = [];

				var element = document.elementFromPoint(event.pageX, event.pageY);
				var $face = $(element).parents("#face-list .face");
				if ($face.length) {
					this.remoteIdToDelete = $face.data("remoteid");
                    if (this.remoteIdToDelete) {
						this.contextMenu_.append(new MenuItem({
                            label: $.i18n.t("context_menu.STR_CONTEXT_DELETE_REMOTE"),
                            click: () => {
                                var response = electronDialog.showMessageBox({
                                    type: "warning",
                                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_DELETE_REMOTE"),
                                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_DELETE"), $.i18n.t("dialog.button.STR_DIALOG_BUTTON_CANCEL")],
									title: PRODUCT_NAME,
									cancelId:1,
                                });
                                if (response === 0) {
                                    //this._removeFace(remoteId);
                                    //this._renderFaceList();
                                    this._onSyncPcToHuisClick(true); // true で警告なし
                               }
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

				//var faceHistoryListContainerHeight = 200; // tentative
                var faceHistoryListContainerHeight = 0; // ヒストリー表示がなくなったので、暫定的にサイズ 0
                var scrollHeight = windowHeight - $(window).outerHeight(true);
                var faceListContainerHeight = innerHeight - $("#face-list-container").offset().top - faceHistoryListContainerHeight - scrollHeight;
				//if (faceListContainerHeight < 200) {s
				//	faceListContainerHeight = 200;
				//}
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

            //private _onKeyDown(event: JQueryEventObject) {
            //    console.log("_onKeyDown : " + event.keyCode);

            //    switch (event.keyCode) {
            //        case 8: // BS
            //        case 46: // DEL
            //            if (this.selectedRemoteId) {
            //                var response = electronDialog.showMessageBox({
            //                    type: "info",
            //                    message: "リモコンを削除すると元に戻せません。削除しますか？",
            //                    buttons: ["yes", "no"]
            //                });
            //                if (response === 0) {
            //                    this._removeFace(this.selectedRemoteId);
            //                    this._renderFaceList();
            //                }
            //            }
            //            break;
            //        default:
            //            break;
            //    }
            //}
		}

		var View = new Home();
	}
}