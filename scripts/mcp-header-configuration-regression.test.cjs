const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const base = path.resolve(__dirname, "../packages/aihappey-core/src/features/mcp-servers");

function load(filename, mocks = {}) {
  const result = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", output)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + (id.includes("Editor") ? ".tsx" : ".ts")), mocks);
    return require(id);
  }, result, result.exports);
  return result.exports;
}
const config = load(path.join(base, "headerConfiguration.ts"));
const keyHeader = { name: "Authorization", value: "Bearer {api_key}", isRequired: true,
  variables: { api_key: { isRequired: true, isSecret: true, placeholder: "API key" } } };
const item = (headers = [keyHeader], meta) => ({ server: { name: "example.test/images", version: "1",
  remotes: [{ type: "streamable-http", url: "https://mcp.example/images", headers }], _meta: meta } });
const official = key => ({ "io.modelcontextprotocol.registry/publisher-provided": { [key]: { type: "oauth2", resourceMetadataUrl: "https://untrusted.example/metadata" } } });

test("OAuth presentation hints are namespace-independent and support legacy placement without trusting their URLs", () => {
  for (const name of ["test.example/auth", "arbitrary.reverse.namespace/auth", "localhost/auth"]) {
    const server = item([keyHeader], official(name));
    assert.equal(config.hasOAuthHint(server), true);
    assert.equal(config.requiresHeaderConfiguration(server), false);
    assert.deepEqual(config.initialRegistryHeaders(server), {});
    assert.equal(config.hasOAuthHint({ ...item(), _meta: { [name]: { type: "oauth2" } } }), true);
  }
  assert.equal(config.hasOAuthHint(item([], { "test/auth": { type: "other" } })), false);
  assert.equal(config.hasOAuthHint({ ...item(), _meta: null }), false);
  assert.equal(config.requiresHeaderConfiguration(item()), true);
});

test("header forms resolve templates/defaults, preserve extras/casing, and never mutate registry definitions", () => {
  const definitions = [keyHeader, { name: "X-Region", choices: ["eu", "us"], default: "eu" },
    { name: "X-Fixed", value: "constant" }, { name: "X-Enabled", format: "boolean", default: "false" }];
  const original = JSON.stringify(definitions);
  const form = config.headerForm(definitions, false, { authorization: "Bearer existing", "X-Extra": "keep" });
  assert.equal(form.fields[0].value, "existing");
  form.fields[0].value = "new-key";
  const headers = config.resolveHeaderForm(form, definitions);
  assert.deepEqual(headers, { Authorization: "Bearer new-key", "X-Region": "eu", "X-Fixed": "constant", "X-Enabled": "false", "X-Extra": "keep" });
  assert.equal(JSON.stringify(definitions), original);
  assert.deepEqual(config.resolveHeaderForm(config.headerForm(definitions, false, headers), definitions), headers);
  assert.deepEqual(config.registryHeaders(item(definitions), "https://different.example/images"), []);
});

test("custom raw header values are retained when they cannot be decomposed into registry variables", () => {
  const saved = { Authorization: "Custom original credential", "X-Unknown": "original" };
  assert.deepEqual(config.resolveHeaderForm(config.headerForm([keyHeader], false, saved), [keyHeader]), saved);
  for (const raw of ["[]", "null", '{"X-Key":1}', '{"X-Key":"ok","x-key":"duplicate"}', '{"X-Key":"ok","X-Key":"duplicate"}', '{"bad name":"x"}', '{"X-Key":"bad\\r\\nvalue"}'])
    assert.throws(() => config.parseHeaders(raw));
  assert.deepEqual(config.parseHeaders(""), {});
});

