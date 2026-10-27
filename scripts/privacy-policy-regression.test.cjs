const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const core = "packages/aihappey-core/src";
const read = (file) => fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
const english = JSON.parse(read("packages/aihappey-i18n/src/locales/en/en.json"));
const i18n = { useTranslation: () => ({ t: (key) => {
  if (key === "disclaimer") return "Example app disclaimer";
  return key.split(".").reduce((value, part) => value?.[part], english) ?? key;
} }) };

function load(filename, mocks = {}, fallback) {
  const output = ts.transpileModule(read(filename), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)((id) => {
    if (id === "react/jsx-runtime") return require(id);
    if (id in mocks) return mocks[id];
    if (fallback) return fallback(id);
    throw new Error(`Unmocked import ${id} in ${filename}`);
  }, module, module.exports);
  return module.exports;
}

const policyHelpers = load(`${core}/features/privacy/privacyPolicy.ts`);
const { normalizePrivacyPolicy } = policyHelpers;

function all(node, type) {
  if (!React.isValidElement(node)) return [];
  return [
    ...(node.type === type ? [node] : []),
    ...React.Children.toArray(node.props.children).flatMap(child => all(child, type)),
  ];
}

function footer(privacyPolicy, { desktop = true, appVersion = "test-version" } = {}) {
  const { DisclaimerBar } = load(`${core}/features/chat/layout/DisclaimerBar.tsx`, {
    "../context/ChatContext": { useChatContext: () => ({ config: { privacyPolicy, appVersion } }) },
    "aihappey-i18n": i18n,
    "react-router": { Link: "InternalLink" },
    "../../../shell/responsive/useIsDesktop": { useIsDesktop: () => desktop },
    "../../privacy/privacyPolicy": policyHelpers,
  });
  return DisclaimerBar();
}

function page(privacyPolicy) {
  const { PrivacyPolicyPage } = load(`${core}/features/privacy/PrivacyPolicyPage.tsx`, {
    "react-router": { Navigate: "Navigate" },
    "aihappey-i18n": i18n,
    "../chat/context/ChatContext": { useChatContext: () => ({ config: { privacyPolicy } }) },
    "../../ui/layout/OverviewPageHeader": { OverviewPageHeader: "OverviewPageHeader" },
    "../../ui/markdown/Markdown": { Markdown: "Markdown" },
    "./privacyPolicy": policyHelpers,
  });
  return PrivacyPolicyPage();
}

test("absent and whitespace-only policies normalize to no policy and show no link", () => {
  for (const policy of [undefined, {}, { markdown: "", url: "" }, { markdown: " \n\t ", url: " \t " }]) {
    assert.equal(normalizePrivacyPolicy(policy), undefined);
    const node = footer(policy);
    assert.equal(all(node, "a").length, 0);
    assert.equal(all(node, "InternalLink").length, 0);
    assert.match(renderToStaticMarkup(node), /test-version/);
  }
});

test("Markdown-only and combined policies link internally beside the version", () => {
  for (const policy of [{ markdown: "# Policy" }, { markdown: "# Policy", url: "https://example.com/privacy" }]) {
    const node = footer(policy);
    const [link] = all(node, "InternalLink");
    assert.equal(link.props.to, "/privacy");
    assert.equal(link.props.children, english.privacyPolicy.title);
    assert.equal(link.props.target, undefined);
    assert.equal(all(node, "a").length, 0);
    const group = all(node, "span").find(span => all(span, "InternalLink").length);
    assert.equal(group.props.style.marginLeft, "auto");
    assert.equal(group.props.style.display, "inline-flex");
    assert.equal(all(group, "span").at(-1).props.children, "test-version");
  }
});

test("URL-only footer uses a safe new-tab anchor without internal navigation", () => {
  const node = footer({ markdown: " \n ", url: " https://example.com/privacy " });
  const [link] = all(node, "a");
  assert.equal(link.props.href, "https://example.com/privacy");
  assert.equal(link.props.target, "_blank");
  assert.equal(link.props.rel, "noopener noreferrer");
  assert.equal(all(node, "InternalLink").length, 0);
  assert.ok(renderToStaticMarkup(node).includes(english.privacyPolicy.title));
});

test("privacy link remains visible on mobile and without a version", () => {
  for (const policy of [{ markdown: "Policy" }, { url: "https://example.com/privacy" }]) {
    for (const options of [{ desktop: false }, { appVersion: "" }, { desktop: false, appVersion: "" }]) {
      const node = footer(policy, options);
      assert.equal(all(node, "a").length + all(node, "InternalLink").length, 1);
      assert.equal(node.props.style.flexWrap, "wrap");
      assert.doesNotMatch(renderToStaticMarkup(node), /test-version/);
    }
  }
});

