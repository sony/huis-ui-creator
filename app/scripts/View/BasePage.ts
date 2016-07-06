/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />

module Garage {
    export module View {

        import Framework = CDP.Framework;
        import Tools = CDP.Tools;
        import UI = CDP.UI;
		import Dialog = CDP.UI.Dialog;
		import DialogOptions = CDP.UI.DialogOptions;


		/**
		 * @class StyleBuilderDefault
		 * @brief スタイル変更時に使用する既定の構造体オブジェクト
		 */
		class StyleBuilderDefault implements UI.Toast.StyleBuilder {

			//! class attribute に設定する文字列を取得
			getClass(): string {
				return "ui-loader ui-overlay-shadow ui-corner-all ui-body-b";
			}

			//! style attribute に設定する JSON オブジェクトを取得
			getStyle(): any {
				let style = {
					"display": "block",
					"opacity": 1
				};
				return style;
			}

			//! オフセットの基準位置を取得
			getOffsetPoint(): number {
				//! @enum オフセットの基準
				enum OffsetX {
					LEFT = 0x0001,
					RIGHT = 0x0002,
					CENTER = 0x0004,
				}

				//! @enum オフセットの基準
				enum OffsetY {
					TOP = 0x0010,
					BOTTOM = 0x0020,
					CENTER = 0x0040,
				}

				return OffsetX.CENTER | OffsetY.TOP;
			}

			//! X 座標のオフセット値を取得
			getOffsetX(): number {
				return 0;
			}

			//! Y 座標のオフセット値を取得
			getOffsetY(): number {
				return 87;
			}
		}

        /**
         * @class Home
         * @brief Home View class for Garage.
        */
        export class BasePage extends UI.PageView<Backbone.Model> {

			protected currentWindow_: any;
            protected contextMenu_: any;
            protected rightClickPosition_: { x: number; y: number };

            constructor(html, name, options) {
                super(html, name, options);
            }

            onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
				// Drag and Dropで反応するのを抑制する
				document.addEventListener('dragover', function (event) {
					event.preventDefault();
					return false;
				}, false);

				document.addEventListener('drop', function (event) {
					event.preventDefault();
					return false;
				}, false);

            }

            events(): any {  // 共通のイベント
                return {
                    // プルダウンメニューのリスト
                    "vclick #command-about-this": "_onCommandAboutThis",
                    "vclick #command-visit-help": "_onCommandVisitHelp",
                };
            }

            // ドロップダウンメニューから起動される共通の関数
            private _onCommandAboutThis() {
				var dialog: Dialog = null;
				var props: DialogProps = null;
				var text: string = null;

				text = fs.readFileSync('./sample.txt', 'utf8');

				
				dialog = new CDP.UI.Dialog("#common-dialog-about", {
					src: CDP.Framework.toUrl("/templates/dialogs.html"),
					title: "HUIS UI CREATOR のバージョン情報",
					message: text,
					dismissible: true,
				});
				//dialog.show().css('overflow-y', 'scroll').css('word-wrap', 'brake-word').css('color', 'red');
				dialog.show();
				
				$("#about-version-number").html(APP_VERSION);

                return;
}

            private _onCommandVisitHelp() {
                var shell = require('electron').shell;
                shell.openExternal(HELP_SITE_URL);
                return;
            }

			/*
			* //tooltipを中央揃えにする。
			* @param $target : JQuery toolTipで説明されるDOMのJQuery要素
			*/
			protected centeringTooltip($target: JQuery) {
				//tooltipを中央揃えにする。
				var $tooltip = $target.find(".tooltip-text");
				var widthButton = $target.width();
				var widthToolTip = $tooltip.outerWidth(true);
				var centeredLeft = (widthButton - widthToolTip) / 2;
				$tooltip.css("left", centeredLeft + "px");
				this.deterOverWindow($tooltip);
			}

			/*
			* 画面からはみだる場合、端にそろえる
			* @param $target:JQuery これから表示するJQuery要素
			*/
			protected deterOverWindow($target: JQuery) {
				var left = $target.offset().left;
				var width = $target.outerWidth(true);

				if (left + width > innerWidth) {//windowからはみ出るとき
					var tmpObj = {
						top: $target.offset().top,
						left: innerWidth - width,
					}
					$target.offset(tmpObj);
				}

			}

            /*
             * プルダウンメニュー対応
             */

            private _onOptionPullDownMenuClick() {
                var $overflow = this.$page.find("#option-pulldown-menu-popup"); // ポップアップのjQuery DOMを取得
                var $button1 = this.$page.find("#option-pulldown-menu");
                var $header = this.$page.find("header");

                var options: PopupOptions = {
                    x: $button1.offset().left,
                    y: 0,
                    tolerance: $header.height() + ",0",
                    corners: false
                };

                console.log("options.x options.y : " + options.x + ", " + options.y);

                $overflow.popup(options).popup("open").on("vclick", () => {
                    $overflow.popup("close");
                });

                return;
            }


			/*
             * Garageのデザインで、Toastを標示する。
             */
			protected showGarageToast(message: string) {
				var FUNCTION_NAME ="BasePage.ts : showGarageToast : ";
				if (_.isUndefined(message)) {
					console.log(FUNCTION_NAME + "message is undefined");
				}

				var style : UI.Toast.StyleBuilderDefault = new StyleBuilderDefault();
				UI.Toast.show(message, 1500, style);
			}


        }
    }
}