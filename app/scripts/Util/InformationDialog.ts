module Garage {
    export module Util {

        import Dialog = CDP.UI.Dialog;

        var TAG: string = "[Garage.Util.InformationDialog]";

        var VERSION_TEXT_PATH: string = "./version.txt";
        var LAST_NOTIFIED_VERSION_TEXT_PATH: string = "./last_notified_version.txt";
        var FILE_NAME_DATE  = "date.txt";
        var FILE_NAME_IMAGE = "image.png";
        var FILE_NAME_NOTE  = "note.txt";

        /**
         * @class Notifier
		 * @brief ui-creatorアップデート後の初回起動時かどうかの判定を行い、お知らせダイアログを表示するクラス
		 */
        export class InformationDialog {

            /**
             * ui-creatorアップデート後の初回起動時かどうかの判定を行う関数
             */
            public shouldNotify() {
                let FUNCTION_NAME: string = TAG + " : shouldNotify : ";

                try {
                    let preVersion: string = fs.readFileSync(VERSION_TEXT_PATH).toString();
                    let lastNotifiedVersion: string;
                    if (fs.existsSync(LAST_NOTIFIED_VERSION_TEXT_PATH)) {
                        lastNotifiedVersion = fs.readFileSync(LAST_NOTIFIED_VERSION_TEXT_PATH).toString();
                    } else {
                        console.log(FUNCTION_NAME + LAST_NOTIFIED_VERSION_TEXT_PATH + " is not exist.");
                    }
                    if (preVersion === lastNotifiedVersion) return false;
                    else return true;
                } catch (err) {
                    console.error(FUNCTION_NAME + err);
                }
            }

            /**
             * notesディレクトリを参照し、お知らせダイアログを表示する関数
             *
             * お知らせを追加する場合は/app/res/notes/のディレクトリにフォルダを追加し、
             * 追加したディレクトリ内に date.txt, image.png, note.txt の３つのファイルを追加してください。
             * テキストファイルはutf-8で保存してください。shift-JISだと文字化けします。
		     */
            public notify() {
                let FUNCTION_NAME: string = TAG + " : Notify : ";

                try {
                    fs.outputFile(LAST_NOTIFIED_VERSION_TEXT_PATH, fs.readFileSync(VERSION_TEXT_PATH), function (err) { console.log(err); });

                    var dialog: Dialog = null;
                    var props: DialogProps = null;
                    var informationList: { dirName: string, date: string, imagePath: string, text: string }[] = [];
                    var pathToNotes: string = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/notes/"));
                    var notePaths: string[] = fs.readdirSync(pathToNotes); // noteの情報が入っているディレクトリのパス群
                    notePaths.reverse(); // 新しいnoteから表示させるために反転させる

                    // ダイアログにnoteを追加させていく
                    notePaths.forEach(function (dirName) {
                        let path = pathToNotes + dirName + "/";
                        informationList.push({
                            dirName   : dirName, // 現状は利用していないプロパティ（特に表示したいお知らせがある場合はdirNameを利用してjQueryで操作）
                            imagePath : (path + FILE_NAME_IMAGE),
                            date      : fs.readFileSync(path + FILE_NAME_DATE, "utf8"),
                            text      : fs.readFileSync(path + FILE_NAME_NOTE, "utf8")
                        });
                    });

                    dialog = new CDP.UI.Dialog("#common-dialog-information", {
                        src: CDP.Framework.toUrl("/templates/dialogs.html"),
                        title: $.i18n.t("information.STR_INFORMATION_TITLE"),
                        informationList: informationList,
                        dismissible: true,
                    });
                    dialog.show();
                } catch (err) {
                    console.error(FUNCTION_NAME + "information dialog の表示に失敗しました。" + err);
                }
            }
        }
    }
} 