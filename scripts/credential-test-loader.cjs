const path = require("node:path");
const { buildSync } = require("esbuild");

const root = path.resolve(__dirname, "..");
function load(filename, mocks = {}) {
    const code = buildSync({
        entryPoints: [path.join(root, filename)], bundle: true, packages: "external",
        platform: "node", format: "cjs", write: false, logLevel: "silent",
    }).outputFiles[0].text;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        if (id in mocks) return mocks[id];
        if (id === "aihappey-state") return { store: { getState: () => ({ remoteAgentModels: [], customProviders: {} }) } };
        if (id === "aihappey-http") return load("packages/aihappey-http/src/index.ts");
        if (id === "aihappey-types") return load("packages/aihappey-types/src/index.ts");
        return require(id);
    }, module, module.exports);
    return module.exports;
}
const directory = "packages/aihappey-core/src/features/provider-credentials/";
const auth = load(directory + "providerAuthHeaders.ts");
const scoped = load(directory + "scopedRequest.ts");
module.exports = { load, auth, scoped };
