import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> extname", function () {
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> both Encoding: " + encoding, function () {
                const tests = [
                    [import.meta.url, ".ts"],
                    ["", ""],
                    ["/path/to/file", ""],
                    ["/path/to/file.ext", ".ext"],
                    ["/path.to/file.ext", ".ext"],
                    ["/path.to/file", ""],
                    ["/path.to/.file", ""],
                    ["/path.to/.file.ext", ".ext"],
                    ["/path/to/f.ext", ".ext"],
                    ["/path/to/..ext", ".ext"],
                    ["/path/to/..", ""],
                    ["file", ""],
                    ["file.ext", ".ext"],
                    [".file", ""],
                    [".file.ext", ".ext"],
                    ["/file", ""],
                    ["/file.ext", ".ext"],
                    ["/.file", ""],
                    ["/.file.ext", ".ext"],
                    [".path/file.ext", ".ext"],
                    ["file.ext.ext", ".ext"],
                    ["file.", "."],
                    [".", ""],
                    ["./", ""],
                    [".file.ext", ".ext"],
                    [".file", ""],
                    [".file.", "."],
                    [".file..", "."],
                    ["..", ""],
                    ["../", ""],
                    ["..file.ext", ".ext"],
                    ["..file", ".file"],
                    ["..file.", "."],
                    ["..file..", "."],
                    ["...", "."],
                    ["...ext", ".ext"],
                    ["....", "."],
                    ["file.ext/", ".ext"],
                    ["file.ext//", ".ext"],
                    ["file/", ""],
                    ["file//", ""],
                    ["file./", "."],
                    ["file.//", "."],
                ];
                const slashRE = /\//g;
                tests.forEach(function (t) {
                    [path.posix.extname, path.win32.extname].forEach(function (
                        extname
                    ) {
                        let input = t[0];
                        let fn = "posix";
                        if (extname === path.win32.extname) {
                            input = input.replace(slashRE, "\\");
                            fn = "win32";
                        }
                        test(`Fn: '${fn}' Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                            if (encoding === "none") {
                                expect(extname(input)).to.be.equal(t[1]);
                            } else {
                                const p = Buffer.from(
                                    input,
                                    encoding as BufferEncoding
                                );
                                const result = extname(p).toString(
                                    encoding as BufferEncoding
                                );
                                expect(result).to.be.equal(t[1]);
                            }
                        });
                    });
                });
            });
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32 = [
                    // On Windows, backslash is a path separator.
                    [".\\", ""],
                    ["..\\", ""],
                    ["file.ext\\", ".ext"],
                    ["file.ext\\\\", ".ext"],
                    ["file\\", ""],
                    ["file\\\\", ""],
                    ["file.\\", "."],
                    ["file.\\\\", "."],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.win32.extname(t[0])).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            expect(
                                path.win32
                                    .extname(p)
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
                    // On *nix, backslash is a valid name component like any other character.
                    [".\\", ""],
                    ["..\\", ".\\"],
                    ["file.ext\\", ".ext\\"],
                    ["file.ext\\\\", ".ext\\\\"],
                    ["file\\", ""],
                    ["file\\\\", ""],
                    ["file.\\", ".\\"],
                    ["file.\\\\", ".\\\\"],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(path.posix.extname(t[0])).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0],
                                encoding as BufferEncoding
                            );
                            const result = path.posix
                                .extname(p)
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
