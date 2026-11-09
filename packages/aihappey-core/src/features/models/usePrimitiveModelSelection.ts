import { useCallback, useEffect, useRef, useState } from "react";
import { store, useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { decideFavorite, favoriteRouterModel } from "../chat/engine/favoriteRouter";

/** Page-local candidate selection. A decision never replaces the user's candidate set. */
export function usePrimitiveModelSelection(type: "image" | "video" | "speech", initialModel: string | string[]) {
  const { config } = useChatContext();
  const models = useAppStore(s => s.models);
  const loaded = useAppStore(s => s.modelsLoaded);
  const decisionModel = useAppStore(s => favoriteRouterModel(s, "model"));
  const defaults = Array.isArray(initialModel) ? initialModel : initialModel ? [initialModel] : [];
  const defaultsKey = JSON.stringify(defaults);
  const explicitSelection = useRef(false);
  const [ids, setIds] = useState<string[]>(() => defaults);
  const [processing, setProcessing] = useState(false);
  const active = useRef<AbortController | undefined>(undefined);
  const current = useRef({ ids, config });
  current.current = { ids, config };
  const multiselect = loaded && !!decisionModel && config.gatewayEnabled !== false;

  useEffect(() => {
    if (!loaded) return;
    setIds(previous => {
      const candidates = explicitSelection.current ? previous : defaults;
      let next = (multiselect ? candidates : candidates.slice(0, 1))
        .filter(id => models?.some(m => m.id === id && m.type === type));
      if (!next.length) {
        const fallback = (models ?? []).filter(m => m.type === type)
          .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
        if (fallback) next = [fallback.id];
      }
      return next.join("\0") === previous.join("\0") ? previous : next;
    });
  }, [loaded, models, type, multiselect, defaultsKey]);

  useEffect(() => () => { active.current?.abort(); }, []);
  const setSelectedModel = useCallback((id: string) => {
    explicitSelection.current = true;
    setIds(id ? [id] : []);
  }, []);
  const setSelectedIds = (values: string[]) => { explicitSelection.current = true; setIds(values); };
  const onChange = (id: string) => {
    explicitSelection.current = true;
    if (!multiselect) return setSelectedModel(id);
    setIds(previous => previous.includes(id)
      ? previous.length > 1 ? previous.filter(value => value !== id) : previous
      : [...previous, id]);
  };

  const run = async <T,>(prompt: string, action: (modelId: string, signal: AbortSignal) => Promise<T>) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setProcessing(true);
    const state = store.getState();
    const selected = [...ids];
    // Object identity also catches account/catalog/configuration replacement while deciding.
    const unchanged = () => {
      const next = store.getState();
      return next.models === state.models && next.agents === state.agents
        && next.sideInferenceAgentNames === state.sideInferenceAgentNames
        && next.customHeaders === state.customHeaders && next.gatewayEnabled === state.gatewayEnabled
        && current.current.config === config && current.current.ids === ids;
    };
    const unsubscribe = store.subscribe(() => { if (!unchanged()) controller.abort(); });
    try {
      if (!selected.length || selected.some(id => !state.models?.some(m => m.id === id && m.type === type)))
        throw new Error("Select an available model for this operation.");
      const winner = selected.length === 1 ? selected[0] : await decideFavorite({
        state: { ...state, selectedChatModelIds: selected }, kind: "model", modelTypes: [type],
        messages: [{ role: "user", parts: [{ type: "text", text: prompt }] }],
        config, customHeaders: state.customHeaders, abortSignal: controller.signal,
      });
      controller.signal.throwIfAborted();
      if (!unchanged()) throw new Error("Model routing context changed. Please submit again.");
      return await action(winner, controller.signal);
    } finally {
      unsubscribe();
      if (active.current === controller) { active.current = undefined; setProcessing(false); }
    }
  };

  return {
    selectedModel: ids[0] ?? "", setSelectedModel, processing, run, isRunning: () => !!active.current,
    selectionProps: {
      values: ids, multiselect, onChange, onValuesChange: setSelectedIds,
      allowFavoriteRouter: true, disabled: processing,
    },
    singleModelSelected: ids.length === 1,
  };
}
