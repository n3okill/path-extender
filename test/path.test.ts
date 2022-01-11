import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> path", function () {
        test("sep", function () {
            expect(path.posix.sep).to.be.equal("/");
            expect(path.win32.sep).to.be.equal("\\");
        });
        test("delimiter", function () {
            expect(path.posix.delimiter).to.be.equal(":");
            expect(path.win32.delimiter).to.be.equal(";");
        });
        test("correct path loaded", function () {
            if (process.platform === "win32") {
                expect(path.sep).to.equal(path.win32.sep);
            } else {
                expect(path.sep).to.equal(path.posix.sep);
            }
        });
    });
});
