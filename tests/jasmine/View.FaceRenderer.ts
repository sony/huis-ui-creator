/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/View/FaceRenderer.ts" />

module Garage {
	export module Test {
		describe("View.FaceRenderer",() => {
			var faceRenderer: View.FaceRenderer = null;

			// Called before each test case
			beforeEach(() => {
				faceRenderer = new View.FaceRenderer();
			});

			// Called after each test case
			afterEach(() => {
				faceRenderer = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(faceRenderer).not.toBeNull();
			});

		});
	}
}