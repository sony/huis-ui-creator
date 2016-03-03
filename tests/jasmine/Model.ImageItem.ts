/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/Model/ImageItem.ts" />

module Garage {
	export module Test {
		describe("Model.ImageItem",() => {
			var imageItem: Model.ImageItem = null;

			// Called before each test case
			beforeEach(() => {
				imageItem = new Model.ImageItem();
			});

			// Called after each test case
			afterEach(() => {
				imageItem = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(imageItem).not.toBeNull();
			});

		});
	}
}