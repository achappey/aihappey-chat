const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { renderer, nodes } = require("./react-test-renderer.cjs");

function load(filename, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (id in mocks) return mocks[id];
    throw Error("Unmocked import: " + id);
  }, module, module.exports);
  return module.exports;
}
const preferences = load("packages/aihappey-state/src/slices/modelPreferences.ts");
const evaluator = load("packages/aihappey-core/src/shell/bootstrap/defaultModelUpdates.ts", { "aihappey-state": preferences });
const { getDefaultModelUpdates: find } = evaluator;
const day = 86400, now = Date.parse("2026-11-10T12:00:00Z"), seconds = now / 1000;
const model = (id, age, type = "language") => ({ id, type, created: seconds - age * day });
const saved = { userPreferredModel: ["old"] }, configured = { language: ["new"] };

for (const [age, qualifies] of [[29, false], [30, false], [30 + 1 / day, true], [90, true]]) {
  test(`strict 30-day release-date boundary: ${age} days`, () => {
    assert.deepEqual(find(saved, configured, [model("old", age), model("new", 2)], now), qualifies ? configured : {});
  });
}

test("one old model qualifies a mixed-age list; the entire configured list is normalized in order", () => {
  const input = { userPreferredModel: ["recent", "old"] };
  const defaults = { language: [" new-2 ", "new-1", "new-2", ""] };
  const catalog = [model("old", 60), model("recent", 1), model("new-1", 45), model("new-2", 40)];
  assert.deepEqual(find(input, defaults, catalog, now), { language: ["new-2", "new-1"] });
  assert.deepEqual(input.userPreferredModel, ["recent", "old"]);
  assert.deepEqual(defaults.language, [" new-2 ", "new-1", "new-2", ""]);
});

test("newer must be strictly later and newly introduced, not already selected or merely reordered", () => {
  const catalog = [model("old", 60), model("new", 40), model("same-date", 60), model("older", 61)];
  for (const ids of [["old"], ["same-date"], ["older"]]) assert.deepEqual(find(saved, { language: ids }, catalog, now), {});
  assert.deepEqual(find({ userPreferredModel: ["old", "new"] }, { language: ["new", "old"] }, catalog, now), {});
  assert.deepEqual(find({ userPreferredModel: ["old", "new"] }, { language: ["new"] }, catalog, now), {});
});

for (const badDate of [undefined, null, 0, -1, NaN, Infinity, "123", seconds + 1, Number.MAX_VALUE]) {
  test(`unverifiable release dates cannot establish an upgrade: ${badDate}`, () => {
    assert.deepEqual(find(saved, configured, [{ ...model("old", 60), created: badDate }, model("new", 1)], now), {});
    assert.deepEqual(find(saved, configured, [model("old", 60), { ...model("new", 1), created: badDate }], now), {});
  });
}

test("empty/unset lists, absent configuration, unavailable IDs, wrong types and ambiguous aliases are not upgraded", () => {
  const catalog = [model("old", 60), model("new", 1), model("image", 1, "image")];
  for (const input of [{}, { userPreferredModel: [] }]) assert.deepEqual(find(input, configured, catalog, now), {});
  for (const defaults of [undefined, {}, { language: [] }, { language: ["missing"] }, { language: ["image"] }, { language: ["new", "missing"] }])
    assert.deepEqual(find(saved, defaults, catalog, now), {});
  assert.deepEqual(find({ userPreferredModel: ["missing"] }, configured, catalog, now), {});
  assert.deepEqual(find(saved, { language: ["alias"] }, [{ ...catalog[1], displayId: "alias" }, catalog[0]], now), {});
});

test("only qualifying configured types are offered, independently of routing and provider filters", () => {
  const input = {}, defaults = {}, catalog = [];
  for (const [type, field] of Object.entries(preferences.MODEL_PREFERENCE_FIELDS)) {
    input[field] = [type + "-old"];
    defaults[type] = [type + "-new"];
    catalog.push(model(type + "-old", type === "image" ? 10 : 60, type), model(type + "-new", 1, type));
  }
  delete defaults.video;
  assert.deepEqual(find(input, defaults, catalog, now), { language: ["language-new"], speech: ["speech-new"] });
  assert.deepEqual(find({ ...input, userPreferredModel: ["language-new"], userPreferredSpeechModel: ["speech-new"] }, defaults, catalog, now), {});
});

