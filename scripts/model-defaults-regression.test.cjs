const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { renderer: createRenderer, nodes } = require("./react-test-renderer.cjs");
const { createStore } = require("zustand/vanilla");
const { persist, createJSONStorage } = require("zustand/middleware");

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
const slices = "packages/aihappey-state/src/slices/";
const preferences = load(slices + "modelPreferences.ts");
const ui = load(slices + "uiSlice.ts", { "aihappey-mcp": {}, "./modelPreferences": preferences });
const options = load("packages/aihappey-state/src/persist.ts", {
  "zustand/middleware": { persist: (_, options) => options },
  "./slices/modelPreferences": preferences,
  "./slices/chatSlice": { DEFAULT_TOOL_OUTPUT_CONTENT_SETTINGS: {} },
  "./slices/chatEndpoint": { normalizeBaseUrl: value => value, resolveEffectiveBaseUrl: value => value },
  "./slices/uiSlice": ui,
  "./slices/apiKeyEncryption": { resolveApiKeyEncryptionStatus: () => "unconfigured" },
  "./slices/providerHeaders": { normalizeProviderHeaders: value => value },
  "./slices/defaultProviderTranscriptionMetadata": { normalizeProviderTranscriptionMetadata: value => value },
  "./slices/providerMetadataAliases": { normalizeSpaceXAiProviderMetadata: value => value },
}).withPersist(() => ({}));

function createPersistedUiStore(entries = new Map()) {
  return createStore(persist(ui.createUiSlice, {
    ...options,
    storage: createJSONStorage(() => ({
      getItem: key => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: key => entries.delete(key),
    })),
  }));
}

test("new users have Cloud enabled but keep conversation storage local, including after restart", () => {
  const entries = new Map();
  const store = createPersistedUiStore(entries);
  assert.equal(store.persist.hasHydrated(), true);
  assert.equal(store.getState().remoteStorageConnected, true);
  assert.equal(store.getState().conversationStorage, "local");
  store.getState().setRemoteStorageConnected(true);
  const restarted = createPersistedUiStore(entries).getState();
  assert.equal(restarted.remoteStorageConnected, true);
  assert.equal(restarted.conversationStorage, "local");
});

for (const version of [38, options.version]) {
  for (const remoteStorageConnected of [false, true]) {
    for (const conversationStorage of ["local", "remote"]) {
      test(`saved Cloud and storage preferences survive hydration and restart: v${version}, ${remoteStorageConnected}, ${conversationStorage}`, () => {
        const saved = { remoteStorageConnected, conversationStorage };
        const entries = new Map([[options.name, JSON.stringify({ state: saved, version })]]);
        const store = createPersistedUiStore(entries);
        assert.equal(store.getState().remoteStorageConnected, remoteStorageConnected);
        assert.equal(store.getState().conversationStorage, conversationStorage);
        store.getState().setRemoteStorageConnected(remoteStorageConnected);
        const restarted = createPersistedUiStore(entries).getState();
        assert.equal(restarted.remoteStorageConnected, remoteStorageConnected);
        assert.equal(restarted.conversationStorage, conversationStorage);
      });
    }
  }
}

test("a new user's explicit Cloud opt-out stays off after restart without selecting remote storage", () => {
  const entries = new Map();
  const store = createPersistedUiStore(entries);
  store.getState().setRemoteStorageConnected(false);
  const restarted = createPersistedUiStore(entries).getState();
  assert.equal(restarted.remoteStorageConnected, false);
  assert.equal(restarted.conversationStorage, "local");
});

function transcriptionSplitSettings(state) {
  return {
    transcriptionFileSplitEnabled: state.transcriptionFileSplitEnabled,
    transcriptionFileSplitOverlapSeconds: state.transcriptionFileSplitOverlapSeconds,
    transcriptionFileSplitMaxSizeMb: state.transcriptionFileSplitMaxSizeMb,
  };
}

