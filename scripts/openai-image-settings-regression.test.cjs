const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderer, nodes } = require('./react-test-renderer.cjs');

function setup() {
  const render = renderer(), cache = new Map();
  const theme = new Proxy({}, { get: (_, name) => name === 'Card'
    ? props => React.createElement('Card', props, props.headerActions, props.children)
    : String(name) });
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    cache.set(file, module.exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', code)(id => {
      if (id === 'react') return render.react;
      if (id.endsWith('theme/ThemeContext')) return { useTheme: () => theme };
      if (id === 'aihappey-i18n') return { useTranslation: () => ({ t: key => key }) };
      if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
      if (!id.startsWith('.')) return require(id);
      const target = path.resolve(path.dirname(file), id);
      return load(['', '.ts', '.tsx', '/index.ts'].map(ext => target + ext).find(p => fs.existsSync(p) && fs.statSync(p).isFile()));
    }, module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  }
  return { render, load };
}
const openai = 'packages/aihappey-components/src/forms/providers/openai/';
const clean = value => JSON.parse(JSON.stringify(value));

test('standalone image forms pass through formats, quality and complexity with independent optional GIF fields', () => {
  const { render, load } = setup();
  const { OpenAIImageConfigForm } = load(openai + 'OpenAIImageConfigForm.tsx');
  let config = { future: { keep: true }, output_format: 'png' };
  const tree = () => render.render(OpenAIImageConfigForm, { config, updateConfig: next => { config = next; } });
  const field = (type, label) => nodes(tree(), type).find(n => n.props.label === label).props;
  assert.equal(nodes(tree(), 'Card').length, 3);
  assert.equal(nodes(tree(), 'Switch').length, 1, 'only SVG has a toggle');
  assert.deepEqual(field('Select', 'providers:openai.imageOutputFormat').options.map(o => o.value), ['', 'png', 'jpeg', 'webp', 'gif', 'svg']);
  field('Select', 'providers:openai.imageOutputFormat').onChange('');
  assert.deepEqual(field('Select', 'providers:openai.imageOutputFormat').values, ['']);
  assert.ok(!('output_format' in clean(config)), 'Default omits output_format instead of writing PNG');
  field('Select', 'providers:openai.imageOutputFormat').onChange('png');
  assert.deepEqual(field('Select', 'quality').options.map(o => o.value), ['auto', 'low', 'medium', 'high', 'xhigh', 'max']);
  field('Select', 'providers:openai.imageComplexity').onChange('high');
  field('Input', 'providers:openai.imageFrameCount').onChange({ target: { value: '12' } });
  field('Input', 'providers:openai.imageFrameDuration').onChange({ target: { value: '2500' } });
  assert.equal(config.output_format, 'png', 'no implicit format switching');
  assert.equal(config.frame_duration_ms, 2500, 'no Responses-only limit applied to Images');
  field('Input', 'providers:openai.imageFrameCount').onChange({ target: { value: '' } });
  assert.ok(!('frame_count' in clean(config)));
  assert.equal(config.frame_duration_ms, 2500);
  field('Select', 'providers:openai.imageComplexity').onChange('');
  assert.ok(!('complexity' in clean(config)));
  assert.deepEqual(config.future, { keep: true });
});

test('SVG toggle omits the whole object and author options preserve unknown settings', () => {
  const { render, load } = setup();
  const { OpenAIImageOptionsCards } = load(openai + 'cards/OpenAIImageOptionsCards.tsx');
  let config = { output_format: 'jpeg', svg: { model: 'author', future: 42, reasoning: { effort: 'high', future: true } } };
  const tree = () => render.render(OpenAIImageOptionsCards, { config, updateConfig: next => { config = next; } });
  nodes(tree(), 'Select')[0].props.onChange('max');
  assert.deepEqual(config.svg, { model: 'author', future: 42, reasoning: { effort: 'max', future: true } });
  nodes(tree(), 'Switch')[0].props.onChange();
  assert.deepEqual(clean(config), { output_format: 'jpeg' });
  assert.ok(nodes(tree(), 'Input').find(n => n.props.label === 'providers:openai.imageSvgModel').props.disabled);
  nodes(tree(), 'Switch')[0].props.onChange();
  assert.deepEqual(config.svg, {});
  nodes(tree(), 'Input').find(n => n.props.label === 'providers:openai.imageSvgModel').props.onChange({ target: { value: 'new-author' } });
  nodes(tree(), 'Select')[0].props.onChange('');
  assert.deepEqual(clean(config.svg), { model: 'new-author' });
});

test('chat image tool has 2.6 models, no 1.5 choice or fidelity control, and the current default', () => {
  const { render, load } = setup();
  const { OpenAIImageGenerationForm } = load(openai + 'cards/OpenAIImageGenerationForm.tsx');
  let config = {};
  const tree = () => render.render(OpenAIImageGenerationForm, { config, updateConfig: next => { config = next; } });
  nodes(tree(), 'Switch').find(n => n.props.id === 'image_generation').props.onChange();
  assert.equal(config.image_generation.model, 'gpt-image-2.5-sunburst');
  assert.ok(!('input_fidelity' in config.image_generation));
  const select = nodes(tree(), 'Select').find(n => n.props.label === 'model').props;
  assert.ok(select.options.some(o => o.value === 'gpt-image-2.6-sunburst'));
  assert.ok(select.options.some(o => o.value === 'gpt-image-2.6-flare'));
  assert.ok(!select.options.some(o => o.value === 'gpt-image-1.5'));
  assert.ok(!nodes(tree(), 'Select').some(n => n.props.label === 'input_fidelity'));
  assert.deepEqual(nodes(tree(), 'Select').find(n => n.props.label === 'providers:openai.imageOutputFormat').props.values, ['']);
  const cards = nodes(tree(), 'Card');
  assert.deepEqual(cards.map(card => card.props.title), ['image_generation', 'SVG'], 'chat embeds GIF inputs instead of a separate GIF card');
  assert.equal(nodes(cards[0], 'Input').filter(n => n.props.type === 'number').length, 2);
  assert.equal(nodes(cards[1], 'Input').filter(n => n.props.type === 'number').length, 0);
  for (const row of nodes(cards[0], 'div').filter(node => node.props.style?.flexDirection === 'row')) {
    const count = ['Select', 'Input', 'Slider'].reduce((sum, type) => sum + nodes(row, type).length, 0);
    assert.ok(count <= 2, 'chat rows never contain more than two fields');
  }
  nodes(tree(), 'Input').find(n => n.props.label === 'providers:openai.imageFrameCount').props.onChange({ target: { value: '8' } });
  assert.equal(config.image_generation.frame_count, 8);
  nodes(tree(), 'Switch').find(n => n.props.id === 'openai-chat-image-svg').props.onChange();
  assert.deepEqual(config.image_generation.svg, {});
});

