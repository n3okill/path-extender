import { FormatInputPathObject, posix as NodePath } from "path";
import * as NodeUrl from "url";
import {
    PathLike,
    BufferWrapper,
    posixCwd,
    CHAR_CODE_FORWARD_SLASH,
    normalizeString,
    isPosixPathSeparator,
    CHAR_CODE_DOT,
    fileURLToPath,
    FormatInputPathObjectBuffer,
    CHAR_CODE_BACKWARD_SLASH,
    CHAR_CODE_COLON,
    getFirstEncoding,
    format as _format,
} from "./util";

/**
 * path.resolve([from ...], to)
 * @param {...string} args
 * @returns {string}
 */
export function resolve(...args: Array<string | NodeUrl.URL>): string;
export function resolve(...args: Array<PathLike>): Buffer;
export function resolve(...args: Array<PathLike>): string | Buffer;
export function resolve(...args: Array<PathLike>): string | Buffer {
    const hasBuffer = args.some((s) => Buffer.isBuffer(s));
    if (!hasBuffer) {
        const newArgs = args.map((arg) => fileURLToPath(arg as string));
        return NodePath.resolve(...(newArgs as Array<string>));
    } else {
        const encoding = getFirstEncoding(args);
        let resolvedPath = BufferWrapper.from("", encoding);
        let resolvedAbsolute = false;

        for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            const path = BufferWrapper.from(
                i >= 0 ? args[i] : posixCwd(),
                encoding
            );
            // Skip empty entries
            if (path.length === 0) {
                continue;
            }
            resolvedPath = BufferWrapper.concat(
                [path, "/", resolvedPath],
                encoding
            );
            resolvedAbsolute = path.charCodeAt(0) === CHAR_CODE_FORWARD_SLASH;
        }

        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)

        // Normalize the path
        resolvedPath = normalizeString(
            resolvedPath,
            !resolvedAbsolute,
            BufferWrapper.from("/", encoding),
            CHAR_CODE_FORWARD_SLASH,
            isPosixPathSeparator
        );

        if (resolvedAbsolute) {
            return resolvedPath.unshift("/").buffer;
        }
        return resolvedPath.length > 0
            ? resolvedPath.buffer
            : Buffer.from(".", encoding);
    }
}

/**
 * @param {string} path
 * @returns {string}
 */
