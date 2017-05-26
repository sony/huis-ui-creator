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
                // [TODO] areaRatio を考慮すべきだが、暫定的に親要素と同じサイズ
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
            get image(): Model.ImageItem[]{
                return this.imageCollection_.models;
            }

            set image(val: Model.ImageItem[]) {
                this.imageCollection_.reset(val);
            }

            // TODO: change name, label to labels
            get label(): Model.LabelItem[]{
                return this.get("label");
            }

            set label(val: Model.LabelItem[]) {
                this.set("label", val);
            }

            // TODO: change name, action to actions
            get action(): IAction[]{
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
        }
    }
}