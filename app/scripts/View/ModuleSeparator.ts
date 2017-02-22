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

                let moduleSeparatorModel = new Model.ModuleSeparator(this.moduleName_);
                let $moduleSeparator = $(this.template_(moduleSeparatorModel));
                this.$el.append($moduleSeparator);
                return this;
            }
        }
    }
}