export function normalize(path: string | NodeUrl.URL): string;
export function normalize(path: Buffer): Buffer;
export function normalize(path: PathLike): string | Buffer;
export function normalize(path: PathLike): string | Buffer {
    if (!Buffer.isBuffer(path)) {
        return NodePath.normalize(fileURLToPath(path) as never);
    } else {
        if ((path as Buffer).length === 0) {
            return Buffer.from(".");
        }

        let p = BufferWrapper.from(path as Buffer);

        const isAbsolute = p.charCodeAt(0) === CHAR_CODE_FORWARD_SLASH;
        const trailingSeparator =
            p.charCodeAt(p.length - 1) === CHAR_CODE_FORWARD_SLASH;

        // Normalize the path
        p = normalizeString(
            p,
            !isAbsolute,
            BufferWrapper.from("/", p.encoding),
            CHAR_CODE_FORWARD_SLASH,
            isPosixPathSeparator
        );

        if (p.length === 0) {
            if (isAbsolute) {
                return BufferWrapper.from("/", p.encoding).buffer;
            }
            return BufferWrapper.from(
                trailingSeparator ? "./" : ".",
                p.encoding
            ).buffer;
        }

        if (trailingSeparator) {
            p.push("/");
        }
        return isAbsolute ? p.unshift("/").buffer : p.buffer;
    }
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isAbsolute(path: PathLike): boolean {
    if (!Buffer.isBuffer(path)) {
        return NodePath.isAbsolute(fileURLToPath(path) as never);
    } else {
        const p = BufferWrapper.from(path);
        return p.length > 0 && p.charCodeAt(0) === CHAR_CODE_FORWARD_SLASH;
    }
}

/**
 * @param {...string} args
 * @returns {string}
 */

export function join(...args: Array<string | NodeUrl.URL>): string;
export function join(...args: Array<Buffer>): Buffer;
export function join(...args: Array<PathLike>): string | Buffer;
export function join(...args: Array<PathLike>): string | Buffer {
    const hasBuffer = args.some((s) => Buffer.isBuffer(s));
    if (!hasBuffer) {
        const newArgs = args.map((arg) => fileURLToPath(arg) as never);
        return NodePath.join(...newArgs);
    } else {
        if (args.length === 0) {
            return Buffer.from(".");
        }
        const encoding = getFirstEncoding(args);

        let joined;
        for (let i = 0; i < args.length; ++i) {
            const arg = BufferWrapper.from(args[i], encoding);
            if (arg.length > 0) {
                if (joined === undefined) {
                    joined = arg;
                } else {
                    joined = BufferWrapper.concat([joined, "/", arg], encoding);
                }
            }
        }
        if (joined === undefined) {
            return Buffer.from(".", encoding);
        }
        return normalize(joined.buffer);
    }
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
export function relative(
    from: string | NodeUrl.URL,
    to: string | NodeUrl.URL
): string;
export function relative(from: PathLike, to: PathLike): Buffer;
export function relative(from: PathLike, to: PathLike): string | Buffer;
export function relative(from: PathLike, to: PathLike): string | Buffer {
    const hasBuffer = Buffer.isBuffer(from) || Buffer.isBuffer(to);
    if (!hasBuffer) {
        return NodePath.relative(
            fileURLToPath(from) as never,
            fileURLToPath(to) as never
        );
    } else {
        const encoding = getFirstEncoding([from, to]);
        let pFrom = BufferWrapper.from(from, encoding);
        let pTo = BufferWrapper.from(to, encoding);

        if (pFrom.equals(pTo)) {
            return Buffer.from("", encoding);
        }

        // Trim leading forward slashes.
        pFrom = BufferWrapper.from(resolve(pFrom.buffer) as Buffer, encoding);
        pTo = BufferWrapper.from(resolve(pTo.buffer) as Buffer, encoding);

        if (pFrom.equals(pTo)) {
            return Buffer.from("", encoding);
        }
        const fromStart = 1;
        const fromEnd = pFrom.length;
        const fromLen = fromEnd - fromStart;
        const toStart = 1;
        const toEnd = pTo.length;
        const toLen = toEnd - toStart;

        // Compare paths to find the longest common path from root
        const length = fromLen < toLen ? fromLen : toLen;
        let lastCommonSep = -1;
        let i = 0;
        for (; i < length; i++) {
            const fromCode = pFrom.charCodeAt(fromStart + i);
            if (fromCode !== pTo.charCodeAt(toStart + i)) {
                break;
            } else if (fromCode === CHAR_CODE_FORWARD_SLASH) {
                lastCommonSep = i;
            }
        }
        if (i === length) {
            if (toLen > length) {
                if (pTo.charCodeAt(toStart + i) === CHAR_CODE_FORWARD_SLASH) {
                    // We get here if `from` is the exact base path for `to`.
                    // For example: from='/foo/bar'; to='/foo/bar/baz'
                    return pTo.slice(toStart + i + 1).buffer;
                }
                if (i === 0) {
                    // We get here if `from` is the root
                    // For example: from='/'; to='/foo'
                    return pTo.slice(toStart + i).buffer;
                }
            } else if (fromLen > length) {
                if (
                    pFrom.charCodeAt(fromStart + i) === CHAR_CODE_FORWARD_SLASH
                ) {
                    // We get here if `to` is the exact base path for `from`.
                    // For example: from='/foo/bar/baz'; to='/foo/bar'
                    lastCommonSep = i;
                } else if (i === 0) {
                    // We get here if `to` is the root.
                    // For example: from='/foo/bar'; to='/'
                    lastCommonSep = 0;
                }
            }
        }

        const out = BufferWrapper.from("", encoding);
        // Generate the relative path based on the path difference between `to`
        // and `from`.
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (
                i === fromEnd ||
                pFrom.charCodeAt(i) === CHAR_CODE_FORWARD_SLASH
            ) {
                out.push(out.length === 0 ? ".." : "/..");
            }
        }

        // Lastly, append the rest of the destination (`to`) path that comes after
        // the common path parts.
        return out.push(pTo.slice(toStart + lastCommonSep).buffer).buffer;
    }
}

/**
 * @param {string} path
 * @returns {string}
 */
export function toNamespacedPath(path: string | NodeUrl.URL): string;
export function toNamespacedPath(path: Buffer): Buffer;
export function toNamespacedPath(path: PathLike): string | Buffer;
export function toNamespacedPath(path: PathLike): string | Buffer {
    // Non-op on posix systems
    return !Buffer.isBuffer(path) ? (fileURLToPath(path) as never) : path;
}

/**
 * @param {string} path
 * @returns {string}
 */
export function dirname(path: string | NodeUrl.URL): string;
export function dirname(path: Buffer): Buffer;
export function dirname(path: PathLike): string | Buffer;
export function dirname(path: PathLike): string | Buffer {
    if (!Buffer.isBuffer(path)) {
        return NodePath.dirname(fileURLToPath(path) as never);
    } else {
        const p = BufferWrapper.from(path);
        if (p.length === 0) {
            return Buffer.from(".", p.encoding);
        }

        const hasRoot = p.charCodeAt(0) === CHAR_CODE_FORWARD_SLASH;
        let end = -1;
        let matchedSlash = true;
        for (let i = p.length - 1; i >= 1; i--) {
            if (p.charCodeAt(i) === CHAR_CODE_FORWARD_SLASH) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            } else {
                // We saw the first non-path separator
                matchedSlash = false;
            }
        }

        if (end === -1) {
            return Buffer.from(hasRoot ? "/" : ".", p.encoding);
        }
        if (hasRoot && end === 1) {
            return Buffer.from("//", p.encoding);
        }
        return p.slice(0, end).buffer;
    }
}

