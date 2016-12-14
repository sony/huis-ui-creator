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
                if (!position) {
                    console.error(TAG + "argument position is null or undefined");
                    return false;
                }
                return this.x == position.x && this.y == position.y;
            }

            public setPositionXY(x: number, y:number): void {
                this.x = x;
                this.y = y;
            }

            public setPosition(position: IPosition): void {
                if (!position) {
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


        }
    }
}