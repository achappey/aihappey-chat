import { listMcpSkills, mcpSkillId, supportsSkills, validateMcpSkillEntry } from "aihappey-mcp";
import type { ConnectedMcpSkill } from "aihappey-mcp";

type SkillClient = Parameters<typeof listMcpSkills>[0];
type SkillState = {
  enableMcpSkills: boolean;
  mcpSkills: Record<string, ConnectedMcpSkill[]>;
  mcpSkillErrors: Record<string, string>;
  enabledSkillIds: string[];
  seenMcpSkillIds: string[];
};

/** A controller per store keeps disabled/replaced discovery from publishing stale results. */
export function createMcpSkillDiscovery(
  get: () => SkillState,
  set: (update: (state: SkillState) => Partial<SkillState>) => void,
  clients: Map<string, SkillClient>,
) {
  const pending = new Map<string, AbortController>();

  const cancel = () => {
    pending.forEach(controller => controller.abort());
    pending.clear();
  };

  const refresh = async (serverKey: string, client: SkillClient) => {
    if (get().enableMcpSkills === false || clients.get(serverKey) !== client || !supportsSkills(client)) return;
    pending.get(serverKey)?.abort();
    const controller = new AbortController();
    pending.set(serverKey, controller);
    const isActive = () => !controller.signal.aborted && get().enableMcpSkills !== false
      && clients.get(serverKey) === client && pending.get(serverKey) === controller;
    try {
      const entries = await listMcpSkills(client, { signal: controller.signal, isActive });
      if (!isActive()) return;
      const discovered = entries.filter(validateMcpSkillEntry).map(entry => ({
        serverKey, skillId: mcpSkillId(serverKey, entry.uri), entry,
      }));
      set(state => ({
        mcpSkills: { ...state.mcpSkills, [serverKey]: discovered },
        enabledSkillIds: Array.from(new Set([
          ...state.enabledSkillIds,
          ...discovered.filter(skill => !state.seenMcpSkillIds.includes(skill.skillId)).map(skill => skill.skillId),
        ])),
        seenMcpSkillIds: Array.from(new Set([...state.seenMcpSkillIds, ...discovered.map(skill => skill.skillId)])),
        mcpSkillErrors: Object.fromEntries(Object.entries(state.mcpSkillErrors).filter(([key]) => key !== serverKey)),
      }));
    } catch (error) {
      if (isActive()) set(state => ({
        mcpSkills: { ...state.mcpSkills, [serverKey]: [] },
        mcpSkillErrors: { ...state.mcpSkillErrors, [serverKey]: error instanceof Error ? error.message : String(error) },
      }));
    } finally {
      if (pending.get(serverKey) === controller) pending.delete(serverKey);
    }
  };

  return { cancel, refresh };
}
