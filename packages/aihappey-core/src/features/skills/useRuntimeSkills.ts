import { useCallback, useMemo } from "react";
import { useSkills, type StoredSkillFile } from "aihappey-skills";
import {
  readRuntimePluginSkill,
  usePlugins,
  type RuntimePluginSkill,
} from "aihappey-plugins";
import { store, useAppStore } from "aihappey-state";
import { connectedMcpSkills, readConnectedSkillFile, skillResourcePaths } from "./connectedMcpSkills";
import type { ConnectedMcpSkill } from "aihappey-mcp";

export type RuntimeSkillCatalogItem = {
  skillId: string;
  name: string;
  description: string;
  origin: "local" | "remote" | "plugin" | "mcp";
  serverKey?: string;
  uri?: string;
  version?: string;
  defaultVersion?: string;
  latestVersion?: string;
  downloadedVersion?: string;
  isDownloaded?: boolean;
  pluginId?: string;
  pluginName?: string;
};

export type RuntimeSkillContent = RuntimeSkillCatalogItem & {
  body: string;
  files: StoredSkillFile[];
};

const pluginCatalogItem = (skill: RuntimePluginSkill, version?: string): RuntimeSkillCatalogItem => ({
  skillId: skill.skillId,
  name: skill.name,
  description: skill.description,
  origin: "plugin",
  version,
  defaultVersion: version,
  latestVersion: version,
  isDownloaded: true,
  pluginId: skill.pluginId,
  pluginName: skill.pluginName,
});

export function useRuntimeSkills() {
  const skills = useSkills();
  const plugins = usePlugins();
  const enabledSkillIds = useAppStore((state) => state.enabledSkillIds);
  const mcpSkills = useAppStore((state) => state.mcpSkills);
  const liveMcpSkills = useMemo(() => connectedMcpSkills(mcpSkills), [mcpSkills]);

  const standaloneCatalog = useMemo<RuntimeSkillCatalogItem[]>(() =>
    (skills.items ?? []).map((skill) => ({
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      origin: skill.origin,
      version: skill.version,
      defaultVersion: skill.defaultVersion,
      latestVersion: skill.latestVersion,
      downloadedVersion: skill.downloadedVersion,
      isDownloaded: skill.isDownloaded,
    })), [skills.items]);

  const pluginCatalog = useMemo<RuntimeSkillCatalogItem[]>(() =>
    plugins.enabled.flatMap((plugin) => plugin.skills.map((skill) => pluginCatalogItem(skill, plugin.version))),
  [plugins.enabled]);

  const mcpCatalog = useMemo<RuntimeSkillCatalogItem[]>(() => liveMcpSkills.map((skill) => ({
    skillId: skill.skillId,
    name: skill.entry.frontmatter.name,
    description: skill.entry.frontmatter.description,
    origin: "mcp",
    serverKey: skill.serverKey,
    uri: skill.entry.uri,
    isDownloaded: false,
  })), [liveMcpSkills]);

  const enabled = useMemo(() => {
    const selected = new Set(enabledSkillIds ?? []);
    return [
      ...standaloneCatalog.filter((skill) => selected.has(skill.skillId)),
      ...pluginCatalog,
      ...mcpCatalog.filter((skill) => selected.has(skill.skillId)),
    ];
  }, [enabledSkillIds, pluginCatalog, standaloneCatalog, mcpCatalog]);

  const searchable = useMemo(
    () => [...standaloneCatalog, ...pluginCatalog, ...mcpCatalog],
    [pluginCatalog, standaloneCatalog, mcpCatalog],
  );

  const read = useCallback(async (skillId: string): Promise<RuntimeSkillContent | undefined> => {
    const mcp = liveMcpSkills.find((item) => item.skillId === skillId);
    if (mcp) {
      const body = await (await readConnectedSkillFile(mcp, mcp.entry.uri)).text();
      if (store.getState().enableMcpSkills === false) throw new Error("MCP Skills are disabled in settings");
      return { ...mcpCatalog.find((item) => item.skillId === skillId)!, body, files: [] };
    }
    const plugin = plugins.enabled.find((item) => item.skills.some((skill) => skill.skillId === skillId));
    if (plugin) {
      const content = await readRuntimePluginSkill(plugin, skillId);
      return content ? { ...content, origin: "plugin", version: plugin.version } : undefined;
    }

    const descriptor = standaloneCatalog.find((item) => item.skillId === skillId);
    if (!descriptor) return undefined;
    let stored = await skills.read(skillId);
    if (!stored) stored = await skills.ensureDownloaded(skillId);
    if (!stored) return undefined;
    return {
      ...descriptor,
      name: stored.name,
      description: stored.description,
      body: stored.body,
      files: stored.files,
    };
  }, [plugins.enabled, skills, standaloneCatalog, liveMcpSkills, mcpCatalog]);

  return { enabled, searchable, read, plugins: plugins.enabled, mcpSkills: liveMcpSkills };
}
