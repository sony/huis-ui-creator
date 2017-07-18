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

module Garage {
    export module Util {

        import Dialog = CDP.UI.Dialog;

        var TAG: string = "[Garage.Util.InformationDialog]";

        namespace ConstValue {
            export const LAST_NOTIFIED_VERSION_TEXT_PATH: string = Util.PathManager.join(GARAGE_FILES_ROOT, "last_notified_version.txt");
            export const FILE_NAME_DATE: string = "date.txt";
            export const FILE_NAME_IMAGE: string = "image.png";
            export const FILE_NAME_NOTE: string = "note.txt";
            export const DIR_NAME_WINDOWS: string = "Windows";
            export const DIR_NAME_MAC: string = "Mac";
        }

        interface InformationList {
            dirName: string;
            date: string;
            imagePath: string;
            text: string;
        }

        /**
         * @class Notifier
		 * @brief ui-creatorアップデート後の初回起動時かどうかの判定を行い、お知らせダイアログを表示するクラス
		 */
        export class InformationDialog {

            private lastNotifiedVersion_: Model.VersionString;

            private _readLastNotifiedVersion() {
                let FUNCTION_NAME: string = TAG + " : _readLastNotifiedVersion : ";

                if (fs.existsSync(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH)) {
                    this.lastNotifiedVersion_ = new Model.VersionString(fs.readFileSync(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH).toString());
                } else {
                    // first launch after installation
                    console.warn(FUNCTION_NAME + ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH + " is not exist.");
                    this.lastNotifiedVersion_ = new Model.VersionString("0.0.0");
                }
            }

            /**
             * ui-creatorアップデート後の初回起動時かどうかの判定を行う関数
             */
            private shouldNotify() {
                let FUNCTION_NAME: string = TAG + " : shouldNotify : ";

                let currentVersion = new Model.VersionString(APP_VERSION);

                try {
                    return currentVersion.isNewerThan(this.lastNotifiedVersion_);

                } catch (err) {
                    console.error(FUNCTION_NAME + err);
                }
            }

            private createInfoListFromVersionDir(versionDirFullPath: string): InformationList[] {

                var informationList: InformationList[] = [];
                var contentsDirs: string[] = fs.readdirSync(versionDirFullPath); // noteの情報が入っているディレクトリのパス群

                //もしコンテンツがない場合、なにも表示しない
                if (!this.isExistValidContents(contentsDirs)) {
                    return;
                }

                contentsDirs.reverse(); // 新しいnoteから表示させるために反転させる

                // ダイアログにnoteを追加させていく
                contentsDirs.forEach(function (dirName) {
                    let articlePath = PathManager.join(versionDirFullPath, dirName);
                    informationList.push({
                        dirName: dirName, // 現状は利用していないプロパティ（特に表示したいお知らせがある場合はdirNameを利用してjQueryで操作）
                        imagePath: PathManager.join(articlePath, ConstValue.FILE_NAME_IMAGE),
                        date: fs.readFileSync(PathManager.join(articlePath, ConstValue.FILE_NAME_DATE), "utf8"),
                        text: fs.readFileSync(PathManager.join(articlePath, ConstValue.FILE_NAME_NOTE), "utf8")
                    });
                });

                return informationList;
            }

            /**
             * 最後にお知らせDialogを表示したVersionからの機能差分をユーザに通知する。
             * 差分が無ければ特に何も行わない。
             */
            notifyIfNecessary() {
                this._readLastNotifiedVersion();
                if (this.shouldNotify()) {
                    this.notify();
                }
            }

            /**
             * notesディレクトリを参照し、お知らせダイアログを表示する関数
             *
             * お知らせを追加する場合は/app/res/notes/のディレクトリにフォルダを追加し、
             * 追加したディレクトリ内に date.txt, image.png, note.txt の３つのファイルを追加してください。
             * テキストファイルはutf-8で保存してください。shift-JISだと文字化けします。
             */
            private notify() {
                let FUNCTION_NAME: string = TAG + " : Notify : ";

                var informationList: InformationList[] = [];
                var dialog: Dialog = null;

                try {

                    var props: DialogProps = null;

                    //お知らせダイアログにだすコンテンツがあるフォルダを指定
                    var pathToNotes: string = Util.MiscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/notes/"));
                    // Garage のファイルのルートパス設定 (%APPDATA%\Garage)
                    if (Util.MiscUtil.isWindows()) {
                        pathToNotes = Util.PathManager.join(pathToNotes, ConstValue.DIR_NAME_WINDOWS + "/");
                    } else if (Util.MiscUtil.isDarwin()) {
                        pathToNotes = path.join(pathToNotes, ConstValue.DIR_NAME_MAC + "/");
                    } else {
                        console.error("Error: unsupported platform");
                    }

                    var contentsDirs: string[] = fs.readdirSync(pathToNotes); // noteの情報が入っているディレクトリのパス群
                    contentsDirs = contentsDirs.filter((path) => {
                        let infoVersionString = new Model.VersionString(path);
                        return infoVersionString.isNewerThan(this.lastNotifiedVersion_);
                    });

                    contentsDirs.reverse(); // 新しいnoteから表示させるために反転させる

                    for (let dir of contentsDirs) {
                        informationList = informationList.concat(this.createInfoListFromVersionDir(PathManager.join(pathToNotes, dir)));
                    }

                    dialog = new CDP.UI.Dialog("#common-dialog-information", {
                        src: CDP.Framework.toUrl("/templates/dialogs.html"),
                        title: $.i18n.t("information.STR_INFORMATION_TITLE"),
                        informationList: informationList,
                        dismissible: true,
                    });

                    dialog.show();

                    //お知らせダイアログを出すか否か判定するファイルを書き出す。
                    fs.outputFile(ConstValue.LAST_NOTIFIED_VERSION_TEXT_PATH, APP_VERSION, function (err) { console.log(err); });

                } catch (err) {
                    console.error(FUNCTION_NAME + "information dialog の表示に失敗しました。" + err);
                }
            }

            /**
             * お知らせダイアログに表示するコンテンツが存在するか判定する。
             * @param {string[]} contentsDirs お知らせダイアログのコンテンツが存在するフォルダに存在するファイル/フォルダ名の配列
             * @return {boolean} 000, 001, のように XXX(Xは整数) のフォルダが場合true, ひとつも存在しない場合false
             */
            private isExistValidContents(contentsDirs: string[]): boolean {
                let FUNCTION_NAME: string = TAG + " : isExistValidContents : ";

                //対象のパスにひとつもファイルもフォルダもない場合false;
                if (contentsDirs.length == 0) {
                    return false;
                }

                //一つでも、有効なコンテンツ名がある場合、true
                for (let dirName of contentsDirs) {
                    if (dirName.match(/^[0-9]{3}$/)) {
                        return true;
                    }
                }

                //ひとつも、有効なコンテンツ名がない場合、false;
                return false;
            }


        }
    }
}
