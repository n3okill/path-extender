import * as NodeUrl from "url";
import { FormatInputPathObject } from "path";

export type PathLike = Buffer | string | NodeUrl.URL;

export const platformIsWin32 = process.platform === "win32";

export const CHAR_CODE_FORWARD_SLASH = "/".charCodeAt(0);
export const CHAR_CODE_BACKWARD_SLASH = "\\".charCodeAt(0);
export const CHAR_CODE_LOWERCASE_A = "a".charCodeAt(0);
export const CHAR_CODE_UPPERCASE_A = "A".charCodeAt(0);
export const CHAR_CODE_LOWERCASE_Z = "z".charCodeAt(0);
export const CHAR_CODE_UPPERCASE_Z = "Z".charCodeAt(0);
export const CHAR_CODE_DOT = ".".charCodeAt(0);
export const CHAR_CODE_COLON = ":".charCodeAt(0);
export const CHAR_CODE_SEMICOLON = ";".charCodeAt(0);
export const CHAR_CODE_QUESTION_MARK = "?".charCodeAt(0);

export const UTF16 = "utf16le";
export const UTF8 = "utf8";

export interface FormatInputPathObjectBuffer {
    /**
     * The root of the path such as '/' or 'c:\'
     */
    root?: string | Buffer | undefined;
    /**
     * The full directory path such as '/home/user/dir' or 'c:\path\dir'
     */
    dir?: string | Buffer | undefined;
    /**
     * The file name including extension (if any) such as 'index.html'
     */
    base?: string | Buffer | undefined;
    /**
     * The file extension (if any) such as '.html'
     */
    ext?: string | Buffer | undefined;
    /**
     * The file name without extension (if any) such as 'index'
     */
    name?: string | Buffer | undefined;
}

type _FormatInputPathObjectBuffer = FormatInputPathObjectBuffer & {
    [key: string]: string | Buffer;
};

export function fileURLToPath(str: unknown): string | unknown {
    if (
        (typeof str === "string" && str.startsWith("file://")) ||
        isURLInstance(str as never)
    ) {
        try {
            return NodeUrl.fileURLToPath(str as never);
        } catch (err) {}
    }
    return str;
}

function isURLInstance(fileURLOrPath: NodeUrl.URL) {
    return fileURLOrPath != null && fileURLOrPath.href && fileURLOrPath.origin;
}

export function isPathSeparator(code: number): boolean {
    return (
        code === CHAR_CODE_FORWARD_SLASH || code === CHAR_CODE_BACKWARD_SLASH
    );
}

export function isPosixPathSeparator(code: number): boolean {
    return code === CHAR_CODE_FORWARD_SLASH;
}

export function isWindowsDeviceRoot(code: number): boolean {
    return (
        (code >= CHAR_CODE_UPPERCASE_A && code <= CHAR_CODE_UPPERCASE_Z) ||
        (code >= CHAR_CODE_LOWERCASE_A && code <= CHAR_CODE_LOWERCASE_Z)
    );
}

export function detectEncoding(buf: Buffer): BufferEncoding {
    return buf.lastIndexOf(0) !== -1 ? UTF16 : UTF8;
}

// Wraps a Buffer providing handling for both utf8 and utf8le byte encodings.
export class BufferWrapper {
    private _buffer;
    readonly encoding: BufferEncoding;
    constructor(_buffer: Buffer, encoding?: BufferEncoding) {
        this._buffer = _buffer;
        this.encoding = encoding ?? detectEncoding(this._buffer);
    }
    static concat(
        buffers: Array<BufferWrapper | Buffer | string>,
        encoding?: BufferEncoding
    ): BufferWrapper {
        const unwraped: Array<Buffer> = [];
        for (const buf of buffers) {
            if (buf instanceof BufferWrapper) {
                unwraped.push(buf.buffer);
            } else if (Buffer.isBuffer(buf)) {
                unwraped.push(buf);
            } else {
                unwraped.push(Buffer.from(buf as string, encoding));
            }
        }
        return BufferWrapper.from(Buffer.concat(unwraped), encoding);
    }
    push(str: string | Buffer | BufferWrapper): BufferWrapper {
        if (str instanceof BufferWrapper) {
            this._buffer = Buffer.concat([this._buffer, str.buffer]);
        } else if (Buffer.isBuffer(str)) {
            this._buffer = Buffer.concat([this._buffer, str]);
        } else {
            this._buffer = Buffer.concat([
                this._buffer,
                Buffer.from(str, this.encoding),
            ]);
        }
        return this;
    }
    unshift(str: string | Buffer | BufferWrapper): BufferWrapper {
        if (str instanceof BufferWrapper) {
            this._buffer = Buffer.concat([str.buffer, this._buffer]);
            //return BufferWrapper.from(Buffer.concat([str.buffer, this.buffer]), this.encoding);
        } else if (Buffer.isBuffer(str)) {
            this._buffer = Buffer.concat([str, this._buffer]);
        } else {
            this._buffer = Buffer.concat([
                Buffer.from(str, this.encoding),
                this._buffer,
            ]);
        }
        return this;
    }
    static from(buf: PathLike, encoding?: BufferEncoding): BufferWrapper {
        if (Buffer.isBuffer(buf)) {
            return new BufferWrapper(buf as Buffer, encoding);
        }
        buf = fileURLToPath(buf) as string;
        return new BufferWrapper(
            Buffer.from(buf as string, encoding),
            encoding
        );
    }
    charCodeAt(position: number): number {
        switch (this.encoding) {
            case UTF16:
                position *= 2;
                // Handle both LE and BE case:
                return this._buffer[position]
                    ? this._buffer[position]
                    : this._buffer[position + 1];
                break;
            default:
                return this._buffer[position];
        }
    }
    lastIndexOf(charCode: number): number {
        let i = this.length + 1;
        while (i-- >= 0) {
            if (this.charCodeAt(i) === charCode) {
                return i;
            }
        }
        return -1;
    }
    slice(start: number, end?: number): BufferWrapper {
        if (!end) {
            end = this.buffer.length;
        }
        if (this.encoding === UTF16) {
            start *= 2;
            end *= 2;
        }
        return BufferWrapper.from(this.buffer.slice(start, end), this.encoding);
    }
    get buffer(): Buffer {
        return Buffer.from(this._buffer);
    }
    get length(): number {
        switch (this.encoding) {
            case UTF16:
                return this._buffer.length / 2;
            default:
                return this._buffer.length;
        }
    }
    equals(buf: BufferWrapper | Buffer): boolean {
        if (buf instanceof BufferWrapper) {
            return this.buffer.equals(buf.buffer);
        }
        return this.buffer.equals(buf as Buffer);
    }
    toString(encoding?: BufferEncoding): string {
        return this.buffer.toString(encoding || this.encoding);
    }
    toLowerCase(encoding?: BufferEncoding): string {
        return this.toString(encoding).toLowerCase();
    }
}

