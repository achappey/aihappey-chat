# Shared provider catalog

Provider metadata is maintained as **one JSON file per provider** in the existing
[catalog directory](catalog). The [ordered index](catalog/index.json) is the entry
point for chat and external clients. There is no second, hand-maintained TypeScript
copy of the metadata.

## External-client contract

1. Read [catalog/index.json](catalog/index.json), a JSON array of objects containing
   an [id](catalog/index.json:3) and a [file](catalog/index.json:4).
2. Read each referenced JSON file relative to the catalog directory.
3. Use the index ID as the stable provider identifier, and the JSON object as its
   metadata. Preserve index order if the application needs the same order as chat.
4. Fetch/copy the index and files from the **same Git revision**. Pin a commit or
   tag when reproducibility matters; do not combine files from different revisions.
5. Do not infer IDs from filenames or display names. For example, the registry ID
   for [302ai.json](catalog/302ai.json) is **ai302**, not **302ai**.

The index is explicit rather than a directory listing: pricing and model catalogs
remain in their own subdirectories and are not provider metadata. External clients
need only the index and its referenced JSON files; Node.js, TypeScript, generated
imports, and the chat application are not required. The metadata format is defined
by [provider.schema.json](provider.schema.json), a draft-07 JSON Schema.

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

- Edit the provider JSON directly. Do not edit generated TypeScript imports.
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
node --test scripts/provider-catalog-migration.test.cjs scripts/provider-catalog-regression.test.cjs scripts/aether-provider-regression.test.cjs scripts/provider-settings-regression.test.cjs
npm run build --workspace aihappey-core
```

Commit the JSON, index, and regenerated [catalog.generated.ts](catalog.generated.ts)
together. Generated imports contain no metadata literals; JSON is the source of
truth. Imports are static so existing TypeScript and browser bundlers can resolve
them without a backend, runtime filesystem access, or additional HTTP requests.
The existing [registry export](providers.ts:10) and
[compatibility export](providerMetadata.ts:7) continue to work unchanged.

Core build and watch startup run the generator automatically. During a running
watch session, existing JSON edits are watched by TypeScript; after adding/removing
or reordering index entries, rerun generation (or restart watch).