# json-render v0.4.0 migration notes

## Spec structure (unchanged, but now enforced by schema)
Specs must follow the flat element tree schema:

```json
{
  "root": "card-1",
  "elements": {
    "card-1": {
      "key": "card-1",
      "type": "Card",
      "props": { "title": "Welcome" },
      "children": ["text-1"],
      "parentKey": ""
    },
    "text-1": {
      "key": "text-1",
      "type": "Text",
      "props": { "text": "Hello" },
      "children": [],
      "parentKey": "card-1"
    }
  }
}
```

### Required fields
- `root`: string key of the root element.
- `elements`: map of element keys to element objects.
- Each element includes `key`, `type`, `props`, `children` (array), and `parentKey` (empty string for root).

## Data binding paths
The updated `@json-render/react` schema uses JSON Pointer paths for dynamic data.

**Example (JSON Pointer):**

```json
{
  "type": "Metric",
  "props": {
    "label": "Revenue",
    "valuePath": "/metrics/revenue"
  }
}
```

If older specs use `$data.*` paths, migrate them to JSON Pointer (e.g. `$data.user.name` → `/user/name`).

## Catalog definitions
Component definitions now use `slots` instead of `hasChildren`:

```ts
{
  Card: {
    props: z.object({ title: z.string() }),
    slots: ["default"],
  }
}
```

When loading stored catalogs, `hasChildren: true` is mapped to `slots: ["default"]`.

## Renderer usage
The renderer now expects a `spec` prop instead of `tree`.

```tsx
<Renderer spec={spec} registry={registry} />
```

## Streaming (custom hook)
The custom `useUIStream` keeps auth/custom headers, but now returns `{ spec }` instead of `{ tree }`.

```ts
const { spec, send } = useUIStream({ api, catalogPrompt, model });
```