test("new users default to transcription splitting with 5-second overlap and 15 MB chunks", () => {
  const entries = new Map();
  const store = createPersistedUiStore(entries);
  assert.equal(store.persist.hasHydrated(), true);
  const expected = {
    transcriptionFileSplitEnabled: true,
    transcriptionFileSplitOverlapSeconds: 5,
    transcriptionFileSplitMaxSizeMb: 15,
  };
  assert.deepEqual(transcriptionSplitSettings(store.getState()), expected);
  store.getState().setTranscriptionFileSplitEnabled(true);
  assert.deepEqual(transcriptionSplitSettings(createPersistedUiStore(entries).getState()), expected);
});

for (const version of [38, options.version]) {
  for (const [enabled, overlap, maxSize] of [[false, 5, 25], [true, 5, 15], [false, 0, 42], [true, 12, 7]]) {
    test(`saved transcription splitting survives hydration and reload: v${version}, ${enabled}, ${overlap}s, ${maxSize} MB`, () => {
      const saved = {
        transcriptionFileSplitEnabled: enabled,
        transcriptionFileSplitOverlapSeconds: overlap,
        transcriptionFileSplitMaxSizeMb: maxSize,
      };
      const entries = new Map([[options.name, JSON.stringify({ state: saved, version })]]);
      const store = createPersistedUiStore(entries);
      assert.equal(store.persist.hasHydrated(), true);
      assert.deepEqual(transcriptionSplitSettings(store.getState()), saved);
      store.getState().setTranscriptionFileSplitEnabled(enabled);
      assert.deepEqual(transcriptionSplitSettings(JSON.parse(entries.get(options.name)).state), saved);
      assert.deepEqual(transcriptionSplitSettings(createPersistedUiStore(entries).getState()), saved);
    });
  }
}

test("migration wraps the four legacy IDs, preserves array order/empty/unset, and leaves scalar types alone", () => {
  const saved = { userPreferredModel: " p/old ", userPreferredImageModel: [],
    userPreferredVideoModel: ["p/second", "p/first", "p/second"], userPreferredSpeechModel: null,
    userPreferredTranscriptionModel: "p/stt", userPreferredAudioModel: "p/realtime" };
  const migrated = options.migrate(saved, 38);
  assert.equal(options.name, "aihappey_store_v8");
  assert.equal(options.version, 39);
  assert.deepEqual(migrated.userPreferredModel, ["p/old"]);
  assert.deepEqual(migrated.userPreferredImageModel, []);
  assert.deepEqual(migrated.userPreferredVideoModel, ["p/second", "p/first"]);
  assert.equal(migrated.userPreferredSpeechModel, undefined);
  assert.equal(migrated.userPreferredTranscriptionModel, "p/stt");
  assert.equal(migrated.userPreferredAudioModel, "p/realtime");
  assert.equal(options.migrate({}, 38).userPreferredModel, undefined);
  const serialized = JSON.parse(JSON.stringify(options.partialize(migrated)));
  for (const field of Object.values(preferences.MODEL_PREFERENCE_FIELDS))
    assert.deepEqual(serialized[field], migrated[field]);
  assert.equal(saved.userPreferredModel, " p/old ");
});

test("all four preference setters store normalized independent ordered arrays", () => {
  let state;
  state = ui.createUiSlice(update => { state = { ...state, ...update(state) }; }, () => state, {});
  const input = [" p/second ", "p/first", "p/second", ""];
  for (const field of Object.values(preferences.MODEL_PREFERENCE_FIELDS)) {
    const setter = "set" + field[0].toUpperCase() + field.slice(1);
    state[setter](input);
    assert.deepEqual(state[field], ["p/second", "p/first"]);
    assert.notEqual(state[field], input);
    state[setter]([]);
    assert.deepEqual(state[field], []);
  }
});

