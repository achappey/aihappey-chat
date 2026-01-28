import React from "react";
import { compileRuntimeComponent, validateComponentCode } from "aihappey-json-render-registry";
import { useTheme } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * Dev/regression sanity check for local registry validation.
 *
 * Run after building:
 * - `npm run check:local-registry-validation`
 */
export function runLocalRegistryValidationSelfCheck(): void {
  // 1) Forbidden token check (the production failure shown in the UI was: Forbidden token: \bFunction\b)
  {
    const code = "(props, ctx) => React.createElement('div', null, Function('return 1')())";
    const result = validateComponentCode(code);
    assert(result.ok === false, "Expected validateComponentCode to reject forbidden token Function");
    assert(
      result.errors.some((e) => e.includes("Forbidden token:")),
      "Expected validation errors to include Forbidden token",
    );
  }

  // 2) "must evaluate to function" check
  {
    const runtime = { React } as any;
    let threw = false;
    try {
      compileRuntimeComponent("123", runtime);
    } catch (e) {
      threw = true;
    }
    assert(threw, "Expected compileRuntimeComponent to throw when code is not a function expression");
  }

  // 3) Minimal valid component
  {
    const runtime = { React } as any;
    const code = "(props, ctx) => React.createElement('div', null, 'ok')";
    const Component = compileRuntimeComponent(code, runtime, { name: "SelfCheck" });
    assert(typeof Component === "function", "Expected compileRuntimeComponent to return a component");
  }

  // 4) Optional runtime bindings: useTheme + useDarkMode
  // (ensures the host app can expose theme helpers to runtime components/actions)
  {
    const runtime = { React, useTheme, useDarkMode } as any;
    const code =
      "(props, ctx) => { const t = useTheme(); const { isDarkMode } = useDarkMode(); return React.createElement('div', null, String(!!t) + ':' + String(!!isDarkMode)); }";
    const Component = compileRuntimeComponent(code, runtime, { name: "SelfCheckThemeBindings" });
    assert(typeof Component === "function", "Expected themed runtime component to compile");
  }
}