test("required fields, choices, numeric/boolean formats and unresolved variables are validated", () => {
  for (const header of [keyHeader, { name: "X-Choice", isRequired: true, choices: ["one"], default: "two" },
    { name: "X-Count", format: "number", default: "NaN" }, { name: "X-Enabled", format: "boolean", default: "yes" }]) {
    assert.throws(() => config.resolveHeaderForm(config.headerForm([header], false), [header]));
  }
  assert.throws(() => config.validateRegistryHeaders({ Authorization: "Bearer {api_key}" }, [keyHeader], false));
  const multi = [{ name: "X-Composite", value: "{a}:{b}:{a}", variables: { a: { isRequired: true }, b: { isRequired: true } } }];
  const form = config.headerForm(multi, false, { "X-Composite": "one:two:one" });
  assert.deepEqual(form.fields.map(field => field.value), ["one", "two"]);
  assert.deepEqual(config.resolveHeaderForm(form, multi), { "X-Composite": "one:two:one" });
  assert.deepEqual(config.initialRegistryHeaders(item([{ name: "X-Region", default: "eu" }])), { "X-Region": "eu" });
  const optional = { ...keyHeader, isRequired: false };
  assert.equal(config.requiresHeaderConfiguration(item([optional])), false);
  assert.equal(config.requiresHeaderConfiguration(item([{ name: "X-Key", value: "{missing}", isRequired: true }])), true);
});

function all(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => all(child, predicate))];
}
function harness() {
  const slots = []; let cursor = 0;
  const react = {
    useMemo: factory => factory(),
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  };
  const mocks = { react, "aihappey-components": { useTheme: () => new Proxy({}, { get: (_, name) => name }) },
    "aihappey-i18n": { useTranslation: () => ({ t: (key, options) => options?.defaultValue ?? key }) } };
  const editor = load(path.join(base, "useMcpHeadersEditor.tsx"), mocks);
  return { mocks, render(initial = {}, server) { cursor = 0; return editor.useMcpHeadersEditor(initial, server); },
    component(filename, props) { cursor = 0; const element = load(path.join(base, filename), mocks)[filename.startsWith("Add") ? "AddServerModal" : "EditServerModal"](props);
      return element ? element.type(element.props) : null; } };
}
const tabs = editor => all(editor.content, node => node.type === "Tabs")[0];

test("Add and Edit dialogs separate URL fields from header tabs and localize the Edit title", () => {
  for (const [language, title] of [["en", "Edit"], ["nl", "Bewerken"]]) {
    const translations = JSON.parse(fs.readFileSync(path.resolve(__dirname,
      `../packages/aihappey-i18n/src/locales/${language}/${language}.json`), "utf8").replace(/^\uFEFF/, ""));
    assert.equal(translations.edit, title);
    for (const filename of ["AddServerModal.tsx", "EditServerModal.tsx"]) {
      const h = harness();
      h.mocks["aihappey-i18n"] = { useTranslation: () => ({ t: (key, options) =>
        key.split(".").reduce((value, part) => value?.[part], translations) ?? options?.defaultValue ?? key }) };
      h.mocks["aihappey-state"] = { useAppStore: selector => selector({ mcpServers: {}, mcpRegistries: {} }) };
      const tree = h.component(filename, { show: true, name: "pending", registry: item(), onHide() {} });
      const editor = all(tree, node => node.type === "div" && React.Children.toArray(node.props.children)
        .some(child => React.isValidElement(child) && child.type === "Tabs"))[0];
      assert.equal(editor.props.style.paddingTop, 12);
      assert.ok(all(tree, node => node.type === "Input" && node.props.label === translations.manageServersModal.url).length);
      if (filename.startsWith("Edit")) assert.equal(tree.props.title, title);
    }
  }
});

