/// <reference path="../include/interfaces.d.ts" />

module Garage {
	export module View {
		export interface ICommand {
			invoke();
			undo();
			redo();
		}

		export class CommandManager {
			private maxStack_: number;
			private undoStack_: MementoCommand[];
			private redoStack_: MementoCommand[];

			/**
			 * コンストラクター
			 * 
			 * @param maxStack? {number} stack 数の上限。未指定の場合は上限なし。 
			 */
			constructor(maxStack?: number) {
				this.undoStack_ = [];
				this.redoStack_ = [];
				// 未指定 (undefined) でない場合は、1 以上になるように補正
				this.maxStack_ = (_.isUndefined(maxStack) || 0 < maxStack) ? maxStack : 1;
			}

			/**
			 * コマンドを実行する。
			 * 
			 * @param command {MementoCommand} 実行するコマンド
			 * @return {boolean} true:成功 / false:失敗
			 */
			invoke(command: MementoCommand): ItemModel[] {
				// max stack に達した場合はエラー
				if (!_.isUndefined(this.maxStack_) && this.maxStack_ <= this.undoStack_.length) {
					return null;
				}

				var target = command.invoke();
				this.redoStack_ = [];
				this.undoStack_.push(command);
				return target;
			}

			/**
			 * コマンドを取り消す。
			 */
			undo(): ItemModel[] {
				if (!this.canUndo()) {
					return null;
				}
				var command = this.undoStack_.pop();
				var target = command.undo();
				this.redoStack_.push(command);
				return target;
			}

			/**
			 * undo() で取り消したコマンドを再度実行する。
			 */
			redo(): ItemModel[] {
				if (!this.canRedo()) {
					return null;
				}
				var command = this.redoStack_.pop();
				var target = command.redo();
				this.undoStack_.push(command);
				return target;
			}

			/**
			 * undo() 可能かどうかチェック。
			 * 
			 * @return {boolean} true:可能 / false:不可能
			 */
			canUndo(): boolean {
				if (this.undoStack_.length === 0) {
					return false;
				}

				return true;
			}

			/**
			 * redo() 可能かどうかチェック。
			 * 
			 * @return {boolean} true:可能 / false:不可能
			 */
			canRedo(): boolean {
				if (this.redoStack_.length === 0) {
					return false;
				}

				return true;
			}

			/**
			 * CommandManager をリセットする。
			 */
			reset() {
				this.undoStack_ = [];
				this.redoStack_ = [];
			}
		}

		export interface IMemento {
			target: ItemModel;
			previousData: Object;
			nextData: Object;
		}

		export class MementoCommand implements ICommand {
			/*
            private target_: ItemModel;
			private prev_: Object;
			private next_: Object;
            */
            private mementoList_: IMemento[];

            constructor(...memento: IMemento[]) {
                this.mementoList_ = memento;

                /*
				this.target_ = memento.target;
				this.prev_ = memento.previousData;
				this.next_ = memento.nextData;
                */
			}

			invoke(): ItemModel[] {
				//this.prev_ = this.memento_.mementoData;
				//this._setMemento(this.next_);
				//return this.target_;
                return this.redo();
			}

            undo(): ItemModel[] {
                let updatedModels: ItemModel[] = [];

                // 配列末尾から実行
                for (let i = this.mementoList_.length - 1; i >= 0; i--) {
                    let memento = this.mementoList_[i];
                    updatedModels.push(memento.target);

                    let keys = Object.keys(memento.previousData);
                    keys.forEach((key) => {
                        memento.target[key] = memento.previousData[key];
                    });
                }

                return updatedModels;
			}

            redo(): ItemModel[] {
                let updatedModels: ItemModel[] = [];

                // 配列先頭から実行
                for (let i = 0; i < this.mementoList_.length; i++) {
                    let memento = this.mementoList_[i];
                    updatedModels.push(memento.target);

                    let keys = Object.keys(memento.nextData);
                    keys.forEach((key) => {
                        memento.target[key] = memento.nextData[key];
                    });
                }

                return updatedModels;
			}

            /*
			private _setMemento(mementoData: Object) {
				var keys = Object.keys(mementoData);
				keys.forEach((key) => {
					//this.target_.set(key, mementoData[key]);
					this.target_[key] = mementoData[key];
				});
            }
            */
		}
	}
}