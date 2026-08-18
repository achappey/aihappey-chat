import { get, set } from "idb-keyval";
import { createStoredPlugin, exportPluginArchive, parsePluginArchive } from "../package";
import type { PluginCatalogItem, PluginDraft, PluginImportResult, PluginStore, StoredPlugin } from "../types";

const DB_KEY = "aihappey_plugins_v1";

async function loadPlugins(): Promise<StoredPlugin[]> {
  if (typeof window === "undefined") return [];
  return ((await get(DB_KEY)) as StoredPlugin[] | undefined) ?? [];
}

async function savePlugins(items: StoredPlugin[]) {
  if (typeof window !== "undefined") await set(DB_KEY, items);
}

function catalogItem(plugin: StoredPlugin): PluginCatalogItem {
  const servers = Object.values(plugin.mcp?.mcpServers ?? {});
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.manifest.description ?? "",
    version: plugin.manifest.version,
    author: plugin.manifest.author,
    homepage: plugin.manifest.homepage,
    repository: plugin.manifest.repository,
    keywords: plugin.manifest.keywords ?? [],
    skillCount: plugin.skills.filter((skill) => skill.valid).length,
    mcpServerCount: servers.length,
    unsupportedServerCount: servers.filter((server) => server.type !== "streamable-http").length,
    diagnosticCount: plugin.diagnostics.length,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt,
  };
}

export class IndexedDBPluginStore implements PluginStore {
  readonly kind = "indexeddb" as const;
  private data: StoredPlugin[] = [];
  private loaded = false;

  private ensureLoaded = async () => {
    if (!this.loaded) {
      this.data = await loadPlugins();
      this.loaded = true;
    }
  };

  list = async () => {
    await this.ensureLoaded();
    return this.data.map(catalogItem).sort((a, b) => a.name.localeCompare(b.name));
  };

  read = async (id: string) => {
    await this.ensureLoaded();
    return this.data.find((plugin) => plugin.id === id || plugin.name === id);
  };

  create = async (draft: PluginDraft) => {
    await this.ensureLoaded();
    if (this.data.some((plugin) => plugin.name === draft.manifest.name)) throw new Error(`Plugin '${draft.manifest.name}' already exists.`);
    const plugin = await createStoredPlugin(draft);
    this.data = [...this.data, plugin];
    await savePlugins(this.data);
    return plugin;
  };

  update = async (id: string, draft: PluginDraft) => {
    await this.ensureLoaded();
    const current = this.data.find((plugin) => plugin.id === id || plugin.name === id);
    if (!current) throw new Error(`Plugin '${id}' was not found.`);
    const plugin = await createStoredPlugin(draft, current);
    this.data = this.data.map((item) => item.id === current.id ? plugin : item);
    await savePlugins(this.data);
    return plugin;
  };

  delete = async (id: string) => {
    await this.ensureLoaded();
    this.data = this.data.filter((plugin) => plugin.id !== id && plugin.name !== id);
    await savePlugins(this.data);
  };

  importArchive = async (file: Blob): Promise<PluginImportResult> => {
    await this.ensureLoaded();
    const result = await parsePluginArchive(file);
    const imported: StoredPlugin[] = [];
    const diagnostics = [...result.diagnostics];
    const names = new Set(this.data.map((plugin) => plugin.name));
    for (const plugin of result.imported) {
      if (names.has(plugin.name)) {
        diagnostics.push({
          severity: "error",
          boundary: "plugin",
          code: "plugin-already-exists",
          message: `Plugin '${plugin.name}' already exists.`,
          entry: plugin.name,
        });
        continue;
      }
      names.add(plugin.name);
      imported.push(plugin);
    }
    if (imported.length) {
      this.data = [...this.data, ...imported];
      await savePlugins(this.data);
    }
    return { imported, diagnostics };
  };

  exportArchive = async (id: string) => {
    const plugin = await this.read(id);
    return plugin ? exportPluginArchive(plugin) : undefined;
  };
}
