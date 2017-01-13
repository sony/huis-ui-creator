/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        /**
         * リモコンのアイテムをコピー/貼り付けするためのクリップボード
         */
        export class ItemClipboard {

            /** コピーしたアイテム */
            private items: ClipboardItem[];

            /** 貼り付けるページ毎の位置ずらしサイズ */
            private pasteDisplacement: { [pageId: string]: Model.Position };

            /** 貼り付け時の位置ずらしサイズ */
            private posIncrement: number;

            /**
             *　 
             *
             * @param posIncrement {number} 貼り付け時に位置をずらすサイズ
             */
            constructor(posIncrement: number) {
                this.posIncrement = posIncrement;
                this.items = [];
                this.pasteDisplacement = {};
            }

            /**
             * クリップボード上のアイテムを削除
             */
            public clear() {
                if (this.hasItem()) {
                    this.items = [];
                    this.pasteDisplacement = {};
                }
            }

            /**
             * クリップボードにアイテムがあるかどうか検査する
             * １つでも存在する場合は true、そうでない場合は false を返す
             *
             * @return {boolean}
             */
            public hasItem(): boolean {
                return (this.items != null && this.items.length > 0);
            }

            /**
             * アイテムをクリップボードに記録
             *
             * @param pageId {string} コピーするアイテムのあるページモジュールID
             * @param item {Model.Item}
             * @param moduleOffsetY {number}
             */
            public setItem(pageId: string, item: Model.Item, moduleOffsetY: number) {
                this.items.push(new ClipboardItem(item, moduleOffsetY));
                this.pasteDisplacement[pageId] = new Model.Position(this.posIncrement, this.posIncrement);
            }

            /**
             * 貼り付け用のアイテムを取得
             *
             * @param pageId {string} 貼り付け先のページモジュールID
             * @return {ClipboardItem[]}
             */
            public getItems(pageId: string): ClipboardItem[] {
                if (!this.hasItem()) {
                    return [];
                }

                if (this.pasteDisplacement[pageId] == null) {
                    this.pasteDisplacement[pageId] = new Model.Position(0, 0);
                }

                let displacement = this.pasteDisplacement[pageId].clone();

                this.pasteDisplacement[pageId].x += this.posIncrement;
                this.pasteDisplacement[pageId].y += this.posIncrement;

                let clippedItem = this.items[0];
                clippedItem.position = new Model.Position(
                    clippedItem.item.area.x + displacement.x,
                    clippedItem.item.area.y + displacement.y);

                return [clippedItem];
            }
        }


        /**
         * クリップボード上に記録されるアイテム情報
         */
        class ClipboardItem {

            public item: Model.Item;
            public moduleOffsetY: number;
            public position: Model.Position;

            constructor(item: Model.Item, moduleOffsetY: number) {
                this.item = item;
                this.moduleOffsetY = moduleOffsetY;
            }

        }


    }
}