const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");

const features = "packages/aihappey-core/src/features/";
const attachments = features + "attachments/";
const openai = "packages/aihappey-components/src/forms/providers/openai/";
const theme = new Proxy({}, { get: (_, name) => name });
const components = new Proxy({ useTheme: () => theme }, { get: (target, name) => target[name] ?? name });
const i18n = { useTranslation: () => ({ t: key => key }) };

function load(filename, mocks = {}, globals = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "..", filename), "utf8"), {
        fileName: filename,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
            target: ts.ScriptTarget.ES2022, esModuleInterop: true,
        },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", ...Object.keys(globals), output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id} in ${filename}`);
    }, module, module.exports, ...Object.values(globals));
    return module.exports;
}

function hooks() {
    const slots = [];
    let index = 0;
    const react = {
        ...React,
        useState(initial) {
            const slot = index++;
            if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
            return [slots[slot], next => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }];
        },
        useRef: initial => react.useState(() => ({ current: initial }))[0],
        useCallback: callback => callback,
        useMemo: factory => factory(),
    };
    return { react, render(Component, props) { index = 0; return Component(props); } };
}

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate)),
    ];
}

function one(tree, type) {
    const matches = findAll(tree, node => node.type === type);
    assert.equal(matches.length, 1, type);
    return matches[0];
}

const urlHelpers = load(attachments + "urlAttachment.ts", { mime: { getType: () => null } });
const link = urlHelpers.createUrlAttachment("https://example.com/report.pdf?token=keep%2Fthis#page=2");
const event = () => ({ preventDefault() {} });

test("the reused attachment menu has only Attachments and Link and retains file selection and disabled behavior", () => {
    const h = hooks();
    const addedFiles = [], addedUrls = [];
    const { MediaAttachmentMenu } = load(attachments + "MediaAttachmentMenu.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-i18n": i18n,
        "./UrlAttachmentModal": { UrlAttachmentModal: "UrlAttachmentModal" },
    });
    const props = { onFilesSelected: files => addedFiles.push(files), onAddUrl: part => addedUrls.push(part) };
    let tree = h.render(MediaAttachmentMenu, props);
    const menu = one(tree, "Menu");
    assert.deepEqual(menu.props.items.map(item => item.key), ["select-file", "add-url"]);
    assert.deepEqual(menu.props.items.map(item => item.label), ["attachments", "urlAttachment.title"]);
    assert.equal(menu.props.trigger.props.icon, "add");
    assert.equal(menu.props.trigger.props.variant, "transparent");
    assert.equal(menu.props.trigger.props.type, "button");
    assert.equal(menu.props.align, "left");
    assert.equal(menu.props.direction, "top");
    const input = one(tree, "input");
    let clicks = 0;
    input.props.ref.current = { click: () => clicks++ };
    menu.props.items[0].onClick();
    assert.equal(clicks, 1);
    assert.equal(input.props.multiple, true);
    assert.equal(input.props.hidden, true);
    const files = [{ name: "report.pdf" }];
    const change = { target: { files, value: "report.pdf" } };
    input.props.onChange(change);
    assert.deepEqual(addedFiles, [files]);
    assert.equal(change.target.value, "");
    menu.props.items[1].onClick();
    tree = h.render(MediaAttachmentMenu, props);
    const modal = one(tree, "UrlAttachmentModal");
    assert.equal(modal.props.mode, "url");
    assert.equal(modal.props.open, true);
    modal.props.onAdd(link);
    assert.deepEqual(addedUrls, [link]);
    modal.props.onHide();
    tree = h.render(MediaAttachmentMenu, { ...props, disabled: true });
    assert.equal(one(tree, "UrlAttachmentModal").props.open, false);
    assert.equal(one(tree, "Menu").props.trigger.props.disabled, true);
    assert.ok(one(tree, "Menu").props.items.every(item => item.disabled));
    assert.equal(one(tree, "input").props.disabled, true);
});

