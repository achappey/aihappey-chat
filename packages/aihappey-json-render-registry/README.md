# aihappey-json-render-registry

Runtime registry storage for json-render components.

## Overview

This package stores custom json-render component definitions (runtime code strings) and exposes helpers to compile them into React components and merge with your default registry. Components are grouped by a required `registryId` so you can build bundle-specific registries.

## Usage

Wrap the app with the provider:

```tsx
import { JsonRenderRegistryProvider } from "aihappey-json-render-registry";

<JsonRenderRegistryProvider>
  {children}
</JsonRenderRegistryProvider>
```

Compile and merge:

```ts
import {
  buildRuntimeRegistry,
  mergeComponentRegistries,
} from "aihappey-json-render-registry";

const { registry: runtimeRegistry } = buildRuntimeRegistryForId(items, runtime, "app");
const combined = mergeComponentRegistries(defaultRegistry, runtimeRegistry);
```

Runtime registry items must include a `registryId` (bundle identifier). Runtime component code is expected to be a function expression, for example:

```js
(props) => {
  const [value, setValue] = useDataBinding("/form/email");
  return React.createElement("input", {
    value: value ?? "",
    onChange: (e) => setValue(e.target.value),
  });
}
```
