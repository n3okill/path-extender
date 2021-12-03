import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";
import * as NodePath from "path";
import * as NodeUrl from "url";

describe("path-extender", function () {
    describe("> url", function () {
        const windowsTests = [
            // Lowercase ascii alpha
            { path: "C:\\foo", fileURL: "file:///C:/foo" },
            // Uppercase ascii alpha
            { path: "C:\\FOO", fileURL: "file:///C:/FOO" },
            // dir
            { path: "C:\\dir\\foo", fileURL: "file:///C:/dir/foo" },
            // trailing separator
            { path: "C:\\dir\\", fileURL: "file:///C:/dir/" },
            // dot
            { path: "C:\\foo.mjs", fileURL: "file:///C:/foo.mjs" },
            // space
            { path: "C:\\foo bar", fileURL: "file:///C:/foo%20bar" },
            // question mark
            { path: "C:\\foo?bar", fileURL: "file:///C:/foo%3Fbar" },
            // number sign
            { path: "C:\\foo#bar", fileURL: "file:///C:/foo%23bar" },
            // ampersand
            { path: "C:\\foo&bar", fileURL: "file:///C:/foo&bar" },
            // equals
            { path: "C:\\foo=bar", fileURL: "file:///C:/foo=bar" },
            // colon
            { path: "C:\\foo:bar", fileURL: "file:///C:/foo:bar" },
            // semicolon
            { path: "C:\\foo;bar", fileURL: "file:///C:/foo;bar" },
            // percent
            { path: "C:\\foo%bar", fileURL: "file:///C:/foo%25bar" },
            // backslash
            { path: "C:\\foo\\bar", fileURL: "file:///C:/foo/bar" },
            // backspace
            { path: "C:\\foo\bbar", fileURL: "file:///C:/foo%08bar" },
            // tab
            { path: "C:\\foo\tbar", fileURL: "file:///C:/foo%09bar" },
            // newline
            { path: "C:\\foo\nbar", fileURL: "file:///C:/foo%0Abar" },
            // carriage return
            { path: "C:\\foo\rbar", fileURL: "file:///C:/foo%0Dbar" },
            // latin1
            { path: "C:\\fóóbàr", fileURL: "file:///C:/f%C3%B3%C3%B3b%C3%A0r" },
            // Euro sign (BMP code point)
            { path: "C:\\€", fileURL: "file:///C:/%E2%82%AC" },
            // Rocket emoji (non-BMP code point)
            { path: "C:\\🚀", fileURL: "file:///C:/%F0%9F%9A%80" },
            // UNC path (see https://docs.microsoft.com/en-us/archive/blogs/ie/file-uris-in-windows)
            {
                path: "\\\\nas\\My Docs\\File.doc",
                fileURL: "file://nas/My%20Docs/File.doc",
            },
        ];
        const posixTests = [
            // Lowercase ascii alpha
            { path: "/foo", fileURL: "file:///foo" },
            // Uppercase ascii alpha
            { path: "/FOO", fileURL: "file:///FOO" },
            // dir
            { path: "/dir/foo", fileURL: "file:///dir/foo" },
            // trailing separator
            { path: "/dir/", fileURL: "file:///dir/" },
            // dot
            { path: "/foo.mjs", fileURL: "file:///foo.mjs" },
            // space
            { path: "/foo bar", fileURL: "file:///foo%20bar" },
            // question mark
            { path: "/foo?bar", fileURL: "file:///foo%3Fbar" },
            // number sign
            { path: "/foo#bar", fileURL: "file:///foo%23bar" },
            // ampersand
            { path: "/foo&bar", fileURL: "file:///foo&bar" },
            // equals
            { path: "/foo=bar", fileURL: "file:///foo=bar" },
            // colon
            { path: "/foo:bar", fileURL: "file:///foo:bar" },
            // semicolon
            { path: "/foo;bar", fileURL: "file:///foo;bar" },
            // percent
            { path: "/foo%bar", fileURL: "file:///foo%25bar" },
            // backslash
            { path: "/foo\\bar", fileURL: "file:///foo%5Cbar" },
            // backspace
            { path: "/foo\bbar", fileURL: "file:///foo%08bar" },
            // tab
            { path: "/foo\tbar", fileURL: "file:///foo%09bar" },
            // newline
            { path: "/foo\nbar", fileURL: "file:///foo%0Abar" },
            // carriage return
            { path: "/foo\rbar", fileURL: "file:///foo%0Dbar" },
            // latin1
            { path: "/fóóbàr", fileURL: "file:///f%C3%B3%C3%B3b%C3%A0r" },
            // Euro sign (BMP code point)
            { path: "/€", fileURL: "file:///%E2%82%AC" },
            // Rocket emoji (non-BMP code point)
            { path: "/🚀", fileURL: "file:///%F0%9F%9A%80" },
        ];
        (["utf8", "utf16le"] as Array<BufferEncoding>).forEach(function (
            encoding
        ) {
            describe("> " + encoding, function () {
                describe("> win32", function () {
                    before(function () {
                        if (process.platform !== "win32") {
                            this.skip();
                        }
                    });
                    windowsTests.forEach(function (t) {
                        test(`Url: '${t.fileURL}'`, function () {
                            const p = NodeUrl.fileURLToPath(t.fileURL);
                            expect(p).to.be.equal(t.path);
                            const buf = Buffer.from(p, encoding);
                            const basename = path.win32
                                .basename(buf)
                                .toString(encoding);
                            expect(basename).to.be.equal(
                                NodePath.win32.basename(p)
                            );
                            const dirname = path.win32
                                .dirname(buf)
                                .toString(encoding);
                            expect(decodeURI(t.fileURL)).to.have.string(
                                dirname.replace(/\\/g, path.posix.sep)
                            );
                            expect(dirname).to.be.equal(
                                NodePath.win32.dirname(p)
                            );
                            const extname = path.win32
                                .extname(buf)
                                .toString(encoding);
                            expect(t.fileURL).to.have.string(extname);
                            expect(extname).to.be.equal(
                                NodePath.win32.extname(p)
                            );
                            const isAbsolute = path.win32.isAbsolute(buf);
                            expect(isAbsolute).to.be.equal(
                                NodePath.win32.isAbsolute(p)
                            );
                            const join = path.win32
                                .join(
                                    buf,
                                    ".",
                                    new NodeUrl.URL("file:C:\\a/b.js")
                                )
                                .toString(encoding);
                            expect(join).to.be.equal(
                                NodePath.win32.join(p, ".", "C:\\a/b.js")
                            );
                            const normalize = path.win32
                                .normalize(buf)
                                .toString(encoding);
                            expect(normalize).to.be.equal(
                                NodePath.win32.normalize(p)
                            );
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const parse = path.win32.parse(buf) as any;
                            Object.keys(parse).forEach(
                                (k) => (parse[k] = parse[k].toString(encoding))
                            );
                            expect(parse).to.be.deep.equal(
                                NodePath.win32.parse(p)
                            );
                            const relative = path.win32
                                .relative(buf, new NodeUrl.URL("file:C:\\foo"))
                                .toString(encoding);
                            expect(relative).to.be.equal(
                                NodePath.win32.relative(p, "C:\\foo")
                            );
                            const resolve = path.win32
                                .resolve(
                                    new NodeUrl.URL("file:C:\\foo"),
                                    "../",
                                    buf
                                )
                                .toString(encoding);
                            expect(resolve).to.be.equal(
                                NodePath.win32.resolve("C:\\foo", "..", p)
                            );
                        });
                    });
                });
                describe("> posix", function () {
                    before(function () {
                        if (process.platform === "win32") {
                            this.skip();
                        }
                    });
                    posixTests.forEach(function (t) {
                        test(`Url: '${t.fileURL}'`, function () {
                            const p = NodeUrl.fileURLToPath(t.fileURL);
                            expect(p).to.be.equal(t.path);
                            const buf = Buffer.from(p, encoding);
                            const basename = path.posix
                                .basename(buf)
                                .toString(encoding);
                            expect(basename).to.be.equal(
                                NodePath.posix.basename(p)
                            );
                            const dirname = path.posix
                                .dirname(buf)
                                .toString(encoding);
                            expect(t.fileURL).to.have.string(dirname);
                            expect(dirname).to.be.equal(
                                NodePath.posix.dirname(p)
                            );
                            const extname = path.posix
                                .extname(buf)
                                .toString(encoding);
                            expect(t.fileURL).to.have.string(extname);
                            expect(extname).to.be.equal(
                                NodePath.posix.extname(p)
                            );
                            const isAbsolute = path.posix.isAbsolute(buf);
                            expect(isAbsolute).to.be.equal(
                                NodePath.posix.isAbsolute(p)
                            );
                            const join = path.posix
                                .join(buf, ".", new NodeUrl.URL("file:a/b.js"))
                                .toString(encoding);
                            expect(join).to.be.equal(
                                NodePath.posix.join(p, ".", "a/b.js")
                            );
                            const normalize = path.posix
                                .normalize(buf)
                                .toString(encoding);
                            expect(normalize).to.be.equal(
                                NodePath.posix.normalize(p)
                            );
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const parse = path.posix.parse(buf) as any;
                            Object.keys(parse).forEach(
                                (k) => (parse[k] = parse[k].toString(encoding))
                            );
                            expect(parse).to.be.deep.equal(
                                NodePath.posix.parse(p)
                            );
                            const relative = path.posix
                                .relative(buf, new NodeUrl.URL("file:///foo"))
                                .toString(encoding);
                            expect(relative).to.be.equal(
                                NodePath.posix.relative(p, "/foo")
                            );
                            const resolve = path.posix
                                .resolve(
                                    new NodeUrl.URL("file:///foo"),
                                    "../",
                                    buf
                                )
                                .toString(encoding);
                            expect(resolve).to.be.equal(
                                NodePath.posix.resolve("/foo", "..", p)
                            );
                        });
                    });
                });
            });
        });
    });
});