test("privacy page uses the shared page header and Markdown renderer", () => {
  const node = page({ markdown: "  ## Our policy\n\n**Markdown** text.  " });
  assert.equal(node.type, "main");
  assert.equal(node.props.style.maxWidth, "100%");
  assert.equal(all(node, "OverviewPageHeader")[0].props.title, english.privacyPolicy.title);
  assert.equal(all(node, "Markdown")[0].props.text, "## Our policy\n\n**Markdown** text.");
  assert.equal(all(node, "a").length, 0);
});

test("combined configuration also displays a safe external link on the Markdown page", () => {
  const node = page({ markdown: "Our policy", url: "https://example.com/privacy" });
  assert.equal(all(node, "Markdown").length, 1);
  const [link] = all(node, "a");
  assert.equal(link.props.href, "https://example.com/privacy");
  assert.equal(link.props.target, "_blank");
  assert.equal(link.props.rel, "noopener noreferrer");
  assert.equal(link.props.children, "View the external privacy policy");
});

test("direct visits without Markdown return to chat instead of displaying an empty page", () => {
  for (const policy of [undefined, { markdown: " \n " }, { url: "https://example.com/privacy" }]) {
    const node = page(policy);
    assert.equal(node.type, "Navigate");
    assert.equal(node.props.to, "/");
    assert.equal(node.props.replace, true);
  }
});

test("invalid and unsafe policy URLs cannot create external links", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,policy", "file:///policy", "not a URL", "/privacy", "//example.com/privacy"]) {
    assert.equal(normalizePrivacyPolicy({ url }), undefined);
    assert.equal(all(footer({ url }), "a").length, 0);
    assert.equal(all(page({ markdown: "Policy", url }), "a").length, 0);
    assert.equal(all(footer({ markdown: "Policy", url }), "InternalLink").length, 1);
  }
  assert.equal(normalizePrivacyPolicy({ url: "http://localhost/privacy" }).url, "http://localhost/privacy");
});

test("CoreRoot forwards typed optional policy values and registers the themed privacy route", () => {
  let routes;
  const memos = [];
  let memoIndex = 0;
  const componentMocks = new Proxy({}, { get: (_, name) => String(name) });
  const { CoreRoot } = load(`${core}/shell/CoreRoot.tsx`, {
    react: {
      useEffect: () => {},
      useMemo: (fn, deps) => {
        const index = memoIndex++;
        if (!memos[index] || deps.some((dep, i) => dep !== memos[index].deps[i])) {
          memos[index] = { value: fn(), deps };
        }
        return memos[index].value;
      },
    },
    "react-router": { createBrowserRouter: value => { routes = value; return {}; }, RouterProvider: "RouterProvider" },
    "aihappey-components": { useTheme: () => ({ Skeleton: "Skeleton" }) },
    "aihappey-ai": { defaultEndpoints: {} },
    "aihappey-auth": componentMocks,
    "aihappey-state": { normalizeChatEndpointId: id => id ?? "chat" },
  }, id => {
    assert.ok(id.startsWith("."), `Unexpected import: ${id}`);
    return componentMocks;
  });
  const props = { appName: "Test app", baseUrl: "https://api.example", appVersion: "v1" };
  const render = privacyPolicy => {
    memoIndex = 0;
    CoreRoot({ ...props, privacyPolicy });
    const shell = routes.find(route => route.path === "/*");
    assert.equal(shell.element.type, "CoreShell");
    assert.equal(shell.children[0].element.type, "SidebarLayout");
    assert.equal(shell.children[0].children.find(route => route.path === "privacy").element.type, "PrivacyPolicyPage");
    return shell.element.props.chatConfig;
  };
  assert.equal(render(undefined).privacyPolicy, undefined);
  const first = { markdown: "First policy" };
  assert.equal(render(first).privacyPolicy, first);
  const second = { markdown: "Updated policy", url: "https://example.com/privacy" };
  assert.equal(render(second).privacyPolicy, second);
  assert.equal(render(undefined).privacyPolicy, undefined);
});

