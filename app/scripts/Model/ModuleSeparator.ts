/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.LabelItem] ";

        const HORIZONTAL_LINE_IMAGE_PATH: string = "/res/images/divider_pickup_custom.png";

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
                let miscUtil = new Garage.Util.MiscUtil();
                this._copyImageFile(image, miscUtil.getAppropriatePath(CDP.Framework.toUrl(HORIZONTAL_LINE_IMAGE_PATH), true), image.resolvedPath);
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
                if(path && fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
                    Model.OffscreenEditor.editImage(srcPath, IMAGE_EDIT_PARAMS, dstPath).done((editedImage) => {
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
                newLabel.size = MODULE_SEPARATOR_LABEL_FONT_SIZE;
                newLabel.font_weight = MODULE_SEPARATOR_LABEL_FONT_WEIGHT;

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
