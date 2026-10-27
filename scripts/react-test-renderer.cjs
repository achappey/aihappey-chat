const React = require("react");

// Component instances retain hook state until their tree position unmounts.
// Shared by modal tests so verification boundaries are rendered, not bypassed.
function renderer() {
    const instances = new Map();
    let current, index, effects, seen;
    const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
    const react = {
        ...React,
        useState(initial) {
            const slot = index++;
            const hooks = current.hooks;
            hooks[slot] ??= { value: typeof initial === "function" ? initial() : initial };
            return [hooks[slot].value, next => { hooks[slot].value = typeof next === "function" ? next(hooks[slot].value) : next; }];
        },
        useRef(initial) { const slot = index++; return current.hooks[slot] ??= { current: initial }; },
        useMemo(factory, deps) {
            const slot = index++;
            if (!same(current.hooks[slot]?.deps, deps)) current.hooks[slot] = { value: factory(), deps };
            return current.hooks[slot].value;
        },
        useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
        useEffect(effect, deps) {
            const slot = index++, hooks = current.hooks;
            if (!same(hooks[slot]?.deps, deps)) effects.push(() => {
                hooks[slot]?.cleanup?.();
                hooks[slot] = { deps, cleanup: effect() };
            });
        },
    };
    function cleanup(instance) { instance.hooks.forEach(hook => hook?.cleanup?.()); }
    function visit(node, key) {
        if (node == null || typeof node === "boolean") return null;
        if (Array.isArray(node)) return node.map((child, i) => visit(child, `${key}.${i}`));
        if (!React.isValidElement(node)) return node;
        if (typeof node.type === "function") {
            let instance = instances.get(key);
            if (instance?.type !== node.type) {
                if (instance) cleanup(instance);
                instance = { type: node.type, hooks: [] };
                instances.set(key, instance);
            }
            seen.add(key);
            current = instance;
            index = 0;
            return visit(node.type(node.props), `${key}.render`);
        }
        return {
            type: node.type,
            props: node.props,
            children: [visit(node.props.children, `${key}.children`), visit(node.props.actions, `${key}.actions`)],
        };
    }
    return {
        react,
        render(Component, props) {
            seen = new Set();
            effects = [];
            const tree = visit(React.createElement(Component, props), "root");
            for (const [key, instance] of instances) {
                if (!seen.has(key)) { cleanup(instance); instances.delete(key); }
            }
            effects.forEach(effect => effect());
            return tree;
        },
    };
}

function nodes(tree, type) {
    if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, type));
    if (!tree || typeof tree !== "object") return [];
    return [...(tree.type === type ? [tree] : []), ...nodes(tree.children, type)];
}

module.exports = { renderer, nodes };
