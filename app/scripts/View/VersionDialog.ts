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
                    text = fs.readFileSync('license-link.html', 'utf8');
                } catch (err) {
                    console.error(err);
                }

                let $dialog = $(jst({
                    title: $.i18n.t("app.name") + $.i18n.t("about.STR_ABOUT_TITLE"),
                    message: text,
                }));


                this.$el.append($dialog);

                this.$el.trigger('create');

                return this;
            }

            close(event: Event) {
                this.undelegateEvents();

                let dom = this.$el.find('#about-dialog-back');
                dom.remove();
            }

            openLink(event: Event) {
                let anchor = $(event.currentTarget);
                let href = miscUtil.getAppropriatePath(anchor.prop('href'));
                console.log(TAG + ' open link: ' + href);

                var shell = require('electron').shell;
                shell.openItem(href);

                event.stopPropagation();
                event.preventDefault();
            }
        }


    }
}
