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
/// <reference path="ButtonState.ts" />

module Garage {
    export module Model {
        var TAG = "[Garage.Model.ButtonStateCollection] ";

        export class ButtonStateCollection extends Backbone.Collection<ButtonState> {
            model = ButtonState;

            clone(): ButtonStateCollection {
                let result: ButtonStateCollection = new ButtonStateCollection();
                for (let state of this.models){
                    result.add(state.clone());
                }
                return result;
            }

            /**
             * stateId から ButtonState を取得する。
             * stateId は順番とは一致しないため、一致するIDを検索して検出する。
             * 例) エアコンの温度は温度でID管理しているので、21度のときのIDは21だが、
             *     Collectionのサイズは21もない。
             *
             * @param {number} stateId あるかどうか確認したい state の id
             * @return {ButtonState} 引数と一致する id を持つ state。ない場合は null。
             */
            getStateById(stateId: number): ButtonState {
                for (let state of this.models) {
                    if (state.isSameId(stateId)) {
                        return state;
                    }
                }
                throw new Error(TAG + "invalid id : " + stateId);
            }
        }
    }
}
