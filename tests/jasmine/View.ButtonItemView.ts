/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/View/ButtonItem.ts" />

module Garage {
	export module Test {
		describe("View.ButtonItemView",() => {
			var buttonItemView: View.ButtonItem = null;

			// Called before each test case
			beforeEach(() => {
				buttonItemView = new View.ButtonItem();
			});

			// Called after each test case
			afterEach(() => {
				buttonItemView = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(buttonItemView).not.toBeNull();
			});

		});
	}
}