test("form-first UI masks credentials, round-trips JSON, and retains incomplete drafts without saving templates", () => {
  const h = harness(); const server = item();
  let editor = h.render({}, server);
  assert.equal(tabs(editor).props.activeKey, "form");
  assert.equal(editor.error, undefined);
  assert.equal(editor.connectionError, "required");
  const secret = all(editor.content, node => node.type === "Input" && node.props.type === "password")[0];
  assert.equal(secret.props.placeholder, "API key");
  secret.props.onChange({ target: { value: "caller-key" } });
  editor = h.render({}, server);
  assert.deepEqual(editor.headers, { Authorization: "Bearer caller-key" });
  tabs(editor).props.onSelect("raw"); editor = h.render({}, server);
  const raw = all(editor.content, node => node.type === "TextArea")[0];
  assert.deepEqual(JSON.parse(raw.props.value), editor.headers);
  raw.props.onChange('{"Authorization":"Bearer changed","X-Extra":"keep"}');
  tabs(h.render({}, server)).props.onSelect("form"); editor = h.render({}, server);
  assert.deepEqual(editor.headers, { Authorization: "Bearer changed", "X-Extra": "keep" });
  tabs(editor).props.onSelect("raw"); editor = h.render({}, server);
  all(editor.content, node => node.type === "TextArea")[0].props.onChange("invalid json");
  editor = h.render({}, server); assert.ok(editor.error);
  tabs(editor).props.onSelect("form"); assert.equal(tabs(h.render({}, server)).props.activeKey, "raw");

  const blank = harness(); tabs(blank.render({}, server)).props.onSelect("raw");
  assert.equal(tabs(blank.render({}, server)).props.activeKey, "raw");
  tabs(blank.render({}, server)).props.onSelect("form"); assert.equal(blank.render({}, server).connectionError, "required");
});

test("custom add blocks invalid JSON/URL and duplicate names; cancel never writes a server", () => {
  const h = harness(); const writes = []; let closed = 0;
  const store = { mcpServers: {}, addMcpServer: (...args) => writes.push(args) };
  h.mocks["aihappey-state"] = { useAppStore: selector => selector(store) };
  const render = () => h.component("AddServerModal.tsx", { show: true, onHide: () => closed++ });
  let tree = render(); const buttons = () => React.Children.toArray(render().props.actions.props.children);
  assert.equal(buttons()[1].props.disabled, true);
  all(tree, node => node.type === "Input" && node.props.required)[0].props.onChange({ target: { value: "https://mcp.example/custom" } });
  tree = render(); all(tree, node => node.type === "Tabs")[0].props.onSelect("raw");
  tree = render(); all(tree, node => node.type === "TextArea")[0].props.onChange("[]");
  assert.equal(buttons()[1].props.disabled, true); buttons()[1].props.onClick(); assert.equal(writes.length, 0);
  buttons()[0].props.onClick(); assert.equal(closed, 1); assert.equal(writes.length, 0);
});

test("catalog configuration saves only on confirmation and installed editing preserves the rest of config", () => {
  const h = harness(); const writes = []; let closed = 0;
  const stored = { config: { type: "http", url: "https://mcp.example/images", disabled: false, alwaysAllow: ["tool"], headers: { Authorization: "Bearer old" } }, registry: item() };
  h.mocks["aihappey-state"] = { useAppStore: selector => selector({ mcpServers: { installed: stored }, updateMcpServer: (...args) => writes.push(args) }) };
  let tree = h.component("EditServerModal.tsx", { show: true, name: "installed", onHide: () => closed++ });
  all(tree, node => node.type === "Input" && node.props.type === "password")[0].props.onChange({ target: { value: "new" } });
  tree = h.component("EditServerModal.tsx", { show: true, name: "installed", onHide: () => closed++ });
  React.Children.toArray(tree.props.actions.props.children)[1].props.onClick();
  assert.deepEqual(writes, [["installed", { ...stored.config, headers: { Authorization: "Bearer new" } }]]);
  assert.equal(stored.config.headers.Authorization, "Bearer old"); assert.equal(closed, 1);

  const pending = harness(); pending.mocks["aihappey-state"] = h.mocks["aihappey-state"];
  const props = { show: true, name: "pending", registry: item(), onHide: () => closed++, onSaveHeaders: headers => writes.push(headers) };
  tree = pending.component("EditServerModal.tsx", props);
  assert.equal(React.Children.toArray(tree.props.actions.props.children)[1].props.disabled, false);
  React.Children.toArray(tree.props.actions.props.children)[0].props.onClick(); assert.equal(writes.length, 1);
});

