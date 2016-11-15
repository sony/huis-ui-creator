module Garage {
    export module Util {

        import Dialog = CDP.UI.Dialog;

        var TAG: string = "[Garage.Util.InformationDialog]";

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
                    var preVersion: string = fs.readFileSync("./version.txt").toString();
                } catch (err) {
                    console.error(FUNCTION_NAME + "version.txt が存在しません" + err);
                }

                try {
                    var lastNotifiedVersion: string = fs.readFileSync("./last_notified_version.txt").toString();
                } catch (err) {
                    console.log("last_notified_version.txt が存在しません");
                }

                try {
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
                    fs.outputFile("./last_notified_version.txt", fs.readFileSync("./version.txt"), function (err) { console.log(err); });

                    var dialog: Dialog = null;
                    var props: DialogProps = null;
                    var informationList: { dirName: string, date: string, imagePath: string, text: string }[] = [];
                    var pathToNotes: string = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/notes/"));
                    var notePaths: string[] = fs.readdirSync(pathToNotes); // noteの情報が入っているディレクトリのパス群
                    notePaths.reverse(); // 新しいnoteから表示させるために反転させる

                    // ダイアログにnoteを追加させていく
                    notePaths.forEach(function (dirName) {
                        informationList.push({
                            dirName: dirName, // 現状は利用していないプロパティ（特に表示したいお知らせがある場合はdirNameを利用してjQueryで操作）
                            date: fs.readFileSync(pathToNotes + dirName + "/date.txt", "utf8"),
                            imagePath: (pathToNotes + dirName + "/image.png"),
                            text: fs.readFileSync(pathToNotes + dirName + "/note.txt", "utf8")
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