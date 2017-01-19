/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.LabelItem] ";

        const HORIZONTAL_LINE_IMAGE_PATH: string = "/res/images/divider_pickup_custom.png";

        export class ModuleSeparator extends Backbone.Model {

            constructor(text: string, attributes?: any) {
                super(attributes, null);
                this.text = text;
            }

            public insertTo(module: Model.Module) {
                let label = this.itemizeLabel();
                if (module.label == null) {
                    module.label = [];
                }
                module.label.push(label);

                let image = this.itemizeHorizontalLine(module.remoteId);
                let miscUtil = new Garage.Util.MiscUtil();
                this._copyImageFile(image, miscUtil.getAppropriatePath(CDP.Framework.toUrl(HORIZONTAL_LINE_IMAGE_PATH), true), image.resolvedPath);
                image.path = module.remoteId + "/" + path.basename(Model.OffscreenEditor.getEncodedPath(path.basename(image.resolvedPath)));

                if (module.image == null) {
                    module.image = [];
                }
                module.image.push(image);
            }

            private _copyImageFile(imageItem: Model.ImageItem, srcPath: string, dstPath: string) {
                // 有効な画像パスが指定されており、出力先のパスに画像が存在しない場合、グレースケール化してコピーする
                if(path && fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
                    Model.OffscreenEditor.editImage(srcPath, IMAGE_EDIT_PARAMS, dstPath).done((editedImage) => {
                        console.log(editedImage.path);
                        imageItem.path = editedImage.path;
                    });
                }
            }

            private itemizeHorizontalLine(remoteId: string): Model.ImageItem {

                // 新しい model を追加する
                var horizontalLineImage = new Model.ImageItem({
                    materialsRootPath: HUIS_FILES_ROOT,
                    remoteId: remoteId
                });

                var newArea: IArea;
                var srcImagePath: string;
                newArea = {
                    x: BIAS_X_DEFAULT_GRID_LEFT,
                    y: 0,
                    w: GRID_AREA_WIDTH,
                    h: DEFAULT_GRID
                };
                horizontalLineImage.area = newArea;
                horizontalLineImage.path = remoteId + "/" + path.basename(HORIZONTAL_LINE_IMAGE_PATH);

                return horizontalLineImage;
            }

            private itemizeLabel(): Model.LabelItem {
                let newLabel = new Model.LabelItem();
                let $moduleSeparator = $(".module-separator");
                newLabel.size = parseInt($moduleSeparator.css("font-size"), 10);
                newLabel.font_weight = $moduleSeparator.css("font_weight");

                newLabel.area.x = BIAS_X_DEFAULT_GRID_LEFT;
                newLabel.area.y = 0;
                newLabel.area.w = GRID_AREA_WIDTH;
                newLabel.area.h = DEFAULT_GRID;

                newLabel.text = this.text;

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
