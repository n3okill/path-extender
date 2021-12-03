import { expect } from "chai";
import { describe, test } from "mocha";
import path from "../src";

// These testcases are specific to one uncommon behavior in path module. Few
// of the functions in path module, treat '' strings as current working
// directory. This test makes sure that the behavior is intact between commits.
// See: https://github.com/nodejs/node/pull/2106

describe("path-extender", function () {
    describe("> zero length", function () {
        const pwd = process.cwd();
        ["none", "utf8", "utf16le"].forEach(function (encoding) {
            describe("> join - Encode: " + encoding, function () {
                // Join will internally ignore all the zero-length strings and it will return
                // '.' if the joined string is a zero-length string.
                test("default", function () {
                    if (encoding === "none") {
                        expect(path.join(pwd)).to.be.equal(pwd);
                        expect(path.join(pwd, "")).to.be.equal(pwd);
                    } else {
                        expect(
                            path.join(Buffer.from(pwd)).toString()
                        ).to.be.equal(pwd);
                        expect(
                            path.join(Buffer.from(pwd), "").toString()
                        ).to.be.equal(pwd);
                    }
                });
                test("posix", function () {
                    if (encoding === "none") {
                        expect(path.posix.join("")).to.be.equal(".");
                        expect(path.posix.join("", "")).to.be.equal(".");
                    } else {
                        expect(
                            path.posix.join(Buffer.from("")).toString()
                        ).to.be.equal(".");
                        expect(
                            path.posix.join(Buffer.from(""), "").toString()
                        ).to.be.equal(".");
                    }
                });
                test("win32", function () {
                    if (encoding === "none") {
                        expect(path.win32.join("")).to.be.equal(".");
                        expect(path.win32.join("", "")).to.be.equal(".");
                    } else {
                        expect(
                            path.win32.join(Buffer.from("")).toString()
                        ).to.be.equal(".");
                        expect(
                            path.win32.join(Buffer.from(""), "").toString()
                        ).to.be.equal(".");
                    }
                });
            });
            describe("> normalize - Encode: " + encoding, function () {
                // Normalize will return '.' if the input is a zero-length string
                test("default", function () {
                    if (encoding === "none") {
                        expect(path.normalize(pwd)).to.be.equal(pwd);
                    } else {
                        expect(
                            path.normalize(Buffer.from(pwd)).toString()
                        ).to.be.equal(pwd);
                    }
                });
                test("posix", function () {
                    if (encoding === "none") {
                        expect(path.posix.normalize("")).to.be.equal(".");
                    } else {
                        expect(
                            path.posix.normalize(Buffer.from("")).toString()
                        ).to.be.equal(".");
                    }
                });
                test("win32", function () {
                    if (encoding === "none") {
                        expect(path.win32.normalize("")).to.be.equal(".");
                    } else {
                        expect(
                            path.win32.normalize(Buffer.from("")).toString()
                        ).to.be.equal(".");
                    }
                });
            });
            describe("> isAbsolute - Encode: " + encoding, function () {
                // Since '' is not a valid path in any of the common environments, return false
                test("posix", function () {
                    if (encoding === "none") {
                        expect(path.posix.isAbsolute("")).to.be.equal(false);
                    } else {
                        expect(
                            path.posix.isAbsolute(Buffer.from(""))
                        ).to.be.equal(false);
                    }
                });
                test("win32", function () {
                    if (encoding === "none") {
                        expect(path.win32.isAbsolute("")).to.be.equal(false);
                    } else {
                        expect(
                            path.win32.isAbsolute(Buffer.from(""))
                        ).to.be.equal(false);
                    }
                });
            });
            describe("> resolve - Encode: " + encoding, function () {
                // Resolve, internally ignores all the zero-length strings and returns the
                // current working directory
                test("default", function () {
                    if (encoding === "none") {
                        expect(path.resolve("")).to.be.equal(pwd);
                        expect(path.resolve("", "")).to.be.equal(pwd);
                    } else {
                        expect(
                            path.resolve(Buffer.from("")).toString()
                        ).to.be.equal(pwd);
                        expect(
                            path.resolve(Buffer.from(""), "").toString()
                        ).to.be.equal(pwd);
                    }
                });
            });
            describe("> relative - Encode: " + encoding, function () {
                // Relative, internally calls resolve. So, '' is actually the current directory
                test("default", function () {
                    if (encoding === "none") {
                        expect(path.relative("", pwd)).to.be.equal("");
                        expect(path.relative(pwd, "")).to.be.equal("");
                        expect(path.relative(pwd, pwd)).to.be.equal("");
                    } else {
                        expect(
                            path.relative(Buffer.from(""), pwd).toString()
                        ).to.be.equal("");
                        expect(
                            path.relative(Buffer.from(pwd), "").toString()
                        ).to.be.equal("");
                        expect(
                            path.relative(Buffer.from(pwd), pwd).toString()
                        ).to.be.equal("");
                    }
                });
            });
        });
    });
});
