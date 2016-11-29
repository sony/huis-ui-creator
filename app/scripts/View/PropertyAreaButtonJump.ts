 /// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

        var TAG = "[Garage.View.PropertyAreaButtonJump] ";

        export class PropertyAreaButtonJump extends PropertyAreaButtonBase {
            /**
             * 編集中リモコンの remote_id
             * Jump機能の跳び先ではないことに注意。
             */
            //private remoteId: string;

            /**
             * 編集中リモコン名
             * Jump機能の跳び先ではないことに注意。
             */
            private faceName: string;

            /**
             * 編集中リモコンのモジュール
             */
            //private gmodules: IGModule[];

            /**
             * constructor
             * @param remoteId {string} 編集中のリモコンの remote_id
             * @param faceName {string} 編集中のリモコン名
             * @param gmodules {IGModule[]} 編集中のリモコンのモジュール
             */
            constructor(remoteId: string, faceName: string, gmodules: IGModule[], options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);

                this.remoteId = remoteId;
                this.faceName = faceName;
                this.gmodules = gmodules;

                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInJump(remoteId, faceName, gmodules);
            }


            events() {
                return {
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .page-input": "onPagePullDownListChanged",
                    "click #button-change-jump-dest": "onChangeJumpDestButtonClicked"
                };
            }


            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";
                this.updateModel();
            }

            /**
             * リモコン選択用のプルダウンが変更されたときに呼ばれる
             */
            private onRemotePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onRemotePullDownListChanged";
                let $target = $(event.currentTarget);
                let remoteId = $target.val();

                //remoteIdがない場合、処理を終了する。
                if (remoteId == "none" || remoteId == null) {
                    return;
                }

                // プルダウンに設定されている順番を取得
                let order = this.getOrderFrom($target);

                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.renderPagesOf(order, undefined);

                this.updateModel();

                //jQueryのスタイルをあてる。
                let $targetSignalContainer = this.getSignalContainerElementOf(order);
                $targetSignalContainer.i18n();
                this.refreshPageSelect($targetSignalContainer);
            }

            private onPagePullDownListChanged(event: Event) {
                this.updateModel();
            }

            /**
             * ページジャンプ設定変更ボタン押下時イベント
             *
             * @param event {Event}
             */
            private onChangeJumpDestButtonClicked(event: Event) {
                this.showSelectRemotePageDialog();
            }




            /**
             * 保持しているモデルの内容で詳細エリアを描画する
             */
            renderView(): JQuery {
                let FUNCTION_NAME = TAG + ":renderView : ";

                let templateState = Tools.Template.getJST("#template-property-jump-button-state", this.templateItemDetailFile_);
                let $jumpContainer = this.$el.nextAll("#states-container");
                let stateData = this.createStateData(this.defaultState);
                stateData.actionList = ACTION_INPUTS_JUMP;
                stateData.jump = this.defaultState.action[0].jump;
                let $stateDetail = $(templateState(stateData));

                //テキストラベルの大きさの設定値を反映する。
                var $textSize = $stateDetail.find(".property-state-text-size[data-state-id=\"" + stateData.id + "\"]");
                if (!_.isUndefined(stateData.label)) {
                    var textSizeString: string = stateData.label.size;
                    $textSize.val(textSizeString);
                }

                $jumpContainer.append($stateDetail);

                this.setActionPullDown(this.defaultState);
                this.renderRemoteIdOf(0, undefined, this.defaultState.action[0].jump.remote_id);
                this.renderPagesOf(0, undefined, this.defaultState.action[0].jump.scene_no); 

                $jumpContainer.i18n();

                return $jumpContainer;
            }


            

            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /**
             * 保持しているモデルを表示内容に合わせてアップデートする。
             */
            private updateModel() {
                let FUNCTION_NAME = TAG + "updateModel : ";

                let tmpInput = this.$el.find(".action-input[data-state-id=\"" + this.model.default + "\"]").val();
                this.defaultState.action[0].input = tmpInput;
                this.defaultState.action[0].jump = this.getJumpSettings();

                let states: IGState[] = [];
                states.push(this.defaultState);

                this.model.state = states;
                this.trigger("updateModel");
            }

            /**
             * ActionのPullDownを変更する
             *
             * @param state {IGState}
             */
            private setActionPullDown(state: IGState) {
                let FUNCTION_NAME = TAG + "changeActionPullDown : ";

                let actions: IAction[] = state.action;
                if (actions == null || actions.length == 0) {
                    console.warn(FUNCTION_NAME + "acctions is null");
                    return;
                }

                //ActionのPullDownを変更する。
                //inputを読み取るアクションのIDは0とする。
                //マクロは複数の異なるアクションを設定できないためどのアクションを選択しても変わらない。
                let TARGET_ACTION = 0;
                var $actionPullDown: JQuery = this.$el.find(".action-input[data-state-id=\"" + state.id + "\"]");
                if ($actionPullDown && actions[TARGET_ACTION] && actions[TARGET_ACTION].input) {
                    $actionPullDown.val(actions[TARGET_ACTION].input);
                }
            }


            /**
             * ページジャンプ先を選択するためのリモコンページ選択ダイアログを表示する
             */
            private showSelectRemotePageDialog() {
                let dialog = new Util.SelectRemotePageDialog(
                    $.i18n.t("dialog.title.STR_DIALOG_TITLE_SELECT_JUMP"),
                    this.getJumpSettings(),
                    huisFiles.createTmpFace(this.remoteId, this.faceName, this.gmodules));

                dialog.show((result) => {
                    this.updateJumpSettings(result);
                });
            }


            /**
             * ページジャンプ設定とその表示を更新する
             * 新規ページジャンプ設定を渡さなかった場合は表示のみ更新する
             *
             * @param newSettings {IJump} ページジャンプ設定
             */
            private updateJumpSettings(newSettings: IJump) {
                this.setRemoteIdPullDownOf(0, newSettings.remote_id);
                
                this.renderPagesOf(0, undefined, newSettings.scene_no);

                let $targetSignalContainer = this.getSignalContainerElementOf(0);
                $targetSignalContainer.i18n();
                this.refreshRemoteSelect($targetSignalContainer);
                this.refreshPageSelect($targetSignalContainer);

                this.updateModel();
            }

            private refreshRemoteSelect($signalContainer: JQuery) {
                $signalContainer.find('#signal-remote-container .custom-select select').selectmenu('refresh');
            }

            private refreshPageSelect($signalContainer: JQuery) {
                $signalContainer.find('#signal-page-container .custom-select select').selectmenu('refresh', true);
            }

            /**
             * 詳細エリア表示用のface名を取得する
             *
             * @param remoteId {string} 検索する remote_id
             * @return {string} 表示用のface名
             */
            private getFaceNameForDisplay(remoteId: string): string {
                if (remoteId == null ||
                    remoteId.length <= 0) {
                    return $.i18n.t("edit.property.STR_EDIT_PROPERTY_JUMP_NO_DEST");
                }

                if (remoteId == this.remoteId) {
                    // 編集中リモコン
                    return this.faceName;
                }

                let face = huisFiles.getFace(remoteId);
                if (face) {
                    // HuisFiles内のリモコン
                    return face.name;
                }

                return remoteId;
            }


            /**
             * ページジャンプ跳び先ページ番号の詳細エリア表示用テキストを取得する
             *
             * @param jump {IJump} ページジャンプ設定
             * @return {string} 表示用ページ番号
             */
            private createPageNumberText(jump: IJump): string {
                let total: number;
                if (jump.remote_id == this.remoteId) {
                    // 編集中ページを跳び先としている場合
                    total = this.gmodules.length;

                } else {
                    let face = huisFiles.getFace(jump.remote_id);
                    if (face) {
                        // 総ページ数を取得するためにViewを生成
                        let modulesView = new Module({
                            el: $(''),
                            attributes: {
                                remoteId: face.remoteId,
                                modules: face.modules,
                                materialsRootPath: HUIS_FILES_ROOT
                            }
                        });
                        total = modulesView.getPageCount();
                    } else {
                        // 存在しないリモコン
                        total = -1;//★★TODO
                    }
                }

                return (jump.scene_no + 1) + " / " + total;
            }


            /**
             * 現在のページジャンプ設定を取得する
             *
             * @return {IJump} 現在のページジャンプ設定
             */
            private getJumpSettings(): IJump {
                let remoteId = this.getRemoteIdFromPullDownOf(0); //this.$el.find("#property-jump-remote-name").data("remote-id");
                let sceneNoText = this.getPageFromPullDownOf(0); //this.$el.find("#property-jump-scene-no").data("scene-no");
                let sceneNo: number = sceneNoText ? Number(sceneNoText) : 0;

                return {
                    remote_id: remoteId,
                    scene_no: sceneNo
                };
            }


        }
    }
}