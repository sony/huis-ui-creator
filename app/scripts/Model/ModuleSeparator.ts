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
    export module Model {
        var TAG = "[Garage.Model.LabelItem] ";

        const HORIZONTAL_LINE_IMAGE_PATH: string = HUIS_REMOTEIMAGES_ROOT + "/divider_pickup_custom.png";

        const MODULE_SEPARATOR_LABEL_FONT_SIZE = 18;
        const MODULE_SEPARATOR_LABEL_FONT_WEIGHT = "normal";

        export class ModuleSeparator extends Backbone.Model {

            constructor(text: string, attributes?: any) {
                super(attributes, null);
                this.text = text;
            }

            /*
             * このModuleSeparatorを引数で渡されたModuleに追加する。
             * ModuleSeparatorを追加する際は、名前を表すTextItemと
             * 区切り線を示す点線のImageItemの二つを新規に作成して、それを追加する。
             * @param module: Model.Module 挿入する対象となるModule
             */
            public insertTo(module: Model.Module) {
                let label = this.itemizeLabel();
                if (module.label == null) {
                    module.label = [];
                }
                module.label.push(label);

                let image = this.itemizeHorizontalLine(module.remoteId);
                this._copyImageFile(image, Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl(HORIZONTAL_LINE_IMAGE_PATH), true), image.resolvedPath);
                image.path = module.remoteId + "/" + path.basename(Model.OffscreenEditor.getEncodedPath(path.basename(image.resolvedPath)));

                if (module.image == null) {
                    module.image = [];
                }
                module.image.push(image);
            }

            /*
             * srcPathからdstPathに画像ファイルをコピーする。
             * コピーされた画像ファイル名はhash化されたものとなり、
             * コピー後、imageItemにコピー先のpathを設定する。
             */
            private _copyImageFile(imageItem: Model.ImageItem, srcPath: string, dstPath: string) {
                if (path && fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
                    Model.OffscreenEditor.editImage(srcPath, IMAGE_EDIT_PARAMS, dstPath).done((editedImage) => {
                        imageItem.path = editedImage.path;
                    });
                }
            }

            private itemizeHorizontalLine(remoteId: string): Model.ImageItem {

                let horizontalLineArea = {
                    x: BIAS_X_DEFAULT_GRID_LEFT,
                    y: 0,
                    w: GRID_AREA_WIDTH,
                    h: DEFAULT_GRID
                };
                let horizontalLineSrcPath = path.basename(HORIZONTAL_LINE_IMAGE_PATH);

                var horizontalLineImage = new Model.ImageItem({
                    area: horizontalLineArea,
                    path: horizontalLineSrcPath
                });

                return horizontalLineImage;
            }

            private itemizeLabel(): Model.LabelItem {
                let iLabel = {
                    size: MODULE_SEPARATOR_LABEL_FONT_SIZE,
                    area: {
                        x: BIAS_X_DEFAULT_GRID_LEFT,
                        y: 0,
                        w: GRID_AREA_WIDTH,
                        h: DEFAULT_GRID
                    },
                    font_weight: MODULE_SEPARATOR_LABEL_FONT_WEIGHT,
                    text: this.text
                }
                let newLabel = new Model.LabelItem(iLabel);

                return newLabel;
            }

            /**
             * getters and setters
             */
            get text(): string {
                return this.get("text");
            }

            set text(val: string) {
                this.set("text", val);
            }


            /**
             * 変更可能なプロパティーの一覧
             */
            get properties(): string[] {
                return ["text"];
            }

            /**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {
                return {
                    text: "",
                };
            }

        }
    }
}
