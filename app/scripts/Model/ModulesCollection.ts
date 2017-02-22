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
/// <reference path="Module.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.ModulesCollection] ";

        /**
         * @class ModuleCollection
         * @brief ModuleItem のコレクションオブジェクト
         */
        export class ModulesCollection extends Backbone.Collection<Module> {
            // Backbone.Collection に対象の Model の型を与える
            model = Module;
            private facePageWidth: number = 0;
            private facePageHeight: number = 0;

            constructor(models?: Module[], options?: any) {
                super(models, options);
            }

            initialize(models?: Module[], options?: any) {
                if (options && options.facePageHeight) {
                    this.facePageHeight = options.facePageHeight;
                }

                this.modufyModules(models,this.facePageHeight);
            }

            /**
             * face のページ数を取得する
             * 
             * @return {number} ページ数
             */
            getPageCount(): number {
                var maxPageIndex = -1;
                for (let i = 0, l = this.models.length; i < l; i++) {
                    if (maxPageIndex < this.models[i].pageIndex) {
                        maxPageIndex = this.models[i].pageIndex;
                    }
                }
                return maxPageIndex + 1;
            }

            /**
             * モジュールの値を1ページ分にfitするようにpageIndedとoffsetYを補正する。
             * @param modules{Module[]} 追加したmoduleの塊。
             * @param facePageHeight{number} 1ページ分の高さ
             * @param inifialPageIndex?{number} 追加前のページインデックス
             */
            modufyModules(models: Module[], facePageHeight:number, inifialPageIndex? : number) {

                let offsetY = 0
                let pageIndex = 0;
                if (inifialPageIndex != null) {
                    pageIndex = inifialPageIndex;
                }
          
                for (var i = 0, l = models.length; i < l; i++) {
                    let model = models[i];
                    let height = model.area.h;
                    if (0 < facePageHeight) {
                        if (facePageHeight < offsetY + height) {
                            offsetY = 0;
                            pageIndex++;
                        }
                    }
                    model.set("offsetY", offsetY);
                    model.set("pageIndex", pageIndex);

                    offsetY += height;
                }
            }

            /**
             * モジュールを新規に追加する。
             * @param modules{Module[]} 追加したmoduleの塊。
             * @param facePageHeight{number} 1ページ分の高さ
             */
            addModules(models: Module[], facePageHeight: number) {
                let pageCount= this.getPageCount();
                this.modufyModules(models, facePageHeight, pageCount);
                super.add(models);
            }



        }
    }
}