/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        /**
         * phnconfig.ini ファイル操作クラス
         */
        export class PhnConfigFile {
            private static TAG: string = "[Garage.Util.PhConfigFile] ";

            private static FILE_NAME = "phnconfig.ini";

            /**
             * phnconfig.ini に記述されるプロパティ名と順序
             */
            private static KEYS: string[] = [
                'home_id',
                'scene_no',
                'enable_vertical_remote_page_swipe',
                'enable_horizontal_remote_page_swipe',
                'display_remote_arrow',
                'display_setting_button',
                'display_add_button'
            ];


            /**
             * phnconfig.iniのファイルパスをフルパスで取得
             * 
             * @param huisFilesRoot {string}
             * @return {string} 
             */
            private static getFilePath(huisFilesRoot: string): string {
                return path.resolve(path.join(huisFilesRoot, PhnConfigFile.FILE_NAME));
            }


            /**
             * phnconfig.iniを読み込みデータを取得
             *
             * @param huisFilesRoot {string}
             * @return {IPhnConfig}
             */
            static loadFromFile(huisFilesRoot: string): IPhnConfig {
                let confFilePath = PhnConfigFile.getFilePath(huisFilesRoot);

                if (!fs.existsSync(confFilePath)) {
                    console.warn('File not found: ' + confFilePath);

                    return PhnConfigFile.createDefaultData();
                }

                let nodeIni = require("node-ini");
                let confData = nodeIni.parseSync(confFilePath);
                if (!confData) {
                    console.error(PhnConfigFile.TAG + "_loadFromFile() [parseError] " + confFilePath);
                    return PhnConfigFile.createDefaultData();
                }

                // ini ファイルの [phnconfig] に設定が記述されている
                let conf: any = confData.phnconfig;
                if (!conf) {
                    console.error(PhnConfigFile.TAG + "_loadFromFile() [parseError] \"phnconfig\" not found");
                    return PhnConfigFile.createDefaultData();
                }

                let model = new Model.PhnConfig();
                for (let prop in conf) {
                    if (conf.hasOwnProperty(prop) &&
                        model.has(prop)) {

                        let val = PhnConfigFile.parseProperty(prop, conf[prop]);
                        console.log(PhnConfigFile.TAG + prop + ": " + val + " (" + typeof (val) + ")");

                        model.set(prop, val);
                    }
                }

                return model.toPhnConfigData();
            }

            /**
             * phnconfigのプロパティの値を該当する型に変換する
             * 変換できなかった場合はnullを返す
             *
             * @param prop {string} プロパティ名
             * @param val {string} 値
             */
            private static parseProperty(prop: string, val: string): any {
                switch (prop) {
                    case 'home_id':
                        return val;
                    case 'scene_no':
                        try {
                            return Number(val);
                        } catch (e) {
                            return null;
                        }
                    default:
                        if (val === 'true') {
                            return true;
                        } else if (val === 'false') {
                            return false;
                        } else {
                            return null;
                        }
                }
            }


            /**
             * phnconfig.iniのデータを初期値で生成
             *
             * @param {IPhnConfig}
             */
            private static createDefaultData(): IPhnConfig {
                let defModel = new Model.PhnConfig();
                return defModel.toPhnConfigData();
            }


            /**
             * phnconfigデータを保存
             *
             * @param huisFilesRoot {string}
             * @param data {IPhnConfig} 保存するデータ
             * @return {CDP.IPromise<void>}
             */
            static saveToFile(huisFilesRoot: string, data: IPhnConfig): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);
                let path = PhnConfigFile.getFilePath(huisFilesRoot);

                setTimeout(() => {
                    PhnConfigFile.writeToFile(path, data, df);
                });

                return promise;
            }


            /**
             * phnconfigデータをファイルに書き込む
             *
             * @param path {string} phnconfig.iniファイルのフルパス
             * @param data {IPhnConfig} 出力するデータ
             * @param df {JQueryDeferred<void>} 
             */
            private static writeToFile(path: string, data: IPhnConfig, df: JQueryDeferred<void>) {
                let text = "[phnconfig]\n";

                for (let i = 0; i < PhnConfigFile.KEYS.length; i++) {
                    let key = PhnConfigFile.KEYS[i];
                    let val = data[key];
                    if (val != null) {
                        text += (key + "=" + val + "\n");
                    }
                }

                try {
                    fs.outputFileSync(path, text);
                    df.resolve();
                } catch (e) {
                    console.error(PhnConfigFile.TAG + 'failed to output: ' + e);
                    df.fail();
                }
            }
        }

    }
}
