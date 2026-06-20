import type { Agent } from "aihappey-types";
import { cloneAgents, ensureDefaultAgents } from "./slices/defaultAgents";

export type AppStoreConfig = {
  defaultAgents?: Agent[];
};

let appStoreConfig: Required<AppStoreConfig> = {
  defaultAgents: [],
};

export const getAppStoreConfig = (): Required<AppStoreConfig> => ({
  defaultAgents: cloneAgents(appStoreConfig.defaultAgents),
});

export const getConfiguredDefaultAgents = (): Agent[] =>
  cloneAgents(appStoreConfig.defaultAgents);

export const setAppStoreConfig = (config: AppStoreConfig = {}) => {
  const previousConfig = getAppStoreConfig();

  appStoreConfig = {
    defaultAgents: ensureDefaultAgents([], config.defaultAgents ?? []),
  };

  return {
    previousConfig,
    nextConfig: getAppStoreConfig(),
  };
};

export const areAgentsEqual = (left: Agent[] = [], right: Agent[] = []) =>
  JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
