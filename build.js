/* eslint-disable @typescript-eslint/no-var-requires */
//const fs = require("fs");
//const path = require("path");

import * as fs from "fs";
import * as path from "path";

fs.writeFileSync(path.join("./", "dist", "mjs", "package.json"), JSON.stringify({ "type": "module" }, null, 4));
fs.writeFileSync(path.join("./", "dist", "cjs", "package.json"), JSON.stringify({ "type": "commonjs" }, null, 4));
