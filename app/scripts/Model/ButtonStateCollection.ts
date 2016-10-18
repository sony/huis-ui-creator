/// <reference path="../include/interfaces.d.ts" />
/// <reference path="ButtonState.ts" />

module Garage {
	export module Model {
		var TAG = "[Garage.Model.ButtonStateCollection] ";

		export class ButtonStateCollection extends Backbone.Collection<ButtonState> {
			model = ButtonState;
		}
	}
}