test("legacy empty/malformed registry data cannot crash editing and shows only Headers and Raw", () => {
  for (const registry of [undefined, {}, { server: null }, { server: {} }, { server: { remotes: {} } }]) {
    assert.deepEqual(config.registryHeaders(registry), []);
    const h = harness();
    const saved = { config: { type: "http", url: "https://custom.example/mcp", headers: { "X-Key": "working" } }, registry };
    h.mocks["aihappey-state"] = { useAppStore: selector => selector({ mcpServers: { legacy: saved }, mcpRegistries: {} }) };
    const tree = h.component("EditServerModal.tsx", { show: true, name: "legacy", onHide() {} });
    assert.equal(all(tree, node => node.type === "Tabs")[0].props.activeKey, "headers");
    assert.deepEqual(all(tree, node => node.type === "Tab").map(tab => tab.props.eventKey), ["headers", "raw"]);
    assert.equal(all(tree, node => node.type === "Input" && node.props.type === "password")[0].props.value, "working");
  }
});

test("server updates preserve optional registry absence, existing metadata, and plugin ownership", () => {
  const slice = load(path.resolve(__dirname, "../packages/aihappey-state/src/slices/mcpServersSlice.ts"));
  let state = { mcpServers: { custom: { config: { type: "http", url: "https://custom.example/mcp" }, source: { kind: "agent-plugin", pluginId: "p" } },
    catalog: { config: { type: "http", url: "https://mcp.example/images" }, registry: item() } } };
  const actions = slice.createMcpServersSlice(patch => { state = { ...state, ...patch(state) }; }, () => state, {});
  actions.updateMcpServer("custom", { headers: { "X-Key": "key" } });
  actions.updateMcpServers({ custom: { disabled: true }, catalog: { disabled: false } });
  assert.equal(state.mcpServers.custom.registry, undefined);
  assert.equal(state.mcpServers.custom.source.pluginId, "p");
  assert.equal(state.mcpServers.catalog.registry.server.name, item().server.name);
});

test("metadata form groups multiple variable inputs and header/variable descriptions in one card per header", () => {
  const headers = [{ name: "Authorization", description: "Header-level guidance", value: "{user}:{key}", isRequired: true,
    variables: { user: { description: "Account name", isRequired: true }, key: { description: "Provider secret", isSecret: true, isRequired: true } } },
    { name: "X-Region", description: "Region guidance", choices: ["eu", "us"] }];
  const h = harness(); let editor = h.render({}, item(headers));
  assert.deepEqual(all(editor.content, node => node.type === "Tab").map(tab => tab.props.eventKey), ["form", "headers", "raw"]);
  const cards = all(editor.content, node => node.type === "Card");
  assert.deepEqual(cards.map(card => card.props.title), ["Authorization", "X-Region"]);
  assert.deepEqual(all(cards[0], node => node.type === "Input").map(input => [input.props.label, input.props.type]), [["user", "text"], ["key", "password"]]);
  assert.ok(all(cards[0], node => node.props.children === "Header-level guidance").length);
  assert.ok(all(cards[0], node => node.props.children === "Provider secret").length);
  all(cards[0], node => node.type === "Input" && node.props.label === "user")[0].props.onChange("account");
  editor = h.render({}, item(headers));
  assert.equal(editor.error, undefined); assert.equal(editor.connectionError, "required");
  assert.equal(config.canConnectServer(editor.headers, item(headers)), false);
  const reopened = harness().render(editor.headers, item(headers));
  assert.equal(all(reopened.content, node => node.type === "Input" && node.props.label === "user")[0].props.value, "account");
  assert.equal(all(reopened.content, node => node.type === "Input" && node.props.label === "key")[0].props.value, "");
  tabs(editor).props.onSelect("headers");
  editor = h.render({}, item(headers));
  assert.equal(tabs(editor).props.activeKey, "headers");
  tabs(editor).props.onSelect("form");
  assert.equal(h.render({}, item(headers)).connectionError, "required");
});

