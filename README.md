# path-extender

## Overview

---

This is a port of node's path module to alow the use of `Buffer` and `URL` in paths instead of only `string`.

## Why this module

---

Because until node v17 at leats it isn't possible to use Buffer or URL in path module, but it's possible to make call's to the methods in the filesystem module using Buffer, URL or string, and with this module it's already possible to for example join 2 buffer's and send it to `fs.readFile`.

## Usage

---

-   ### cjs

You can use this module as a cjs module by making:

```js
const path = require("path-extender").default;
```

-   ### esm

But you can also use this module as an esm be making:

```js
import path from "path-extender";
```

or

```js
import { default as pathExtender } from "path-extender";
```

after this you only have to follow the node path documentation [Node Path](https://nodejs.org/api/path.html) and remember that where in the original module you'll have to pass a string in this module you can pass a Buffer, an URL instance or a string, you can even mix them.

## Example

---

```js
import path from "path-extender";

const buf = Buffer.from("a/b/c/d.js");
const dir = "/root/dir";

const joinedPath = path.join(dir, buf);
//will result in: /root/dir/a/b/c/d.js
```

## Note

---

If you only use strings or URL to work with path this module will default to use [Node Path](https://nodejs.org/api/path.html).

## Runing tests

---

-   `npm run lint`: runs the linter
-   `npm run unit`: run unit tests
-   `npm test`: run both lint and unit tests

## Contribute

---

If you find a problem with the package you can

-   [Submiting Bugs](https://github.com/n3okill/path-extender/issues)

or even make a

-   [Pull request](https://github.com/n3okill/path-extender/pulls)

## Credits

---

[Node Team](https://github.com/nodejs/node) - Obviously, for having created the path module in the first place.

[bcoe](https://github.com/bcoe/path-buffer) - Creator of `path-buffer` a partial implementation of node's path with buffers, ad from where the basis of this module come from.

## License

---

Licensed under MIT

Copyright (c) 2021 [João Parreira](https://github.com/n3okill)
