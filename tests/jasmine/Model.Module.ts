/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/Model/Module.ts" />

module Garage {
	export module Test {
		describe("Model.Module",() => {
			var module: Model.Module = null;

			// Called before each test case
			beforeEach(() => {
				module = new Model.Module();
			});

			// Called after each test case
			afterEach(() => {
				module = null;
			});

			////////////////////
			// test cases
			it("can be instantiated",() => {
				expect(module).not.toBeNull();
			});

		});
	}
}