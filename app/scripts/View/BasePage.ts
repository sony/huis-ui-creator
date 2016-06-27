/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />

module Garage {
    export module View {

        import Framework = CDP.Framework;
        import Tools = CDP.Tools;
        import UI = CDP.UI;
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
                var options: Util.ElectronMessageBoxOptions = {
                    type: "info",
                    message: "HUIS UI Creator (c) 2016 Sony Corporation",
                    buttons: [
                        "OK"
                    ],
                };
                electronDialog.showMessageBox(options);
                return;
}

            private _onCommandVisitHelp() {
                var shell = require('electron').shell;
                shell.openExternal(HELP_SITE_URL);
                return;
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

        }
    }
}