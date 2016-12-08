/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Model {
        export class Position implements IPosition {

            public x: number;
            public y: number;

            public isSame(position: IPosition): boolean {
                return this.x == position.x && this.y == position.y;
            }

            public setCoord(x: number, y:number): void {
                this.x = x;
                this.y = y;
            }

            public setPosition(position: IPosition): void {
                this.x = position.x;
                this.y = position.y;
            }
        }
    }
}