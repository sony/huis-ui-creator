/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import JQUtils = Util.JQueryUtils;
        var TAG = "[Garage.View.ModuleSeparator] ";

        // const values


        // may extends Backbone.View in future
        export class ModuleSeparator extends Backbone.View<Model.ModuleSeparator> {

            private template_;
            private moduleName_;

            /**
              * constructor
              */
            constructor(moduleName: string, options?: Backbone.ViewOptions<Model.ModuleSeparator>) {
                super(options);
                let templateFile = CDP.Framework.toUrl("/templates/face-items.html");
                this.template_ = Tools.Template.getJST("#template-module-separator", templateFile);
                this.moduleName_ = moduleName;
            }

            render(): ModuleSeparator {

                let moduleSeparatorModel = new Model.ModuleSeparator({
                    text: this.moduleName_,
                });
                let $moduleSeparator = $(this.template_(moduleSeparatorModel));
                this.$el.append($moduleSeparator);
                return this;
            }
        }
    }
}
