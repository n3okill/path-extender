import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";
import * as NodePath from "path";
export const platformIsWin32 = process.platform === "win32";

describe("path-extender", function () {
    describe("> dirname", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> both Encoding: " + encoding, function () {
                test(`Test:"${NodePath.basename(
                    __filename
                )}" - Result:".../test"`, function () {
                    const pathdirname = NodePath.dirname(__filename);
                    if (encoding === "none") {
                        const result = path.dirname(__filename);
                        expect(result).to.be.equal(pathdirname);
                    } else {
                        const p = Buffer.from(
                            __filename,
                            encoding as BufferEncoding
                        );
                        const result = path
                            .dirname(p)
                            .toString(encoding as BufferEncoding);
                        expect(result).to.be.equal(pathdirname);
                    }
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const tests = [
                    ["/a/b/", "/a"],
                    ["/a/b", "/a"],
                    ["/a", "/"],
                    ["", "."],
                    ["/", "/"],
                    ["////", "/"],
                    ["//a", "//"],
                    ["foo", "."],
                ];
                tests.forEach(function (t) {
                    test(`Test:"${encodeURIComponent(
                        t[0]
                    )}" - Result:"${encodeURIComponent(t[1])}"`, function () {
                        if (encoding === "none") {
                            expect(path.posix.dirname(t[0])).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix
                                .dirname(p)
                                .toString(
                                    t[0]
                                        ? (encoding as BufferEncoding)
                                        : undefined
                                );
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> win32 Encoding: " + encoding, function () {
                const tests = [
                    ["c:\\", "c:\\"],
                    ["c:\\foo", "c:\\"],
                    ["c:\\foo\\", "c:\\"],
                    ["c:\\foo\\bar", "c:\\foo"],
                    ["c:\\foo\\bar\\", "c:\\foo"],
                    ["c:\\foo\\bar\\baz", "c:\\foo\\bar"],
                    ["c:\\foo bar\\baz", "c:\\foo bar"],
                    ["\\", "\\"],
                    ["\\foo", "\\"],
                    ["\\foo\\", "\\"],
                    ["\\foo\\bar", "\\foo"],
                    ["\\foo\\bar\\", "\\foo"],
                    ["\\foo\\bar\\baz", "\\foo\\bar"],
                    ["\\foo bar\\baz", "\\foo bar"],
                    ["c:", "c:"],
                    ["c:foo", "c:"],
                    ["c:foo\\", "c:"],
                    ["c:foo\\bar", "c:foo"],
                    ["c:foo\\bar\\", "c:foo"],
                    ["c:foo\\bar\\baz", "c:foo\\bar"],
                    ["c:foo bar\\baz", "c:foo bar"],
                    ["file:stream", "."],
                    ["dir\\file:stream", "dir"],
                    ["\\\\unc\\share", "\\\\unc\\share"],
                    ["\\\\unc\\share\\foo", "\\\\unc\\share\\"],
                    ["\\\\unc\\share\\foo\\", "\\\\unc\\share\\"],
                    ["\\\\unc\\share\\foo\\bar", "\\\\unc\\share\\foo"],
                    ["\\\\unc\\share\\foo\\bar\\", "\\\\unc\\share\\foo"],
                    [
                        "\\\\unc\\share\\foo\\bar\\baz",
                        "\\\\unc\\share\\foo\\bar",
                    ],
                    ["/a/b/", "/a"],
                    ["/a/b", "/a"],
                    ["/a", "/"],
                    ["", "."],
                    ["/", "/"],
                    ["////", "/"],
                    ["foo", "."],
                ];
                tests.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.win32.dirname(t[0])).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.win32
                                .dirname(p)
                                .toString(
                                    t[0]
                                        ? (encoding as BufferEncoding)
                                        : undefined
                                );
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
        });
    });
});
