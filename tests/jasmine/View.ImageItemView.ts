/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/View/ImageItem.ts" />

module Garage {
	export module Test {
		describe("View.ImageItemView",() => {
			var imageItemView: View.ImageItem = null;

			// Called before each test case
			beforeEach(() => {
				imageItemView = new View.ImageItem();
			});

			// Called after each test case
			afterEach(() => {
				imageItemView = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(imageItemView).not.toBeNull();
			});

		});
	}
}