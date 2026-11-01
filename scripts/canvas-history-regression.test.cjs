const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderer, nodes } = require('./react-test-renderer.cjs');
const content = 'packages/aihappey-core/src/features/chat/activity/content/';
function load(file, mocks = {}, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} }; cache.set(file, module.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (id in mocks) return mocks[id];
    if (!id.startsWith('.')) return require(id);
    const base = path.resolve(path.dirname(file), id);
    const target = ['', '.ts', '.tsx', '/index.ts'].map(ext => base + ext).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    return load(target, mocks, cache);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const { extractLocalCanvasHistory } = load(content + 'localCanvasHistory.ts');
function call(name, input, extra = {}) {
  return { type: 'tool-' + name, input, state: 'output-available', msgId: 'm', partIndex: 0,
    output: { isError: false, content: [{ type: 'text', text: 'OK' }] }, ...extra };
}
const patch = (type, path, diff, extra) => call('apply_patch', { operation: { type, path, diff } }, extra);
const editor = (command, path, fields, extra) => call('str_replace_based_edit_tool', { command, path, ...fields }, extra);
const create = () => editor('create', 'test.md', { file_text: 'one\ntwo' });

test('Canvas reconstructs a complete document across patch, Anthropic aliases, and local Canvas without touching results', () => {
  const parts = [
    patch('create_file', 'my notes.md', '+one\n+two', { msgId: 'a', partIndex: 2 }),
    call('str_replace_editor', { command: 'str_replace', path: '/my notes.md', old_str: 'one', new_str: '$&' }, { msgId: 'b' }),
    call('local_canvas_insert', { path: '/folder/my notes', insert_line: 1, insert_text: 'head' }, { msgId: 'b', partIndex: 3 }),
    editor('insert', 'my notes.md', { insert_line: 3, insert_text: 'tail' }, { msgId: 'c', partIndex: 1 }),
  ];
  const before = JSON.stringify(parts);
  const resources = extractLocalCanvasHistory(parts);
  assert.deepEqual(resources.map(r => r.text), ['one\ntwo', '$&\ntwo', 'head\n$&\ntwo', 'head\n$&\ntwo\ntail']);
  assert.ok(resources.every(r => r.uri === 'localcanvas:///my%20notes.md' && r.mimeType === 'text/markdown' && r._localDocument));
  assert.equal(resources[0]._partIndex, 2);
  assert.equal(JSON.stringify(parts), before);
  assert.deepEqual(extractLocalCanvasHistory(JSON.parse(before)), resources);
  assert.deepEqual(extractLocalCanvasHistory([]), []);
});

test('only successful released creation calls seed Canvas; existing files and fragments are not guessed', () => {
  for (const part of [
    editor('view', 'existing.md', {}),
    editor('str_replace', 'existing.md', { old_str: 'a', new_str: 'b' }),
    editor('insert', 'existing.md', { insert_line: 0, insert_text: 'fragment' }),
    patch('update_file', 'existing.md', '@@\n-a\n+b'),
    call('local_canvas_read', { path: '/existing', view_range: [1, 2] }),
    call('local_canvas_replace', { path: '/existing', old_str: 'a', new_str: 'fragment' }),
    call('local_canvas_unknown', { path: '/existing', file_text: 'unknown' }),
    call('unrelated', { path: 'existing.md', file_text: 'unrelated' }),
    createWith({ state: 'approval-requested' }), createWith({ state: 'input-available' }),
    createWith({ state: 'input-streaming' }), createWith({ state: 'output-denied' }), createWith({ state: 'output-error' }),
    createWith({ output: { isError: true } }), createWith({ output: { structuredContent: { status: 'failed' } } }),
    createWith({ approval: { approved: false }, state: 'approval-responded' }),
    createWith({ output: undefined }), createWith({ providerExecuted: true }), createWith({ input: '{' }),
    editor('create', 'document.html', { file_text: '<script>bad</script>' }),
    editor('create', 'document.png', { file_text: 'not text' }),
    editor('create', '../escape.md', { file_text: 'bad' }),
    editor('create', 'binary.md', { file_text: 'a\0b' }),
    patch('create_file', 'folder/not-flat.md', '+bad'),
  ]) assert.deepEqual(extractLocalCanvasHistory([part]), [], JSON.stringify(part));
  function createWith(extra) { return { ...create(), ...extra }; }
  assert.equal(extractLocalCanvasHistory([createWith({ state: 'approval-responded', approval: { approved: true } })]).length, 1);
});

test('empty creation, plain text, JSON-string inputs, and browser case-sensitive identities are retained', () => {
  const resources = extractLocalCanvasHistory([
    patch('create_file', 'empty.md', ''),
    editor('create', 'plain.txt', { file_text: '# Not Markdown\n<script>literal</script>' }),
    call('local_canvas_create', JSON.stringify({ path: '/Case', file_text: 'upper' })),
    call('local_canvas_create', { path: '/case', file_text: 'lower' }),
  ]);
  assert.equal(resources[0].text, '');
  assert.equal(resources[1].mimeType, 'text/plain');
  assert.notEqual(resources[2].uri, resources[3].uri);
});

test('deletion, conflicts, denied mutations, and recreation conservatively track the known baseline', () => {
  const update = () => patch('update_file', 'test.md', '@@\n-one\n+ONE');
  assert.equal(extractLocalCanvasHistory([create(), update()]).at(-1).text, 'ONE\ntwo');
  assert.equal(extractLocalCanvasHistory([create(), patch('delete_file', 'test.md'), update()]).length, 1);
  assert.equal(extractLocalCanvasHistory([create(), editor('str_replace', 'test.md', { old_str: 'missing', new_str: 'bad' }), update()]).length, 1);
  assert.equal(extractLocalCanvasHistory([create(), editor('str_replace', 'test.md', { old_str: 'one', new_str: 'bad' }, { approval: { approved: false }, state: 'approval-responded' }), update()]).length, 1);
  assert.equal(extractLocalCanvasHistory([create(), editor('str_replace', 'test.md', { old_str: 'one', new_str: 'bad' }, { output: { isError: true } }), update()]).length, 2);
  assert.equal(extractLocalCanvasHistory([create(), call('local_canvas_read', { path: 'test.md', view_range: [1, 1] }), update()]).at(-1).text, 'ONE\ntwo');
  assert.equal(extractLocalCanvasHistory([create(), patch('delete_file', 'test.md'), create()]).length, 2);
});

test('replay rejects ambiguous edits, invalid lines, oversized content, and invalid V4A without crashing', () => {
  const ambiguous = editor('create', 'test.md', { file_text: 'a a' });
  for (const edit of [
    editor('str_replace', 'test.md', { old_str: 'a', new_str: 'b' }),
    editor('str_replace', 'test.md', { old_str: '', new_str: 'b' }),
    editor('insert', 'test.md', { insert_line: 99, insert_text: 'b' }),
    editor('insert', 'test.md', { insert_line: 0.5, insert_text: 'b' }),
    patch('update_file', 'test.md', 'not a patch'),
  ]) assert.equal(extractLocalCanvasHistory([ambiguous, edit]).length, 1);
  assert.deepEqual(extractLocalCanvasHistory([editor('create', 'large.md', { file_text: 'x'.repeat(2_000_001) })]), []);
  assert.deepEqual(extractLocalCanvasHistory([patch('create_file', 'bad.md', 'not a patch')]), []);
  assert.equal(extractLocalCanvasHistory([ambiguous, call('local_canvas_replace', { path: 'test.md', old_str: 'a', new_str: '$&' })]).at(-1).text, '$& a');
});

test('Canvas card preserves title/date/version controls, literal plain text, and disabled local links', async () => {
  const render = renderer();
  const { CanvasCard } = load(content + 'CanvasCard.tsx', {
    react: render.react,
    'aihappey-components': { useTheme: () => ({ Card: 'Card', Button: 'Button', Menu: 'Menu' }), OpenLinkButton: 'OpenLinkButton' },
    'aihappey-i18n': { useTranslation: () => ({ t: value => value }) },
    '../../../../ui/markdown/Markdown': { Markdown: props => render.react.createElement('Markdown', props) },
    '../../files/file': { copyMarkdownToClipboard: async () => {} },
  });
  const version = { text: '<script>literal</script>\n# plain', mimeType: 'text/plain', _localDocument: true,
    _msgId: 'm', _partIndex: 3, _ts: '2026-11-01T12:00:00Z' };
  const props = { uri: 'localcanvas:///my%20notes.txt', versions: [version] };
  const tree = render.render(CanvasCard, props);
  assert.equal(nodes(tree, 'Card')[0].props.title, 'my notes');
  assert.ok(nodes(tree, 'Card')[0].props.description !== '-');
  assert.equal(nodes(tree, 'Card')[0].props.headerActions.props.items.length, 1);
  assert.equal(nodes(tree, 'OpenLinkButton')[0].props.disabled, true);
  assert.equal(nodes(tree, 'Markdown').length, 0);
  assert.equal(nodes(tree, 'div')[0].props.children, version.text);
  const markdown = { ...version, mimeType: 'text/markdown', text: '# Markdown' };
  const mdProps = { ...props, versions: [markdown] };
  render.render(CanvasCard, mdProps);
  assert.equal(nodes(render.render(CanvasCard, mdProps), 'Markdown')[0].props.safeDocument, true);
});

test('document Markdown opts out of raw HTML, active previews, image reads, and unsafe link protocols', () => {
  const render = renderer();
  const { Markdown } = load('packages/aihappey-core/src/ui/markdown/Markdown.tsx', {
    'react-markdown': 'ReactMarkdown', 'remark-gfm': 'gfm', 'rehype-raw': 'raw',
    'rehype-sanitize': { __esModule: true, default: 'sanitize', defaultSchema: {} }, 'rehype-highlight': 'highlight',
    'aihappey-components': { useTheme: () => ({ Image: 'Image' }) },
    './Codeblock': { CodeBlock: 'CodeBlock' }, '@google/model-viewer': {},
  });
  const props = nodes(render.render(Markdown, { text: '# Safe', safeDocument: true }), 'ReactMarkdown')[0].props;
  assert.equal(props.skipHtml, true);
  assert.ok(!props.rehypePlugins.includes('raw'));
  assert.equal(props.components.code, undefined);
  for (const uri of ['javascript:alert(1)', 'file:///C:/secret', 'data:text/html,test', 'ms-settings:', '/local/file', 'https://user:secret@example.com/']) assert.equal(props.urlTransform(uri), '');
  assert.equal(props.urlTransform('https://example.com/'), 'https://example.com/');
  assert.equal(props.components.img({ alt: 'image', src: 'https://example.com/image.png' }).type, 'span');
});
