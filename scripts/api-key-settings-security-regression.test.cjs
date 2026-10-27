const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderer, nodes } = require("./react-test-renderer.cjs");

const root = path.resolve(__dirname, "..");
const credentials = "packages/aihappey-core/src/features/provider-credentials/";
function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

function harness({ encrypted = true, decrypt } = {}) {
    const view = renderer();
    let closes = 0, headerReads = 0, mutations = 0;
    const state = {
        encryptedApiKeys: encrypted ? { ciphertext: "encrypted" } : undefined,
        apiKeyEncryptionStatus: encrypted ? "unlocked" : "none",
        apiKeySessionPassword: "cached-startup-password",
        get customHeaders() { headerReads++; return { "X-OpenAI-Key": "SECRET" }; },
        enabledProvidersByType: {},
    };
    for (const action of ["resetModels", "addCustomHeader", "removeCustomHeader", "setCustomHeaders", "setEncryptedApiKeys", "setApiKeySessionPassword", "setEnabledProvidersForType"]) {
        state[action] = () => { mutations++; };
    }
    const theme = { Modal: "modal", Button: "button", Input: "input", Alert: "alert" };
    const common = {
        react: view.react,
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-components": { useTheme: () => theme, ProviderKeysForm: "key-form", SettingsActionButtons: "settings-actions" },
    };
    const { ApiKeyPasswordModal } = load(credentials + "ApiKeyPasswordModal.tsx", common);
    const { ProviderKeysModal } = load(credentials + "ProviderKeysModal.tsx", {
        ...common,
        "aihappey-state": { useAppStore: selector => selector(state), PROVIDER_CAPABILITIES: [] },
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "./providerAuthHeaders": { getProviderApiKeyHeaderName: () => "X-OpenAI-Key" },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => ({ openai: { name: "OpenAI" } }) },
        "./ApiKeyPasswordModal": { ApiKeyPasswordModal },
        "./apiKeyEncryption": {
            decryptApiKeys: decrypt ?? (async (_, password) => {
                if (password !== "correct") throw new Error("Wrong password");
                return { "X-OpenAI-Key": "SECRET" };
            }),
            encryptApiKeys: async () => ({ ciphertext: "new" }),
        },
    });
    let tree;
    const render = (open = true) => tree = view.render(ProviderKeysModal, { open, onClose: () => { closes++; } });
    const submit = async password => {
        nodes(tree, "input")[0].props.onChange({ target: { value: password } });
        render();
        nodes(tree, "button").find(button => button.props.variant === "primary").props.onClick();
        await new Promise(resolve => setImmediate(resolve));
        render();
    };
    return {
        render, submit, state,
        get tree() { return tree; },
        get closes() { return closes; },
        get headerReads() { return headerReads; },
        get mutations() { return mutations; },
        cancel() { nodes(tree, "button").find(button => button.props.children === "cancel").props.onClick(); },
    };
}

test("already-unlocked sessions never mount keys or export before fresh password verification", async () => {
    const h = harness();
    const first = h.render();
    assert.equal(h.headerReads, 0);
    assert.equal(nodes(first, "key-form").length, 0);
    assert.equal(nodes(first, "settings-actions").length, 0);
    assert.ok(!JSON.stringify(first).includes("SECRET"));
    assert.equal(nodes(first, "modal")[0].props.modalType, undefined);
    await h.submit("cached-startup-password");
    assert.equal(nodes(h.tree, "key-form").length, 0);
    assert.equal(nodes(h.tree, "alert")[0].props.children, "apiKeysPassword.invalidPassword");
    assert.equal(h.headerReads, 0);
    await h.submit("correct");
    assert.equal(nodes(h.tree, "key-form")[0].props.values["X-OpenAI-Key"], "SECRET");
    assert.equal(typeof nodes(h.tree, "settings-actions")[0].props.onDownload, "function");
    assert.equal(h.mutations, 0, "verification must not change chat credentials or startup unlock state");
});

test("cancel closes without exposing keys; reopening clears entered password and errors", async () => {
    const h = harness();
    h.render();
    await h.submit("wrong");
    h.cancel();
    assert.equal(h.render(), null);
    assert.equal(h.closes, 1);
    assert.equal(h.headerReads, 0);
    h.render(false);
    h.render();
    assert.equal(nodes(h.tree, "input")[0].props.value, "");
    assert.equal(nodes(h.tree, "alert").length, 0);
    assert.equal(nodes(h.tree, "key-form").length, 0);
});