test("Jobs composer allows URL-only, file-only and text submissions, shows removable tags, and blocks empty or disabled submissions", async () => {
    const h = hooks();
    const sent = [], removed = [];
    const { JobsInput } = load(features + "jobs/JobsInput.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-i18n": i18n,
        "../chat/input/ResizableTextArea": { ResizableTextArea: "ResizableTextArea" },
        "../chat/input/usePromptDictationControls": { usePromptDictationControls: () => ({}) },
        "../attachments/MediaAttachmentMenu": { MediaAttachmentMenu: "MediaAttachmentMenu" },
        "../attachments/UrlAttachmentTags": { UrlAttachmentTags: "UrlAttachmentTags" },
    });
    const props = {
        value: "   ", files: [], urlAttachments: [], onChange() {},
        onSend: async text => sent.push(text), onFilesSelected() {}, onRemoveFile() {},
        onAddUrl() {}, onRemoveUrl: url => removed.push(url),
    };
    let tree = h.render(JobsInput, props);
    assert.equal(one(tree, "Button").props.disabled, true);
    await one(tree, "form").props.onSubmit(event());
    assert.deepEqual(sent, []);
    props.urlAttachments = [link];
    tree = h.render(JobsInput, props);
    assert.equal(one(tree, "Button").props.disabled, false);
    assert.equal(one(tree, "MediaAttachmentMenu").props.onAddUrl, props.onAddUrl);
    assert.equal(one(tree, "MediaAttachmentMenu").props.onFilesSelected, props.onFilesSelected);
    assert.deepEqual(one(tree, "UrlAttachmentTags").props.attachments, [link]);
    one(tree, "UrlAttachmentTags").props.onRemove(link.url);
    assert.deepEqual(removed, [link.url]);
    await one(tree, "form").props.onSubmit(event());
    props.files = [{ name: "report.pdf" }];
    tree = h.render(JobsInput, props);
    assert.equal(one(tree, "FileTags").props.removeFile, props.onRemoveFile);
    assert.deepEqual(one(tree, "UrlAttachmentTags").props.attachments, [link]);
    props.urlAttachments = [];
    tree = h.render(JobsInput, props);
    await one(tree, "form").props.onSubmit(event());
    props.files = [];
    props.value = "  Summarize this  ";
    tree = h.render(JobsInput, props);
    await one(tree, "form").props.onSubmit(event());
    tree = h.render(JobsInput, { ...props, disabled: true });
    assert.equal(one(tree, "Button").props.disabled, true);
    assert.equal(one(tree, "MediaAttachmentMenu").props.disabled, true);
    await one(tree, "form").props.onSubmit(event());
    assert.deepEqual(sent, ["", "", "Summarize this"]);
});

function jobsHarness() {
    const h = hooks();
    const requests = [], saved = [], errors = [];
    const control = { failure: undefined };
    const { useMediaUrlAttachments } = load(attachments + "useMediaUrlAttachments.ts", {
        react: h.react, "./urlAttachment": urlHelpers,
    });
    const jobs = {
        items: [], refresh() {},
        add: async (...args) => {
            if (control.failure === "save") throw new Error("Save failed");
            saved.push(args);
        },
    };
    const { JobsPage } = load(features + "jobs/JobsPage.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-ai": { createResponsesProvider: () => ({ create: async request => {
            requests.push(request);
            if (control.failure === "create") throw new Error("Request failed");
            return { id: "response-1", status: "queued" };
        } }) },
        "aihappey-jobs": { useJobs: () => jobs },
        "aihappey-state": { useAppStore: selector => selector({
            selectedAgentNames: ["agent"], agents: [], remoteAgentModels: [],
        }) },
        "../provider-credentials/scopedRequest": { createCredentialScopedFetch: fetch => fetch },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: {
            baseUrl: "https://example.com", endpoints: { responses: "/v1/responses" },
        } }) },
        "../agents/AgentSelect": { AgentSelect: "AgentSelect" },
        "../agents/agentSelection": {
            normalizeSelectedAgentKeys: () => [], resolveSelectedAgentEntries: () => [],
            buildSelectedAgentRequest: () => ({ models: ["agent"], localAgents: [] }),
        },
        "../chat/input/useChatFileDrop": { useChatFileDrop: () => ({ dropRef() {} }) },
        "../user-settings/UserMenuInline": { UserMenuInline: "UserMenuInline" },
        "../storage/storageErrorMessage": { useStorageErrorMessage: () => error => error.message },
        "../../ui/markdown/Markdown": { Markdown: "Markdown" },
        "./JobsInput": { JobsInput: "JobsInput" },
        "./useJobErrors": { useJobErrors: () => ({
            errors, warnings: [], addError: error => errors.push(error), addWarnings() {},
        }) },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "../attachments/useMediaUrlAttachments": { useMediaUrlAttachments },
    }, {
        FileReader: class {
            readAsDataURL(file) { this.result = file.data; this.onload(); }
        },
    });
    const input = () => one(h.render(JobsPage), "JobsInput").props;
    return { input, requests, saved, errors, control };
}

