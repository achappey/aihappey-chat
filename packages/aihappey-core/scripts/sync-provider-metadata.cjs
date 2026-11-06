const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const { parseJson } = require('./generate-provider-catalog.cjs');

const packageRoot = path.resolve(__dirname, '..');
const defaultSource = path.resolve(packageRoot, '../../../aihappey-providers/metadata');
const defaultDestination = path.join(packageRoot, 'src/runtime/providers');
const manifestName = 'metadata.snapshot.json';
const hash = (bytes) => crypto.createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const modelFiles = ['minimax.json', 'rebytemodels.json', 'zai.json'];

function safeFile(file) {
  assert.equal(typeof file, 'string');
  assert.match(file, /^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*\.json$/);
  assert.ok(!file.split('/').some((part) => part === '.' || part === '..'), `Unsafe metadata path: ${file}`);
  return file;
}

function destinationFor(file) {
  if (file === 'provider.schema.json') return file;
  if (/^providers\/[^/]+\.json$/.test(file)) return 'catalog/' + file.slice('providers/'.length);
  if (modelFiles.some((name) => file === 'models/providers/' + name)) return 'catalog/models/' + path.posix.basename(file);
  if (/^pricing\/providers\/[^/]+\.json$/.test(file)) return 'catalog/pricing/' + path.posix.basename(file);
}

function readJson(file) {
  return parseJson(fs.readFileSync(file, 'utf8'), file);
}

function managedFiles(destination) {
  const result = ['provider.schema.json'];
  for (const directory of ['catalog', 'catalog/models', 'catalog/pricing']) {
    const full = path.join(destination, directory);
    if (fs.existsSync(full)) result.push(...fs.readdirSync(full)
      .filter((file) => file.endsWith('.json')).map((file) => directory + '/' + file));
  }
  return result.sort(compare);
}

function validateFiles(entries, getBytes) {
  const byFile = new Map(entries.map((entry) => [entry.file, entry]));
  assert.equal(byFile.size, entries.length, 'Duplicate snapshot destination');
  const data = new Map();
  for (const entry of entries) {
    safeFile(entry.source);
    safeFile(entry.file);
    assert.equal(destinationFor(entry.source), entry.file, `Unexpected snapshot mapping: ${entry.source}`);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    const bytes = getBytes(entry);
    assert.equal(hash(bytes), entry.sha256, `Metadata hash mismatch: ${entry.file}`);
    data.set(entry.file, parseJson(bytes.toString('utf8'), entry.file));
  }
  for (const file of ['provider.schema.json', 'catalog/index.json', ...modelFiles.map((name) => 'catalog/models/' + name)])
    assert.ok(byFile.has(file), `Missing required snapshot file: ${file}`);
  const validate = new Ajv({ allErrors: true }).compile(data.get('provider.schema.json'));
  const index = data.get('catalog/index.json');
  assert.ok(Array.isArray(index) && index.length > 0, 'Empty provider index');
  const ids = new Set();
  const providerFiles = new Set(['catalog/index.json']);
  for (const entry of index) {
    assert.deepEqual(Object.keys(entry).sort(), ['file', 'id']);
    assert.match(entry.id, /^[A-Za-z][A-Za-z0-9]*$/);
    assert.notEqual(entry.id, '__proto__');
    assert.match(entry.file, /^[a-z0-9][a-z0-9-]*\.json$/);
    assert.ok(!ids.has(entry.id), `Duplicate provider ID: ${entry.id}`);
    const file = 'catalog/' + entry.file;
    assert.ok(!providerFiles.has(file), `Duplicate provider file: ${entry.file}`);
    ids.add(entry.id);
    providerFiles.add(file);
    assert.ok(byFile.has(file), `Missing provider: ${file}`);
    assert.ok(validate(data.get(file)), `Invalid provider metadata ${file}: ${JSON.stringify(validate.errors)}`);
  }
  assert.deepEqual(entries.filter(({ file }) => /^catalog\/[^/]+\.json$/.test(file)).map(({ file }) => file).sort(compare), [...providerFiles].sort(compare));
}