test("configuration waits for hydration, seeds only unset lists, and is independent of routing", () => {
  const render = createRenderer();
  let hydrated = false, finish;
  let state = {};
  const store = { getState: () => state, setState: patch => { state = { ...state, ...patch }; },
    persist: { hasHydrated: () => hydrated, onFinishHydration: fn => { finish = fn; return () => {}; } } };
  const { useDefaultModel } = load("packages/aihappey-core/src/shell/bootstrap/useDefaultModel.ts", {
    react: render.react, "aihappey-state": { ...preferences, store, useAppStore: selector => selector(state) },
  });
  let defaults = { language: ["p/config-1", "p/config-2"], image: ["p/image-1", "p/image-2"], video: [], speech: ["p/speech"] };
  const Component = () => { useDefaultModel(false, defaults); return null; };
  render.render(Component, {});
  assert.deepEqual(state, {});
  state = { userPreferredModel: ["p/saved-2", "p/saved-1"], userPreferredSpeechModel: [] };
  hydrated = true; finish(); render.render(Component, {});
  assert.deepEqual(state, { userPreferredModel: ["p/saved-2", "p/saved-1"],
    userPreferredImageModel: defaults.image, userPreferredVideoModel: [], userPreferredSpeechModel: [] });
  defaults = { language: ["changed"], image: ["changed"], speech: ["changed"] };
  render.render(Component, {});
  assert.deepEqual(state.userPreferredImageModel, ["p/image-1", "p/image-2"]);
  assert.deepEqual(state.userPreferredSpeechModel, []);
});

test("omitting model configuration retains the existing language fallback without seeding unrelated types", () => {
  for (const authenticated of [false, true]) {
    const render = createRenderer();
    let state = {};
    const store = { getState: () => state, setState: patch => { state = { ...state, ...patch }; } };
    const { useDefaultModel } = load("packages/aihappey-core/src/shell/bootstrap/useDefaultModel.ts", {
      react: render.react, "aihappey-state": { ...preferences, store, useAppStore: selector => selector(state) },
    });
    render.render(() => { useDefaultModel(authenticated); return null; }, {});
    assert.deepEqual(state.userPreferredModel, [authenticated ? "openai/gpt-6-luna" : "pollinations/openai"]);
    assert.equal(state.userPreferredImageModel, undefined);
    assert.equal(state.userPreferredAudioModel, undefined);
    assert.equal(state.userPreferredTranscriptionModel, undefined);
  }
});

test("only the four supported default settings are multi-select, and allow clearing without a decision model", () => {
  const render = createRenderer();
  let state;
  state = ui.createUiSlice(update => { state = { ...state, ...update(state) }; }, () => state, {});
  const { AiDefaultSettings } = load("packages/aihappey-core/src/features/user-settings/AiDefaultSettings.tsx", {
    react: { ...render.react, default: render.react },
    "aihappey-state": { useAppStore: selector => selector(state) },
    "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
    "aihappey-types": { getModelTypeIcon: type => type, getModelTypeLabelKey: type => type },
    "aihappey-components": { useTheme: () => ({ Tabs: "tabs", Tab: "tab", Switch: "switch", Slider: "slider" }) },
    "../models/ModelSelect": { ModelSelect: "model-select" },
  });
  const pickers = () => nodes(render.render(AiDefaultSettings, {}), "model-select");
  assert.deepEqual(pickers().filter(picker => picker.props.multiselect).map(picker => picker.props.modelTypes[0]),
    ["language", "image", "speech", "video"]);
  for (const [type, field] of Object.entries(preferences.MODEL_PREFERENCE_FIELDS)) {
    const picker = () => pickers().find(picker => picker.props.modelTypes[0] === type);
    picker().props.onChange("p/second"); picker().props.onChange("p/first");
    assert.deepEqual(state[field], ["p/second", "p/first"]);
    picker().props.onChange("p/second"); picker().props.onChange("p/first");
    assert.deepEqual(state[field], []);
  }
  assert.equal(pickers().find(picker => picker.props.modelTypes[0] === "transcription").props.multiselect, undefined);
  assert.equal(pickers().find(picker => picker.props.modelTypes[0] === "audio").props.multiselect, undefined);
});