function warningHarness({ hydrated = true, failSave = false } = {}) {
  const render = renderer();
  const state = {
    models: [model("old", 60), model("new", 1), model("image-old", 2, "image"), model("image-new", 1, "image")],
    modelsLoaded: true, userPreferredModel: ["old"], userPreferredImageModel: ["image-old"],
    userPreferredTranscriptionModel: "keep-stt", selectedModel: "active-conversation", selectedChatModelIds: ["active-conversation"],
  };
  // The component uses the real clock; retain relative model ages without depending on test date.
  state.models = state.models.map(item => ({ ...item, created: item.created + (Date.now() - now) / 1000 }));
  const defaults = { language: ["new"], image: ["image-new"] };
  let finish, writes = [], persisted;
  const store = { getState: () => state,
    setState: patch => { writes.push(patch); Object.assign(state, patch); if (failSave) throw Error("disk full"); persisted = structuredClone(state); },
    persist: { hasHydrated: () => hydrated, onFinishHydration: callback => { finish = callback; return () => {}; } },
  };
  let Component;
  function restartModule() {
    Component = load("packages/aihappey-core/src/shell/bootstrap/DefaultModelUpdatesWarning.tsx", {
      react: { ...render.react, default: render.react },
      "aihappey-components": { useTheme: () => ({ Alert: "alert", Button: "button" }) },
      "aihappey-i18n": { useTranslation: () => ({ t: (key, values) => values ? key + ":" + values.types : key }) },
      "aihappey-types": { getModelTypeLabelKey: type => type },
      "aihappey-state": { ...preferences, store, useAppStore: selector => selector(state) },
      "../../features/chat/context/ChatContext": { useChatContext: () => ({ config: { defaultModelsByType: defaults } }) },
      "./defaultModelUpdates": evaluator,
    }).DefaultModelUpdatesWarning;
  }
  restartModule();
  return { state, defaults, writes, render: () => render.render(Component, {}),
    hydrate: () => { hydrated = true; finish(); }, restartModule,
    remount: () => render.render(() => null, {}), persisted: () => persisted,
    allowSave: () => { failSave = false; } };
}
const click = (tree, label) => nodes(tree, "button").find(button => button.props.children === label).props.onClick();

test("warning waits for settings hydration and completed model discovery; theme and labels are accessible", () => {
  const h = warningHarness({ hydrated: false });
  assert.equal(h.render(), null);
  h.hydrate(); h.state.modelsLoaded = false;
  assert.equal(h.render(), null);
  h.state.modelsLoaded = true; h.state.modelsLoadingProgress = { active: true };
  assert.equal(h.render(), null);
  h.state.modelsLoadingProgress = undefined;
  const tree = h.render();
  assert.equal(nodes(tree, "alert")[0].props.variant, "warning");
  assert.equal(nodes(tree, "button")[1].props["aria-label"], "defaultModelUpdates.dismiss");
  assert.equal(nodes(tree, "span")[0].props.children, "defaultModelUpdates.message:language");
});

test("dismissal survives navigation/remount/catalog refresh without persistence, and returns on app restart", () => {
  const h = warningHarness();
  click(h.render(), "defaultModelUpdates.dismiss");
  assert.equal(h.render(), null);
  h.remount(); h.state.models = [...h.state.models];
  assert.equal(h.render(), null);
  assert.equal(h.writes.length, 0);
  h.restartModule();
  assert.equal(nodes(h.render(), "alert").length, 1);
});

test("Apply persists only qualifying lists and never changes active selections or other defaults", () => {
  const h = warningHarness();
  click(h.render(), "defaultModelUpdates.apply");
  assert.deepEqual(h.writes, [{ userPreferredModel: ["new"] }]);
  assert.deepEqual(h.persisted().userPreferredModel, ["new"]);
  assert.deepEqual(h.state.userPreferredImageModel, ["image-old"]);
  assert.equal(h.state.userPreferredTranscriptionModel, "keep-stt");
  assert.equal(h.state.selectedModel, "active-conversation");
  assert.deepEqual(h.state.selectedChatModelIds, ["active-conversation"]);
  assert.equal(h.render(), null);
  h.restartModule(); assert.equal(h.render(), null);
});

test("Apply rechecks the latest settings rather than overwriting a newer user choice", () => {
  const h = warningHarness(), tree = h.render();
  h.state.userPreferredModel = ["new"];
  click(tree, "defaultModelUpdates.apply");
  assert.equal(h.writes.length, 0);
  assert.equal(h.render(), null);
});

test("failed browser persistence restores the affected fields and retains the warning for retry", () => {
  const h = warningHarness({ failSave: true });
  click(h.render(), "defaultModelUpdates.apply");
  assert.deepEqual(h.state.userPreferredModel, ["old"]);
  assert.equal(nodes(h.render(), "div").filter(node => node.props.role === "alert").length, 1);
  h.allowSave(); click(h.render(), "defaultModelUpdates.apply");
  assert.deepEqual(h.persisted().userPreferredModel, ["new"]);
  assert.equal(h.render(), null);
});
