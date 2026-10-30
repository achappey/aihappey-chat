const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
const target = path.resolve(root, '../aihappey-desktop/Core/AIHappey.Desktop.Core/Assets/FishAudio');
const sources = ['fishAudioSession.ts', 'fishAudioDesktopBridge.ts'].map(name => path.join(root, 'packages/aihappey-core/src/features/realtime', name));
const sdk = require('@fishaudio/agent-client/package.json');
fs.mkdirSync(target, { recursive: true });
buildSync({ entryPoints: [sources[1]], outfile: path.join(target, 'runtime.js'), bundle: true, minify: true,
  platform: 'browser', target: 'es2022', format: 'iife', legalComments: 'external' });
// Git may check text files out as CRLF on Windows. Hash their UTF-8/LF representation consistently.
const sha = value => crypto.createHash('sha256').update(value.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ sdk: sdk.version,
  sources: Object.fromEntries(sources.map(file => [path.basename(file), sha(fs.readFileSync(file))])),
  bundle: sha(fs.readFileSync(path.join(target, 'runtime.js'))) }, null, 2) + '\n');
console.log('Bundled Fish Audio transport-only runtime with SDK ' + sdk.version);
