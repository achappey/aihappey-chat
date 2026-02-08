import { useMemo } from "react";
import { LocalToolsSettingsForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";
import { builtInCatalogLabels, mapLegacyDefaultCatalogSelection } from "../json-render/catalog";
import {
  builtInRegistryLabels,
  mapLegacyDefaultRegistrySelection,
} from "../json-render/ComponentRegistry";

const BUILTIN_CATALOG_IDS = ["app", "openapi", "adaptive-cards"];

function parseCommaList(value: string | undefined, all: string[]): string[] {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return all;

  const tokens = trimmed
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const includeAll = tokens.some((t) => t.toLowerCase() === "all");
  if (includeAll) return all;

  const allowed = tokens.filter((t) => all.includes(t));
  return allowed.length ? Array.from(new Set(allowed)) : all;
}

function normalizeSelectionToStore(value: string[], all: string[]): string | undefined {
  const uniq = Array.from(new Set((value ?? []).filter(Boolean)));
  // Semantics:
  // - empty => ALL (store undefined)
  // - selecting ALL items => ALL (store undefined)
  if (uniq.length === 0) return undefined;
  if (uniq.length === all.length) return undefined;
  return uniq.join(",");
}

export const AppsSettings = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { Text } = theme;

  const catalogs = useJsonRenderCatalog();
  const registryStore = useJsonRenderRegistry();

  // NOTE: RootState typing comes from built `aihappey-state` package.
  // When working in-repo without rebuilding, newly added fields may not exist in .d.ts yet.
  const defaultCatalogs = useAppStore((s) => (s as any).defaultCatalogs as string | undefined);
  const setDefaultCatalogs = useAppStore((s) => s.setDefaultCatalogs);

  const defaultRegistries = useAppStore((s) => (s as any).defaultRegistries as string | undefined);
  const setDefaultRegistries = useAppStore((s) => (s as any).setDefaultRegistries as (v?: string) => void);

  const catalogItems = useMemo(() => {
    const builtIns = BUILTIN_CATALOG_IDS.map((id) => ({
      id,
      label: builtInCatalogLabels[id as keyof typeof builtInCatalogLabels] ?? id,
    }));

    const stored = (catalogs.items ?? []).map((c) => ({
      id: c.name,
      label: c.name,
    }));

    return [...builtIns, ...stored].sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogs.items]);

  const allCatalogIds = useMemo(() => catalogItems.map((x) => x.id), [catalogItems]);
  const selectedCatalogIds = useMemo(
    () => parseCommaList(mapLegacyDefaultCatalogSelection(defaultCatalogs), allCatalogIds),
    [defaultCatalogs, allCatalogIds],
  );

  const registryItems = useMemo(() => {
    const ids = new Set<string>();
    ids.add("app");
    ids.add("openapi");
    ids.add("adaptive-cards");
    for (const item of registryStore.items ?? []) {
      if (item?.registryId) ids.add(item.registryId);
    }
    return Array.from(ids)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({
        id,
        label: builtInRegistryLabels[id as keyof typeof builtInRegistryLabels] ?? id,
      }));
  }, [registryStore.items]);

  const allRegistryIds = useMemo(() => registryItems.map((x) => x.id), [registryItems]);
  const selectedRegistryIds = useMemo(
    () => parseCommaList(mapLegacyDefaultRegistrySelection(defaultRegistries), allRegistryIds),
    [defaultRegistries, allRegistryIds],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Text>
        {t("settingsModal.appsHint") ??
          "Select which catalogs (prompt) and registries (runtime) are enabled for Apps. If you select none, all are enabled."}
      </Text>

      <LocalToolsSettingsForm
        formTitle={t("settingsModal.defaultCatalogs") ?? "Default catalogs"}
        items={catalogItems}
        value={selectedCatalogIds}
        onChange={(next) => {
          const normalized = normalizeSelectionToStore(next, allCatalogIds);
          setDefaultCatalogs(normalized);
        }}
        columns={2}
      />

      <LocalToolsSettingsForm
        formTitle={t("settingsModal.defaultRegistries") ?? "Default registries"}
        items={registryItems}
        value={selectedRegistryIds}
        onChange={(next) => {
          const normalized = normalizeSelectionToStore(next, allRegistryIds);
          setDefaultRegistries(normalized);
        }}
        columns={2}
      />
    </div>
  );
};

