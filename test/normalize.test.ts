import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";

describe("path-extender", function () {
    describe("> normalize", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32 = [
                    ["./fixtures///b/../b/c.js", "fixtures\\b\\c.js"],
                    ["/foo/../../../bar", "\\bar"],
                    ["a//b//../b", "a\\b"],
                    ["a//b//./c", "a\\b\\c"],
                    ["a//b//.", "a\\b"],
                    [
                        "//server/share/dir/file.ext",
                        "\\\\server\\share\\dir\\file.ext",
                    ],
                    ["/a/b/c/../../../x/y/z", "\\x\\y\\z"],
                    ["C:", "C:."],
                    ["C:..\\abc", "C:..\\abc"],
                    ["C:..\\..\\abc\\..\\def", "C:..\\..\\def"],
                    ["C:\\.", "C:\\"],
                    ["file:stream", "file:stream"],
                    ["bar\\foo..\\..\\", "bar\\"],
                    ["bar\\foo..\\..", "bar"],
                    ["bar\\foo..\\..\\baz", "bar\\baz"],
                    ["bar\\foo..\\", "bar\\foo..\\"],
                    ["bar\\foo..", "bar\\foo.."],
                    ["..\\foo..\\..\\..\\bar", "..\\..\\bar"],
                    ["..\\...\\..\\.\\...\\..\\..\\bar", "..\\..\\bar"],
                    ["../../../foo/../../../bar", "..\\..\\..\\..\\..\\bar"],
                    [
                        "../../../foo/../../../bar/../../",
                        "..\\..\\..\\..\\..\\..\\",
                    ],
                    ["../foobar/barfoo/foo/../../../bar/../../", "..\\..\\"],
                    [
                        "../.../../foobar/../../../bar/../../baz",
                        "..\\..\\..\\..\\baz",
                    ],
                    ["foo/bar\\baz", "foo\\bar\\baz"],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.win32.normalize(t[0])).to.be.equal(
                                t[1]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            expect(
                                path.win32
                                    .normalize(p)
                                    .toString(
                                        t[0]
                                            ? (encoding as BufferEncoding)
                                            : undefined
                                    )
                            ).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const testPosix = [
                    ["./fixtures///b/../b/c.js", "fixtures/b/c.js"],
                    ["/foo/../../../bar", "/bar"],
                    ["a//b//../b", "a/b"],
                    ["a//b//./c", "a/b/c"],
                    ["a//b//.", "a/b"],
                    ["/a/b/c/../../../x/y/z", "/x/y/z"],
                    ["///..//./foo/.//bar", "/foo/bar"],
                    ["bar/foo../../", "bar/"],
                    ["bar/foo../..", "bar"],
                    ["bar/foo../../baz", "bar/baz"],
                    ["bar/foo../", "bar/foo../"],
                    ["bar/foo..", "bar/foo.."],
                    ["../foo../../../bar", "../../bar"],
                    ["../.../.././.../../../bar", "../../bar"],
                    ["../../../foo/../../../bar", "../../../../../bar"],
                    ["../../../foo/../../../bar/../../", "../../../../../../"],
                    ["../foobar/barfoo/foo/../../../bar/../../", "../../"],
                    [
                        "../.../../foobar/../../../bar/../../baz",
                        "../../../../baz",
                    ],
                    ["foo/bar\\baz", "foo/bar\\baz"],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.posix.normalize(t[0])).to.be.equal(
                                t[1]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix
                                .normalize(p)
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
