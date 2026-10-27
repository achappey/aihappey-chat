const path = require("node:path");
const { buildSync } = require("esbuild");

// Source regressions are independent of the compiled-package Node tests. Only
// this path uses aliases; the workspace test imports the actual public package.
const root = path.resolve(__dirname, "..");
const code = buildSync({
  entryPoints: [path.join(root, "packages/aihappey-agents/tests/normalizeAgent.test.mjs")],
  alias: {
    "aihappey-agents": path.join(root, "packages/aihappey-agents/src/index.ts"),
    "aihappey-types": path.join(root, "packages/aihappey-types/src/index.ts"),
  },
  bundle: true,
  packages: "external",
  platform: "node",
  format: "cjs",
  write: false,
}).outputFiles[0].text;
new Function("require", code)(require);
