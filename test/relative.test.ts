import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";

describe("path-extender", function () {
    describe("> relative", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32 = [
                    ["c:/blah\\blah", "d:/games", "d:\\games"],
                    ["c:/aaaa/bbbb", "c:/aaaa", ".."],
                    ["c:/aaaa/bbbb", "c:/cccc", "..\\..\\cccc"],
                    ["c:/aaaa/bbbb", "c:/aaaa/bbbb", ""],
                    ["c:/aaaa/bbbb", "c:/aaaa/cccc", "..\\cccc"],
                    ["c:/aaaa/", "c:/aaaa/cccc", "cccc"],
                    ["c:/", "c:\\aaaa\\bbbb", "aaaa\\bbbb"],
                    ["c:/aaaa/bbbb", "d:\\", "d:\\"],
                    ["c:/AaAa/bbbb", "c:/aaaa/bbbb", ""],
                    ["c:/aaaaa/", "c:/aaaa/cccc", "..\\aaaa\\cccc"],
                    ["C:\\foo\\bar\\baz\\quux", "C:\\", "..\\..\\..\\.."],
                    [
                        "C:\\foo\\test",
                        "C:\\foo\\test\\bar\\package.json",
                        "bar\\package.json",
                    ],
                    ["C:\\foo\\bar\\baz-quux", "C:\\foo\\bar\\baz", "..\\baz"],
                    [
                        "C:\\foo\\bar\\baz",
                        "C:\\foo\\bar\\baz-quux",
                        "..\\baz-quux",
                    ],
                    ["\\\\foo\\bar", "\\\\foo\\bar\\baz", "baz"],
                    ["\\\\foo\\bar\\baz", "\\\\foo\\bar", ".."],
                    ["\\\\foo\\bar\\baz-quux", "\\\\foo\\bar\\baz", "..\\baz"],
                    [
                        "\\\\foo\\bar\\baz",
                        "\\\\foo\\bar\\baz-quux",
                        "..\\baz-quux",
                    ],
                    ["C:\\baz-quux", "C:\\baz", "..\\baz"],
                    ["C:\\baz", "C:\\baz-quux", "..\\baz-quux"],
                    ["\\\\foo\\baz-quux", "\\\\foo\\baz", "..\\baz"],
                    ["\\\\foo\\baz", "\\\\foo\\baz-quux", "..\\baz-quux"],
                    ["C:\\baz", "\\\\foo\\bar\\baz", "\\\\foo\\bar\\baz"],
                    ["\\\\foo\\bar\\baz", "C:\\baz", "C:\\baz"],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.win32.relative(t[0], t[1])).to.be.equal(
                                t[2]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            expect(
                                path.win32
                                    .relative(p, t[1])
                                    .toString(
                                        t[0]
                                            ? (encoding as BufferEncoding)
                                            : undefined
                                    )
                            ).to.be.equal(t[2]);
                        }
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const testPosix = [
                    ["/var/lib", "/var", ".."],
                    ["/var/lib", "/bin", "../../bin"],
                    ["/var/lib", "/var/lib", ""],
                    ["/var/lib", "/var/apache", "../apache"],
                    ["/var/", "/var/lib", "lib"],
                    ["/", "/var/lib", "var/lib"],
                    [
                        "/foo/test",
                        "/foo/test/bar/package.json",
                        "bar/package.json",
                    ],
                    ["/Users/a/web/b/test/mails", "/Users/a/web/b", "../.."],
                    ["/foo/bar/baz-quux", "/foo/bar/baz", "../baz"],
                    ["/foo/bar/baz", "/foo/bar/baz-quux", "../baz-quux"],
                    ["/baz-quux", "/baz", "../baz"],
                    ["/baz", "/baz-quux", "../baz-quux"],
                    ["/page1/page2/foo", "/", "../../.."],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.posix.relative(t[0], t[1])).to.be.equal(
                                t[2]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix
                                .relative(p, t[1])
                                .toString(
                                    t[0]
                                        ? (encoding as BufferEncoding)
                                        : undefined
                                );
                            expect(result).to.be.equal(t[2]);
                        }
                    });
                });
                test("posix relative on windows", function () {
                    // Refs: https://github.com/nodejs/node/issues/13683
                    const from = "a/b/c";
                    const to = "../../x";
                    if (encoding === "none") {
                        try {
                            //This throws on Node < v14.17.0 and < v15.13
                            expect(path.posix.relative(from, to)).to.match(
                                /^(\.\.\/){3,5}x$/
                            );
                        } catch (err) {
                            expect(path.posix.relative(from, to)).to.match(
                                /^(\.\.\/){3}\.\.\.\.\/x$/
                            );
                        }
                    } else {
                        const p = Buffer.from(
                            "a/b/c",
                            encoding as BufferEncoding
                        );
                        const result = path.posix
                            .relative(p, to)
                            .toString(encoding as BufferEncoding);
                        expect(result).to.match(/^(\.\.\/){3,5}x$/);
                    }
                });
            });
        });
    });
});
