/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module View {
		import Tools = CDP.Tools;
		var TAG = "[Garage.View.LabelItem] ";

		export class LabelItem extends Backbone.View<Model.LabelItem> {

			private labelItemTemplate_: Tools.JST;

			/**
			 * constructor
			 */
			constructor(options?: Backbone.ViewOptions<Model.LabelItem>) {
				super(options);
			}

			events() {
				// Please add events
				return {
				};
			}

			initialize(options?: Backbone.ViewOptions<Model.LabelItem>) {
				if (options.attributes) {
					let unknownTypeLabel = options.attributes["labels"];
					if (unknownTypeLabel) {
						let labels: ILabel[] = [];
						if (_.isArray(unknownTypeLabel)) {
							labels = unknownTypeLabel;
						} else {
							labels.push(unknownTypeLabel);
						}

						let labelModels: Model.LabelItem[] = [];
						for (let i = 0, l = labels.length; i < l; i++) {
							let labelModel: Model.LabelItem = new Model.LabelItem();
							labelModel.area = $.extend(true, {}, labels[i].area);
							labelModel.text = labels[i].text;
							if (_.isNumber(labels[i].color)) {
								labelModel.color = labels[i].color;
							}
							if (_.isString(labels[i].font)) {
								labelModel.font = labels[i].font;
                            }
                            if (_.isString(labels[i].font_weight)) {
                                labelModel.font_weight = FontWeight.exchangeStringToFontWeight(labels[i].font_weight);
                            }
							if (_.isNumber(labels[i].size)) {
								labelModel.size = labels[i].size;
							}
							labelModels.push(labelModel);
						}

						this.collection = new Model.LabelItemsCollection(labelModels);
					}
				}

				if (!this.collection) {
					this.collection = new Model.LabelItemsCollection();
				}

				this.collection.on("add", this._renderNewModel.bind(this));

				var templateFile = CDP.Framework.toUrl("/templates/face-items.html");
				this.labelItemTemplate_ = Tools.Template.getJST("#template-label-item", templateFile);
			}

			render(): LabelItem {
				this.collection.each((item: Model.LabelItem, index: number) => {
					let label: IGLabel = $.extend(true, {}, item);
					//label.resolvedColor = this._getResolvedColor(label.color);
					label.resolvedColor = item.resolvedColor;
					this.$el.append($(this.labelItemTemplate_(label)));
				});
				return this;
			}

			/**
			 * LabelItem View がもつすべての LabelItem を返す。
			 * 
			 * @return {IGLabel[]} LabelItem View がもつ LabelItem
			 */
			getLabels(): IGLabel[] {
				// enabled でない model を間引く 
				var labelModels = this.collection.models.filter((model) => {
					return model.enabled;
				});
				var labels: IGLabel[] = $.extend(true, [], labelModels);

				return labels;
			}

			/**
			 * collection に LabelItem が追加されたら、追加分をレンダリングする
			 */
			private _renderNewModel(model: Model.LabelItem) {
				var label: IGLabel = $.extend(true, {}, model);
				label.resolvedColor = model.resolvedColor;
				this.$el.append($(this.labelItemTemplate_(label)));
			}
		}
	}
}