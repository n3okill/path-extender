import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src/index.js";

describe("path-extender", function () {
    describe("> resolve", function () {
        const isWindows = process.platform === "win32";
        const slashRE = /\//g;
        const backslashRE = /\\/g;
        //const sepReg = new RegExp(path.sep, "g");
        const posixyCwd = isWindows
            ? (() => {
                  const fn = process.cwd().replace(/\\/g, path.posix.sep);
                  return fn.slice(fn.indexOf(path.posix.sep));
              })()
            : process.cwd();
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> win32 Encoding: " + encoding, function () {
                const testWin32: Array<[Array<string>, string]> = [
                    [["c:/blah\\blah", "d:/games", "c:../a"], "c:\\blah\\a"],
                    [["c:/ignore", "d:\\a/b\\c/d", "\\e.exe"], "d:\\e.exe"],
                    [["c:/ignore", "c:/some/file"], "c:\\some\\file"],
                    [["d:/ignore", "d:some/dir//"], "d:\\ignore\\some\\dir"],
                    [["."], process.cwd().replace(slashRE, "\\")],
                    [
                        ["//server/share", "..", "relative\\"],
                        "\\\\server\\share\\relative",
                    ],
                    [["c:/", "//"], "c:\\"],
                    [["c:/", "//dir"], "c:\\dir"],
                    [["c:/", "//server/share"], "\\\\server\\share\\"],
                    [["c:/", "//server//share"], "\\\\server\\share\\"],
                    [["c:/", "///some//dir"], "c:\\some\\dir"],
                    [
                        ["C:\\foo\\tmp.3\\", "..\\tmp.3\\cycles\\root.js"],
                        "C:\\foo\\tmp.3\\cycles\\root.js",
                    ],
                ];
                testWin32.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        const input: Array<string | Buffer> = t[0];
                        if (encoding !== "none") {
                            input[0] = Buffer.from(
                                input[0] as string,
                                encoding as BufferEncoding
                            );
                        }
                        const result = path.win32
                            .resolve(...input)
                            .toString(encoding as BufferEncoding);
                        expect(result).to.be.equal(t[1]);
                    });
                });
            });
            describe("> posix Encoding: " + encoding, function () {
                const testPosix: Array<[Array<string>, string]> = [
                    [["/var/lib", "../", "file/"], "/var/file"],
                    [["/var/lib", "/../", "file/"], "/file"],
                    [
                        ["a/b/c/", "../../.."],
                        posixyCwd.replace(backslashRE, "/"),
                    ],
                    [["."], posixyCwd.replace(backslashRE, "/")],
                    [["/some/dir", ".", "/absolute/"], "/absolute"],
                    [
                        ["/foo/tmp.3/", "../tmp.3/cycles/root.js"],
                        "/foo/tmp.3/cycles/root.js",
                    ],
                ];
                testPosix.forEach(function (t) {
                    test(`Test:"${t[0]}" - Result:"${t[1]}"`, function () {
                        const input: Array<string | Buffer> = t[0];
                        if (encoding !== "none") {
                            input[0] = Buffer.from(
                                input[0] as string,
                                encoding as BufferEncoding
                            );
                        }
                        const result = path.posix
                            .resolve(...input)
                            .toString(encoding as BufferEncoding);
                        if (process.platform !== "win32") {
                            expect(result).to.be.equal(t[1]);
                        } else {
                            expect(
                                result.replace(backslashRE, "/")
                            ).to.have.string(t[1]);
                        }
                    });
                });
            });
        });
    });
});
