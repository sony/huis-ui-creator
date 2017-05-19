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

            constructor(attributes?: any) {
                super();
                this.imageCollection_ = new ImageItemsCollection();
                this.labelCollection_ = new LabelItemsCollection();
                super(attributes, null);
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

            get image(): Model.ImageItem[]{
                let images: Model.ImageItem[] = [];
                let imageModels = this.imageCollection_.models;
                if (imageModels && 0 < imageModels.length) {
                    imageModels.forEach((imageModel) => {
                        images.push(imageModel.clone());
                    });
                    return images;
                }
                return null;
                //return this.get("image");
            }

            set image(val: Model.ImageItem[]) {
                this.imageCollection_.reset(val);
                //this.set("image", val);
            }

            get label(): Model.LabelItem[]{
                return this.get("label");
            }

            set label(val: Model.LabelItem[]) {
                this.set("label", val);
            }

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