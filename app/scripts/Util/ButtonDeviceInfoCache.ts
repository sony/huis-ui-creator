/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        export class ButtonDeviceInfoCache {

            private filePath: string;

            constructor(huisFilesRoot: string, remoteId: string) {

                this.filePath = path.join(huisFilesRoot, remoteId, remoteId + "_buttondeviceinfo.cache");
            }

            /**
             * キャッシュファイルを読み込み、渡されたIGModuleに設定
             */
            load(gmodules: IGModule[]) {

                if (!fs.existsSync(this.filePath)) {
                    return;
                }

                let buttonDeviceInfoCache: IButtonDeviceInfo[];
                try {
                    buttonDeviceInfoCache = fs.readJSONSync(this.filePath);
                } catch (e) {
                    console.log("failed to read buttondeviceinfo.cache: " + e);
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
                    let id: string[] = buttonDeviceInfo.id.split("-");

                    if (id.length <= 0) continue;

                    if (+id[0] == page &&
                        +id[1] == x    &&
                        +id[2] == y) {
                        return buttonDeviceInfo;
                    }
                }

                return null;
            }

            /**
             * 渡されたIGModule内のボタン情報をキャッシュファイルに出力
             */
            update(gmodules: IGModule[]) {
                let newList: IButtonDeviceInfo[] = [];

                for (let gmodule of gmodules) {
                    for (let gbutton of gmodule.button) {
                        // 座標からIDを生成/更新 page-x座標-y座標
                        gbutton.deviceInfo.id = gmodule.pageIndex + "-" + gbutton.area.x + "-" + gbutton.area.y;

                        newList.push(gbutton.deviceInfo);
                    }
                }

                try {
                    fs.outputJSONSync(this.filePath, newList, { spaces: 2 });
                } catch (e) {
                    console.log("failed to write buttondeviceinfo.cache: " + e);
                }
            }


        }

    }
}