const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { sync, hash } = require('../packages/aihappey-core/scripts/sync-provider-metadata.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-metadata-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'upstream');
  const destination = path.join(root, 'snapshot');
  const documents = {
    'provider.schema.json': JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/aihappey-core/src/runtime/providers/provider.schema.json'), 'utf8')),
    'providers/index.json': [{ id: 'example', file: 'example.json' }],
    'providers/example.json': { name: 'Example', icons: [], experimental: false },
    'models/providers/minimax.json': { data: [{ id: 'minimax/model' }] },
    'models/providers/rebytemodels.json': { data: [{ id: 'rebytemodels/model' }] },
    'models/providers/zai.json': { data: [{ id: 'zai/model' }] },
    'pricing/providers/example.json': { 'example/model': { pricing: { input: '0.001', output: '0.002' } } },
    'pricing/providers/example/long_context.json': { tiers: [] },
  };
  function publish() {
    const files = Object.entries(documents).sort(([a], [b]) => a < b ? -1 : 1).map(([file, value]) => {
      const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
      fs.mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
      fs.writeFileSync(path.join(source, file), bytes);
      return { file, sha256: hash(bytes) };
    });
    fs.writeFileSync(path.join(source, 'index.json'), JSON.stringify({ version: 1, files }));
  }
  publish();
  return { source, destination, documents, publish };
}

test('snapshots are deterministic, match upstream JSON, preserve fields, and do not bundle unconsumed variants', (t) => {
  const options = fixture(t);
  const first = sync(options);
  assert.deepEqual(sync(options), first);
  assert.deepEqual(sync({ ...options, check: true, requireSource: true }), first);
  for (const { source, file } of first.files)
    assert.deepEqual(fs.readFileSync(path.join(options.source, source)), fs.readFileSync(path.join(options.destination, file)));
  assert.ok(!fs.existsSync(path.join(options.destination, 'catalog/pricing/example/long_context.json')));
  const metadata = JSON.parse(fs.readFileSync(path.join(options.destination, 'catalog/example.json'), 'utf8'));
  assert.deepEqual(metadata.icons, []);
  assert.equal(metadata.experimental, false);
});

test('validated offline development works, but release checks require the source', (t) => {
  const options = fixture(t);
  sync(options);
  fs.rmSync(options.source, { recursive: true });
  let warning;
  sync({ ...options, check: true, warn: (value) => { warning = value; } });
  assert.match(warning, /validated offline/);
  assert.throws(() => sync({ ...options, requireSource: true }), /checkout is required/);
  fs.writeFileSync(path.join(options.destination, 'catalog/models/zai.json'), '{"data":[]}');
  assert.throws(() => sync(options), /hash mismatch/);
});

