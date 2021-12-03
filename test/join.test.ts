import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";

describe("path-extender", function () {
    describe("> join", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            const backslashRE = /\\/g;
            describe("> both Encoding: " + encoding, function () {
                const tests: Array<[Array<string>, string]> = [
                    [[".", "x/b", "..", "/b/c.js"], "x/b/c.js"],
                    [[], "."],
                    [["/.", "x/b", "..", "/b/c.js"], "/x/b/c.js"],
                    [["/foo", "../../../bar"], "/bar"],
                    [["foo", "../../../bar"], "../../bar"],
                    [["foo/", "../../../bar"], "../../bar"],
                    [["foo/x", "../../../bar"], "../bar"],
                    [["foo/x", "./bar"], "foo/x/bar"],
                    [["foo/x/", "./bar"], "foo/x/bar"],
                    [["foo/x/", ".", "bar"], "foo/x/bar"],
                    [["./"], "./"],
                    [[".", "./"], "./"],
                    [[".", ".", "."], "."],
                    [[".", "./", "."], "."],
                    [[".", "/./", "."], "."],
                    [[".", "/////./", "."], "."],
                    [["."], "."],
                    [["", "."], "."],
                    [["", "foo"], "foo"],
                    [["foo", "/bar"], "foo/bar"],
                    [["", "/foo"], "/foo"],
                    [["", "", "/foo"], "/foo"],
                    [["", "", "foo"], "foo"],
                    [["foo", ""], "foo"],
                    [["foo/", ""], "foo/"],
                    [["foo", "", "/bar"], "foo/bar"],
                    [["./", "..", "/foo"], "../foo"],
                    [["./", "..", "..", "/foo"], "../../foo"],
                    [[".", "..", "..", "/foo"], "../../foo"],
                    [["", "..", "..", "/foo"], "../../foo"],
                    [["/"], "/"],
                    [["/", "."], "/"],
                    [["/", ".."], "/"],
                    [["/", "..", ".."], "/"],
                    [[""], "."],
                    [["", ""], "."],
                    [[" /foo"], " /foo"],
                    [[" ", "foo"], " /foo"],
                    [[" ", "."], " "],
                    [[" ", "/"], " /"],
                    [[" ", ""], " "],
                    [["/", "foo"], "/foo"],
                    [["/", "/foo"], "/foo"],
                    [["/", "//foo"], "/foo"],
                    [["/", "", "/foo"], "/foo"],
                    [["", "/", "foo"], "/foo"],
                    [["", "/", "/foo"], "/foo"],
                ];
                tests.forEach(function (t) {
                    [path.posix.join, path.win32.join].forEach(function (join) {
                        let fn = "posix";
                        if (join === path.win32.join) {
                            fn = "win32";
                        }
                        test(`Fn: '${fn}' Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                            const input = t[0];
                            if (encoding !== "none") {
                                if (input[0]) {
                                    input[0] = Buffer.from(
                                        input[0],
                                        encoding as BufferEncoding
                                    ) as never;
                                }
                            }
                            let result = join(
                                ...(input as unknown as Array<Buffer>)
                            ).toString(
                                encoding !== "none"
                                    ? (encoding as BufferEncoding)
                                    : undefined
                            );
                            if (fn === "win32") {
                                result = result.replace(backslashRE, "/");
                            }
                            expect(result).to.be.equal(t[1]);
                        });
                    });
                });
            });
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32: Array<[Array<string>, string]> = [
                    [[".", "x/b", "..", "/b/c.js"], "x/b/c.js"],
                    [[], "."],
                    [["/.", "x/b", "..", "/b/c.js"], "/x/b/c.js"],
                    [["/foo", "../../../bar"], "/bar"],
                    [["foo", "../../../bar"], "../../bar"],
                    [["foo/", "../../../bar"], "../../bar"],
                    [["foo/x", "../../../bar"], "../bar"],
                    [["foo/x", "./bar"], "foo/x/bar"],
                    [["foo/x/", "./bar"], "foo/x/bar"],
                    [["foo/x/", ".", "bar"], "foo/x/bar"],
                    [["./"], "./"],
                    [[".", "./"], "./"],
                    [[".", ".", "."], "."],
                    [[".", "./", "."], "."],
                    [[".", "/./", "."], "."],
                    [[".", "/////./", "."], "."],
                    [["."], "."],
                    [["", "."], "."],
                    [["", "foo"], "foo"],
                    [["foo", "/bar"], "foo/bar"],
                    [["", "/foo"], "/foo"],
                    [["", "", "/foo"], "/foo"],
                    [["", "", "foo"], "foo"],
                    [["foo", ""], "foo"],
                    [["foo/", ""], "foo/"],
                    [["foo", "", "/bar"], "foo/bar"],
                    [["./", "..", "/foo"], "../foo"],
                    [["./", "..", "..", "/foo"], "../../foo"],
                    [[".", "..", "..", "/foo"], "../../foo"],
                    [["", "..", "..", "/foo"], "../../foo"],
                    [["/"], "/"],
                    [["/", "."], "/"],
                    [["/", ".."], "/"],
                    [["/", "..", ".."], "/"],
                    [[""], "."],
                    [["", ""], "."],
                    [[" /foo"], " /foo"],
                    [[" ", "foo"], " /foo"],
                    [[" ", "."], " "],
                    [[" ", "/"], " /"],
                    [[" ", ""], " "],
                    [["/", "foo"], "/foo"],
                    [["/", "/foo"], "/foo"],
                    [["/", "//foo"], "/foo"],
                    [["/", "", "/foo"], "/foo"],
                    [["", "/", "foo"], "/foo"],
                    [["", "/", "/foo"], "/foo"],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        const input = t[0];
                        if (encoding !== "none") {
                            if (input[0]) {
                                input[0] = Buffer.from(
                                    input[0],
                                    encoding as BufferEncoding
                                ) as never;
                            }
                        }
                        let result = path.win32
                            .join(...(input as unknown as Array<Buffer>))
                            .toString(
                                encoding !== "none"
                                    ? (encoding as BufferEncoding)
                                    : undefined
                            );
                        result = result.replace(backslashRE, "/");
                        expect(result).to.be.equal(t[1]);
                    });
                });
            });
        });
    });
});
