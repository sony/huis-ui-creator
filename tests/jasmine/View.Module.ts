/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/View/Module.ts" />

module Garage {
    export module Test {
        describe("View.Module", () => {
            var module: View.Module = null;

            // Called before each test case
            beforeEach(() => {
                module = new View.Module();
            });

            // Called after each test case
            afterEach(() => {
                module = null;
            });

            ////////////////////
            // test cases
            it("can be instantiated", () => {
                expect(module).not.toBeNull();
            });

        });
    }
}
