/// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import JQUtils = Util.JQueryUtils;
        var TAG = "[Garage.View.PhnConfig] ";

        export class PhnConfig extends Backbone.View<Model.PhnConfig> {


            /**
             * constructor
             */
            constructor(options?: Backbone.ViewOptions<Model.PhnConfig>) {
                super(options);
            }

            events(): any {
                return {
                    "change #dialog-config-radio-home-as-home": "onChangeHomeAsHomeRadio",
                    "change #dialog-config-radio-jump-as-home": "onChangeJumpAsHomeRadio",
                    "click #dialog-config-button-change-home-dest": "onClickChangeHomeDestButton",
                    "change #dialog-config-checkbox-show-button-setting": "onChangeShowSettingButtonCheckbox",
                    "change #dialog-config-checkbox-show-button-add": "onChangeShowAddButtonCheckbox",
                    "change #dialog-config-checkbox-show-button-move": "onChangeShowMoveButtonCheckbox",
                    "change #dialog-config-checkbox-disable-swipe": "onChangeDisableSwipeCheckbox",
                    "change #dialog-config-checkbox-block-storage-access": "onChangeBlockStorageAccessCheckbox",

                    "click #dialog-config-button-default": "onClickDefaultButton",

                    "click #dialog-config-button-submit": "onClickSubmitButton",
                    "click #dialog-config-button-cancel": "onClickCancelButton"
                };
            }

            initialize() {
                this.render();
            }

            render(): PhnConfig {
                let templateFile = CDP.Framework.toUrl("/templates/dialogs.html");
                let jst = Tools.Template.getJST("#dialog-config", templateFile);

                let data = this.model.toPhnConfigData();
                let checkHomeAsHomeRadio: boolean = (this.model.homeId === Model.PhnConfig.HOME_ID_TO_HOME);
                data['checkHomeAsHomeRadio'] = checkHomeAsHomeRadio;

                if (!checkHomeAsHomeRadio) {
                    data['destLabel'] = this.createDestLabel();
                }

                data['allowAccessToStorage'] = this.model.allowAccessToStorage;
                

                let $dialog = $(jst(data));

                this.$el.append($dialog);

                $dialog.i18n();
                $dialog.trigger('create');

                return this;
            }



            /**
             * 「本体ホームボタン押下時にホーム画面を表示する」チェックボックスが変更された場合の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeHomeAsHomeRadio(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                this.changeEnableOfChangeHomeDestButton(!val);
                this.updateHomeDestLabel();

                this.enableSubmitButton();
            }


            /**
             * 「本体ホームボタン押下時にリモコン画面を表示する」チェックボックスが変更された場合の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeJumpAsHomeRadio(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                if (val) {
                    this.showSelectDestDialog(() => {
                        // ラジオボタンから起動された選択ダイアログのキャンセル時にはラジオボタンを戻す
                        $('input[name=radio-home-dest]')
                            .val(['home'])
                            .checkboxradio('refresh');
                    });
                }
            }


            /**
             * ホームボタンの跳び先変更ボタンの有効化/無効化
             *
             * @param enable {boolean} ボタンの有効/無効
             */
            private changeEnableOfChangeHomeDestButton(enable: boolean) {
                $('#dialog-config-button-change-home-dest').prop('disabled', !enable);
            }


            /**
             * ホームボタンの跳び先変更ボタン押下時処理
             *
             * @param event {Event} clickイベント
             */
            private onClickChangeHomeDestButton(event: Event) {
                this.showSelectDestDialog();

            }


            /**
             * 跳び先選択ダイアログを表示
             */
            private showSelectDestDialog(onCancel?: () => void) {
                let dialog = new Util.SelectRemotePageDialog(
                    $.i18n.t("dialog.title.STR_DIALOG_TITLE_SELECT_JUMP"),
                    { remote_id: this.model.homeId, scene_no: this.model.sceneNo });

                dialog.show(
                    (result) => {
                        // OK押下時
                        this.setHomeDest(result);
                        this.updateHomeDestRadio();
                        this.enableSubmitButton();
                    },
                    () => {
                        // Cancel押下時
                        if (onCancel != null) {
                            onCancel();
                        }
                    }
                );
            }


            /**
             * ホームボタン跳び先設定ラジオボタンの選択状態を更新
             */
            private updateHomeDestRadio() {
                let radio = $('input[name=radio-home-dest]');

                if (this.model.homeId === Model.PhnConfig.HOME_ID_TO_HOME) {
                    radio.val(['home']);
                    this.changeEnableOfChangeHomeDestButton(false);
                } else {
                    radio.val(['jump']);
                    this.changeEnableOfChangeHomeDestButton(true);
                }

                radio.checkboxradio('refresh');
            }


            /**
             * ホームボタン跳び先設定を変更
             *
             * @param dest {IJump} 跳び先情報
             */
            private setHomeDest(dest: IJump) {
                this.model.homeId = dest.remote_id;
                this.model.sceneNo = dest.scene_no;

                this.updateHomeDestLabel();
            }


            /**
             * モデル情報からホームボタンの跳び先情報として表示する文字列を生成
             */
            private createDestLabel(): string {
                if (this.model.homeId === Model.PhnConfig.HOME_ID_TO_HOME) {
                    return '';
                }

                let remoteName: string;
                let face = huisFiles.getFace(this.model.homeId);
                if (face == null) {
                    console.error('face not found. remote_id: ' + this.model.homeId);
                    remoteName = this.model.homeId;
                } else {
                    remoteName = face.name;
                }

                return remoteName + " ページ" + (this.model.sceneNo + 1);
            }


            /**
             * ホームボタン跳び先表示ラベルの文字列を変更
             */
            private updateHomeDestLabel() {
                $('#dialog-config-label-jump-dest').text(this.createDestLabel());
            }


            /**
             * ホームボタン設定ラジオボタンの状態に合わせてモデル情報を更新
             */
            private updateHomeDest() {
                let toHome: boolean = $('#dialog-config-radio-home-as-home').prop('checked');
                if (toHome) {
                    this.model.setDefaultHomeDest();
                }
            }


            /**
             * 「ホーム画面の設定ボタンを非表示」チェックボックス変更時の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeShowSettingButtonCheckbox(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                // 「非表示にする」のチェックボックスなので保存時の値としては逆を設定
                this.model.displaySettingButton = !val;

                this.enableSubmitButton();
            }


            /**
             * 「ホーム画面の設定ボタンを非表示」チェックボックスをモデル状態に合わせて更新
             */
            private updateShowSettingButtonCheckbox() {
                $('#dialog-config-checkbox-show-button-setting')
                    .prop('checked', !this.model.displaySettingButton)
                    .checkboxradio('refresh');
            }


            /**
             * 「ホーム画面の追加ボタンを非表示」チェックボックス変更時の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeShowAddButtonCheckbox(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                // 「非表示にする」のチェックボックスなので保存時の値としては逆を設定
                this.model.displayAddButton = !val;

                this.enableSubmitButton();
            }


            /**
             *「ホーム画面の追加ボタンを非表示」チェックボックスをモデル状態に合わせて更新
             */
            private updateShowAddButtonCheckbox() {
                $('#dialog-config-checkbox-show-button-add')
                    .prop('checked', !this.model.displayAddButton)
                    .checkboxradio('refresh');
            }

            /**
             * 「ヘッダーの左右移動ボタンを非表示」チェックボックス変更時の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeShowMoveButtonCheckbox(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                // 「非表示にする」のチェックボックスなので保存時の値としては逆を設定
                this.model.displayRemoteArrow = !val;

                this.enableSubmitButton();
            }


            /**
             *「ヘッダーの左右移動ボタンを非表示」チェックボックスをモデル状態に合わせて更新
             */
            private updateShowMoveButtonCheckbox() {
                $('#dialog-config-checkbox-show-button-move')
                    .prop('checked', !this.model.displayRemoteArrow)
                    .checkboxradio('refresh');
            }


            /**
             * 「スワイプによる移動を無効化」チェックボックス変更時の処理
             *
             * @param event {Event} changeイベント
             */
            private onChangeDisableSwipeCheckbox(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');

                // 「無効化する」のチェックボックスなので保存時の値としては逆を設定
                this.model.enableHorizontalRemotePageSwipe = !val;
                this.model.enableVerticalRemovePageSwipe = !val;

                this.enableSubmitButton();
            }



            /**
             *「スワイプによる移動を無効化」チェックボックスをモデル状態に合わせて更新
             */
            private updateDisableSwipeCheckbox() {
                $('#dialog-config-checkbox-disable-swipe')
                    .prop('checked', !this.model.enableHorizontalRemotePageSwipe)
                    .checkboxradio('refresh');
            }


            /**
             * 「ストレージへのアクセスをブロック」チェックボックス変更時の処理
             *
             * @param event {Event}
             */
            private onChangeBlockStorageAccessCheckbox(event: Event) {
                let val: boolean = $(event.currentTarget).prop('checked');
                this.model.allowAccessToStorage = !val;

                this.enableSubmitButton();

            }


            /**
             *「ストレージへのアクセスをブロック」チェックボックスをモデル状態に合わせて更新
             */
            private updateBlockStorageAccessCheckbox() {
                $('#dialog-config-checkbox-block-storage-access')
                    .prop('checked', !this.model.allowAccessToStorage)
                    .checkboxradio('refresh');
            }


            /**
             * 「デフォルトに戻す」ボタン押下時処理
             *
             * event {Event} clickイベント
             */
            private onClickDefaultButton(event: Event) {
                this.model.set(this.model.defaults());

                this.updateHomeDestRadio();
                this.updateHomeDestLabel();
                this.updateShowSettingButtonCheckbox();
                this.updateShowAddButtonCheckbox();
                this.updateShowMoveButtonCheckbox();
                this.updateDisableSwipeCheckbox();
                this.updateBlockStorageAccessCheckbox();

                this.enableSubmitButton();
            }



            /**
             * OKボタン押下時処理
             *
             * @param event {Event} clickイベント
             */
            private onClickSubmitButton(event: Event) {
                // ホームボタンの跳び先設定のみOK押下時にモデルに反映
                this.updateHomeDest();

                // ストレージロック設定の反映
                this.updateStorageLockFile();

                // 設定保存
                this.updatePhnConfigFile();

                this.removeConfigDialog();

            }


            /**
             * キャンセルボタン押下時処理
             *
             * @param event {Event} clickイベント
             */
            private onClickCancelButton(event: Event) {
                this.removeConfigDialog();
            }


            /**
             * OKボタンを有効化
             */
            private enableSubmitButton() {
                this.$el.find('#dialog-config-button-submit').prop('disabled', false);
            }


            /**
             * 詳細設定ダイアログのDomを削除
             */
            private removeConfigDialog() {
                this.undelegateEvents();
                this.$el.children('#dialog-config-screen').remove();
            }


            /**
             * ストレージロックファイルをモデルに合わせて更新
             */
            private updateStorageLockFile() {
                if (this.model.allowAccessToStorage) {
                    storageLock.cancelToLock();
                } else {
                    storageLock.readyToLock();
                }
            }


            /**
             * 詳細設定をファイルに出力
             */
            private updatePhnConfigFile() {
                let dialog = new CDP.UI.Dialog("#common-dialog-spinner", {
                    src: CDP.Framework.toUrl("/templates/dialogs.html"),
                    title: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SYNC_DETAIL_PROPERTY"),
                });

                let $dialog = dialog.show();

                huisFiles.updatePhnConfigFile(this.model.toPhnConfigData())
                    .then(() => {
                        return this.stopSpinnerOnSuccess($dialog);
                    })
                    .always(() => {
                        dialog.close();
                    });
            }


            /**
             * 保存処理中を表すスピナーを停止し処理完了表示に変更する
             *
             * @param $dialog {JQuery} 設定保存処理中を表すスピナーダイアログ
             */
            private stopSpinnerOnSuccess($dialog: JQuery): CDP.IPromise<void> {
                let df = $.Deferred<void>();
                let promise = CDP.makePromise(df);

                let $spinner = $dialog.find("#common-dialog-center-spinner");

                $spinner.removeClass("spinner");//アイコンが回転しないようにする。
                $spinner.css("background-image", 'url("../res/images/icon_done.png")');
                $dialog.find("p").html($.i18n.t("dialog.message.STR_DIALOG_MESSAGE_SYNC_DETAIL_PROPERTY_DONE"));

                setTimeout(() => {
                    df.resolve();
                }, 2000);

                return promise;
            }


        }

    }
}