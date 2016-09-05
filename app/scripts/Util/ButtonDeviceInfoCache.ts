/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        export const FILE_NAME_BUTTON_DEVICE_INFO_CACHE = "_buttondeviceinfo.cache";

        export class ButtonDeviceInfoCache {

            private filePath: string;

            constructor(huisFilesRoot: string, remoteId: string) {

                this.filePath = path.join(huisFilesRoot, remoteId, remoteId + FILE_NAME_BUTTON_DEVICE_INFO_CACHE);
            }

            /**
             * キャッシュファイルを読み込み、渡されたIGModuleに設定
             */
            load(gmodules: IGModule[]) {

                if (!fs.existsSync(this.filePath)) {
                    console.log("buttondeviceinfo.cache not found: " + this.filePath);
                    return;
                }

                let buttonDeviceInfoCache: IButtonDeviceInfo[];
                try {
                    buttonDeviceInfoCache = fs.readJSONSync(this.filePath);
                } catch (e) {
                    console.error("failed to read buttondeviceinfo.cache: " + e);
                    return;
                }

                for (let gmodule of gmodules) {
                    if (!gmodule.button) continue;

                    for (let gbutton of gmodule.button) {
                        if (!gbutton.area) continue;

                        let cache = this.find(buttonDeviceInfoCache, gmodule.pageIndex, gbutton.area.x, gbutton.area.y);

                        if (cache) {
                            // 参照を直接更新
                            gbutton.deviceInfo = cache;
                        }
                    }
                }

            }

            /**
             * 渡されたページ番号、x座標、y座標から一致するIButtonDeviceInfoを返却
             * 一致するものが無い場合はnullを返却
             */
            private find(cache: IButtonDeviceInfo[], page: number, x: number, y: number): IButtonDeviceInfo {
                for (let buttonDeviceInfo of cache) {
                    let id: string = ButtonDeviceInfoCache.createId(page, x, y);

                    if (buttonDeviceInfo.id == id) {
                        return buttonDeviceInfo;
                    }
                }

                return null;
            }

            /**
             * ButtonDeviceInfoCacheのIDを生成
             * @param page ボタンのあるページ番号
             * @param x    ボタンのx座標
             * @param y    ボタンのy座標
             * @return IDの文字列
             */
            private static createId(page: number, x: number, y: number): string {
                return page + "-" + x + "-" + y;
            }

            /**
             * 渡されたIGModule内のボタン情報をキャッシュファイルに出力
             */
            save(gmodules: IGModule[]) {
                let newList: IButtonDeviceInfo[] = [];

                for (let gmodule of gmodules) {
                    if (!gmodule.button) continue;

                    for (let gbutton of gmodule.button) {
                        gbutton.deviceInfo.id = ButtonDeviceInfoCache.createId(gmodule.pageIndex, gbutton.area.x, gbutton.area.y);
                        newList.push(gbutton.deviceInfo);
                    }
                }

                try {
                    fs.outputJSONSync(this.filePath, newList, { spaces: 2 });
                } catch (e) {
                    console.error("failed to write buttondeviceinfo.cache: " + e);
                }
            }


        }

    }
}
