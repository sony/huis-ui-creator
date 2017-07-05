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

/// <reference path="../../../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.Preview.TextPreview] ";

        namespace ConstValue {

            export const TEMPLATE_DOM_ID: string = "#template-text-preview";
            export const DOM_ID: string = "#preview";

            //text size pulldown
            export const SIZE_PULLDOWN_CONTAINER_DOM_ID: string = "#text-size-pulldown";
            export const SIZE_PULLDOWN_SELECT_DOM_ID: string = "#select-text-size";
            export const TEMPLATE_SIZE_PULLDOWN_DOM_ID: string = "#template-text-size-pulldown";
            export const SIZE_PULLLDOWN_VALUES: number[] = [
                12, 14, 16, 18, 20, 23, 28, 30, 32, 36,
                40, 44, 48, 54, 60, 72, 80, 88, 96
            ];
            export const COLOR_PULLDOWN_CONTAINER_DOM_ID: string = "#text-color-pulldown";
            export const COLOR_PULLDOWN_SELECT_DOM_ID: string = "#select-text-color";
            export const TEMPLATE_COLOR_PULLDOWN_DOM_ID: string = "#template-text-color-pulldown";

            //text field
            export const TEXT_FIELD_DOM_ID: string = "#text-field";
        }

        export class TextPreview extends Preview {


            constructor(item: Model.LabelItem) {
                super(item, ConstValue.DOM_ID, ConstValue.TEMPLATE_DOM_ID);
            }


            events() {
                // Please add events
                let events: Object = {};
                events[Events.CHANGE_WITH_DIVIDER + ConstValue.SIZE_PULLDOWN_SELECT_DOM_ID] = "_onTextSizePulldownChanged";
                events[Events.CHANGE_WITH_DIVIDER + ConstValue.COLOR_PULLDOWN_SELECT_DOM_ID] = "_onTextColorPulldownChanged";
                events[Events.CHANGE_WITH_DIVIDER + ConstValue.TEXT_FIELD_DOM_ID] = "_onTextFieldChanged";
                return events;
            }

            private _onTextSizePulldownChanged(event: Event) {
                let FUNCTION_NAME = TAG + "_onTextSizePulldownChanged : ";
                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_SIZE);//PropertyAreaでUIの変更イベント発火を探知される。
            }

            private _onTextColorPulldownChanged(event: Event) {
                let FUNCTION_NAME = TAG + "_onTextColorPulldownChanged : ";
                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_COLOR);//PropertyAreaでUIの変更イベント発火を探知される。
            }

            private _onTextFieldChanged(event: Event) {
                let FUNCTION_NAME = TAG + "_onTextFieldChanged : ";

                var $target = $(event.currentTarget);
                var value: any = $target.val();
                //禁則文字がある場合、表示を取り消す。
                let filteredString: string = Util.MiscUtil.getRemovedInhibitionWords(value);
                if (filteredString != value) {
                    $target.val(filteredString);
                }

                this.trigger(PropertyAreaEvents.Label.UI_CHANGE_TEXT);//PropertyAreaでUIの変更イベント発火を探知される。
            }

            render(option?: any): Backbone.View<Model.Item> {
                super.render();
                //render size pulldown
                let templateTextSizePulldown = CDP.Tools.Template.getJST(ConstValue.TEMPLATE_SIZE_PULLDOWN_DOM_ID, this._getTemplateFilePath());
                let dataSizePulldownRender = {
                    sizeValues: ConstValue.SIZE_PULLLDOWN_VALUES
                }
                this.$el.find(ConstValue.SIZE_PULLDOWN_CONTAINER_DOM_ID).append(templateTextSizePulldown(dataSizePulldownRender));

                //set initial value of size pulldown
                let size = this.getModel().size;
                if (Util.JQueryUtils.isValidValue(size)) {
                    this.$el.find(ConstValue.SIZE_PULLDOWN_SELECT_DOM_ID).val(size.toString());
                }

                //render color pulldown
                let templateTextColorPulldown = CDP.Tools.Template.getJST(ConstValue.TEMPLATE_COLOR_PULLDOWN_DOM_ID, this._getTemplateFilePath());
                this.$el.find(ConstValue.COLOR_PULLDOWN_CONTAINER_DOM_ID).append(templateTextColorPulldown());

                //set initial value of color pulldown
                let color = this.getModel().color;
                if (Util.JQueryUtils.isValidValue(color)) {
                    this.$el.find(ConstValue.COLOR_PULLDOWN_SELECT_DOM_ID).val(color);
                }

                this.$el.i18n();

                this.endProcessOfRender();
                return this;
            };


            // TODO: null check
            /**
             * @return {number} テキストサイズ変更用プルダウンの値を取得する。
             */
            getTextSize(): number {
                return this.$el.find(ConstValue.SIZE_PULLDOWN_SELECT_DOM_ID).val();
            }

            /**
             * @return {number} テキストサイズ変更用プルダウンの値を取得する。
             */
            getTextColor(): string {
                return this.$el.find(ConstValue.COLOR_PULLDOWN_SELECT_DOM_ID).val();
            }

            /**
             * @return {string} テキストフィールドの値を取得する。
             */
            getText(): string {
                return this.$el.find(ConstValue.TEXT_FIELD_DOM_ID).val();
            }

            /**
             * 保持しているモデルを取得する
             * @return {Model.LabelItem}
             */
            getModel(): Model.LabelItem {
                return <Model.LabelItem>this.model;
            }


        }
    }
}
