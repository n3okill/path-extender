import * as posixAux from "./posix.js";
import { platformIsWin32, FormatInputPathObjectBuffer } from "./util.js";
import * as win32Aux from "./win32.js";

const posix = {
    ...posixAux,
    posix: posixAux,
    win32: win32Aux,
    // Legacy internal API, docs-only deprecated: DEP0080
    _makeLong: posixAux.toNamespacedPath,
};
const win32 = {
    ...win32Aux,
    posix: posixAux,
    win32: win32Aux,
    // Legacy internal API, docs-only deprecated: DEP0080
    _makeLong: win32Aux.toNamespacedPath,
};
export { FormatInputPathObjectBuffer };
export default platformIsWin32 ? { ...win32 } : { ...posix };
//module.exports = platformIsWin32 ? { ...win32 } : { ...posix };
