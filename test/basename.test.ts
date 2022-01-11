import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> basename", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> both Encoding: " + encoding, function () {
                const tests: Array<[test: Array<string>, result: string]> = [
                    [[import.meta.url], "basename.test.ts"],
                    [[import.meta.url, ".js"], "basename.test.ts"],
                    [[".js", ".js"], ""],
                    [[""], ""],
                    [["/dir/basename.ext"], "basename.ext"],
                    [["/basename.ext"], "basename.ext"],
                    [["basename.ext"], "basename.ext"],
                    [["basename.ext/"], "basename.ext"],
                    [["basename.ext//"], "basename.ext"],
                    [["aaa/bbb", "/bbb"], "bbb"],
                    [["aaa/bbb", "a/bbb"], "bbb"],
                    [["aaa/bbb", "bbb"], "bbb"],
                    [["aaa/bbb//", "bbb"], "bbb"],
                    [["aaa/bbb", "bb"], "b"],
                    [["aaa/bbb", "b"], "bb"],
                    [["/aaa/bbb", "/bbb"], "bbb"],
                    [["/aaa/bbb", "a/bbb"], "bbb"],
                    [["/aaa/bbb", "bbb"], "bbb"],
                    [["/aaa/bbb//", "bbb"], "bbb"],
                    [["/aaa/bbb", "bb"], "b"],
                    [["/aaa/bbb", "b"], "bb"],
                    [["/aaa/bbb"], "bbb"],
                    [["/aaa/"], "aaa"],
                    [["/aaa/b"], "b"],
                    [["/a/b"], "b"],
                    [["//a"], "a"],
                    [["a", "a"], ""],
                ];
                tests.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.basename(t[0][0], t[0][1])).to.be.equal(
                                t[1]
                            );
                        } else {
                            const p = Buffer.from(
                                t[0][0],
                                encoding as BufferEncoding
                            );
                            const result = path
                                .basename(p, t[0][1])
                                .toString(encoding as BufferEncoding);
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> win32 Encoding: " + encoding, function () {
                // On Windows a backslash acts as a path separator.
                const testWin32 = [
                    [["\\dir\\basename.ext"], "basename.ext"],
                    [["\\basename.ext"], "basename.ext"],
                    [["basename.ext"], "basename.ext"],
                    [["basename.ext\\"], "basename.ext"],
                    [["basename.ext\\\\"], "basename.ext"],
                    [["foo"], "foo"],
                    [["aaa\\bbb", "\\bbb"], "bbb"],
                    [["aaa\\bbb", "a\\bbb"], "bbb"],
                    [["aaa\\bbb", "bbb"], "bbb"],
                    [["aaa\\bbb\\\\\\\\", "bbb"], "bbb"],
                    [["aaa\\bbb", "bb"], "b"],
                    [["aaa\\bbb", "b"], "bb"],
                    [["C:"], ""],
                    [["C:."], "."],
                    [["C:\\"], ""],
                    [["C:\\dir\\base.ext"], "base.ext"],
                    [["C:\\basename.ext"], "basename.ext"],
                    [["C:basename.ext"], "basename.ext"],
                    [["C:basename.ext\\"], "basename.ext"],
                    [["C:basename.ext\\\\"], "basename.ext"],
                    [["C:foo"], "foo"],
                    [["file:stream"], "file:stream"],
                    [["a", "a"], ""],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.win32.basename(t[0][0], t[0][1])
                            ).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0][0],
                                encoding as BufferEncoding
                            );
                            expect(
                                path.win32
                                    .basename(p, t[0][1])
                                    .toString(
                                        t[0][0]
                                            ? (encoding as BufferEncoding)
                                            : undefined
                                    )
                            ).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                // On unix a backslash is just treated as any other character.

                // POSIX filenames may include control characters
                // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
                const controlCharFilename = `Icon${String.fromCharCode(13)}`;
                const testPosix = [
                    [["\\dir\\basename.ext"], "\\dir\\basename.ext"],
                    [["\\basename.ext"], "\\basename.ext"],
                    [["basename.ext"], "basename.ext"],
                    [["basename.ext\\"], "basename.ext\\"],
                    [["basename.ext\\\\"], "basename.ext\\\\"],
                    [["foo"], "foo"],
                    [[`/a/b/${controlCharFilename}`], controlCharFilename],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${encodeURIComponent(
                        t[0] as string
                    )}" - Result:"${encodeURIComponent(t[1] as string)}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.posix.basename(t[0][0], t[0][1])
                            ).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0][0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix
                                .basename(p, t[0][1])
                                .toString(
                                    t[0][0]
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
