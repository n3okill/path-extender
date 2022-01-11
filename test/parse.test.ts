import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> parse", function () {
        const winPaths = [
            // [path, root]
            ["C:\\path\\dir\\index.html", "C:\\"],
            ["C:\\another_path\\DIR\\1\\2\\33\\\\index", "C:\\"],
            ["another_path\\DIR with spaces\\1\\2\\33\\index", ""],
            ["\\", "\\"],
            ["\\foo\\C:", "\\"],
            ["file", ""],
            ["file:stream", ""],
            [".\\file", ""],
            ["C:", "C:"],
            ["C:.", "C:"],
            ["C:..", "C:"],
            ["C:abc", "C:"],
            ["C:\\", "C:\\"],
            ["C:\\abc", "C:\\"],
            ["", ""],

            // unc
            ["\\\\server\\share\\file_path", "\\\\server\\share\\"],
            [
                "\\\\server two\\shared folder\\file path.zip",
                "\\\\server two\\shared folder\\",
            ],
            ["\\\\teela\\admin$\\system32", "\\\\teela\\admin$\\"],
            ["\\\\?\\UNC\\server\\share", "\\\\?\\UNC\\"],
        ];

        const winSpecialCaseParseTests: Array<[string, unknown]> = [
            ["t", { base: "t", name: "t", root: "", dir: "", ext: "" }],
            [
                "/foo/bar",
                { root: "/", dir: "/foo", base: "bar", ext: "", name: "bar" },
            ],
        ];

        const winSpecialCaseFormatTests: Array<
            [
                {
                    dir?: string;
                    base?: string;
                    root?: string;
                    name?: string;
                    ext?: string;
                },
                string
            ]
        > = [
            [{ dir: "some\\dir" }, "some\\dir\\"],
            [{ base: "index.html" }, "index.html"],
            [{ root: "C:\\" }, "C:\\"],
            [{ name: "index", ext: ".html" }, "index.html"],
            [
                { dir: "some\\dir", name: "index", ext: ".html" },
                "some\\dir\\index.html",
            ],
            [{ root: "C:\\", name: "index", ext: ".html" }, "C:\\index.html"],
            [{}, ""],
        ];

        const unixPaths = [
            // [path, root]
            ["/home/user/dir/file.txt", "/"],
            ["/home/user/a dir/another File.zip", "/"],
            ["/home/user/a dir//another&File.", "/"],
            ["/home/user/a$$$dir//another File.zip", "/"],
            ["user/dir/another File.zip", ""],
            ["file", ""],
            [".\\file", ""],
            ["./file", ""],
            ["C:\\foo", ""],
            ["/", "/"],
            ["", ""],
            [".", ""],
            ["..", ""],
            ["/foo", "/"],
            ["/foo.", "/"],
            ["/foo.bar", "/"],
            ["/.", "/"],
            ["/.foo", "/"],
            ["/.foo.bar", "/"],
            ["/foo/bar.baz", "/"],
        ];

        const unixSpecialCaseFormatTests: Array<
            [
                {
                    dir?: string;
                    base?: string;
                    root?: string;
                    name?: string;
                    ext?: string;
                },
                string
            ]
        > = [
            [{ dir: "some/dir" }, "some/dir/"],
            [{ base: "index.html" }, "index.html"],
            [{ root: "/" }, "/"],
            [{ name: "index", ext: ".html" }, "index.html"],
            [
                { dir: "some/dir", name: "index", ext: ".html" },
                "some/dir/index.html",
            ],
            [{ root: "/", name: "index", ext: ".html" }, "/index.html"],
            [{}, ""],
        ];

        const errors: Array<{ method: string; input: Array<unknown> }> = [
            { method: "parse", input: [null] },
            { method: "parse", input: [{}] },
            { method: "parse", input: [true] },
            { method: "parse", input: [1] },
            { method: "parse", input: [] },
            { method: "format", input: [null] },
            { method: "format", input: [""] },
            { method: "format", input: [true] },
            { method: "format", input: [1] },
        ];

        const win32TrailingTests: Array<
            [
                string,
                {
                    dir?: string;
                    root?: string;
                    base?: string;
                    ext?: string;
                    name?: string;
                }
            ]
        > = [
            [".\\", { root: "", dir: "", base: ".", ext: "", name: "." }],
            ["\\\\", { root: "\\", dir: "\\", base: "", ext: "", name: "" }],
            ["\\\\", { root: "\\", dir: "\\", base: "", ext: "", name: "" }],
            [
                "c:\\foo\\\\\\",
                {
                    root: "c:\\",
                    dir: "c:\\",
                    base: "foo",
                    ext: "",
                    name: "foo",
                },
            ],
            [
                "D:\\foo\\\\\\bar.baz",
                {
                    root: "D:\\",
                    dir: "D:\\foo\\\\",
                    base: "bar.baz",
                    ext: ".baz",
                    name: "bar",
                },
            ],
        ];
        const posixTrailingTests: Array<
            [
                string,
                {
                    dir?: string;
                    root?: string;
                    base?: string;
                    ext?: string;
                    name?: string;
                }
            ]
        > = [
            ["./", { root: "", dir: "", base: ".", ext: "", name: "." }],
            ["//", { root: "/", dir: "/", base: "", ext: "", name: "" }],
            ["///", { root: "/", dir: "/", base: "", ext: "", name: "" }],
            [
                "/foo///",
                { root: "/", dir: "/", base: "foo", ext: "", name: "foo" },
            ],
            [
                "/foo///bar.baz",
                {
                    root: "/",
                    dir: "/foo//",
                    base: "bar.baz",
                    ext: ".baz",
                    name: "bar",
                },
            ],
        ];

        function checkPathFormat(
            encoding: string,
            t: Array<string>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            path: any
        ) {
            const hasEncoding = encoding === "none" ? false : true;
            let input = t[0];
            if (hasEncoding) {
                input = Buffer.from(input, encoding as BufferEncoding) as never;
            }
            const output = path.parse(input);
            if (hasEncoding) {
                expect(Buffer.isBuffer(output.root)).to.be.true;
                expect(Buffer.isBuffer(output.dir)).to.be.true;
                expect(Buffer.isBuffer(output.base)).to.be.true;
                expect(Buffer.isBuffer(output.ext)).to.be.true;
                expect(Buffer.isBuffer(output.name)).to.be.true;
                expect(
                    output.root.toString(encoding as BufferEncoding)
                ).to.be.equal(t[1]);
                expect(
                    output.dir
                        .toString(encoding as BufferEncoding)
                        .startsWith(
                            output.root.toString(encoding as BufferEncoding)
                        )
                ).to.be.true;
                expect(
                    output.dir.toString(encoding as BufferEncoding)
                ).to.be.equal(
                    output.dir.toString(encoding as BufferEncoding)
                        ? path
                              .dirname(input)
                              .toString(encoding as BufferEncoding)
                        : ""
                );
                expect(
                    output.base.toString(encoding as BufferEncoding)
                ).to.be.equal(
                    path.basename(input).toString(encoding as BufferEncoding)
                );
                expect(
                    output.ext.toString(encoding as BufferEncoding)
                ).to.be.equal(
                    path.extname(input).toString(encoding as BufferEncoding)
                );
                expect(
                    path.format(output).toString(encoding as BufferEncoding)
                ).to.be.equal(t[0]);
            } else {
                expect(output.root).to.be.a.string;
                expect(output.dir).to.be.a.string;
                expect(output.base).to.be.a.string;
                expect(output.ext).to.be.a.string;
                expect(output.name).to.be.a.string;
                expect(output.root).to.be.equal(t[1]);
                expect(output.dir.toString().startsWith(output.root.toString()))
                    .to.be.true;
                expect(output.dir.toString()).to.be.equal(
                    output.dir.toString() ? path.dirname(input) : ""
                );
                expect(output.base.toString()).to.be.equal(
                    path.basename(input).toString()
                );
                expect(output.ext.toString()).to.be.equal(
                    path.extname(input).toString()
                );
                expect(path.format(output).toString()).to.be.equal(t[0]);
            }
        }

        function checkErrors(
            encoding: string,
            t: { method: string; input: Array<unknown> },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            path: any
        ) {
            const hasEncoding = encoding === "none" ? false : true;
            const input = t.input;
            if (hasEncoding && typeof input[0] === "string") {
                input[0] = Buffer.from(
                    input[0],
                    encoding as BufferEncoding
                ) as never;
            }
            expect(() => path[t.method](...input))
                .to.throw()
                .to.have.property("code", "ERR_INVALID_ARG_TYPE");
        }
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> win32 Encoding: " + encoding, function () {
                winPaths.forEach(function (t) {
                    test("check parse format " + t[0], function () {
                        checkPathFormat(encoding, t, path.win32);
                    });
                });
                winSpecialCaseParseTests.forEach(function (t) {
                    test("special case " + t[0], function () {
                        const hasEncoding = encoding === "none" ? false : true;
                        let input = t[0];
                        if (hasEncoding) {
                            input = Buffer.from(
                                input,
                                encoding as BufferEncoding
                            ) as never;
                        }
                        const output = path.win32.parse(input);
                        if (!hasEncoding) {
                            expect(output).to.be.deep.equal(t[1]);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const o: any = {};
                            Object.keys(output).forEach((k) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                o[k] = (output as any)[k].toString(encoding);
                            });
                            expect(o).to.deep.equal(t[1]);
                        }
                    });
                });
                errors.forEach(function (t) {
                    test(`check error Method: '${t.method}' Input: '${t.input}'`, function () {
                        checkErrors(encoding, t, path.win32);
                    });
                });
                winSpecialCaseFormatTests.forEach(function (t) {
                    test("special case format " + t[1], function () {
                        const hasEncoding = encoding === "none" ? false : true;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const obj: any = {};
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const t0: any = t[0];
                        Object.keys(t0).forEach(
                            (k) =>
                                (obj[k] = hasEncoding
                                    ? Buffer.from(
                                          t0[k],
                                          encoding as BufferEncoding
                                      )
                                    : t0[k])
                        );
                        const output = path.win32.format(obj);
                        if (!hasEncoding) {
                            expect(output).to.be.deep.equal(t[1]);
                        } else {
                            expect(
                                output.toString(encoding as BufferEncoding)
                            ).to.deep.equal(t[1]);
                        }
                    });
                });
                win32TrailingTests.forEach(function (t) {
                    test("trailing test " + t[0], function () {
                        const hasEncoding = encoding === "none" ? false : true;
                        let input = t[0];
                        if (hasEncoding) {
                            input = Buffer.from(
                                input,
                                encoding as BufferEncoding
                            ) as never;
                        }
                        const output = path.win32.parse(input);
                        if (!hasEncoding) {
                            expect(output).to.be.deep.equal(t[1]);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const o: any = {};
                            Object.keys(output).forEach((k) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                o[k] = (output as any)[k].toString(encoding);
                            });
                            expect(o).to.deep.equal(t[1]);
                        }
                    });
                });
            });
            describe("> Posix Encoding: " + encoding, function () {
                unixPaths.forEach(function (t) {
                    test("check parse format " + t[0], function () {
                        checkPathFormat(encoding, t, path.posix);
                    });
                });
                unixSpecialCaseFormatTests.forEach(function (t) {
                    test("special case format " + t[1], function () {
                        const hasEncoding = encoding === "none" ? false : true;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const obj: any = {};
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const t0: any = t[0];
                        Object.keys(t0).forEach(
                            (k) =>
                                (obj[k] = hasEncoding
                                    ? Buffer.from(
                                          t0[k],
                                          encoding as BufferEncoding
                                      )
                                    : t0[k])
                        );
                        const output = path.posix.format(obj);
                        if (!hasEncoding) {
                            expect(output).to.be.deep.equal(t[1]);
                        } else {
                            expect(
                                output.toString(encoding as BufferEncoding)
                            ).to.deep.equal(t[1]);
                        }
                    });
                });
                posixTrailingTests.forEach(function (t) {
                    test("trailing test " + t[0], function () {
                        const hasEncoding = encoding === "none" ? false : true;
                        let input = t[0];
                        if (hasEncoding) {
                            input = Buffer.from(
                                input,
                                encoding as BufferEncoding
                            ) as never;
                        }
                        const output = path.posix.parse(input);
                        if (!hasEncoding) {
                            expect(output).to.be.deep.equal(t[1]);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const o: any = {};
                            Object.keys(output).forEach((k) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                o[k] = (output as any)[k].toString(encoding);
                            });
                            expect(o).to.deep.equal(t[1]);
                        }
                    });
                });
            });
        });
    });
});