test("incomplete configuration saves without connection and OAuth-managed fields remain connectable", () => {
  const h = harness(); const writes = [];
  h.mocks["aihappey-state"] = { useAppStore: selector => selector({ mcpServers: {}, mcpRegistries: {} }) };
  const props = { show: true, name: "pending", registry: item(), onHide() {}, onSaveHeaders: headers => writes.push(headers) };
  const tree = h.component("EditServerModal.tsx", props);
  const save = React.Children.toArray(tree.props.actions.props.children)[1];
  assert.equal(save.props.disabled, false); save.props.onClick();
  assert.equal(writes.length, 1); assert.equal(config.canConnectServer(writes[0], item()), false);
  const oauth = item([keyHeader], official("arbitrary.namespace/auth"));
  assert.equal(config.canConnectServer({}, oauth), true);
  const ready = harness().render({}, oauth);
  assert.deepEqual(all(ready.content, node => node.type === "Tab").map(tab => tab.props.eventKey), ["headers", "raw"]);
  assert.equal(ready.connectionError, undefined);
});

test("installed card disables enabling incomplete credentials but still allows disconnect", () => {
  const file = path.resolve(__dirname, "../packages/aihappey-components/src/cards/McpServerCard.tsx");
  const mocks = { "../theme/ThemeContext": { useTheme: () => ({ Card: "Card", Switch: "Switch" }) },
    "../buttons/McpServerCardButtons": { McpServerCardButtons: "Actions" }, "../fields/LimitedTextField": { LimitedTextField: "Text" },
    "./getRepositoryUrl": { getRepositoryUrl: () => undefined }, "../images": { CapabilityIcon: "Icon" } };
  const { McpServerCard } = load(file, mocks);
  for (const checked of [false, true]) {
    const card = McpServerCard({ serverName: "server", serverConfig: { url: "https://mcp.example" }, checked, canConnect: false, onToggle() {} });
    assert.equal(card.props.headerActions.props.disabled, !checked);
  }
});

test("explicit authorization wins over cached OAuth while ordinary custom headers retain OAuth redirect behavior", async () => {
  let outgoing, redirects = 0, unauthorized = false;
  const connector = load(path.resolve(__dirname, "../packages/aihappey-mcp/src/mcpConnector.ts"), {
    "@modelcontextprotocol/client": {
      Client: class { async connect(transport) { outgoing = transport.options.requestInit.headers; if (unauthorized) throw { status: 401 }; } },
      StreamableHTTPClientTransport: class { constructor(url, options) { this.options = options; } },
    },
    "aihappey-auth": { getMcpAccessToken: () => "cached-oauth", clearMcpAccessToken: () => {}, initiateMcpOAuthFlow: async () => { redirects++; } },
  });
  await connector.connectMcpServer("https://mcp.example/images", { headers: { authorization: "Bearer provider-key" }, handleOAuth: true });
  assert.deepEqual(outgoing, { authorization: "Bearer provider-key" }); assert.equal(redirects, 0);
  await connector.connectMcpServer("https://mcp.example/images", { headers: { "X-Tenant": "tenant" }, handleOAuth: true });
  assert.deepEqual(outgoing, { "X-Tenant": "tenant", Authorization: "Bearer cached-oauth" });
  unauthorized = true;
  await assert.rejects(connector.connectMcpServer("https://mcp.example/images", { handleOAuth: true }), /Redirecting for OAuth/);
  assert.equal(redirects, 1);
});
