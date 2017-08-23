/// <referecen path="../include/interfaces.d.ts" />

module Garage {
    export module Util {

        export class StorageLock {
            /**
             * ロックされているかの判定に使用するファイル
             * HUISルートからの相対パス
             */
            private static CheckFiles: string[] = [
                'remotelist.ini'
            ];

            /** ロックファイル名 */
            private static LockFileName: string = 'lock.key';

            /** ロックファイルソースパス */
            private lockFile: string = '';

            /** アンロックファイル名 */
            private static UnlockFileName: string = 'unlock.key';

            /** アンロックファイルソースパス */
            private unlockFile: string = '';



            constructor() {
                let keysDir = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/keys"));
                this.lockFile = Util.PathManager.join(keysDir, StorageLock.LockFileName);
                this.unlockFile = Util.PathManager.join(keysDir, StorageLock.UnlockFileName);
            }


            /**
             * ストレージがロックされているかを取得
             */
            isLocked(): boolean {
                return !this.existCheckFiles();
            }


            /**
             * HUIS接続解除時にロックされる状態かどうかを取得
             *
             * @return {boolean} 
             */
            isReadyToLock(): boolean {
                return this.existLockFile();
            }


            /**
             * ロックを解除
             *
             * @return {boolean} 解除成否
             */
            unlock(): boolean {
                return this.createUnlockFile();
            }

            /**
             * HUIS接続解除時にロックされる状態にする
             */
            readyToLock(): boolean {
                return this.createLockFile();
                // 同期は呼び出し元に任せる
            }

            /**
             * HUIS接続解除時にロックされない状態にする
             */
            cancelToLock(): boolean {
                return this.removeLockFile();
            }


            /**
             * ロックされているかの判定ファイルが全て存在するか検査する
             * 全て存在する場合はtrue、そうでない場合はfalseを返す
             *
             * @return {boolean}
             */
            private existCheckFiles(): boolean {
                for (let file of StorageLock.CheckFiles) {
                    let filePath = Util.PathManager.join(HUIS_ROOT_PATH, file);

                    try {
                        if (!fs.existsSync(filePath)) {
                            return false;
                        }
                    } catch (e) {
                        console.log('Errored on checking storage-lock at "' + filePath + '": ' + e);
                        return false;
                    }
                }

                return true;
            }


            /**
             * ロックファイルがあるかどうか検査する。
             * ロックファイルが存在し、かつアプリで保有しているファイルと同一の場合はtrue、
             * そうでない場合はfalseを返す。
             *
             * @return {boolean}
             */
            private existLockFile(): boolean {
                let lockFileOnHuis = Util.PathManager.join(HUIS_FILES_ROOT, StorageLock.LockFileName);

                try {
                    if (fs.existsSync(lockFileOnHuis)) {
                        return this.isSameLockFile(lockFileOnHuis, this.lockFile);
                    }
                } catch (e) {
                    return false;
                }

                return false;
            }


            /**
             * 2つのロックファイルが同一のものか検査する
             * 同一の場合はtrue、そうでない場合はfalseを返す
             *
             * @param file1 {string}
             * @param file2 {string}
             * @return {boolean}
             */
            private isSameLockFile(file1: string, file2: string): boolean {
                try {
                    let text1 = fs.readFileSync(file1);
                    let text2 = fs.readFileSync(file2);
                    if (text1.length != text2.length) {
                        return false;
                    }

                    for (let i = 0; i < text1.length; i++) {
                        if (text1[i] != text2[i]) {
                            return false;
                        }
                    }

                } catch (e) {
                    console.warn('StorageLock.isSameLockFile: ' + e);
                    return false;
                }

                return true;
            }



            /**
             * アンロックファイルをHUIS直下に生成
             *
             * @return {boolean} アンロックファイル生成の成否
             */
            private createUnlockFile(): boolean {
                let dst = Util.PathManager.join(HUIS_ROOT_PATH, StorageLock.UnlockFileName);

                try {
                    if (!fs.existsSync(this.unlockFile)) {
                        console.error('unlock file not found: ' + this.unlockFile);
                        return false;
                    }

                    fs.copySync(this.unlockFile, dst);
                } catch (e) {
                    console.error('failed to copy unlock file: ' + this.unlockFile + ' -> ' + dst);
                    return false;
                }

                return true;
            }


            /**
             * ロックファイルをHuisFiles直下に生成
             *
             * @return {boolean} ロックファイル生成の成否
             */
            private createLockFile(): boolean {
                let dst = Util.PathManager.join(HUIS_FILES_ROOT, StorageLock.LockFileName);

                try {
                    if (!fs.existsSync(this.lockFile)) {
                        console.error('lock file not found: ' + this.lockFile);
                        return false;
                    }

                    fs.copySync(this.lockFile, dst);
                    // 本体への同期はここではしない
                } catch (e) {
                    console.error('failed to copy lock file: ' + this.lockFile + ' -> ' + dst);
                    return false;
                }

                return true;
            }

            /**
             * ロックファイルを削除
             *
             * @return {boolean} ロックファイル削除の成否
             */
            private removeLockFile(): boolean {
                let lockFileOnHuisFiles = path.join(HUIS_FILES_ROOT, StorageLock.LockFileName);

                try {
                    if (fs.existsSync(lockFileOnHuisFiles)) {
                        // ロックファイルを削除
                        fs.removeSync(lockFileOnHuisFiles);
                    }
                    // 本体への同期はここではしない？
                    // ★★本体への同期時に削除はしていない気がするので確認
                } catch (e) {
                    console.error('failed to remove lock file: ' + this.lockFile);
                    return false;
                }

                return true;
            }


        }


    }
}
