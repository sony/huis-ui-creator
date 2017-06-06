/// <reference path="../../app/modules/include/jasmine.d.ts" />
/// <reference path="../../app/scripts/Model/ButtonState.ts" />

module Garage {
    export module Test {
        describe("Model.ButtonState", () => {
            var buttonState: Model.ButtonState = null;

            // Called before each test case
            beforeEach(() => {
                buttonState = new Model.ButtonState();
            });

            // Called after each test case
            afterEach(() => {
                buttonState = null;
            });

            ////////////////////
            // test cases
            it("can be instantiated", () => {
                expect(buttonState).not.toBeNull();
            });

        });
    }
}
