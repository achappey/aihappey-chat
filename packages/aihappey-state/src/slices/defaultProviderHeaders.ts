// First-run and explicit reset defaults. Existing installations are pinned during migration.
export const defaultProviderHeaders: Record<string, Record<string, string>> = {
  anthropic: { "anthropic-version": "2026-10-21" },
};