/**
 * @param {string} path
 * @param {string} [ext]
 * @returns {string}
 */
export function basename(path: string | NodeUrl.URL, ext?: string): string;
export function basename(path: Buffer, ext?: string): Buffer;
export function basename(path: PathLike, ext?: string): string | Buffer;
export function basename(path: PathLike, ext?: string): string | Buffer {
    if (!Buffer.isBuffer(path)) {
        return NodePath.basename(fileURLToPath(path) as never, ext);
    } else {
        const p = BufferWrapper.from(path);
        let e = undefined;
        if (ext !== undefined) {
            e = BufferWrapper.from(ext, p.encoding);
        }

        let start = 0;
        let end = -1;
        let matchedSlash = true;

        if (e !== undefined && e.length > 0 && e.length <= p.length) {
            if (p.equals(e)) {
                return Buffer.from("", p.encoding);
            }
            let eIdx = e.length - 1;
            let firstNonSlashEnd = -1;
            for (let i = p.length - 1; i >= 0; --i) {
                const code = p.charCodeAt(i);
                if (code === CHAR_CODE_FORWARD_SLASH) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                } else {
                    if (firstNonSlashEnd === -1) {
                        // We saw the first non-path separator, remember this index in case
                        // we need it if the extension ends up not matching
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if (eIdx >= 0) {
                        // Try to match the explicit extension
                        if (code === e.charCodeAt(eIdx)) {
                            if (--eIdx === -1) {
                                // We matched the extension, so mark this as the end of our path
                                // component
                                end = i;
                            }
                        } else {
                            // Extension does not match, so our result is the entire path
                            // component
                            eIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
            if (start === end) {
                end = firstNonSlashEnd;
            } else if (end === -1) {
                end = p.length;
            }
            return p.slice(start, end).buffer;
        }
        for (let i = p.length - 1; i >= 0; --i) {
            if (p.charCodeAt(i) === CHAR_CODE_FORWARD_SLASH) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // path component
                matchedSlash = false;
                end = i + 1;
            }
        }

        if (end === -1) {
            return Buffer.from("", p.encoding);
        }
        return p.slice(start, end).buffer;
    }
}

/**
 * @param {string} path
 * @returns {string}
 */
export function extname(path: string | NodeUrl.URL): string;
export function extname(path: Buffer): Buffer;
export function extname(path: PathLike): string | Buffer;
export function extname(path: PathLike): string | Buffer {
    if (!Buffer.isBuffer(path)) {
        return NodePath.extname(fileURLToPath(path) as never);
    } else {
        const p = BufferWrapper.from(path);
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        let preDotState = 0;
        for (let i = p.length - 1; i >= 0; --i) {
            const code = p.charCodeAt(i);
            if (code === CHAR_CODE_FORWARD_SLASH) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if (code === CHAR_CODE_DOT) {
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1) {
                    startDot = i;
                } else if (preDotState !== 1) {
                    preDotState = 1;
                }
            } else if (startDot !== -1) {
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }

        if (
            startDot === -1 ||
            end === -1 ||
            // We saw a non-dot character immediately before the dot
            preDotState === 0 ||
            // The (right-most) trimmed path component is exactly '..'
            (preDotState === 1 &&
                startDot === end - 1 &&
                startDot === startPart + 1)
        ) {
            return Buffer.from("", p.encoding);
        }
        return p.slice(startDot, end).buffer;
    }
}

//format: _format.bind(null)
/*format: FunctionPrototypeBind(_format, null, '/'),*/
//format: _format.bind(null, '/'),
//export const format = NodePath.format;
export function format(obj: FormatInputPathObjectBuffer): PathLike {
    return _format("/", obj, NodePath.format);
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
/*type _FormatInputPathObjectBuffer = FormatInputPathObjectBuffer & {
    [key: string]: string | Buffer;
}

export function format(obj: FormatInputPathObjectBuffer): PathLike {
    const sep = '/';
    const keys = ["dir", "root", "base", "name", "ext"];
    const o = obj as _FormatInputPathObjectBuffer;
    const hasBuffer = keys.some((k) => k in obj && Buffer.isBuffer(o[k]));
    if (!hasBuffer) {
        return NodePath.format(obj as FormatInputPathObject);
    } else {
        const dir = o.dir && Buffer.from(o.dir.toString()) || o.root && Buffer.from(o.root.toString());
        const base = o.base && Buffer.from(o.base.toString()) ||
            Buffer.from(`${o.name ? o.name.toString() : ''}${o.ext ? o.ext.toString() : ''}`);
        if (!dir) {
            return base;
        }
        return dir.toString() === o.root?.toString() ? Buffer.from(`${dir.toString()}${base.toString()}`) :
            Buffer.from(`${dir.toString()}${sep}${base.toString()}`);
    }
}
*/
/**
 * @param {string} path
 * @returns {{
 *   dir: string;
 *   root: string;
 *   base: string;
 *   name: string;
 *   ext: string;
 *   }}
 */

export function parse(
    path: string | NodeUrl.URL
): Required<FormatInputPathObject>;
export function parse(path: Buffer): Required<FormatInputPathObjectBuffer>;
export function parse(path: PathLike): Required<FormatInputPathObjectBuffer>;
export function parse(path: PathLike): Required<FormatInputPathObjectBuffer> {
    if (!Buffer.isBuffer(path)) {
        return NodePath.parse(fileURLToPath(path) as never);
    } else {
        const p = BufferWrapper.from(path);

        const ret = {
            root: Buffer.from("", p.encoding),
            dir: Buffer.from("", p.encoding),
            base: Buffer.from("", p.encoding),
            ext: Buffer.from("", p.encoding),
            name: Buffer.from("", p.encoding),
        };
        if (p.length === 0) return ret;
        const isAbsolute = p.charCodeAt(0) === CHAR_CODE_FORWARD_SLASH;
        let start;
        if (isAbsolute) {
            ret.root = Buffer.from("/", p.encoding);
            start = 1;
        } else {
            start = 0;
        }
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let i = p.length - 1;

        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        let preDotState = 0;

        // Get non-dir info
        for (; i >= start; --i) {
            const code = p.charCodeAt(i);
            if (code === CHAR_CODE_FORWARD_SLASH) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if (code === CHAR_CODE_DOT) {
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1) startDot = i;
                else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }

        if (end !== -1) {
            const start = startPart === 0 && isAbsolute ? 1 : startPart;
            if (
                startDot === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1)
            ) {
                ret.base = ret.name = p.slice(start, end).buffer;
            } else {
                ret.name = p.slice(start, startDot).buffer;
                ret.base = p.slice(start, end).buffer;
                ret.ext = p.slice(startDot, end).buffer;
            }
        }

        if (startPart > 0) ret.dir = p.slice(0, startPart - 1).buffer;
        else if (isAbsolute) ret.dir = Buffer.from("/", p.encoding);

        return ret;
    }
}

// eslint-disable-next-line prefer-const
export const sep = "/";
// eslint-disable-next-line prefer-const
export const sepCode = CHAR_CODE_BACKWARD_SLASH;
// eslint-disable-next-line prefer-const
export const delimiter = ":";
// eslint-disable-next-line prefer-const
export const delimiterCode = CHAR_CODE_COLON;
// eslint-disable-next-line prefer-const
//export let win32 = null;
// eslint-disable-next-line prefer-const
//export let posix = null;
