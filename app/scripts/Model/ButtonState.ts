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
        var TAG = "[Garage.Model.ButtonState] ";

        namespace constValue {
            export const DEFAULT_IMAGE_INDEX: number = 0;
            export const DEFAULT_LABEL_INDEX: number = 0;
        }

        export class ButtonState extends Backbone.Model {
            private imageCollection_: Backbone.Collection<ImageItem>;
            private labelCollection_: Backbone.Collection<LabelItem>;

            defaults() {
                // Please write default parameters' value
                return {
                };
            }

            // TODO: JSDoc comment
            // TODO: Change attribute of constructor
            constructor(attributes?: any) {
                super();
                this.imageCollection_ = new ImageItemsCollection();
                this.labelCollection_ = new LabelItemsCollection();
                super(attributes, null);
            }

            clone() {
                // TODO: change constructor
                let cloneState = new Model.ButtonState({
                    stateId: this.stateId
                });
                cloneState.active = this.active;

                if (this.action) {
                    if (_.isArray(this.action)) {
                        cloneState.action = $.extend(true, [], this.action);
                    } else {
                        cloneState.action = [$.extend(true, {}, this.action)];
                    }
                }

                if (this.translate) {
                    if (_.isArray(this.translate)) {
                        cloneState.translate = $.extend(true, [], this.translate);
                    } else {
                        cloneState.translate = [$.extend(true, {}, this.translate)];
                    }
                }

                cloneState.image = [];
                for (let image of this.image) {
                    cloneState.image.push(image.clone());
                }

                cloneState.label = [];
                for (let label of this.label) {
                    cloneState.label.push(label.clone());
                }

                return cloneState;
            }

            /**
             * @return {boolean} 有効なModel.ImageItemを持っている場合、trueを返す。
             */
            hasValidImage(): boolean {
                return this.imageCollection_.models.length > 0;
            }

            /**
             * @return {boolean} 有効なModel.LabelItemを持っている場合、trueを返す。
             */
            hasValidLabel(): boolean {
                return this.labelCollection_.models.length > 0;
            }

            /**
             * Model.ButtonStateをHUIS出力用のデータ形式に変換する。
             *
             * @param {string} remoteId このButtonStateが所属するremoteId
             * @param {string} ourputDirPath faceファイルの出力先のディレクトリ
             * @return {IState} 変換されたデータ
             */
            convertToHuisData(remoteId: string, outputDirPath?: string): IState {

                let convertedState: IState = {
                    id: this.stateId
                };

                if (this.image) {
                    convertedState.image = [];
                    for (let image of this.image) {
                        convertedState.image.push(image.convertToHuisData(remoteId, outputDirPath));
                    }
                }
                if (this.label) {
                    convertedState.label = [];
                    for (let label of this.label) {
                        convertedState.label.push(label.convertToHuisData());
                    }
                }
                if (this.action) {
                    convertedState.action = this._normalizeButtonStateActions(this.action);
                }

                if (this.translate) {
                    convertedState.translate = [];
                    this.translate.forEach((translate: IStateTranslate) => {
                        convertedState.translate.push({
                            input: translate.input,
                            next: translate.next
                        });
                    });
                }

                return convertedState;
            }

            // TODO: Move this method to action class
            /**
             * button.state.action データから module 化に不要なものを間引く
             */
            private _normalizeButtonStateActions(actions: IAction[]): IAction[] {
                var normalizedActions: IAction[] = [];

                actions.forEach((action: IAction) => {
                    let normalizedAction: IAction = {
                        input: (action.input) ? action.input : "none"
                    };
                    if (action.code) {
                        normalizedAction.code = action.code;
                    }
                    if (action.code_db) {
                        normalizedAction.code_db = {
                            function: (action.code_db.function) ? Util.HuisFiles.getPlainFunctionKey(action.code_db.function) : "none",
                            brand: action.code_db.brand,
                            device_type: action.code_db.device_type,
                            db_codeset: action.code_db.db_codeset
                        };
                        if (!_.isUndefined(action.code_db.db_device_id)) {
                            normalizedAction.code_db.db_device_id = action.code_db.db_device_id;
                        }
                        if (!_.isUndefined(action.code_db.model_number)) {
                            normalizedAction.code_db.model_number = action.code_db.model_number;
                        }
                        if (!_.isUndefined(action.bluetooth_data)) {
                            normalizedAction.bluetooth_data = action.bluetooth_data;
                        }
                    } else {
                        normalizedAction.code_db = {
                            function: "none",
                            brand: " ",
                            device_type: " ",
                            db_codeset: " "
                        }
                    }
                    if (!_.isUndefined(action.interval)) {
                        normalizedAction.interval = action.interval;
                    }

                    normalizedActions.push(normalizedAction);
                });

                return normalizedActions;
            }

            get stateId(): number {
                return this.get("stateId");
            }

            set stateId(val: number) {
                this.set("stateId", val);
            }

            get area(): IArea {
                return this.get("area");
            }

            set area(val: IArea) {
                this.set("area", val);
                // state 内の model の area 更新
                this.imageCollection_.forEach((imageModel) => {
                    imageModel.area = {
                        x: 0,
                        y: 0,
                        w: val.w,
                        h: val.h
                    };
                });
            }

            // TODO: change name, image to images
            get image(): Model.ImageItem[] {
                return this.imageCollection_.models;
            }

            set image(val: Model.ImageItem[]) {
                this.imageCollection_.reset(val);
            }

            // TODO: change name, label to labels
            get label(): Model.LabelItem[] {
                return this.get("label");
            }

            set label(val: Model.LabelItem[]) {
                this.set("label", val);
            }

            // TODO: change name, action to actions
            get action(): IAction[] {
                return this.get("action");
            }

            set action(val: IAction[]) {
                this.set("action", val);
            }

            get translate(): IStateTranslate[] {
                return this.get("translate");
            }

            set translate(val: IStateTranslate[]) {
                this.set("translate", val);
            }

            get active(): boolean {
                return this.get("active");
            }

            set active(val: boolean) {
                this.set("active", val);
            }

            getDefaultImage(): Model.ImageItem {
                return this.imageCollection_.models[constValue.DEFAULT_IMAGE_INDEX];
            }

            getDefaultLabel(): Model.LabelItem {
                return this.label[constValue.DEFAULT_LABEL_INDEX];
            }

            /**
             * actionに特定のアクションが含まれるか判定する
             * @param actiionType{string} アクション含まれているか確かめたいアクションタイプ
             * @return {boolean} 特定のアクションがひとつでも含まれる場合true,ひとつも含まれない場合false.エラーが発生した場合 undefinedを返す。
             */
            isIncludeSpecificActionType(actionType: string): boolean {
                for (let action of this.action) {
                    if (!action.input) continue;

                    if (action.input == actionType) {
                        return true;
                    }
                }
                return false;
            }

        }
    }
}
