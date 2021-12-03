/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

fs.writeFileSync(path.join(__dirname, "dist", "mjs", "package.json"), JSON.stringify({ "type": "module" }, null, 4));
fs.writeFileSync(path.join(__dirname, "dist", "cjs", "package.json"), JSON.stringify({ "type": "commonjs" }, null, 4));
