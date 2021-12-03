import { win32 as NodePath, FormatInputPathObject } from "path";
import * as NodeUrl from "url";
import {
    PathLike,
    BufferWrapper,
    CHAR_CODE_BACKWARD_SLASH,
    isPathSeparator,
    isWindowsDeviceRoot,
    CHAR_CODE_COLON,
    fileURLToPath,
    normalizeString,
    isPosixPathSeparator,
    CHAR_CODE_QUESTION_MARK,
    CHAR_CODE_DOT,
    FormatInputPathObjectBuffer,
    CHAR_CODE_SEMICOLON,
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
        const newArgs = args.map((arg) => fileURLToPath(arg) as never);
        return NodePath.resolve(...newArgs);
    } else {
        const encoding = getFirstEncoding(args);
        let resolvedDevice = BufferWrapper.from("", encoding);
        let resolvedTail = BufferWrapper.from("", encoding);
        let resolvedAbsolute = false;

        for (let i = args.length - 1; i >= -1; i--) {
            let path;
            if (i >= 0) {
                path = BufferWrapper.from(args[i], encoding);

                // Skip empty entries
                if (path.length === 0) {
                    continue;
                }
            } else if (resolvedDevice.length === 0) {
                path = BufferWrapper.from(process.cwd(), encoding);
            } else {
                // Windows has the concept of drive-specific current working
                // directories. If we've resolved a drive letter but not yet an
                // absolute path, get cwd for that drive, or the process cwd if
                // the drive cwd is not available. We're sure the device is not
                // a UNC path at this points, because UNC paths are always absolute.
                path = process.env[`=${resolvedDevice.toString()}`]
                    ? BufferWrapper.from(
                          process.env[
                              `=${resolvedDevice.toString()}`
                          ] as string,
                          encoding
                      )
                    : BufferWrapper.from(process.cwd(), encoding);

                // Verify that a cwd was found and that it actually points
                // to our drive. If not, default to the drive's root.
                if (
                    path === undefined ||
                    (path.slice(0, 2).toLowerCase() !==
                        resolvedDevice.toLowerCase() &&
                        path.charCodeAt(2) === CHAR_CODE_BACKWARD_SLASH)
                ) {
                    path = BufferWrapper.concat(
                        [resolvedDevice, "\\"],
                        encoding
                    );
                }
            }

            const len = path.length;
            let rootEnd = 0;
            let device = BufferWrapper.from("", encoding);
            let isAbsolute = false;
            const code = path.charCodeAt(0);

            // Try to match a root
            if (len === 1) {
                if (isPathSeparator(code)) {
                    // `path` contains just a path separator
                    rootEnd = 1;
                    isAbsolute = true;
                }
            } else if (isPathSeparator(code)) {
                // Possible UNC root

                // If we started with a separator, we know we at least have an
                // absolute path of some kind (UNC or otherwise)
                isAbsolute = true;

                if (isPathSeparator(path.charCodeAt(1))) {
                    // Matched double path separator at beginning
                    let j = 2;
                    let last = j;
                    // Match 1 or more non-path separators
                    while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        // Matched!
                        last = j;
                        // Match 1 or more path separators
                        while (j < len && isPathSeparator(path.charCodeAt(j))) {
                            j++;
                        }
                        if (j < len && j !== last) {
                            // Matched!
                            last = j;
                            // Match 1 or more non-path separators
                            while (
                                j < len &&
                                !isPathSeparator(path.charCodeAt(j))
                            ) {
                                j++;
                            }
                            if (j === len || j !== last) {
                                // We matched a UNC root
                                device = BufferWrapper.concat(
                                    [
                                        "\\\\",
                                        firstPart,
                                        "\\",
                                        path.slice(last, j),
                                    ],
                                    encoding
                                );
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (
                isWindowsDeviceRoot(code) &&
                path.charCodeAt(1) === CHAR_CODE_COLON
            ) {
                // Possible device root
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2 && isPathSeparator(path.charCodeAt(2))) {
                    // Treat separator following drive name as an absolute path
                    // indicator
                    isAbsolute = true;
                    rootEnd = 3;
                }
            }

            if (device.length > 0) {
                if (resolvedDevice.length > 0) {
                    if (device.toLowerCase() !== resolvedDevice.toLowerCase()) {
                        // This path points to another device so it is not applicable
                        continue;
                    }
                } else {
                    resolvedDevice = device;
                }
            }

            if (resolvedAbsolute) {
                if (resolvedDevice.length > 0) {
                    break;
                }
            } else {
                resolvedTail = BufferWrapper.concat(
                    [path.slice(rootEnd), "\\", resolvedTail],
                    encoding
                );
                resolvedAbsolute = isAbsolute;
                if (isAbsolute && resolvedDevice.length > 0) {
                    break;
                }
            }
        }

        // At this point the path should be resolved to a full absolute path,
        // but handle relative paths to be safe (might happen when process.cwd()
        // fails)

        // Normalize the tail path
        resolvedTail = normalizeString(
            resolvedTail,
            !resolvedAbsolute,
            BufferWrapper.from("\\", encoding),
            CHAR_CODE_BACKWARD_SLASH,
            isPathSeparator
        );

        if (resolvedAbsolute) {
            return BufferWrapper.concat(
                [resolvedDevice, "\\", resolvedTail],
                encoding
            ).buffer;
        } else {
            const aux = BufferWrapper.concat([resolvedDevice, resolvedTail]);
            if (!aux.length) {
                return Buffer.from(".", encoding);
            }
            return aux.buffer;
        }
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
        const p = BufferWrapper.from(path);
        const len = p.length;
        if (len === 0) return Buffer.from(".", p.encoding);
        let rootEnd = 0;
        let device;
        let isAbsolute = false;
        const code = p.charCodeAt(0);

        // Try to match a root
        if (len === 1) {
            // `path` contains just a single char, exit early to avoid
            // unnecessary work
            return isPosixPathSeparator(code)
                ? Buffer.from("\\", p.encoding)
                : p.buffer;
        }
        if (isPathSeparator(code)) {
            // Possible UNC root

            // If we started with a separator, we know we at least have an absolute
            // path of some kind (UNC or otherwise)
            isAbsolute = true;

            if (isPathSeparator(p.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                    j++;
                }
                if (j < len && j !== last) {
                    const firstPart = p.slice(last, j);
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    while (j < len && isPathSeparator(p.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                            j++;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            // Return the normalized version of the UNC root since there
                            // is nothing left to process
                            return BufferWrapper.concat(
                                ["\\\\", firstPart, "\\", p.slice(last), "\\"],
                                p.encoding
                            ).buffer;
                        }
                        if (j !== last) {
                            // We matched a UNC root with leftovers
                            device = BufferWrapper.concat(
                                ["\\\\", firstPart, "\\", p.slice(last, j)],
                                p.encoding
                            );
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (
            isWindowsDeviceRoot(code) &&
            p.charCodeAt(1) === CHAR_CODE_COLON
        ) {
            // Possible device root
            device = p.slice(0, 2);
            rootEnd = 2;
            if (len > 2 && isPathSeparator(p.charCodeAt(2))) {
                // Treat separator following drive name as an absolute path
                // indicator
                isAbsolute = true;
                rootEnd = 3;
            }
        }

        let tail =
            rootEnd < len
                ? normalizeString(
                      p.slice(rootEnd),
                      !isAbsolute,
                      BufferWrapper.from("\\", p.encoding),
                      CHAR_CODE_BACKWARD_SLASH,
                      isPathSeparator
                  )
                : BufferWrapper.from("", p.encoding);
        if (tail.length === 0 && !isAbsolute) {
            tail = BufferWrapper.from(".", p.encoding);
        }
        if (tail.length > 0 && isPathSeparator(p.charCodeAt(len - 1)))
            tail.push("\\");
        if (device === undefined) {
            return isAbsolute ? tail.unshift("\\").buffer : tail.buffer;
        }
        return isAbsolute
            ? BufferWrapper.concat([device, "\\", tail], p.encoding).buffer
            : device.push(tail.buffer).buffer;
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
        const len = p.length;
        if (len === 0) return false;

        const code = p.charCodeAt(0);
        return (
            isPathSeparator(code) ||
            // Possible device root
            (len > 2 &&
                isWindowsDeviceRoot(code) &&
                p.charCodeAt(1) === CHAR_CODE_COLON &&
                isPathSeparator(p.charCodeAt(2)))
        );
    }
}

/**
 * @param {...string} args
 * @returns {string}
 */
export function join(...args: Array<string | NodeUrl.URL>): string;
export function join(...args: Array<PathLike>): Buffer;
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
        let firstPart = BufferWrapper.from("", encoding);
        for (let i = 0; i < args.length; ++i) {
            const arg = BufferWrapper.from(args[i], encoding);
            if (arg.length > 0) {
                if (joined === undefined) {
                    joined = firstPart = arg;
                } else {
                    joined = BufferWrapper.concat(
                        [joined, "\\", arg],
                        encoding
                    );
                }
            }
        }

        if (joined === undefined) {
            return Buffer.from(".", encoding);
        }

        // Make sure that the joined path doesn't start with two slashes, because
        // normalize() will mistake it for a UNC path then.
        //
        // This step is skipped when it is very clear that the user actually
        // intended to point at a UNC path. This is assumed when the first
        // non-empty string arguments starts with exactly two slashes followed by
        // at least one more non-slash character.
        //
        // Note that for normalize() to treat a path as a UNC path it needs to
        // have at least 2 components, so we don't filter for that here.
        // This means that the user can use join to construct UNC paths from
        // a server name and a share name; for example:
        //   path.join('//server', 'share') -> '\\\\server\\share\\')
        let needsReplace = true;
        let slashCount = 0;
        if (isPathSeparator(firstPart.charCodeAt(0))) {
            ++slashCount;
            const firstLen = firstPart.length;
            if (firstLen > 1 && isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        // We matched a UNC path in the first part
                        needsReplace = false;
                    }
                }
            }
        }
        if (needsReplace) {
            // Find any more consecutive slashes we need to replace
            while (
                slashCount < joined.length &&
                isPathSeparator(joined.charCodeAt(slashCount))
            ) {
                slashCount++;
            }

            // Replace the slashes if needed
            if (slashCount >= 2) {
                joined = joined.slice(slashCount).unshift("\\");
            }
        }

        return normalize(joined.buffer);
    }
}

/**
 * It will solve the relative path from `from` to `to`, for instance
 * from = 'C:\\orandea\\test\\aaa'
 * to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
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
    if (!Buffer.isBuffer(from) && !Buffer.isBuffer(to)) {
        return NodePath.relative(
            fileURLToPath(from) as never,
            fileURLToPath(to) as never
        );
    } else {
        const encoding = getFirstEncoding([from, to]);
        let pFrom = BufferWrapper.from(from, encoding);
        let pTo = BufferWrapper.from(to, encoding);

        if (pFrom.equals(pTo)) return Buffer.from("", encoding);

        const fromOrig = BufferWrapper.from(
            resolve(pFrom.buffer) as Buffer,
            encoding
        );
        const toOrig = BufferWrapper.from(
            resolve(pTo.buffer) as Buffer,
            encoding
        );

        if (fromOrig.equals(toOrig)) return Buffer.from("", encoding);

        pFrom = BufferWrapper.from(fromOrig.toLowerCase(), encoding);
        pTo = BufferWrapper.from(toOrig.toLowerCase(), encoding);
        if (pFrom.equals(pTo)) {
            return Buffer.from("", encoding);
        }

        // Trim any leading backslashes
        let fromStart = 0;
        while (
            fromStart < pFrom.length &&
            pFrom.charCodeAt(fromStart) === CHAR_CODE_BACKWARD_SLASH
        ) {
            fromStart++;
        }
        // Trim trailing backslashes (applicable to UNC paths only)
        let fromEnd = pFrom.length;
        while (
            fromEnd - 1 > fromStart &&
            pFrom.charCodeAt(fromEnd - 1) === CHAR_CODE_BACKWARD_SLASH
        ) {
            fromEnd--;
        }
        const fromLen = fromEnd - fromStart;

        // Trim any leading backslashes
        let toStart = 0;
        while (
            toStart < pTo.length &&
            pTo.charCodeAt(toStart) === CHAR_CODE_BACKWARD_SLASH
        ) {
            toStart++;
        }
        // Trim trailing backslashes (applicable to UNC paths only)
        let toEnd = pTo.length;
        while (
            toEnd - 1 > toStart &&
            pTo.charCodeAt(toEnd - 1) === CHAR_CODE_BACKWARD_SLASH
        ) {
            toEnd--;
        }
        const toLen = toEnd - toStart;

        // Compare paths to find the longest common path from root
        const length = fromLen < toLen ? fromLen : toLen;
        let lastCommonSep = -1;
        let i = 0;
        for (; i < length; i++) {
            const fromCode = pFrom.charCodeAt(fromStart + i);
            if (fromCode !== pTo.charCodeAt(toStart + i)) {
                break;
            } else if (fromCode === CHAR_CODE_BACKWARD_SLASH) {
                lastCommonSep = i;
            }
        }

        // We found a mismatch before the first common path separator was seen, so
        // return the original `to`.
        if (i !== length) {
            if (lastCommonSep === -1) {
                return toOrig.buffer;
            }
        } else {
            if (toLen > length) {
                if (pTo.charCodeAt(toStart + i) === CHAR_CODE_BACKWARD_SLASH) {
                    // We get here if `from` is the exact base path for `to`.
                    // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
                    return toOrig.slice(toStart + i + 1).buffer;
                }
                if (i === 2) {
                    // We get here if `from` is the device root.
                    // For example: from='C:\\'; to='C:\\foo'
                    return toOrig.slice(toStart + i).buffer;
                }
            }
            if (fromLen > length) {
                if (
                    pFrom.charCodeAt(fromStart + i) === CHAR_CODE_BACKWARD_SLASH
                ) {
                    // We get here if `to` is the exact base path for `from`.
                    // For example: from='C:\\foo\\bar'; to='C:\\foo'
                    lastCommonSep = i;
                } else if (i === 2) {
                    // We get here if `to` is the device root.
                    // For example: from='C:\\foo\\bar'; to='C:\\'
                    lastCommonSep = 3;
                }
            }
            if (lastCommonSep === -1) lastCommonSep = 0;
        }

        const out = BufferWrapper.from("", encoding);
        // Generate the relative path based on the path difference between `to` and
        // `from`
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (
                i === fromEnd ||
                pFrom.charCodeAt(i) === CHAR_CODE_BACKWARD_SLASH
            ) {
                out.push(out.length === 0 ? ".." : "\\..");
            }
        }

        toStart += lastCommonSep;

        // Lastly, append the rest of the destination (`to`) path that comes after
        // the common path parts
        if (out.length > 0) {
            return toOrig.slice(toStart, toEnd).unshift(out).buffer;
        }
        if (toOrig.charCodeAt(toStart) === CHAR_CODE_BACKWARD_SLASH) {
            ++toStart;
        }
        return toOrig.slice(toStart, toEnd).buffer;
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
    if (!Buffer.isBuffer(path)) {
        return NodePath.toNamespacedPath(fileURLToPath(path) as never);
    } else {
        // Note: this will *probably* throw somewhere.
        const p = BufferWrapper.from(path);
        if (p.length === 0) {
            return p.buffer;
        }

        const resolvedPath = BufferWrapper.from(
            resolve(p.buffer) as Buffer,
            p.encoding
        );

        if (resolvedPath.length <= 2) return p.buffer;

        if (resolvedPath.charCodeAt(0) === CHAR_CODE_BACKWARD_SLASH) {
            // Possible UNC root
            if (resolvedPath.charCodeAt(1) === CHAR_CODE_BACKWARD_SLASH) {
                const code = resolvedPath.charCodeAt(2);
                if (
                    code !== CHAR_CODE_QUESTION_MARK &&
                    code !== CHAR_CODE_DOT
                ) {
                    // Matched non-long UNC root, convert the path to a long UNC path
                    return resolvedPath.slice(2).unshift("\\\\?\\UNC\\").buffer;
                }
            }
        } else if (
            isWindowsDeviceRoot(resolvedPath.charCodeAt(0)) &&
            resolvedPath.charCodeAt(1) === CHAR_CODE_COLON &&
            resolvedPath.charCodeAt(2) === CHAR_CODE_BACKWARD_SLASH
        ) {
            // Matched device root, convert the path to a long UNC path
            return resolvedPath.unshift("\\\\?\\").buffer;
        }
        return p.buffer;
    }
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
        const len = p.length;
        if (len === 0) {
            return Buffer.from(".", p.encoding);
        }
        let rootEnd = -1;
        let offset = 0;
        const code = p.charCodeAt(0);

        if (len === 1) {
            // `path` contains just a path separator, exit early to avoid
            // unnecessary work or a dot.
            return isPathSeparator(code)
                ? p.buffer
                : Buffer.from(".", p.encoding);
        }

        // Try to match a root
        if (isPathSeparator(code)) {
            // Possible UNC root

            rootEnd = offset = 1;

            if (isPathSeparator(p.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                    j++;
                }
                if (j < len && j !== last) {
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    while (j < len && isPathSeparator(p.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                            j++;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            return p.buffer;
                        }
                        if (j !== last) {
                            // We matched a UNC root with leftovers

                            // Offset by 1 to include the separator after the UNC root to
                            // treat it as a "normal root" on top of a (UNC) root
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
            // Possible device root
        } else if (
            isWindowsDeviceRoot(code) &&
            p.charCodeAt(1) === CHAR_CODE_COLON
        ) {
            rootEnd = len > 2 && isPathSeparator(p.charCodeAt(2)) ? 3 : 2;
            offset = rootEnd;
        }

        let end = -1;
        let matchedSlash = true;
        for (let i = len - 1; i >= offset; --i) {
            if (isPathSeparator(p.charCodeAt(i))) {
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
            if (rootEnd === -1) return Buffer.from(".", p.encoding);

            end = rootEnd;
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

        // Check for a drive letter prefix so as not to mistake the following
        // path separator as an extra separator at the end of the path that can be
        // disregarded
        if (
            p.length >= 2 &&
            isWindowsDeviceRoot(p.charCodeAt(0)) &&
            p.charCodeAt(1) === CHAR_CODE_COLON
        ) {
            start = 2;
        }

        if (e !== undefined && e.length > 0 && e.length <= p.length) {
            if (p.equals(e)) return Buffer.from("", p.encoding);
            let extIdx = e.length - 1;
            let firstNonSlashEnd = -1;
            for (let i = p.length - 1; i >= start; --i) {
                const code = p.charCodeAt(i);
                if (isPathSeparator(code)) {
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
                    if (extIdx >= 0) {
                        // Try to match the explicit extension
                        if (code === e.charCodeAt(extIdx)) {
                            if (--extIdx === -1) {
                                // We matched the extension, so mark this as the end of our path
                                // component
                                end = i;
                            }
                        } else {
                            // Extension does not match, so our result is the entire path
                            // component
                            extIdx = -1;
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
        for (let i = p.length - 1; i >= start; --i) {
            if (isPathSeparator(p.charCodeAt(i))) {
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

        if (end === -1) return Buffer.from("");
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
        let start = 0;
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        let preDotState = 0;

        // Check for a drive letter prefix so as not to mistake the following
        // path separator as an extra separator at the end of the path that can be
        // disregarded

        if (
            p.length >= 2 &&
            p.charCodeAt(1) === CHAR_CODE_COLON &&
            isWindowsDeviceRoot(p.charCodeAt(0))
        ) {
            start = startPart = 2;
        }

        for (let i = p.length - 1; i >= start; --i) {
            const code = p.charCodeAt(i);
            if (isPathSeparator(code)) {
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
export function format(obj: FormatInputPathObjectBuffer): PathLike {
    return _format("\\", obj, NodePath.format);
}

/**
 * @param {PathLike} path
 * @returns {{
 *  dir: string | Buffer;
 *  root: string | Buffer;
 *  base: string | Buffer;
 *  name: string | Buffer;
 *  ext: string | Buffer;
 *  }}
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

        const len = p.length;
        let rootEnd = 0;
        let code = p.charCodeAt(0);

        if (len === 1) {
            if (isPathSeparator(code)) {
                // `path` contains just a path separator, exit early to avoid
                // unnecessary work
                ret.root = ret.dir = p.buffer;
                return ret;
            }
            ret.base = ret.name = p.buffer;
            return ret;
        }
        // Try to match a root
        if (isPathSeparator(code)) {
            // Possible UNC root

            rootEnd = 1;
            if (isPathSeparator(p.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                    j++;
                }
                if (j < len && j !== last) {
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    while (j < len && isPathSeparator(p.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        while (j < len && !isPathSeparator(p.charCodeAt(j))) {
                            j++;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            rootEnd = j;
                        } else if (j !== last) {
                            // We matched a UNC root with leftovers
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (
            isWindowsDeviceRoot(code) &&
            p.charCodeAt(1) === CHAR_CODE_COLON
        ) {
            // Possible device root
            if (len <= 2) {
                // `path` contains just a drive root, exit early to avoid
                // unnecessary work
                ret.root = ret.dir = p.buffer;
                return ret;
            }
            rootEnd = 2;
            if (isPathSeparator(p.charCodeAt(2))) {
                if (len === 3) {
                    // `path` contains just a drive root, exit early to avoid
                    // unnecessary work
                    ret.root = ret.dir = p.buffer;
                    return ret;
                }
                rootEnd = 3;
            }
        }
        if (rootEnd > 0) ret.root = p.slice(0, rootEnd).buffer;

        let startDot = -1;
        let startPart = rootEnd;
        let end = -1;
        let matchedSlash = true;
        let i = p.length - 1;

        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        let preDotState = 0;

        // Get non-dir info
        for (; i >= rootEnd; --i) {
            code = p.charCodeAt(i);
            if (isPathSeparator(code)) {
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

        if (end !== -1) {
            if (
                startDot === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1)
            ) {
                ret.base = ret.name = p.slice(startPart, end).buffer;
            } else {
                ret.name = p.slice(startPart, startDot).buffer;
                ret.base = p.slice(startPart, end).buffer;
                ret.ext = p.slice(startDot, end).buffer;
            }
        }

        // If the directory is the root, use the entire root as the `dir` including
        // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
        // trailing slash (`C:\abc\def` -> `C:\abc`).
        if (startPart > 0 && startPart !== rootEnd) {
            ret.dir = p.slice(0, startPart - 1).buffer;
        } else {
            ret.dir = ret.root;
        }
        return ret;
    }
}

// eslint-disable-next-line prefer-const
export const sep = "\\";
// eslint-disable-next-line prefer-const
export const sepCode = CHAR_CODE_BACKWARD_SLASH;
// eslint-disable-next-line prefer-const
export const delimiter = ";";
// eslint-disable-next-line prefer-const
export const delimiterCode = CHAR_CODE_SEMICOLON;
// eslint-disable-next-line prefer-const
//export let win32 = null;
// eslint-disable-next-line prefer-const
//export let posix = null;
//};
