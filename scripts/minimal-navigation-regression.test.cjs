const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const React = require("react");
const ts = require("typescript");

function load(filename, mocks) {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)((id) => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

function harness(hiddenNavigationItemKeys) {
    const calls = [];
    const state = {
        hiddenNavigationItemKeys,
        selectConversation: id => calls.push(["select", id]),
        toggleSidebar: () => calls.push(["toggle"]),
        // Compact navigation must never change the user's visibility preferences.
        toggleHiddenNavigationItem: () => assert.fail("Unexpected visibility change"),
        showNavigationItem: () => assert.fail("Unexpected visibility change"),
        hideNavigationItem: () => assert.fail("Unexpected visibility change"),
    };
    const onSearch = () => calls.push(["search"]);
    const mocks = {
        "aihappey-components": { useTheme: () => ({ Button: "Button", Menu: "Menu", Navigation: "Navigation" }) },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => `translated:${key}` }) },
        "react-router": {
            useNavigate: () => path => { calls.push(["navigate", path]); },
            useLocation: () => ({ pathname: "/" }),
            useParams: () => ({}),
        },
        react: { useCallback: callback => callback },
        "aihappey-conversations": { useConversations: () => ({ items: [] }) },
        "react-dnd": { useDrop: () => [{ isOver: false }, () => {}] },
        "react-dnd-html5-backend": { NativeTypes: { FILE: "file" } },
        "../responsive/useIsDesktop": { useIsDesktop: () => true },
        "../../features/chat/context/ChatContext": { useChatContext: () => ({ config: {} }) },
    };
    const { MinimalNavBar } = load("packages/aihappey-core/src/shell/navigation/MinimalNavBar.tsx", mocks);
    const { ConversationSidebar } = load("packages/aihappey-core/src/shell/navigation/ConversationSidebar.tsx", mocks);
    return {
        state, calls,
        render: () => React.Children.toArray(MinimalNavBar({ onSearch }).props.children),
        expanded: () => ConversationSidebar({ onSearch }).props.children.props,
    };
}

const buttons = nodes => nodes.filter(node => node.type === "Button").slice(1);
const menu = nodes => nodes.find(node => node.type === "Menu");
const buttonKeys = nodes => buttons(nodes).map(node => node.key.split("$").at(-1));
const firstCategory = h => {
    const items = h.expanded().items;
    return items.slice(0, items.findIndex(item => item.key === "divider"));
};

test("minimal navigation matches only the expanded first category's order, icons, labels, and routes", async () => {
    const h = harness([]);
    const expected = firstCategory(h);
    assert.deepEqual(expected.map(item => item.key), [
        "new", "realtime", "search-conversations", "hub-search", "images", "transcriptions",
        "speech", "decisions", "reranking", "videos", "jobs", "arena",
    ]);
    const nodes = h.render();
    assert.deepEqual(buttonKeys(nodes), expected.map(item => item.key));
    assert.equal(menu(nodes), undefined);
    for (const [index, button] of buttons(nodes).entries()) {
        const item = expected[index];
        assert.equal(button.props.icon, item.icon, item.key);
        assert.equal(button.props["aria-label"], item.label, item.key);
        assert.equal(button.props.title, item.label, item.key);
        assert.equal(button.props.size, "small");
        assert.equal(button.props.variant, "transparent");
        h.calls.length = 0;
        await button.props.onClick();
        assert.deepEqual(h.calls, item.key === "new" ? [["select", null], ["navigate", "/"]]
            : item.key === "search-conversations" ? [["search"]] : [["navigate", item.href]]);
    }
});