// Execute the actual sample build configs without bundling or writing generated assets.
function sampleConfig(sample, env = {}) {
  let options;
  const filename = path.resolve("samples", sample, "esbuild.config.js");
  vm.runInNewContext(read(filename), {
    __dirname: path.dirname(filename),
    process: { env, argv: [], exit: code => { throw new Error(`Build exited: ${code}`); } },
    console: { log() {}, warn() {}, error() {} },
    require: id => {
      if (id === "esbuild") return { build: value => { options = value; return Promise.resolve(); } };
      if (id === "fs") return { ...fs, mkdirSync() {}, existsSync: () => false, readdirSync: () => [] };
      if (id === "path") return path;
      if (id === "dotenv") return { config() {} };
      if (id.endsWith("copy-locales.cjs")) return { copyI18nLocalesToPublic() {} };
      throw new Error(`Unexpected build import: ${id}`);
    },
  }, { filename });
  return {
    markdown: JSON.parse(options.define.__PRIVACY_POLICY_MARKDOWN__),
    url: JSON.parse(options.define.__PRIVACY_POLICY_URL__),
  };
}

test("only chathappey and Fluent inject privacy settings, with the requested sample defaults", () => {
  const chat = sampleConfig("chathappey");
  assert.match(chat.markdown, /^## /m);
  assert.match(chat.markdown, /HeaderAuth/);
  assert.doesNotMatch(chat.markdown, /OPERATOR TO COMPLETE/);
  assert.equal(chat.url, "");
  assert.equal(chat.markdown, read("samples/chathappey/PRIVACY.md"));
  assert.deepEqual(sampleConfig("fluent-sample"), { markdown: "", url: "https://example.com/privacy" });
  for (const sample of ["chathappey", "fluent-sample"]) {
    const app = read(`samples/${sample}/src/App.tsx`);
    assert.match(app, /privacyPolicy=\{\{\s*markdown: __PRIVACY_POLICY_MARKDOWN__,\s*url: __PRIVACY_POLICY_URL__,/);
  }
  for (const sample of fs.readdirSync("samples")) {
    if (["chathappey", "fluent-sample"].includes(sample)) continue;
    const app = `samples/${sample}/src/App.tsx`;
    if (fs.existsSync(app)) assert.doesNotMatch(read(app), /privacyPolicy|__PRIVACY_POLICY_/);
  }
});

for (const sample of ["chathappey", "fluent-sample"]) {
  test(`${sample}: inline Markdown and URL overrides are safely serialized and bypass file reads`, () => {
    const markdown = '# Custom policy\n\n"Quoted" text with \\ backslashes and <tags>.';
    const config = sampleConfig(sample, {
      PRIVACY_POLICY_MARKDOWN: markdown,
      PRIVACY_POLICY_MARKDOWN_FILE: "does-not-exist.md",
      PRIVACY_POLICY_URL: "https://operator.example/privacy",
    });
    assert.deepEqual(config, { markdown, url: "https://operator.example/privacy" });
  });

  test(`${sample}: Markdown files resolve relative to the sample, not the current directory`, () => {
    const config = sampleConfig(sample, { PRIVACY_POLICY_MARKDOWN_FILE: "../chathappey/PRIVACY.md" });
    assert.equal(config.markdown, read("samples/chathappey/PRIVACY.md"));
  });

  test(`${sample}: explicit empty settings can disable the sample defaults`, () => {
    assert.equal(normalizePrivacyPolicy(sampleConfig(sample, {
      PRIVACY_POLICY_MARKDOWN_FILE: "", PRIVACY_POLICY_URL: "",
    })), undefined);
    assert.equal(normalizePrivacyPolicy(sampleConfig(sample, {
      PRIVACY_POLICY_MARKDOWN: "", PRIVACY_POLICY_MARKDOWN_FILE: "missing.md", PRIVACY_POLICY_URL: "",
    })), undefined);
    assert.equal(normalizePrivacyPolicy(sampleConfig(sample, {
      PRIVACY_POLICY_MARKDOWN: " \n ", PRIVACY_POLICY_URL: " \t ",
    })), undefined);
  });

  test(`${sample}: a missing configured policy file fails the build`, () => {
    assert.throws(() => sampleConfig(sample, { PRIVACY_POLICY_MARKDOWN_FILE: "missing-policy-example.md" }), /ENOENT/);
  });
}

test("privacy labels are localized in English and Dutch", () => {
  assert.deepEqual(english.privacyPolicy, { title: "Privacy", externalLink: "View the external privacy policy" });
  const dutch = JSON.parse(read("packages/aihappey-i18n/src/locales/nl/nl.json"));
  assert.deepEqual(dutch.privacyPolicy, { title: "Privacy", externalLink: "Bekijk het externe privacybeleid" });
});

test("the public sample does not compile an Application Insights connection string", () => {
  const build = read("samples/chathappey/esbuild.config.js");
  assert.doesNotMatch(build, /APPLICATIONINSIGHTS|ApplicationInsights|AzureMonitor/);
  assert.doesNotMatch(read("samples/chathappey/src/main.tsx"), /appInsights|ApplicationInsights/);
});
