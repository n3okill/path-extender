import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";

describe("path-extender", function () {
    describe("> makelong", function () {
        const emptyObj = {};
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> both Encoding: " + encoding, function () {
                const tests = [
                    ["", ""],
                    [null, null],
                    [100, 100],
                    [path, path],
                    [false, false],
                    [true, true],
                ];
                tests.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.toNamespacedPath(t[0] as never)
                            ).to.be.equal(t[1]);
                        } else {
                            let input = t[0];
                            if (typeof input === "string") {
                                input = Buffer.from(
                                    input,
                                    encoding as BufferEncoding
                                ) as never;
                            }
                            let result = path.toNamespacedPath(input as never);
                            if (Buffer.isBuffer(result)) {
                                result = result.toString(
                                    encoding as BufferEncoding
                                );
                            }
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32 = [
                    ["C:\\foo", "\\\\?\\C:\\foo"],
                    ["C:/foo", "\\\\?\\C:\\foo"],
                    ["\\\\foo\\bar", "\\\\?\\UNC\\foo\\bar\\"],
                    ["//foo//bar", "\\\\?\\UNC\\foo\\bar\\"],
                    ["\\\\?\\foo", "\\\\?\\foo"],
                    [null, null],
                    [true, true],
                    [1, 1],
                    [, undefined],
                    [emptyObj, emptyObj],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.win32.toNamespacedPath(t[0] as never)
                            ).to.be.equal(t[1]);
                        } else {
                            let input = t[0];
                            if (typeof input === "string") {
                                input = Buffer.from(
                                    input,
                                    encoding as BufferEncoding
                                ) as never;
                            }
                            let result = path.win32.toNamespacedPath(
                                input as never
                            );
                            if (Buffer.isBuffer(result)) {
                                result = result.toString(
                                    encoding as BufferEncoding
                                );
                            }
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const testPosix = [
                    ["/foo/bar", "/foo/bar"],
                    ["foo/bar", "foo/bar"],
                    [null, null],
                    [true, true],
                    [1, 1],
                    [, undefined],
                    [emptyObj, emptyObj],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.posix.toNamespacedPath(t[0] as never)
                            ).to.be.equal(t[1]);
                        } else {
                            let input = t[0];
                            if (typeof input === "string") {
                                input = Buffer.from(
                                    input,
                                    encoding as BufferEncoding
                                ) as never;
                            }
                            let result = path.posix.toNamespacedPath(
                                input as never
                            );
                            if (Buffer.isBuffer(result)) {
                                result = result.toString(
                                    encoding as BufferEncoding
                                );
                            }
                            expect(result).to.be.equal(t[1]);
                        }
                    });
                });
            });
            describe("> Windows only Encoding: " + encoding, function () {
                before(function () {
                    if (!(process.platform === "win32")) {
                        this.skip();
                    }
                });
                // These tests cause resolve() to insert the cwd, so we cannot test them from
                // non-Windows platforms (easily)
                const testWin32 = [
                    [
                        "\\\\someserver\\someshare\\somefile",
                        "\\\\?\\UNC\\someserver\\someshare\\somefile",
                    ],
                    [
                        "\\\\?\\UNC\\someserver\\someshare\\somefile",
                        "\\\\?\\UNC\\someserver\\someshare\\somefile",
                    ],
                    ["\\\\.\\pipe\\somepipe", "\\\\.\\pipe\\somepipe"],
                    ["", ""],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                path.toNamespacedPath(t[0] as never)
                            ).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0] as never,
                                encoding as BufferEncoding
                            );
                            expect(
                                path
                                    .toNamespacedPath(p)
                                    .toString(
                                        t[0]
                                            ? (encoding as BufferEncoding)
                                            : undefined
                                    )
                            ).to.be.equal(t[1]);
                        }
                    });
                });
                const currentDeviceLetter = (
                    path.parse(process.cwd()).root as string
                ).substring(0, 2);
                const testWin32Lowercase = [
                    [
                        "foo\\bar",
                        `\\\\?\\${process.cwd().toLowerCase()}\\foo\\bar`,
                    ],
                    [
                        "foo/bar",
                        `\\\\?\\${process.cwd().toLowerCase()}\\foo\\bar`,
                    ],
                    [
                        currentDeviceLetter,
                        `\\\\?\\${process.cwd().toLowerCase()}`,
                    ],
                    ["C", `\\\\?\\${process.cwd().toLowerCase()}\\c`],
                ];
                testWin32Lowercase.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        if (encoding === "none") {
                            expect(
                                (
                                    path.win32.toNamespacedPath(
                                        t[0] as never
                                    ) as string
                                ).toLowerCase()
                            ).to.be.equal(t[1]);
                        } else {
                            const p = Buffer.from(
                                t[0] as never,
                                encoding as BufferEncoding
                            );
                            expect(
                                path.win32
                                    .toNamespacedPath(p)
                                    .toString(
                                        t[0]
                                            ? (encoding as BufferEncoding)
                                            : undefined
                                    )
                                    .toLowerCase()
                            ).to.be.equal(t[1]);
                        }
                    });
                });
            });
        });
    });
});
