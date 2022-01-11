import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> isAbsolute", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32: Array<[string, boolean]> = [
                    ["/", true],
                    ["//", true],
                    ["//server", true],
                    ["//server/file", true],
                    ["\\\\server\\file", true],
                    ["\\\\server", true],
                    ["\\\\", true],
                    ["c", false],
                    ["c:", false],
                    ["c:\\", true],
                    ["c:/", true],
                    ["c://", true],
                    ["C:/Users/", true],
                    ["C:\\Users\\", true],
                    ["C:cwd/another", false],
                    ["C:cwd\\another", false],
                    ["directory/directory", false],
                    ["directory\\directory", false],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.win32.isAbsolute(t[0])).to.be.equal(
                                t[1]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            expect(path.win32.isAbsolute(p)).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const testPosix: Array<[string, boolean]> = [
                    ["/home/foo", true],
                    ["/home/foo/..", true],
                    ["bar/", false],
                    ["./baz", false],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.posix.isAbsolute(t[0])).to.be.equal(
                                t[1]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix.isAbsolute(p);
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
        });
    });
});