test("Jobs validates, deduplicates and removes page-local URLs, sends native file URLs and clears them after success", async () => {
    const h = jobsHarness();
    for (const url of ["not a URL", "javascript:alert(1)", "file:///report.pdf", "data:text/plain,hi"]) {
        assert.throws(() => h.input().onAddUrl({ type: "url", url }), /Invalid URL/);
    }
    h.input().onAddUrl(link);
    h.input().onAddUrl({ ...link, url: `  ${link.url}  ` });
    assert.deepEqual(h.input().urlAttachments, [link]);
    h.input().onRemoveUrl(link.url);
    assert.deepEqual(h.input().urlAttachments, []);
    h.input().onAddUrl(link);
    const pending = h.input().onSend("");
    assert.equal(h.input().disabled, true);
    await pending;
    assert.deepEqual(h.requests[0], {
        input: [{ role: "user", content: [{ type: "input_file", file_url: link.url }] }],
        background: true, store: true, stream: false, model: "agent",
    });
    assert.equal(h.saved[0][2], link.url);
    assert.deepEqual(h.input().urlAttachments, []);
    assert.equal(h.input().disabled, false);
    assert.deepEqual(h.errors, []);
    assert.deepEqual(jobsHarness().input().urlAttachments, []);
});

test("mixed Jobs content preserves text, local files and image uploads alongside native URL inputs", async () => {
    const h = jobsHarness();
    const pdf = { name: "local.pdf", type: "application/pdf", data: "data:application/pdf;base64,cGRm" };
    const image = { name: "local.png", type: "image/png", data: "data:image/png;base64,cG5n" };
    h.input().onFilesSelected([pdf, image]);
    h.input().onAddUrl(link);
    await h.input().onSend("  Summarize these  ");
    assert.deepEqual(h.requests[0].input[0].content, [
        { type: "input_text", text: "Summarize these" },
        { type: "input_file", file_data: pdf.data, filename: pdf.name },
        { type: "input_image", image_url: image.data },
        { type: "input_file", file_url: link.url },
    ]);
    assert.deepEqual(h.input().files, []);
    assert.deepEqual(h.input().urlAttachments, []);
    h.input().onFilesSelected([pdf]);
    h.input().onAddUrl(link);
    await h.input().onSend("");
    assert.equal(h.saved[1][2], `local.pdf, ${link.url}`);
});

for (const failure of ["create", "save"]) {
    test(`Jobs retains URL and file attachments when ${failure} fails so the request can be retried`, async () => {
        const h = jobsHarness();
        const file = { name: "local.pdf", type: "application/pdf", data: "data:application/pdf;base64,cGRm" };
        h.input().onAddUrl(link);
        h.input().onFilesSelected([file]);
        h.control.failure = failure;
        await h.input().onSend("");
        assert.deepEqual(h.input().urlAttachments, [link]);
        assert.deepEqual(h.input().files, [file]);
        assert.equal(h.input().disabled, false);
        assert.equal(h.errors.length, 1);
        h.control.failure = undefined;
        await h.input().onSend("");
        assert.deepEqual(h.input().urlAttachments, []);
        assert.deepEqual(h.input().files, []);
    });
}

test("OpenAI chat config no longer renders image input detail but retains service tier and parallel-tool settings", () => {
    const h = hooks();
    const mocks = {
        react: h.react, "aihappey-i18n": i18n, "../../../theme/ThemeContext": components,
        "../providerToolConfig": load(openai + "../providerToolConfig.ts"),
    };
    for (const name of [
        "OpenAIReasoningForm", "OpenAIModerationForm", "OpenAIPromptCacheOptionsForm", "OpenAIWebSearchForm",
        "OpenAIImageGenerationForm", "OpenAICodeInterpreterForm", "OpenAIFileSearchForm", "OpenAIShellForm",
        "OpenAIAgentSessionCard", "OpenAIEnvironmentSessionCard",
    ]) mocks[`./cards/${name}`] = { [name]: name };
    const { OpenAIChatConfigForm } = load(openai + "OpenAIChatConfigForm.tsx", mocks);
    const updates = [];
    const tree = h.render(OpenAIChatConfigForm, {
        config: { inputImageDetail: "high", service_tier: "flex", parallel_tool_calls: true },
        updateConfig: config => updates.push(config),
    });
    assert.equal(findAll(tree, node => node.props.label === "providers:openai.imageInputDetail.title").length, 0);
    const serviceTier = findAll(tree, node => node.props.label === "providers:openai.serviceTier.title")[0];
    assert.deepEqual(serviceTier.props.values, ["flex"]);
    serviceTier.props.onChange("default");
    assert.equal(updates[0].service_tier, "default");
    const parallel = findAll(tree, node => node.props.id === "parallelToolCalls")[0];
    assert.equal(parallel.props.checked, true);
    parallel.props.onChange(false);
    assert.equal(updates[1].parallel_tool_calls, false);
    assert.equal(updates[1].service_tier, "flex");
    one(tree, "OpenAIFileSearchForm");
    one(tree, "OpenAIImageGenerationForm");
});
