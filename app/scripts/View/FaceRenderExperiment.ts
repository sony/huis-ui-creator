/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module View {
	
		import Framework = CDP.Framework;
		import UI = CDP.UI;
		
		var TAG: string = "[Garage.View.FaceRenderExperiment] ";
		var HUIS_FILES_DIRECTORY = "app/res/samples/materials";
		
		/**
		 * @class FaceRenderExperiment
		 * @brief FaceRenderExperiment View class for Garage.
		 */
		class FaceRenderExperiment extends UI.PageView<Backbone.Model> {

			private containerBackgroundColorIndex_ = 0;
		
			/**
			 * construnctor
			 */
			constructor() {
				super("/templates/face-render-experiment.html", "page-face-render-experiment", { route: "face-render-experiment" });
			}
			
			///////////////////////////////////////////////////////////////////////
			// Override: UI.PageView

			//! page initialization event
			onInitialize(event: JQueryEventObject): void {
				super.onInitialize(event);
				
			}

			onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
				super.onPageShow(event, data);

				var remoteListPath = path.resolve(path.join(HUIS_FILES_DIRECTORY, "remotelist.json"));
				var remoteListText = fs.readFileSync(remoteListPath, "utf8");
				var remoteList: any[] = JSON.parse(remoteListText.replace(/^\uFEFF/, ""));

				this._initializeFaceSelect(remoteList);
			}

			events(): any {
				return {
					"click #button-edit-image": "_onEditImageClick",
					"click #edited-image-container": "_onEditedImageContainerClick"
				}
			}

			render(): FaceRenderExperiment {
				// Please add your code
				
				return this;
			}

			private _renderFace(remoteId: string): void {
				$("#face-render-canvas-container").children().remove();
				//var huisFilesDirectory = "app/res/samples/materials";
				//var facePath = path.resolve(path.join(huisFilesDirectory, "remotefaces", faceName + ".face"));
				console.log(TAG + "renderFace: " + remoteId);

				var face: IGFace = huisFiles.getFace(remoteId);

				var faceRenderer: FaceRenderer = new FaceRenderer({
					el: $("#face-render-canvas-container"),
					attributes: {
						face: face,
						type: "canvas",
						materialsRootPath: HUIS_FILES_DIRECTORY
					}
				});
				faceRenderer.render();

				// 大きすぎて表示できない場合のためにサイズ調整
				if (window.innerHeight - 200 < HUIS_FACE_PAGE_HEIGHT) {
					let adjustedHeightRate = (window.innerHeight - 200) / HUIS_FACE_PAGE_HEIGHT;
					let $faceCanvas = $("#face-canvas");
					$faceCanvas.css({
						"transform": "scale(" + adjustedHeightRate + ")",
						"transform-origin": "center top"
					});
				}

			}

			private _initializeFaceSelect(remoteList: any[]) {
				var $selectFace = $("#select-face");
				for (let i = 0, l = remoteList.length; i < l; i++) {
					let remoteId = remoteList[i].remote_id;
					let option = "<option value=\"" + remoteId + "\">" + remoteId + "</option>";
					$selectFace.append($(option));
				}
				$selectFace.selectmenu("refresh");

				$selectFace.change(() => {
					this._renderFace($selectFace.val());
				});
				
			}

			private _onEditImageClick() {
				requirejs(["pixi"], () => {
					// 編集元の画像パス
					let imagePath = "../../res/icons/cdp_blog_logo.png";
					// 画像編集のパラメータ－
					let editParams: Model.IImageEditParams = {
						resize: {
							width: $("#input-resize-width").val(),
							height: $("#input-resize-height").val(),
							force: $("#check-force-resize").prop("checked") ? true : false,
							padding: $("#check-resize-padding").prop("checked") ? true : false,
							mode: $("#select-resize-mode").val()
						},
						grayscale: $("#check-grayscale").prop("checked") ? 1 : undefined,
						imageType: $("#check-output-jpeg").prop("checked") ? "image/jpeg" : undefined
					}
					// 出力ファイル名
					let imageName = $("#input-dst-filename").val();
					if (!imageName) {
						let now = Date.now();
						imageName = "" + now + "_w" + editParams.resize.width + "_h" + editParams.resize.height + "_" + editParams.resize.mode;
					}
					let outputPath = path.join(GARAGE_FILES_ROOT, "createdimages", imageName);

					// 画像を編集して、ファイル出力する
					Model.OffscreenEditor.editImage(imagePath, editParams, outputPath).done((editedImage) => {
						$("#edited-image").attr("src", editedImage.dataUrl);
						UI.Toast.show(editedImage.path);
					}).fail(() => {
						alert("ｴﾗｰ");
					});
				});
			}

			private _onEditedImageContainerClick() {
				switch (this.containerBackgroundColorIndex_) {
					case 0:
						$("#edited-image").css("background-color", "white");
						this.containerBackgroundColorIndex_ = 1;
						break;

					default:
						$("#edited-image").css("background-color", "black");
						this.containerBackgroundColorIndex_ = 0;
				}
			}

		}

		var View = new FaceRenderExperiment();
	}
}