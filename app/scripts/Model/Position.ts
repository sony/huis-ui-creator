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

        const TAG: string = "[Garage.Model.Position] ";

        export class Position implements IPosition {

            public x: number;
            public y: number;

            public constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
            }

            public isSame(position: IPosition): boolean {
                if (position == null) {
                    console.error(TAG + "argument position is null or undefined");
                    return false;
                }
                return this.x == position.x && this.y == position.y;
            }

            public setPositionXY(x: number, y: number): void {
                this.x = x;
                this.y = y;
            }

            public setPosition(position: IPosition): void {
                if (position == null) {
                    console.error(TAG + "argument position is null or undefined");
                    return;
                }
                this.x = position.x;
                this.y = position.y;
            }

            public isInArea(area: IArea): boolean {
                return this.x >= area.x && this.x <= area.x + area.w
                    && this.y >= area.y && this.y <= area.y + area.h;
            }

            public clone(): Position {
                return new Position(this.x, this.y);
            }

        }
    }
}