function sync({ source = process.env.AIHAPPEY_PROVIDER_METADATA_SOURCE || defaultSource,
  destination = defaultDestination, check = false, requireSource = false, warn = console.warn } = {}) {
  const target = path.join(destination, manifestName);
  if (!fs.existsSync(source)) {
    assert.ok(!requireSource, `Providers metadata checkout is required: ${source}`);
    const snapshot = readJson(target);
    assert.equal(snapshot.version, 1);
    validateFiles(snapshot.files, ({ file }) => fs.readFileSync(path.join(destination, safeFile(file))));
    assert.deepEqual(managedFiles(destination), snapshot.files.map(({ file }) => file).sort(compare), 'Unindexed or missing snapshot files');
    warn('Providers checkout is missing; using the validated offline metadata snapshot.');
    return snapshot;
  }

  // Validate the entire revision's inventory before changing any local asset.
  const upstream = readJson(path.join(source, 'index.json'));
  assert.equal(upstream.version, 1);
  assert.ok(Array.isArray(upstream.files) && upstream.files.length > 0);



  /*
  const seen = new Set();
  for (const entry of upstream.files) {
    safeFile(entry.file);
    assert.ok(!seen.has(entry.file), `Duplicate upstream file: ${entry.file}`);
    seen.add(entry.file);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    //assert.equal(hash(fs.readFileSync(path.join(source, entry.file))), entry.sha256, `Stale or mixed providers revision: ${entry.file}`);
  }
  const selected = upstream.files.filter(({ file }) => destinationFor(file)).map((entry) => ({
    source: entry.file, file: destinationFor(entry.file), 
    sha256: hash(fs.readFileSync(path.join(source, entry.file))),
  })).sort((a, b) => compare(a.file, b.file));
  const bytes = new Map(selected.map((entry) => [entry.file, fs.readFileSync(path.join(source, entry.source))]));
*/
  const seen = new Set();
  const isProviderFile = file =>
    /^providers\/(?!index\.json$)[^/]+\.json$/.test(file);
  const exists = file => fs.existsSync(path.join(source, file));

  for (const entry of upstream.files) {
    safeFile(entry.file);
    assert.ok(!seen.has(entry.file), `Duplicate upstream file: ${entry.file}`);
    seen.add(entry.file);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);

    // Deleted providers are allowed. Other missing files remain errors.
    assert.ok(
      exists(entry.file) || isProviderFile(entry.file),
      `Missing required metadata: ${entry.file}`
    );
  }

  const selected = upstream.files
    .filter(({ file }) => destinationFor(file) && exists(file))
    .map(entry => ({
      source: entry.file,
      file: destinationFor(entry.file),
      sha256: hash(fs.readFileSync(path.join(source, entry.file))),
    }))
    .sort((a, b) => compare(a.file, b.file));

  const bytes = new Map(
    selected.map(entry => [
      entry.file,
      fs.readFileSync(path.join(source, entry.source)),
    ])
  );

  // Remove deleted providers from the generated catalog index.
  const activeProviders = new Set(
    selected
      .filter(entry => isProviderFile(entry.source))
      .map(entry => path.posix.basename(entry.source))
  );

  const indexFile = 'catalog/index.json';
  const index = parseJson(bytes.get(indexFile).toString('utf8'), indexFile);
  const cleaned = index.filter(entry => activeProviders.has(entry.file));

  if (cleaned.length !== index.length) {
    const content = Buffer.from(JSON.stringify(cleaned, null, 2) + '\n');
    bytes.set(indexFile, content);
    selected.find(entry => entry.file === indexFile).sha256 = hash(content);
  }


  validateFiles(selected, ({ file }) => bytes.get(file));
  const snapshot = { version: 1, source: 'aihappey-providers/metadata', files: selected };
  const content = JSON.stringify(snapshot, null, 2) + '\n';
  const expected = new Set(selected.map(({ file }) => file));
  const obsolete = managedFiles(destination).filter((file) => !expected.has(file));
  if (check) {
    assert.equal(fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n'), content, 'Stale snapshot manifest; run generate:providers');
    assert.deepEqual(obsolete, [], 'Obsolete snapshot files');
    validateFiles(selected, ({ file }) => fs.readFileSync(path.join(destination, file)));
    return snapshot;
  }
  for (const { file, sha256 } of selected) {
    const output = path.join(destination, file);
    if (fs.existsSync(output) && hash(fs.readFileSync(output)) === sha256) continue;
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const temporary = output + '.' + crypto.randomUUID() + '.tmp';
    try { fs.writeFileSync(temporary, bytes.get(file)); fs.renameSync(temporary, output); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  for (const file of obsolete) fs.unlinkSync(path.join(destination, file));
  // Write the manifest last; interrupted updates fail validation rather than looking current.
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content) fs.writeFileSync(target, content);
  return snapshot;
}

module.exports = { sync, hash, destinationFor };
if (require.main === module) {
  const result = sync({ check: process.argv.includes('--check'), requireSource: process.argv.includes('--require-source') });
  console.log(`Providers metadata ${process.argv.includes('--check') ? 'checked' : 'synchronized'}: ${result.files.length} snapshot files.`);
}