test('OpenAI request cleanup removes legacy input fidelity without mutating stored or unrelated settings', () => {
  const { load } = setup();
  const { sanitizeProviderRequestConfigForProvider: sanitize } = load('packages/aihappey-core/src/runtime/providers/providerRequestConfig.ts');
  const config = { image_generation: { input_fidelity: 'low', frame_count: 8 },
    tools: [{ type: 'image_generation', input_fidelity: 'high', output_format: 'svg', svg: { model: 'author' }, future: 42 },
      { type: 'other', input_fidelity: 'keep' }] };
  const result = sanitize(config, 'OpenAI');
  assert.ok(!('input_fidelity' in result.image_generation));
  assert.ok(!('input_fidelity' in result.tools[0]));
  assert.equal(result.tools[0].future, 42);
  assert.equal(result.tools[0].svg.model, 'author');
  assert.equal(result.tools[1].input_fidelity, 'keep');
  assert.equal(config.tools[0].input_fidelity, 'high');
  assert.deepEqual(sanitize(config, 'other'), config);
});

test('markup passes through the unchanged image contract only inside OpenAI provider options', async () => {
  const { load } = setup();
  const { imageFileToMarkup } = load(openai + 'cards/OpenAIImageMarkupField.tsx');
  const { createImageProvider } = load('packages/aihappey-ai/src/createImageProvider.ts');
  const saved = { openai: { output_format: 'gif', frame_count: 9, svg: { model: 'author' }, future: 42 }, other: { keep: true } };
  const markup = await imageFileToMarkup(new File([new Uint8Array([0, 1, 2, 255])], 'overlay.png', { type: 'image/png' }));
  let payload;
  const provider = createImageProvider({ baseUrl: 'https://test.invalid/images', fetch: async (_, request) => {
    payload = JSON.parse(request.body);
    return Response.json({ images: ['image'], warnings: [] });
  } });
  await provider.imageModel('openai/model').doGenerate({ prompt: 'edit', n: 1,
    files: [{ type: 'file', mediaType: 'image/png', data: 'SOURCE' }],
    providerOptions: { ...saved, openai: { ...saved.openai, markup } } });
  assert.ok(!('markup' in payload));
  assert.deepEqual(payload.providerOptions.openai.markup, { image_url: 'data:image/png;base64,AAEC/w==' });
  assert.equal(payload.providerOptions.openai.output_format, 'gif', 'no compatibility filtering');
  assert.equal(payload.providerOptions.openai.svg.model, 'author');
  assert.deepEqual(payload.providerOptions.other, saved.other);
  assert.ok(!('markup' in saved.openai));
});

test('OpenAI provider markup control supports drop, preview, replacement and clear', async () => {
  const { render, load } = setup();
  const { OpenAIImageConfigForm } = load(openai + 'OpenAIImageConfigForm.tsx');
  let config = { future: 42 };
  const tree = () => render.render(OpenAIImageConfigForm, { config, updateConfig: next => { config = next; } });
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const file = new File([new Uint8Array([0, 1, 2, 255])], 'overlay.png', { type: 'image/png' });
  let prevented = 0, stopped = 0;
  const group = nodes(tree(), 'div').find(node => node.props['aria-label'] === 'providers:openai.imageMarkup');
  group.props.onDrop({ preventDefault: () => prevented++, stopPropagation: () => stopped++, dataTransfer: { files: [file] } });
  await tick();
  assert.equal(prevented, 1); assert.equal(stopped, 1);
  assert.deepEqual(config.markup, { image_url: 'data:image/png;base64,AAEC/w==' });
  assert.equal(nodes(tree(), 'img')[0].props.src, config.markup.image_url);
  const input = nodes(tree(), 'input').find(node => node.props.type === 'file').props;
  input.onChange({ target: { files: [new File(['new'], 'new.png', { type: 'image/png' })], value: 'selected' } });
  await tick();
  assert.equal(config.markup.image_url, 'data:image/png;base64,bmV3');
  nodes(tree(), 'Button').find(node => node.props.icon === 'dismiss').props.onClick();
  assert.ok(!('markup' in clean(config)));
  assert.equal(nodes(tree(), 'img').length, 0);
  assert.equal(config.future, 42);
});

test('generic image settings and request code have no markup contract or storage extensions', () => {
  for (const file of [
    'packages/aihappey-components/src/forms/images/ImageSettingsForm.tsx',
    'packages/aihappey-core/src/features/image-settings/ImageSettingsGeneralTab.tsx',
    'packages/aihappey-core/src/features/images/ImagePage.tsx',
    'packages/aihappey-ai/src/createImageProvider.ts',
  ]) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /markup/i, file);
});
