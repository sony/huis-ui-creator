/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/Model/LabelItem.ts" />

module Garage {
	export module Test {
		describe("Model.LabelItem",() => {
			var labelItem: Model.LabelItem = null;

			// Called before each test case
			beforeEach(() => {
				labelItem = new Model.LabelItem();
			});

			// Called after each test case
			afterEach(() => {
				labelItem = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(labelItem).not.toBeNull();
			});

		});
	}
}