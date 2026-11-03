# Shared provider catalog

Provider display metadata, models, and pricing are maintained in the independent
[providers repository](../../../../../../aihappey-providers/metadata/README.md).
The local [catalog directory](catalog), [schema](provider.schema.json), and
[snapshot manifest](metadata.snapshot.json) are generated build-time snapshots,
not independently editable sources. Static imports keep existing browser/bundler
behavior without runtime filesystem reads or metadata HTTP requests.

## External-client contract

1. Read the canonical [provider index](../../../../../../aihappey-providers/metadata/providers/index.json), a JSON array of objects containing
   an [id](catalog/index.json:3) and a [file](catalog/index.json:4).
2. Read each referenced JSON file relative to the catalog directory.
3. Use the index ID as the stable provider identifier, and the JSON object as its
   metadata. Preserve index order if the application needs the same order as chat.
4. Fetch/copy the index and files from the **same Git revision**. Pin a commit or
   tag when reproducibility matters; do not combine files from different revisions.
5. Do not infer IDs from filenames or display names. For example, the registry ID
   for [302ai.json](catalog/302ai.json) is **ai302**, not **302ai**.

The display index is explicit rather than a directory listing. The separate
[dataset manifest](../../../../../../aihappey-providers/metadata/index.json)
also inventories models, pricing, and nested variants. External clients consume
these raw files directly from providers, not from chat. Node.js, TypeScript,
generated imports, and the chat application are not required. Display metadata
uses the unchanged draft-07 JSON Schema, synchronized locally for validation.

Optional properties remain absent when not supplied. Empty arrays, booleans,
descriptions, URLs, country/category values, and array ordering are preserved.
No values are normalized or renamed during migration. Adding/removing schema
fields is a contract change: review other clients before changing their meaning.

### Icons

JSON contains the original **explicit provider icons**, including light/dark theme
variants in their original order. Some providers do not define icons.

Chat applies its existing [fallback rule](providerIcons.ts:15): when explicit icons
are absent or empty and a homepage exists, generate one Google favicon URL for that
homepage. Otherwise, leave icons unchanged. An external client can use its own
fallback, or reproduce the same rule: URL-encode the complete homepage as a query
value and use

```text
https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=<encoded-homepage>&size=128
```

Generated fallback URLs are runtime behavior, not persisted metadata. There is no
network fetch involved in loading the catalog or constructing a fallback URL.

### Executable handlers

JSON never contains code. Eight providers retain cost/usage metadata handlers in
the separate [gateway adapter](gatewayMetadata.ts) and its [handler modules](gatewayMetadata).
Those handlers are attached to the JSON-backed provider registry at runtime and
still use the unchanged pricing helper/catalogs where applicable. External clients
are not required to execute or port these chat-specific handlers.

## Editing and adding providers

- Edit canonical JSON/schema in providers, then regenerate its dataset manifest.
  Do not edit chat's JSON snapshots or generated TypeScript imports.
- To add a provider, add a JSON file and one index entry with a unique, stable ID
  and local filename, at the desired position. To remove it, remove both.
- Keep provider JSON strict: no comments, trailing commas, duplicate properties,
  executable fields, or unknown schema fields.
- The generator rejects duplicate IDs/files, invalid metadata, missing referenced
  files, and unindexed top-level provider JSON files.
- If the metadata schema changes, keep it aligned with the shared
  [Provider type](../../../../aihappey-types/src/index.ts:77) and add regression coverage.

From the repository root:

```sh
npm run generate:providers --workspace aihappey-core
npm run check:providers --workspace aihappey-core
node --test scripts/provider-metadata-sync.test.cjs scripts/provider-catalog-regression.test.cjs scripts/aether-provider-regression.test.cjs scripts/provider-settings-regression.test.cjs
npm run build --workspace aihappey-core
```

Commit refreshed snapshots, their hash manifest, and regenerated
[catalog.generated.ts](catalog.generated.ts) together. A sibling providers checkout
is the default source; an explicit metadata-root override is supported by the
[synchronizer](../../../scripts/sync-provider-metadata.cjs). Source files and the
upstream manifest must agree before any local snapshot is changed. Obsolete local
JSON files are removed. An absent checkout permits hash-validated offline
development; package creation requires the source and checks generated imports
before compiling. Other release automation should run the synchronizer's strict
source-required check before building. No new npm package is introduced.
The existing [registry export](providers.ts:10) and
[compatibility export](providerMetadata.ts:7) continue to work unchanged.

Core build and watch startup synchronize metadata and run the generators
automatically. During a running watch session, rerun generation (or restart watch)
after changing canonical upstream JSON. Chat's model/pricing snapshots now use
the relocated AI data, so model coverage and prices can differ from its former
local copies. Existing routing, cost/usage handlers, pricing algorithms, provider
request configuration, defaults, and settings UI remain chat-owned and unchanged.