test("closing verified settings requires a fresh password on the next opening", async () => {
    const h = harness();
    h.render();
    await h.submit("correct");
    nodes(h.tree, "settings-actions")[0].props.onClose();
    h.render(false);
    h.render();
    assert.equal(nodes(h.tree, "key-form").length, 0);
    assert.equal(nodes(h.tree, "settings-actions").length, 0);
    assert.equal(nodes(h.tree, "input")[0].props.value, "");
    await h.submit("correct");
    assert.equal(nodes(h.tree, "key-form").length, 1);
});

test("a verification completing after unmount cannot unlock a new opening", async () => {
    let resolve;
    const h = harness({ decrypt: () => new Promise(done => { resolve = done; }) });
    h.render();
    await h.submit("correct");
    h.render(false);
    h.render();
    resolve({ "X-OpenAI-Key": "SECRET" });
    await new Promise(done => setImmediate(done));
    h.render();
    assert.equal(h.headerReads, 0);
    assert.equal(nodes(h.tree, "key-form").length, 0);
    assert.equal(nodes(h.tree, "input")[0].props.value, "");
});

test("without an existing password the original password-setup flow remains available", () => {
    const h = harness({ encrypted: false });
    h.render();
    assert.equal(nodes(h.tree, "key-form")[0].props.disabled, true);
    assert.equal(nodes(h.tree, "settings-actions")[0].props.onDownload, undefined);
    nodes(h.tree, "button")[0].props.onClick();
    h.render();
    assert.equal(nodes(h.tree, "modal").at(-1).props.title, "apiKeysPassword.setTitle");
    assert.equal(nodes(h.tree, "input").length, 2);
});

test("password change remains available after verification and requests the current password", async () => {
    const h = harness();
    h.render();
    await h.submit("correct");
    nodes(h.tree, "button")[0].props.onClick();
    h.render();
    assert.equal(nodes(h.tree, "modal").at(-1).props.title, "apiKeysPassword.changeTitle");
    assert.equal(nodes(h.tree, "input").length, 3);
    assert.equal(nodes(h.tree, "input")[0].props.label, "apiKeysPassword.currentPassword");
});

test("startup unlock stays mandatory by default; only settings opt into cancellation", () => {
    const view = renderer();
    const { ApiKeyPasswordModal } = load(credentials + "ApiKeyPasswordModal.tsx", {
        react: view.react,
        "aihappey-components": { useTheme: () => ({ Modal: "modal", Button: "button", Input: "input" }) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
    });
    const tree = view.render(ApiKeyPasswordModal, { open: true, mode: "unlock", onClose() {}, onSubmit() {} });
    assert.equal(nodes(tree, "modal")[0].props.modalType, "alert");
    assert.equal(nodes(tree, "button").length, 1);
    const host = fs.readFileSync(path.join(root, credentials, "ApiKeyUnlockHost.tsx"), "utf8");
    assert.doesNotMatch(host, /allowCancel/);
});

test("all API-key settings entry points use the protected shared modal", () => {
    for (const filename of [
        "user-settings/UserMenuButton.tsx", "user-settings/SettingsModal.tsx",
        "chat-settings/ChatSettingsButton.tsx", "image-settings/ImageSettingsButton.tsx",
        "video-settings/VideoSettingsButton.tsx", "speech-settings/SpeechSettingsButton.tsx",
    ]) {
        const source = fs.readFileSync(path.join(root, "packages/aihappey-core/src/features", filename), "utf8");
        assert.match(source, /import \{ ProviderKeysModal \} from "\.\.\/provider-credentials\/ProviderKeysModal"/);
        assert.match(source, /<ProviderKeysModal\s/);
    }
});

test("real encrypted payload verification rejects incorrect passwords", async () => {
    const { encryptApiKeys, decryptApiKeys } = load(credentials + "apiKeyEncryption.ts");
    const headers = { "X-OpenAI-Key": "test-only-key" };
    const encrypted = await encryptApiKeys(headers, "correct");
    await assert.rejects(decryptApiKeys(encrypted, "incorrect"));
    assert.deepEqual(await decryptApiKeys(encrypted, "correct"), headers);
});