export const posixCwd = (() => {
    if (platformIsWin32) {
        // Converts Windows' backslash path separators to POSIX forward slashes
        // and truncates any drive indicator
        const regexp = /\\/g;
        return () => {
            const cwd = process.cwd().replace(regexp, "/"); //StringPrototypeReplace(process.cwd(), regexp, '/');
            return cwd.slice(cwd.indexOf("/")); //StringPrototypeSlice(cwd, StringPrototypeIndexOf(cwd, '/'));
        };
    }

    // We're already on POSIX, no need for any transformations
    return () => process.cwd();
})();

// Resolves . and .. elements in a path with directory names
export function normalizeString(
    path: BufferWrapper,
    allowAboveRoot: boolean,
    separator: BufferWrapper,
    separatorCode: number,
    isPathSeparator: (n: number) => boolean
): BufferWrapper {
    let res = BufferWrapper.from("", path.encoding);
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code = 0;
    for (let i = 0; i <= path.length; ++i) {
        if (i < path.length) {
            code = path.charCodeAt(i);
        } else if (isPathSeparator(code)) {
            break;
        } else {
            code = CHAR_CODE_FORWARD_SLASH;
        }

        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
                // NOOP
            } else if (dots === 2) {
                if (
                    res.length < 2 ||
                    lastSegmentLength !== 2 ||
                    res.charCodeAt(res.length - 1) !== CHAR_CODE_DOT ||
                    res.charCodeAt(res.length - 2) !== CHAR_CODE_DOT
                ) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separatorCode);
                        if (lastSlashIndex === -1) {
                            res = BufferWrapper.from("", path.encoding);
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength =
                                res.length - 1 - res.lastIndexOf(separatorCode);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length !== 0) {
                        res = BufferWrapper.from("", path.encoding);
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    //res = res.push(res.length > 0 ? `${separator}..` : '..');
                    res = BufferWrapper.concat(
                        res.length > 0
                            ? [
                                  res,
                                  separator,
                                  BufferWrapper.from("..", path.encoding),
                              ]
                            : [res, BufferWrapper.from("..", path.encoding)]
                    );
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) {
                    res = BufferWrapper.concat([
                        res,
                        separator,
                        path.slice(lastSlash + 1, i),
                    ]);
                } else {
                    res = path.slice(lastSlash + 1, i);
                }
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === CHAR_CODE_DOT && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}

export function getFirstEncoding(args: Array<PathLike>): BufferEncoding {
    for (const arg of args) {
        if (arg instanceof BufferWrapper) {
            return arg.encoding;
        } else if (Buffer.isBuffer(arg)) {
            return BufferWrapper.from(arg).encoding;
        }
    }
    return "utf8";
}

/**
 * @param {string} sep
 * @param {{
 *  dir?: string;
 *  root?: string;
 *  base?: string;
 *  name?: string;
 *  ext?: string;
 *  }} pathObject
 * @returns {string}
 */
export function format(
    sep: string,
    obj: FormatInputPathObjectBuffer,
    NodePathFormat: CallableFunction
): PathLike {
    const o = obj as _FormatInputPathObjectBuffer;
    let hasBuffer = false;
    try {
        const keys = ["dir", "root", "base", "name", "ext"];
        hasBuffer = keys.some((k) => k in obj && Buffer.isBuffer(o[k]));
    } catch (err) {}
    if (!(typeof obj === "object")) {
        hasBuffer = false;
    }
    if (!hasBuffer) {
        if (Buffer.isBuffer(obj)) {
            obj = obj.toString() as never;
        }
        return NodePathFormat(obj as FormatInputPathObject);
    } else {
        const encoding = getFirstEncoding([
            o.dir as never,
            o.root as never,
            o.base as never,
            o.name as never,
            o.ext as never,
        ]);
        const dir =
            (o.dir && Buffer.from(o.dir.toString(encoding), encoding)) ||
            (o.root && Buffer.from(o.root.toString(encoding), encoding));
        const base =
            (o.base && Buffer.from(o.base.toString(encoding), encoding)) ||
            Buffer.from(
                `${o.name ? o.name.toString(encoding) : ""}${
                    o.ext ? o.ext.toString(encoding) : ""
                }`,
                encoding
            );
        if (!dir) {
            return base;
        }
        return dir.toString(encoding) === o.root?.toString(encoding)
            ? Buffer.from(
                  `${dir.toString(encoding)}${base.toString(encoding)}`,
                  encoding
              )
            : Buffer.from(
                  `${dir.toString(encoding)}${sep}${base.toString(encoding)}`,
                  encoding
              );
    }
}
