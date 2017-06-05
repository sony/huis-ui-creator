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

module Garage {
    export module View {


        var TAG: string = "[Garage.View.VersionDialog] ";

        export class VersionDialog extends Backbone.View<Model.VersionDialog> {

            constructor(options?: Backbone.ViewOptions<Model.VersionDialog>) {
                super(options);
            }

            events(): any {
                return {
                    "click #dialog-about-button-ok": "close",
                    "click a": "openLink"
                };
            }

            initialize() {
                this.render();
            }

            render(): VersionDialog {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = CDP.Tools.Template.getJST("#dialog-about", templateFile);

                let text = "";
                try {
                    let licenseLinkFilePath = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/license/license-link.html"));
                    text = fs.readFileSync(licenseLinkFilePath, 'utf8');
                } catch (err) {
                    console.error(err);
                }

                let $dialog = $(jst({
                    title: $.i18n.t("app.name") + $.i18n.t("about.STR_ABOUT_TITLE"),
                    message: text,
                }));


                this.$el.append($dialog);

                this.$el.children('#about-dialog-back').trigger('create');

                return this;
            }

            close(event: Event) {
                this.undelegateEvents();

                let dom = this.$el.find('#about-dialog-back');
                dom.remove();
            }

            openLink(event: Event) {
                let anchor = $(event.currentTarget);
                let href = Util.MiscUtil.getAppropriatePath(anchor.prop('href'));
                console.log(TAG + ' open link: ' + href);

                var shell = require('electron').shell;
                shell.openItem(href);

                event.stopPropagation();
                event.preventDefault();
            }
        }


    }
}
