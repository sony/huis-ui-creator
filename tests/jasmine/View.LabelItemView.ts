/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/View/LabelItem.ts" />

module Garage {
    export module Test {
        describe("View.LabelItemView", () => {
            var labelItemView: View.LabelItem = null;

            // Called before each test case
            beforeEach(() => {
                labelItemView = new View.LabelItem();
            });

            // Called after each test case
            afterEach(() => {
                labelItemView = null;
            });

            ////////////////////
            // test cases
            it("can be instantiated", () => {
                expect(labelItemView).not.toBeNull();
            });

        });
    }
}
