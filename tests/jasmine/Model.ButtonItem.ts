/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/Model/ButtonItem.ts" />

module Garage {
	export module Test {
		describe("Model.ButtonItem",() => {
			var buttonItem: Model.ButtonItem = null;

			// Called before each test case
			beforeEach(() => {
				buttonItem = new Model.ButtonItem();
			});

			// Called after each test case
			afterEach(() => {
				buttonItem = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(buttonItem).not.toBeNull();
			});

		});
	}
}