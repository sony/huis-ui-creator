/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:no-string-literal */

module Garage {
	export module Model {
		var TAG = "[Garage.Model.Module] ";

		export class Module extends Backbone.Model implements IGModule {

			constructor(attributes?: any) {
				super(attributes, null);
			}

			/**
             * getters and setters
             */
            get area(): IArea { return this.get("area"); }
            set area(val: IArea) { this.set("area", val); }
			get button(): IGButton[] { return this.get("button"); }
			set button(val: IGButton[]) { this.set("button", val); }
			get label(): IGLabel[] { return this.get("label"); }
			set label(val: IGLabel[]) { this.set("label", val); }
			get image(): IGImage[]{ return this.get("image"); }
			set image(val: IGImage[]) { this.set("image", val); }
			get offsetY(): number { return this.get("offsetY"); }
			set offsetY(val: number) { this.set("offsetY", val); }
			get pageIndex(): number { return this.get("pageIndex"); }
			set pageIndex(val: number) { this.set("pageIndex", val); }
			get remoteId(): string { return this.get("remoteId"); }
			set remoteId(val: string) { this.set("remoteId", val); }
			get name(): string { return this.get("name"); }
			set name(val: string) { this.set("name", val); }

			defaults() {
				var module: IModule = {
					area: { x: 0, y: 0, w: 0, h: 0 }
				};
			}

		}
	}
}