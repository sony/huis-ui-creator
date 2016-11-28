/// <reference path="../include/interfaces.d.ts" />


module Garage {
    export module Model {
        var TAG = "[Garage.Model.PhnConfig] ";

        export class PhnConfig extends Backbone.Model {

            static HOME_ID_TO_HOME: string = 'home';

            static SCENE_NO_TO_HOME: number = 0;


            get homeId(): string {
                return this.get('home_id');
            }
            set homeId(val: string) {
                this.set('home_id', val);
            }
            get sceneNo(): number {
                return this.get('scene_no');
            }
            set sceneNo(val: number) {
                this.set('scene_no', val);
            }
            get enableVerticalRemovePageSwipe(): boolean {
                return this.get('enable_vertical_remote_page_swipe');
            }
            set enableVerticalRemovePageSwipe(val: boolean) {
                this.set('enable_vertical_remote_page_swipe', val);
            }
            get enableHorizontalRemotePageSwipe(): boolean {
                return this.get('enable_horizontal_remote_page_swipe');
            }
            set enableHorizontalRemotePageSwipe(val: boolean) {
                this.set('enable_horizontal_remote_page_swipe', val);
            }
            get displayRemoteArrow(): boolean {
                return this.get('display_remote_arrow');
            }
            set displayRemoteArrow(val: boolean) {
                this.set('display_remote_arrow', val);
            }
            get displaySettingButton(): boolean {
                return this.get('display_setting_button');
            }
            set displaySettingButton(val: boolean) {
                this.set('display_setting_button', val);
            }
            get displayAddButton(): boolean {
                return this.get('display_add_button');
            }
            set displayAddButton(val: boolean) {
                this.set('display_add_button', val);
            }

            constructor(data?: IPhnConfig) {
                super();

                if (data == null) {
                    return;
                }

                for (let key in data) {
                    if (this.has(key)) {
                        this.set(key, data[key]);
                    }
                }

            }


            defaults() {
                return {
                    home_id: PhnConfig.HOME_ID_TO_HOME,
                    scene_no: PhnConfig.SCENE_NO_TO_HOME,
                    enable_vertical_remote_page_swipe: true,
                    enable_horizontal_remote_page_swipe: true,
                    display_remote_arrow: true,
                    display_setting_button: true,
                    display_add_button: true
                };
            }


            /**
             * ホームボタン跳び先設定を初期値にする
             */
            setDefaultHomeDest() {
                this.homeId = PhnConfig.HOME_ID_TO_HOME;
                this.sceneNo = PhnConfig.SCENE_NO_TO_HOME;
            }


            /**
             * 現在のモデル情報をIPhnConfigに変換
             *
             * @return {IPhnConfig}
             */
            toPhnConfigData(): IPhnConfig {
                return {
                    home_id: this.homeId,
                    scene_no: Number(this.sceneNo),
                    enable_vertical_remote_page_swipe: Boolean(this.enableVerticalRemovePageSwipe),
                    enable_horizontal_remote_page_swipe: Boolean(this.enableHorizontalRemotePageSwipe),
                    display_remote_arrow: Boolean(this.displayRemoteArrow),
                    display_setting_button: Boolean(this.displaySettingButton),
                    display_add_button: Boolean(this.displayAddButton)
                };
            }



        }

    }
}