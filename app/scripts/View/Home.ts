/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />
/// <reference path="BasePage.ts" />

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
				$(window).off("resize", this._pageLayout);
				let $faceContainer = $(".face-container");
				$faceContainer.off("click");

				super.onPageBeforeHide(event, data);
			}

			//! events binding
            events(): any {
                var ret:any = {};
                ret = super.events();
				return $.extend(ret,{
					"dblclick header .ui-title": "_onHeaderDblClick",
					"click #create-new-remote": "_onCreateNewRemote",
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

				$(window).on("resize", this._pageLayout);

				this.currentWindow_ = Remote.getCurrentWindow();
				// コンテキストメニュー
                this.contextMenu_ = new Menu();
			}

            /**
			 * face リストのレンダリング
             * リモコンを削除した際にも呼び出してください。 
			 */
			private _renderFaceList() {
				var templateFile = Framework.toUrl("/templates/home.html");
				var faceItemTemplate = Tools.Template.getJST("#face-list-template", templateFile);

				// HuisFiles から フルカスタムの face を取得。
				// face は新しいものから表示するため、取得した facelist を逆順にする。
				var faces = huisFiles.getFilteredFacesByCategories({ matchingCategories: ["fullcustom"] }).reverse();
				var faceList: { remoteId: string, name: string }[] = [];
				faces.forEach((face: IGFace) => {
					faceList.push({
						remoteId: face.remoteId,
						name: face.name
					});
                });

                var numRemotes:number = faces.length;//ホームに出現するリモコン数

                if (numRemotes !== 0) {//リモコン数が0ではないとき、通常通り表示
                    var $faceList = $("#face-list")
                    $faceList.find(".face").empty(); // 当初_renderFaceListは$faceListに要素がないことが前提で作成されていたためこの行を追加、ないとリモコンがダブって表示される
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

				
			}


            /*
            *　導入画面をレンダリング
            */

            private _renderIntroduction() {
                var STR_HOME_INTRODUCTION_TEXT_1: string = "HUISを";
                var STR_HOME_INTRODUCTION_TEXT_2: string = "あなた好み";
                var STR_HOME_INTRODUCTION_TEXT_3: string = "のデザインに。<br>フルカスタムリモコンを作成しましょう。";

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

			private _onHeaderDblClick() {
				var currentWindow = Remote.getCurrentWindow();
				if (currentWindow.isDevToolsOpened()) {
					Framework.Router.navigate("#face-render-experiment");
				} else {
					currentWindow.toggleDevTools();
				}
			}

			private _onCreateNewRemote() {
				if (huisFiles.canCreateNewRemote()) {
					Framework.Router.navigate("#full-custom");
				} else {
					electronDialog.showMessageBox({
						type: "error",
						message: "リモコンの上限数に達しているため、リモコンを作成できません。\n"
						+ "リモコンの上限数は " + MAX_HUIS_FILES + " です。\n"
						+ "これは機器リモコンやカスタムリモコン等を含めた数です。",
						buttons: ["ok"]
					});
				}
			}

            private _onSyncPcToHuisClick(noWarn?: Boolean) {
                if (!noWarn) {
                    let response = electronDialog.showMessageBox({
                        type: "info",
                        message: "変更内容を HUIS に反映しますか？\n"
                        + "最初に接続した HUIS と異なる HUIS を接続している場合、\n"
                        + "HUIS 内のコンテンツが上書きされますので、ご注意ください。",
                        buttons: ["yes", "no"]
                    });
                    if (response !== 0) {
                        huisFiles.updateRemoteList(); // HUIS更新せずにRemoteList更新
                        return;
                    }
                }

				//huisFiles.updateRemoteList();
				if (HUIS_ROOT_PATH) {
					let syncTask = new Util.HuisDev.FileSyncTask();
                    syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, true, DIALOG_PROPS_DELTE_REMOTE, () => {
                        this._removeFace(this.remoteIdToDelete);
                        this._renderFaceList();
                    }, (err) => {
						if (err) {
							// [TODO] エラー値のハンドリング
							electronDialog.showMessageBox({
								type: "error",
								message: "HUIS と同期できませんでした。\n"
								+ "HUIS が PC と接続されていない可能性があります。\n"
								+ "HUIS が PC に接続されていることを確認して、再度同期をお試しください。",
								buttons: ["ok"]
							});
						} else {
							//CDP.UI.Toast.show("HUIS との同期が完了しました。");
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

				var element = document.elementFromPoint(event.pageX, event.pageY);
				var $face = $(element).parents("#face-list .face");
				if ($face.length) {
					this.remoteIdToDelete = $face.data("remoteid");
                    if (this.remoteIdToDelete) {
						this.contextMenu_.append(new MenuItem({
                            label: "このリモコン (" + this.remoteIdToDelete + ") を削除",
                            click: () => {
                                var response = electronDialog.showMessageBox({
                                    type: "info",
                                    message: "リモコンを削除すると元に戻せません。削除しますか？",
                                    buttons: ["yes", "no"]
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
                        label: "要素を検証",
                        click: () => {
                            this.currentWindow_.inspectElement(this.rightClickPosition_.x, this.rightClickPosition_.y);
                        }
                    }));
                }

				this.contextMenu_.popup(this.currentWindow_);
			}

			private _pageLayout() {
				var windowWidth = innerWidth;
				var windowHeight = innerHeight;

				//var faceHistoryListContainerHeight = 200; // tentative
                var faceHistoryListContainerHeight = 0; // ヒストリー表示がなくなったので、暫定的にサイズ 0
                var scrollHeight = windowHeight - $(window).outerHeight(true);
                var faceListContainerHeight = innerHeight - $("#face-list-container").offset().top - faceHistoryListContainerHeight - scrollHeight;
				//if (faceListContainerHeight < 200) {s
				//	faceListContainerHeight = 200;
				//}
			    $("#face-list").css("height", faceListContainerHeight + "px");
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

			private _removeFace(remoteId: string) {
                huisFiles.removeFace(remoteId);
                huisFiles.updateRemoteList()
                huisFiles.init(HUIS_FILES_ROOT);
				$(".face[data-remoteid=" + remoteId + "]").remove();
				this._calculateFaceListWidth();
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