test('current source edits refresh snapshots even when upstream hashes have not been regenerated', (t) => {
  const options = fixture(t);
  sync(options);
  const before = fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8');
  const upstreamManifest = fs.readFileSync(path.join(options.source, 'index.json'), 'utf8');
  const edits = {
    'models/providers/zai.json': { data: [{ id: 'zai/latest-model' }] },
    'providers/example.json': { name: 'Latest Example', icons: [] },
    'pricing/providers/example.json': { 'example/model': { pricing: { input: '0.009', output: '0.008' } } },
  };
  for (const [file, content] of Object.entries(edits))
    fs.writeFileSync(path.join(options.source, file), JSON.stringify(content));
  assert.throws(() => sync({ ...options, check: true }), /Stale snapshot manifest/);
  assert.equal(fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8'), before);
  const snapshot = sync(options);
  for (const [source, content] of Object.entries(edits)) {
    const entry = snapshot.files.find(entry => entry.source === source);
    const bytes = fs.readFileSync(path.join(options.destination, entry.file));
    assert.deepEqual(JSON.parse(bytes), content);
    assert.equal(entry.sha256, hash(bytes));
  }
  assert.equal(fs.readFileSync(path.join(options.source, 'index.json'), 'utf8'), upstreamManifest);
  assert.deepEqual(sync({ ...options, check: true, requireSource: true }), snapshot);
  fs.rmSync(options.source, { recursive: true });
  assert.deepEqual(sync({ ...options, check: true, warn() {} }), snapshot);
});

test('invalid current source data is rejected before changing any snapshot asset', (t) => {
  const options = fixture(t);
  const snapshot = sync(options);
  const files = ['metadata.snapshot.json', ...snapshot.files.map(entry => entry.file)];
  const before = new Map(files.map(file => [file, fs.readFileSync(path.join(options.destination, file))]));
  for (const [file, invalid, error] of [
    ['providers/example.json', '{"name":"Example","unknown":true}', /Invalid provider metadata/],
    ['pricing/providers/example.json', '{invalid JSON}', /Invalid strict JSON/],
    ['providers/index.json', JSON.stringify([{ id: 'example', file: 'example.json' }, { id: 'example', file: 'example.json' }]), /Duplicate provider/],
  ]) {
    const source = path.join(options.source, file);
    const original = fs.readFileSync(source);
    fs.writeFileSync(source, invalid);
    assert.throws(() => sync(options), error);
    for (const [file, content] of before)
      assert.deepEqual(fs.readFileSync(path.join(options.destination, file)), content);
    fs.writeFileSync(source, original);
  }
});

test('unconsumed upstream edits do not block generation or freshness checks', (t) => {
  const options = fixture(t);
  const snapshot = sync(options);
  const before = fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8');
  fs.writeFileSync(path.join(options.source, 'pricing/providers/example/long_context.json'), '{"tiers":[{}]}');
  assert.deepEqual(sync(options), snapshot);
  assert.deepEqual(sync({ ...options, check: true, requireSource: true }), snapshot);
  assert.equal(fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8'), before);
});

test('deleted providers are removed and remaining providers can refresh without upstream hash updates', (t) => {
  const options = fixture(t);
  options.documents['providers/index.json'].push({ id: 'remaining', file: 'remaining.json' });
  options.documents['providers/remaining.json'] = { name: 'Remaining', icons: [] };
  options.publish();
  sync(options);
  fs.unlinkSync(path.join(options.source, 'providers/example.json'));
  const snapshot = sync(options);
  assert.equal(fs.existsSync(path.join(options.destination, 'catalog/example.json')), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.destination, 'catalog/index.json'), 'utf8')),
    [{ id: 'remaining', file: 'remaining.json' }]);
  assert.deepEqual(sync({ ...options, check: true }), snapshot);
  const before = fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8');
  fs.writeFileSync(path.join(options.source, 'providers/remaining.json'), '{"name":"Edited","icons":[]}');
  assert.throws(() => sync({ ...options, check: true }), /Stale snapshot manifest/);
  assert.equal(fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8'), before);
  sync(options);
  assert.equal(JSON.parse(fs.readFileSync(path.join(options.destination, 'catalog/remaining.json'), 'utf8')).name, 'Edited');
  sync({ ...options, check: true });
});

test('source edits refresh local data and obsolete snapshots are removed, not silently retained', (t) => {
  const options = fixture(t);
  sync(options);
  const obsolete = path.join(options.destination, 'catalog/pricing/obsolete.json');
  fs.writeFileSync(obsolete, '{}');
  assert.throws(() => sync({ ...options, check: true }), /Obsolete/);
  options.documents['pricing/providers/example.json']['example/model'].pricing.input = '0.003';
  options.publish();
  assert.throws(() => sync({ ...options, check: true }), /Stale/);
  sync(options);
  assert.equal(fs.existsSync(obsolete), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(options.destination, 'catalog/pricing/example.json'), 'utf8'))['example/model'].pricing.input, '0.003');
});

test('unsafe upstream paths and duplicate manifest entries are rejected', (t) => {
  const options = fixture(t);
  const file = path.join(options.source, 'index.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.files.push(manifest.files[0]);
  fs.writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => sync(options), /Duplicate upstream/);
  manifest.files = [{ file: '../outside.json', sha256: '0'.repeat(64) }];
  fs.writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => sync(options), /Unsafe/);
});
