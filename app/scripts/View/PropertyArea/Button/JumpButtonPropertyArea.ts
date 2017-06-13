/// <reference path="../../../include/interfaces.d.ts" />

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

        var TAG = "[Garage.View.PropertyArea.Button.JumpButtonPropertyArea] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-jump-button-property-area";
            export const NO_PAGE_SELECT_NUM: number = -1; //ページ指定用プルダウンで、なにも選択されていない状態での値。
            export const TEMPLATE_ACTION_PULLDOWN = "#template-action-pulldown";
            export const ACTION_PULLDOWN_DOM_ID = "#action-pulldown";
        }

        export class JumpButtonPropertyArea extends ButtonPropertyArea {

            /** 
             * ページジャンプ設定として使用する信号番号
             */
            static DEFAULT_SIGNAL_ORDER: number = 0;

            /**
             * constructor
             * @param {Model.ButtonItem} button 表示するページジャンプボタン
             * @param {string} editingRemoteId 編集中のリモコンのremoteId
             * @param {CommandManager} commandManager モデルの更新を実際におこなうCommandManager
             * @param {string} faceName  編集中のリモコン名
             * @param {Model.Module[]} modules  編集中のリモコンのモジュール
             */
            constructor(button: Model.ButtonItem, editingRemoteId: string, commandManager: CommandManager, faceName: string, modules: Model.Module[]) {
                super(button, editingRemoteId, constValue.TEMPLATE_DOM_ID, commandManager);

                this.remoteId = editingRemoteId;
                this.faceName = faceName;
                this.modules = modules;

                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInJump(editingRemoteId, faceName, modules);
                this.listenTo(this.getModel(), "change:state", this.render);
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

                let order = this.getOrderFrom($target);
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.renderRemoteIdOf(order, this.getRemoteIdFromPullDownOf(order));
                this.renderPagesOf(order, this.getModel().getDefaultStateId(), constValue.NO_PAGE_SELECT_NUM);

                this.updateModel();
            }


            /**
             * ページプルダウン変更時処理
             *
             * event {Event} changeイベント
             */
            private onPagePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onPagePullDownListChanged";
                let order = this.getOrderFrom($(event.currentTarget));
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.renderPagesOf(order, this.getModel().getDefaultStateId(), this.getPageFromPullDownOf(order));
                this.refreshPageSelect(order);
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
            render(): Backbone.View<Model.Item> {
                super.render();
                let FUNCTION_NAME = TAG + ":renderView : ";
                let targetState: Model.ButtonState = this.getModel().getDefaultState();

                this._renderNonOrderActionPulldown(targetState.stateId, ACTION_INPUTS_JUMP);
                this.setActionPullDown(this.getModel().getDefaultState());

                let targetJump = this.getModel().getDefaultState().action[0].jump;
                let targetRemoteId = targetJump.remote_id;
                if (huisFiles.getFace(targetRemoteId) != null || targetRemoteId == this.remoteId) {
                    this.renderRemoteIdOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER, targetJump.remote_id);
                } else {
                    this.renderRemoteIdOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER, null);
                }
                this.renderPagesOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER, targetState.stateId, targetJump.scene_no);

                this.$el.i18n();
                this._adaptJqueryMobileStyleToPulldown(this.$el);

                this.focusFirstPulldown();

                return this;
            }




            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /**
             * 保持しているモデルを表示内容に合わせてアップデートする。
             */
            private updateModel() {
                let FUNCTION_NAME = TAG + "updateModel : ";

                let tmpInput = this._getActionPulldownJquery(this.getModel().getDefaultStateId()).val();
                let tmpButton: Model.ButtonItem = this.getModel().clone();
                let tmpStates: Model.ButtonState[] = tmpButton.state;
                let tmpState: Model.ButtonState = tmpButton.getDefaultState();
                let newAction = tmpState.action[0];
                newAction.input = tmpInput;
                newAction.jump = this.getJumpSettings();
                let newActions: IAction[] = [newAction];
                tmpState.action = newActions;
                tmpStates[this.getDefaultStateId()] = tmpState;

                this._setStateMementoCommand(tmpStates);
            }

            /**
             * ActionのPullDownを変更する
             *
             * @param state {Model.ButtonState}
             */
            private setActionPullDown(state: Model.ButtonState) {
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
                var $actionPullDown: JQuery = this._getActionPulldownJquery(state.stateId);
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
                    huisFiles.createTmpFace(this.remoteId, this.faceName, this.modules));

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

                let $targetSignalContainer = this.getSignalContainerElementOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);
                $targetSignalContainer.i18n();
                this.refreshRemoteSelect(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);
                this.refreshPageSelect(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);

                this.updateModel();
            }


            /**
             * 現在のページジャンプ設定を取得する
             *
             * @return {IJump} 現在のページジャンプ設定
             */
            private getJumpSettings(): IJump {
                let remoteId = this.getRemoteIdFromPullDownOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);
                let sceneNoText = this.getPageFromPullDownOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);
                let sceneNo: number = sceneNoText ? Number(sceneNoText) : 0;

                return {
                    remote_id: remoteId,
                    scene_no: sceneNo
                };
            }


            /*
            * 何も設定されていない場合、プルダウンをアクセント表示
            */
            focusFirstPulldown() {
                let FUNCTION_NAME = TAG + "focusFirstPulldown";

                //Actionが1つしかない、かつ remoteIdもfunctionも初期値の場合、
                //remoteId設定用プルダウンをフォーカスする。
                let ActionNum = this.getModel().getDefaultState().action.length;

                let remoteId = this.getRemoteIdFromPullDownOf(JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);

                if (!Util.JQueryUtils.isValidValue(remoteId)) {
                    let input = this.$el.find("#select-remote-input-" + JumpButtonPropertyArea.DEFAULT_SIGNAL_ORDER);
                    setTimeout(() => {
                        input.focus();
                    });
                }
            }

        }
    }
}
