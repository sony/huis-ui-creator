/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.ButtonItem] ";

		export class ButtonItem extends Backbone.Model implements IGButton, ItemModel {

			remoteId: string;
			private stateCollection_: ButtonStateCollection;
			private materialsRootPath_: string;
			private resolvedImagePathDirectory_: string;
			private resolvedCopySrcImagePathDirectory_: string; // ボタン内で参照している画像のコピー元のディレクトリー
			private initialArea_: IArea; // ButtonItem の最初に設定された Area


			constructor(attributes?: any, options?: any) {
				super(attributes, options);
				if (attributes) {
					this.remoteId = attributes.remoteId;

					if (attributes.materialsRootPath) {
						this.materialsRootPath_ = attributes.materialsRootPath;
						if (this.remoteId) {
							this.resolvedImagePathDirectory_ = path.resolve(path.join(attributes.materialsRootPath, "remoteimages")).replace(/\\/g, "/");
						}
						if (attributes.srcRemoteId) {
							// 画像のコピー元のディレクトリー
							this.resolvedCopySrcImagePathDirectory_ = path.resolve(path.join(attributes.materialsRootPath, "remoteimages")).replace(/\\/g, "/");
						}
					}
				}
			}

			/**
			 * Model の initialize
			 */
			initialize(attribute?, options?) {
				//console.log("Model.ButtonItem initialize");
			}

			get area(): IArea {
				return this.get("area");
			}
			set area(val: IArea) {
				this.set("area", val);
				if (!this.initialArea_) {
					this.initialArea_ = $.extend(true, {}, val);
				}
				this._setStateItemsArea(val);
				if (this.stateCollection_) {
					this.stateCollection_.forEach((stateModel) => {
						stateModel.area = val;
					});
				}
			}
			get default(): number {
				return this.get("default");
			}
			set default(val: number) {
				this.set("default", val);
			}
            get currentStateId(): number {
				return this.get('currentStateId');
			}
            set currentStateId(val: number) {
				this.set('currentStateId', val);
			}
            get state(): IGState[] {
				if (this.stateCollection_ && 0 < this.stateCollection_.length) {
					let statesData: IGState[] = [];
					this.stateCollection_.forEach((stateModel, index) => {
						let stateData: IGState = {
							id: stateModel.stateId
						};
						if (stateModel.active !== undefined) {
							stateData.active = stateModel.active;
						}
						if (stateModel.image) {
							stateData.image = stateModel.image;
						}
						if (stateModel.label) {
							stateData.label = stateModel.label;
						}
						if (stateModel.action) {
							stateData.action = stateModel.action;
						}
						if (stateModel.translate) {
							stateData.translate = stateModel.translate;
						}

						statesData.push(stateData);
					});
					
					return statesData; 
				}
				return null;
			}
            set state(val: IGState[]) {
				// stateCollection の初期化 / リセット
				if (!this.stateCollection_) {
					this.stateCollection_ = new ButtonStateCollection();
				} else {
					this.stateCollection_.reset();
				}
				// stateData を model 化して stateCollection に追加する
				if (_.isArray(val)) {
					val.forEach((stateData: IGState, index: number) => {
						//let stateModel: ButtonState = new ButtonState({
						//	stateId: stateData.id,
						//	active: stateData.active,
						//	action: $.extend(true, [], stateData.action),
						//	translate: $.extend(true, [], stateData.translate),
						//	image: $.extend(true, [],  stateData.image),
						//	label: $.extend(true, [], stateData.label)
						//});
						let stateModel: ButtonState = new ButtonState({
							materialsRootPath: this.materialsRootPath_, remoteId: this.remoteId
						});
						stateModel.stateId = stateData.id;
						stateModel.active = stateData.active;
						stateModel.action = $.extend(true, [], stateData.action);
						stateModel.translate = $.extend(true, [], stateData.translate);
						stateModel.image = $.extend(true, [], stateData.image);
						stateModel.label = $.extend(true, [], stateData.label);
						stateModel.area = this.area;
						// image にひも付けられている画像を module のディレクトリーにコピー
						let image = stateModel.image;
						if (image) {
							this._copyImageFile(image);
						}
						this.stateCollection_.add(stateModel);
					});
				} else {
					let stateModel: ButtonState = new ButtonState(val);

					this.stateCollection_.add(stateModel);
				}
				// ボタンの機器情報が設定していなかったら、state 内から情報を探して設定する
				if (!this.deviceInfo) {
					for (let i = 0, l = this.stateCollection_.length; i < l; i++) {
						let stateModel = this.stateCollection_.at(i);
						if (stateModel && stateModel.action && stateModel.action.length) {
							let action = stateModel.action[0];
							if (action && action.code_db) {
								let code_db = action.code_db;
								let deviceInfo: IButtonDeviceInfo = {
									code_db: code_db,
									functions: []
								};
								this.deviceInfo = deviceInfo;
								break;
							}
						}
					}
				}
				this._setStateItemsArea(this.area);
			}

			get deviceInfo(): IButtonDeviceInfo {
				return this.get("deviceInfo");
			}

			set deviceInfo(val: IButtonDeviceInfo) {
				this.set("deviceInfo", val);
			}

			get properties(): string[]{
				return ["enabled", "area", "default", "currentStateId", "state", "deviceInfo"];
			}

			get itemType(): string {
				return "button";
			}

			get enabled(): boolean {
				return this.get("enabled");
			}
			set enabled(val: boolean) {
				this.set("enabled", val);
			}

			/**
             * モデルの初期値を返す。
             * new でオブジェクトを生成したとき、まずこの値が attributes に格納される。
             */
            defaults() {
                var s: IGState[] = [
                    {
                        "id": 0,
						"image": [],
//                        "img_path": $('#add_button_img').val(),
                        "label": [{
                            "area": { "x": 0, "y": 0, "w": 60, "h": 20 },
                            "text": "",
                            "color": 0,
                            "font": "",
                            "size": 20,
                            "id": 0,
                        }],
                        "translate": [{
                            "input": "",
                            "next": 0
                        }],
                        "action": [{
                            "input": "",
                            "gimmick": "",
                            "code": "",
                            "codeDB": {
                                "CommandType": "",
                                "brand": "",
                                "Category": "",
                                "Model": ""
                            }
                        }]
                    }
                ];

                var button: IGButton = {
					"enabled": true,
                    "area": {
                        "x": $('#button_x').val(),
                        "y": $('#button_x').val(),
                        "w": $('#button_width').val(),
                        "h": $('#button_height').val()
                    },
                    "defaultStateId": 0,
                    "currentStateId": 0,
                    "state": s,
                    "seqnum": $('#add_button_id').val(),
                    "name": "",
                    "imgPath": $('#add_button_img').val(),
                }


                return button;
            }



            /**
             * destroy をオーバーライド。
             * 本来ならサーバーと通信するがサンプルではデータを永続化しないため、
             * destroy イベントだけ発生させる。
             */
            /*override*/ destroy() {
                this.trigger("destroy", this);
            }

            /**
             * set メソッドに渡されたデータを検証する。
             * 何か値を返すと検証エラー扱いになるので、
             * 不正な値だったときはエラーメッセージなんかを返すといい。
             */
            /*override*/ validate(attrs: any): string {
                // 検証には、underscore の便利メソッドを使っている。
                if (_.isString(attrs.id) && _.isEmpty(attrs.id)) {
                    return "invalid id.";
                }
            }

			/**
			 * ボタンに状態を追加する
			 * 
			 * @param state {IState} 追加する状態
			 */
			addState(state: IState) {
				if (!state) {
					return;
				}
				var stateModel: ButtonState = new ButtonState({
						stateId: state.id,
						active: state.active,
						action: state.action,
						translate: state.translate,
						image: state.image,
						label: state.label
				});
				this.stateCollection_.add(stateModel);
			}

			/**
			 * コピー元の画像ディレクトリーが存在していたら、
			 * state.image に指定されている画像を module ディレクトリーにコピーする。
			 */
			private _copyImageFile(images: IGImage[]): void {
				if (!images || !this.resolvedImagePathDirectory_ || !this.resolvedCopySrcImagePathDirectory_) {
					return;
				}

				images.forEach((image: IGImage) => {
					let resolvedPath = path.resolve(this.resolvedImagePathDirectory_, image.path);
					let resolvedCopySrcImagePath = path.resolve(this.resolvedCopySrcImagePathDirectory_, image.path);
					if (!fs.existsSync(resolvedCopySrcImagePath)) {
						return;
					}
					// 画像ファイルをコピー
					if (!fs.existsSync(resolvedPath)) {
						fs.copySync(resolvedCopySrcImagePath, resolvedPath);
					}
				});
			}

			private _setStateItemsArea(buttonArea: IArea): void {
				var states = this.state;
				if (!states) {
					return;
				}

				states.forEach((state: IGState) => {
					if (state.image) {
						this._setStateImageItemArea(state.image, buttonArea);
					}
					if (state.label) {
						this._setStateLabelItemArea(state.label, buttonArea);
					}
				});
			}

			private _setStateImageItemArea(images: IGImage[], buttonArea: IArea) {
				if (!images || !this.initialArea_) {
					return;
				}

				var initialArea = this.initialArea_;
				images.forEach((image: IGImage) => {
					if (!image.areaRatio) {
						let imageArea = image.area;
						image.areaRatio = {
							x: 0 < initialArea.w ? imageArea.x / initialArea.w : 1,
							y: 0 < initialArea.h ? imageArea.y / initialArea.h : 1,
							w: 0 < initialArea.w ? imageArea.w / initialArea.w : 1,
							h: 0 < initialArea.h ? imageArea.h / initialArea.h : 1
						};
					} else {
						image.area = {
							x: buttonArea.x * image.areaRatio.x,
							y: buttonArea.y * image.areaRatio.y,
							w: buttonArea.w * image.areaRatio.w,
							h: buttonArea.h * image.areaRatio.h
						}
					}
				});
			}

			private _setStateLabelItemArea(labels: IGLabel[], buttonArea: IArea) {
				if (!labels || !this.initialArea_) {
					return;
				}

				var initialArea = this.initialArea_;
				labels.forEach((label: IGLabel) => {
					if (!label.areaRatio) {
						let labelArea = label.area;
						label.areaRatio = {
							x: 0 < initialArea.w ? labelArea.x / initialArea.w : 1,
							y: 0 < initialArea.h ? labelArea.y / initialArea.h : 1,
							w: 0 < initialArea.w ? labelArea.w / initialArea.w : 1,
							h: 0 < initialArea.h ? labelArea.h / initialArea.h : 1
						};
					} else {
						label.area = {
							x: buttonArea.x * label.areaRatio.x,
							y: buttonArea.y * label.areaRatio.y,
							w: buttonArea.w * label.areaRatio.w,
							h: buttonArea.h * label.areaRatio.h
						}
					}
				});
			}

			private _setAreaRatioToStateItems(): void {
				var states = this.state;
				if (!states) {
					return;
				}

				states.forEach((state: IGState) => {
					if (state.image) {
						this._setAreaRatioToStateImageItems(state.image);
					}
					if (state.label) {
						this._setAreaRatioToStateLabelItems(state.label);
					}
				});

				this.state = states;
			}

			private _setAreaRatioToStateImageItems(images: IGImage[]) {
				if (!this.initialArea_) {
					return;
				}

				var buttonArea = this.initialArea_;
				images.forEach((image: IGImage) => {
					if (!image.areaRatio) {
						let imageArea = image.area;
						image.areaRatio = {
							x: 0 < buttonArea.x ? imageArea.x / buttonArea.x : 1,
							y: 0 < buttonArea.y ? imageArea.y / buttonArea.y : 1,
							w: 0 < buttonArea.w ? imageArea.w / buttonArea.w : 1,
							h: 0 < buttonArea.h ? imageArea.h / buttonArea.h : 1
						};
					}
				});
			}

			private _setAreaRatioToStateLabelItems(labels: IGLabel[]) {
				if (!this.initialArea_) {
					return;
				}

				var buttonArea = this.initialArea_;
				labels.forEach((label: IGLabel) => {
					if (!label.areaRatio) {
						let labelArea = label.area;
						label.areaRatio = {
							x: 0 < buttonArea.x ? labelArea.x / buttonArea.x : 1,
							y: 0 < buttonArea.y ? labelArea.y / buttonArea.y : 1,
							w: 0 < buttonArea.w ? labelArea.w / buttonArea.w : 1,
							h: 0 < buttonArea.h ? labelArea.h / buttonArea.h : 1
						};
					}
				});
			}
		}
	}
}