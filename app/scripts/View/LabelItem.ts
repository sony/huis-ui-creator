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
                        let labels: Model.LabelItem[] = [];
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
                            if (_.isString(labels[i].version)) {
                                labelModel.version = labels[i].version;
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
                    let label: Model.LabelItem = $.extend(true, {}, item);
                    //label.resolvedColor = this._getResolvedColor(label.color);

                    //HUISとGarageで大きさが異なるために表示用に補正する。
                    let modelForDisplay: Model.LabelItem = jQuery.extend(true, {}, label);

                    modelForDisplay.size = JQUtils.getOffsetTextLabelSize(label.size);


                    modelForDisplay.resolvedColor = item.resolvedColor;
                    this.$el.append($(this.labelItemTemplate_(modelForDisplay)));
                });
                return this;
            }

            /**
             * LabelItem View がもつすべての LabelItem を返す。
             * 
             * @return {Model.LabelItem[]} LabelItem View がもつ LabelItem
             */
            getLabels(): Model.LabelItem[] {
                // enabled でない model を間引く 
                var labelModels = this.collection.models.filter((model) => {
                    return model.enabled;
                });
                var labels: Model.LabelItem[] = $.extend(true, [], labelModels);

                return labels;
            }

            /**
             * collection に LabelItem が追加されたら、追加分をレンダリングする
             */
            private _renderNewModel(model: Model.LabelItem) {
                var label: Model.LabelItem = $.extend(true, {}, model);
                label.resolvedColor = model.resolvedColor;
                let modelForDisplay: Model.LabelItem = jQuery.extend(true, {}, label);
                //HUISとGarageで大きさが異なるために表示用に補正する。
                modelForDisplay.size = JQUtils.getOffsetTextLabelSize(label.size);
                this.$el.append($(this.labelItemTemplate_(modelForDisplay)));
            }
        }
    }
}