test("hidden first-category items move into a flat direct-open menu without changing preferences", async () => {
    const hidden = Object.freeze(["speech", "reranking", "videos", "jobs", "arena"]);
    const h = harness(hidden);
    const nodes = h.render();
    assert.deepEqual(buttonKeys(nodes), ["new", "realtime", "search-conversations", "hub-search", "images", "transcriptions", "decisions"]);
    const overflow = menu(nodes);
    assert.deepEqual(overflow.props.items.map(item => item.key), ["speech", "reranking", "videos", "jobs", "arena"]);
    assert.equal(overflow.props.trigger.props.icon, "moreHorizontal");
    assert.equal(overflow.props.trigger.props["aria-label"], "translated:more");
    assert.equal(overflow.props.trigger.props.title, "translated:more");
    assert.equal(overflow.props.align, "left");
    for (const item of overflow.props.items) {
        assert.equal(item.children, undefined);
        h.calls.length = 0;
        await item.onClick();
        assert.deepEqual(h.calls, [["navigate", `/${item.key}`]]);
        assert.equal(h.state.hiddenNavigationItemKeys, hidden);
    }
    assert.deepEqual(buttonKeys(h.render()), buttonKeys(nodes));
});

test("all-hidden navigation retains the sidebar toggle and every direct action, including New chat and Search", async () => {
    const h = harness([]);
    const expected = firstCategory(h);
    h.state.hiddenNavigationItemKeys = Object.freeze(expected.map(item => item.key));
    const nodes = h.render();
    assert.deepEqual(buttonKeys(nodes), []);
    assert.equal(nodes[0].props.icon, "navigationMenu");
    assert.equal(nodes[0].props["aria-label"], "translated:openNavigation");
    nodes[0].props.onClick();
    assert.deepEqual(h.calls, [["toggle"]]);
    const items = menu(nodes).props.items;
    assert.deepEqual(items.map(item => item.key), expected.map(item => item.key));
    h.calls.length = 0;
    await items.find(item => item.key === "new").onClick();
    await items.find(item => item.key === "search-conversations").onClick();
    assert.deepEqual(h.calls, [["select", null], ["navigate", "/"], ["search"]]);
    assert.deepEqual(h.state.hiddenNavigationItemKeys, expected.map(item => item.key));
});

test("missing preferences and hidden items from other categories do not create an empty menu", () => {
    for (const hidden of [undefined, [], ["agents", "files", "obsolete-key"]]) {
        const h = harness(hidden);
        assert.equal(menu(h.render()), undefined);
        assert.equal(buttons(h.render()).length, 12);
    }
});

test("visibility changes made in expanded navigation are reflected on the next minimal render", () => {
    const h = harness(["hub-search", "decisions", "arena"]);
    assert.deepEqual(menu(h.render()).props.items.map(item => item.key), ["hub-search", "decisions", "arena"]);
    h.state.hiddenNavigationItemKeys = ["speech"];
    assert.deepEqual(menu(h.render()).props.items.map(item => item.key), ["speech"]);
    assert.ok(["hub-search", "decisions", "arena"].every(key => buttonKeys(h.render()).includes(key)));
    h.state.hiddenNavigationItemKeys = [];
    assert.equal(menu(h.render()), undefined);
});

test("every browser theme maps the dedicated overflow icon to horizontal dots without replacing contextMenu", () => {
    const themes = [
        ["fluent/src/primitives/Button.tsx", "MoreHorizontalRegular"],
        ["bootstrap/src/primitives/IconMap.tsx", "<ThreeDots />"],
        ["material/src/primitives/icons.tsx", "makeIcon(MoreHoriz)"],
        ["shadcn/src/primitives.tsx", "MoreHorizontal"],
        ["mantine/src/primitives.tsx", 'makeIcon("⋯")'],
        ["chakra/src/primitives.tsx", "makeIcon(FaEllipsis)"],
        ["html/src/primitives.tsx", "Ellipsis"],
    ];
    for (const [theme, expected] of themes) {
        const filename = `packages/aihappey-theme-${theme}`;
        const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const mappings = new Map();
        const visit = node => {
            if (ts.isPropertyAssignment(node) && ["moreHorizontal", "contextMenu"].includes(node.name.getText(source))) {
                mappings.set(node.name.getText(source), node.initializer.getText(source));
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
        assert.equal(mappings.get("moreHorizontal"), expected, theme);
        assert.ok(mappings.has("contextMenu"), theme);
    }
});
