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

test('mixed revisions and malformed indexes fail before touching snapshots', (t) => {
  const options = fixture(t);
  sync(options);
  const before = fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8');
  fs.writeFileSync(path.join(options.source, 'models/providers/zai.json'), '{"data":[]}');
  assert.throws(() => sync(options), /Stale or mixed/);
  assert.equal(fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8'), before);
  options.documents['providers/index.json'].push({ id: 'example', file: 'example.json' });
  options.publish();
  assert.throws(() => sync(options), /Duplicate provider/);
  assert.equal(fs.readFileSync(path.join(options.destination, 'metadata.snapshot.json'), 'utf8'), before);
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
