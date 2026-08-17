import { useCallback, useMemo } from "react";
import { useSkills, type StoredSkillFile } from "aihappey-skills";
import {
  readRuntimePluginSkill,
  usePlugins,
  type RuntimePluginSkill,
} from "aihappey-plugins";
import { useAppStore } from "aihappey-state";

export type RuntimeSkillCatalogItem = {
  skillId: string;
  name: string;
  description: string;
  origin: "local" | "remote" | "plugin";
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

  const enabled = useMemo(() => {
    const selected = new Set(enabledSkillIds ?? []);
    return [
      ...standaloneCatalog.filter((skill) => selected.has(skill.skillId)),
      ...pluginCatalog,
    ];
  }, [enabledSkillIds, pluginCatalog, standaloneCatalog]);

  const searchable = useMemo(
    () => [...standaloneCatalog, ...pluginCatalog],
    [pluginCatalog, standaloneCatalog],
  );

  const read = useCallback(async (skillId: string): Promise<RuntimeSkillContent | undefined> => {
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
  }, [plugins.enabled, skills, standaloneCatalog]);

  return { enabled, searchable, read, plugins: plugins.enabled };
}
