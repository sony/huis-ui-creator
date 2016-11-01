/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module View {
		import Tools = CDP.Tools;

		var TAG = "[Garage.View.FaceRenderer] ";

		export class FaceRenderer extends Backbone.View<any> {


			private face_: IGFace;
			private moduleView_: Module;
            private type_: string;
            private $facePlane_ : JQuery; //描画のベースとなるfacePagesArea

			//private template_: Tools.JST;
			/**
			 * constructor
			 */
			constructor(options?: Backbone.ViewOptions<any>) {
				super(options);
			}

			events() {
				// Please add events
				return {
				};
			}

			initialize(options?: Backbone.ViewOptions<any>) {
				this.face_ = options.attributes["face"];
				// face が未指定の場合は新規作成
				if (!this.face_) {
					let remoteId = options.attributes["remoteId"] ? options.attributes["remoteId"] : "9998";
					this.face_ = {
						name: "New Remote",
						remoteId: remoteId,
						category: "fullcustom",
						modules: [{
							offsetY: 0,
							pageIndex: 0,
							remoteId: remoteId,
							area: {
								x: 0,
								y: 0,
								w: HUIS_FACE_PAGE_WIDTH,
								h: HUIS_FACE_PAGE_HEIGHT
							},
							name: remoteId + "_page_0" // 暫定
						}]
					};
                }
                this.$facePlane_ = null;
				this.type_ = options.attributes["type"];
			}

			render(): FaceRenderer {
				// face の用途によってレンダリングの仕方を変える
				switch (this.type_) {
					case "canvas":
						this._renderToCanvas();
						break;

					default:
						this._renderAsPlain();
						break;
				}

				return this;
            }

            /*
            * すでに描画されているFaceに追加で描画する
            */
            addFace(inputFace: IGFace) {
                let FUNCTION_NAME = TAG + "addFace : ";
                switch (this.type_) {
                    case "canvas":
                        console.warn(FUNCTION_NAME + "canvas is not support");
                        break;

                    default:
                        this.addFaceAsPlain(inputFace);
                        break;
                }
            }


            /*
            * すでに描画されているFaceに追加で描画する。Canvas以外用。
            */
            private addFaceAsPlain(inputFace: IGFace) {
                let FUNCTION_NAME = TAG + "addFaceAsPlain : ";
               
                if (this.$facePlane_ == null) {
                    var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
                    var template: Tools.JST = Tools.Template.getJST("#template-face-plain", templateFile);
                    this.$facePlane_ = $(template());
                }

                this.moduleView_.addModuleInNewFacePages(inputFace.modules);

           
                this.$el.append(this.$facePlane_);

            }


			/**
			 * face 内のページ数を取得する。
			 * 
			 * @return {number} face 内のページ数。
			 */
			getPageCount(): number {
				return this.moduleView_.getPageCount();
			}

			/**
			 * モジュール (ページ) を追加する。
			 * 
			 * @return {boolean} true: 成功, false: 失敗
			 */
			addPage(): boolean {
				let result = this.moduleView_.addPage();

				// ページ数を更新
				let pageCount = this.getPageCount();
				if (pageCount) {
					$("#page-total").text(pageCount);
				}
				return result;
			}

			/**
			 * モジュール (ページ) を削除する。
			 * 
			 * @pageIndex {number} 削除するページの index
			 * @return {boolean} true: 成功, false: 失敗
			 */
			deletePage(pageIndex: number): boolean {
				let result = this.moduleView_.deletePage(pageIndex);

				// ページ数を更新
				let pageCount = this.getPageCount();
				if (pageCount) {
					$("#page-total").text(pageCount);
				}
				return result;
			}

			/**
			 * ボタンを取得する。
			 * 
			 * @param moduleId {string} [in] ボタンを検索する module の ID
			 * @param buttonId {string} [in] 検索するボタンの ID
			 * @return {Model.ButtonItem} 見つかったボタンの Model。見つからない場合は null。
			 */
			getButton(moduleId: string, buttonId: string): Model.ButtonItem {
				return this.moduleView_.getButton(moduleId, buttonId);
			}

			/**
			 * module 内のすべてのボタンを取得する。
			 * 
			 * @param moduleId {string} [in] ボタンを取得する module の ID
			 * @return {Model.ButtonItem[]} module 内のすべてのボタンの Model。見つからない場合は null。
			 */
			getButtons(moduleId: string): Model.ButtonItem[] {
				return this.moduleView_.getButtons(moduleId);
			}

			/**
			 * ボタンを追加する。
			 * 
			 * @param button {Model.ButtonItem} [in] 追加するボタンの model
			 * @param moduleId {string} [in] ボタンの追加先となる module の ID
			 * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
			 * @return {Model.ButtonItem} 新しく作成された model
			 */
            addButton(button: Model.ButtonItem, moduleId: string, offsetY?: number): Model.ButtonItem {
                return this.moduleView_.addButton(button, moduleId, offsetY);
			}

			/**
			 * ボタンを削除する。
			 * 
			 * @param button {Model.ButtonItem} [in] 削除するボタンの model
			 * @param moduleId {string} [in] 削除するボタンが存在する module の ID
			 */
			deleteButton(button: Model.ButtonItem, moduleId: string) {
				this.moduleView_.deleteButton(button, moduleId);
			}

			/**
			 * 画像アイテムを取得する。
			 * 
			 * @param moduleId {string} [in] 画像アイテムを検索する module の ID
			 * @param imageId {string} [in] 検索する画像アイテムの ID
			 * @return {Model.ImageItem} 見つかった画像アイテムの Model。見つからない場合は null。
			 */
			getImage(moduleId: string, imageId: string): Model.ImageItem {
				return this.moduleView_.getImage(moduleId, imageId);
			}

			/**
			 * 画像アイテムを追加する。
			 * 
			 * @param image {Model.ImageItem} [in] 追加する画像アイテムの model
			 * @param image {string} [in] 追加する画像アイテムのパス。パスを指定した場合は、ページの背景として追加される。
			 * @param moduleId {string} [in] 画像アイテムの追加先となる module の ID
			 * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
			 * @return {Model.ImageItem} 新しく作成された model
			 */
			addImage(image: Model.ImageItem, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem
			addImage(image: string, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem
			addImage(image: any, moduleId: string, offsetY?: number, callback?: Function): Model.ImageItem {
				return this.moduleView_.addImage(image, moduleId, offsetY, callback);
			}

            /**
             * 画像アイテムを追加する。画像のコピーは発生しない。
             * @param image {Model.ImageItem} [in] 追加する画像アイテムの model
			 * @param image {string} [in] 追加する画像アイテムのパス。パスを指定した場合は、ページの背景として追加される。
			 * @param moduleId {string} [in] 画像アイテムの追加先となる module の ID
			 * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
			 * @return {Model.ImageItem} 新しく作成された model
			 */
            addImageWithoutCopy(image: Model.ImageItem, moduleId: string, offsetY: number) {
                return this.moduleView_.addImageWithoutCopy(image, moduleId, offsetY);
            }

			/**
			 * 画像アイテムを削除する。
			 * 
			 * @param image {Model.ImageItem} [in] 削除する画像アイテムの model
			 * @param moduleId {string} [in] 削除する画像アイテムが存在する module の ID
			 */
			deleteImage(image: Model.ImageItem, moduleId: string) {
				this.moduleView_.deleteImage(image, moduleId);
			}

			/**
			 * ラベルを取得する。
			 * 
			 * @param moduleId {string} [in] ラベルを検索する module の ID
			 * @param labelId {string} [in] 検索するラベルの ID
			 * @return {Model.LabelItem} 見つかったラベルの Model。見つからない場合は null。
			 */
			getLabel(moduleId: string, labelId: string): Model.LabelItem {
				return this.moduleView_.getLabel(moduleId, labelId);
			}

			/**
			 * ラベルを追加する。
			 * 
			 * @param label {Model.LabelItem} [in] 追加するラベルの model
			 * @param moduleId {string} [in] ラベルの追加先となる module の ID
			 * @param offsetY {number} [in] module の y 座標の offset。ここでは、各ページの先頭からの offset を指す。
			 * @return {Model.LabelItem} 新しく作成された model
			 */
			addLabel(label: Model.LabelItem, moduleId: string, offsetY?: number): Model.LabelItem {
				return this.moduleView_.addLabel(label, moduleId, offsetY);
			}



			/**
			 * ラベルを削除する。
			 * 
			 * @param label {Model.LabelItem} [in] 削除するラベルの model
			 * @param moduleId {string} [in] 削除するラベルが存在する module の ID
			 */
			deleteLabel(label: Model.LabelItem, moduleId: string) {
				this.moduleView_.deleteLabel(label, moduleId);
			}

			/**
			 * FaceRenderer が持っている face の remoteId を取得する
			 * 
			 * @return {string} remoteId
			 */
			getRemoteId(): string {
				if (!this.face_) {
					return null;
				}
				return this.face_.remoteId;
			}

			/**
			 * Module View がもつすべての module を取得する。
             * 
			 * @param areaFilter module の area によるフィルタ
			 * @return {IGModule[]} Module View がもつ module の配列
			 */
            getModules(areaFilter?: (area) => boolean): IGModule[] {
                return this.moduleView_.getModules(areaFilter);
            }

			/**
			 * 指定された ID の module を取得する。
			 * 
			 * @param moduleId {string} [in] 取得する module の ID
			 * @return {IGModule} 指定された ID の module
			 */
			getModule(moduleId: string): IGModule {
				return this.moduleView_.getModule(moduleId);
			}

			/**
			 * face をリモコンキャンバスにレンダリングする。
			 * (face の外側に HUIS を模した装飾をつける)
			 */
			private _renderToCanvas() {
				var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
				var template: Tools.JST = Tools.Template.getJST("#template-face-canvas", templateFile);
				var $faceCanvas = $(template({
					name: this.face_.name
				}));
				var $facePagesArea = $faceCanvas.find("#face-pages-area");

				this.moduleView_ = new Module({
					el: $facePagesArea,
					attributes: {
						remoteId: this.face_.remoteId,
						modules: this.face_.modules,
						materialsRootPath: HUIS_FILES_ROOT
					}
				});
				this.moduleView_.render();

				let pageCount = this.getPageCount();
				if (pageCount) {
					$faceCanvas.find("#page-total").text("" + pageCount);
				}

				this.$el.append($faceCanvas);
			}

			/**
			 * face を通常レンダリングする。
			 */
			private _renderAsPlain() {
				var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
				var template: Tools.JST = Tools.Template.getJST("#template-face-plain", templateFile);
                this.$facePlane_ = $(template());

				this.moduleView_ = new Module({
                    el: this.$facePlane_,
					attributes: {
						remoteId: this.face_.remoteId,
						modules: this.face_.modules,
						materialsRootPath: HUIS_FILES_ROOT
					}
				});
				this.moduleView_.render();

                this.$el.append(this.$facePlane_);
			}

		}
	}
}