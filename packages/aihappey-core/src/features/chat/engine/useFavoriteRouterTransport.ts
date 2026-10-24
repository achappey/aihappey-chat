import { useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { singleChatModelId, store } from "aihappey-state";
import type { DefaultChatTransport } from "aihappey-ai";
import type { FileItem, FileStore } from "aihappey-files";
import { useChatContext } from "../context/ChatContext";
import { withOpenAiKnownSpeakerReferences } from "../../transcriptions/knownSpeakersProviderMetadata";
import { chatModelCandidateIds, decideFavorite, favoriteRouterCandidates, favoriteRouterInstructions, favoriteRouterModel, modelRouterCandidates, favoriteRouterContext, isNewFavoriteRouterTurn, replaceRoutedRequestBody } from "./favoriteRouter";

type Transport = Pick<DefaultChatTransport<any>, "sendMessages" | "reconnectToStream">;

export function useFavoriteRouterTransport(
  transport: Transport,
  body: any,
  getDecisionMessages?: (messages: any[]) => any[],
  files?: FileStore & { items?: FileItem[] },
) {
  const { config } = useChatContext();
  const current = useRef({ transport, body, config, getDecisionMessages, files });
  current.current = { transport, body, config, getDecisionMessages, files };
  const deciding = useRef<AbortController | null>(null);
  useEffect(() => () => {
    deciding.current?.abort();
    store.setState({ favoriteRouterDeciding: false });
  }, []);

  return useMemo<Transport>(() => {
    let pinned: { transport: Transport; body: any; routed: boolean } | undefined;
    return {
      async sendMessages(options) {
        if (deciding.current) throw new Error("A favorite routing decision is already in progress.");
        let state = store.getState();
        let manualFallback = false;
        if (isNewFavoriteRouterTurn(options)) {
          const assignments = state.sideInferenceAgentNames;
          if (assignments?.selectModelAgent === "" && state.selectedChatModelIds !== undefined) {
            flushSync(() => state.setSelectedModel(singleChatModelId(state)));
            manualFallback = true;
          }
          if (assignments?.selectFavoriteAgent === "" && state.favoriteAgentRouter) {
            flushSync(() => store.setState({ favoriteAgentRouter: false }));
          }
          state = store.getState();
        }
        const kind = state.chatMode === "agent" ? "agent" : "model";
        const enabled = kind === "agent" ? state.favoriteAgentRouter
          : chatModelCandidateIds(state).length > 1;
        if (isNewFavoriteRouterTurn(options)) {
          if (kind === "model" && state.selectedChatModelIds !== undefined
            && (!chatModelCandidateIds(state).length
              || modelRouterCandidates(state).length !== chatModelCandidateIds(state).length)) {
            throw new Error("Select at least one available chat model before sending.");
          }
          if (enabled) {
            const controller = new AbortController();
            deciding.current = controller;
            const abort = () => controller.abort();
            options.abortSignal?.addEventListener("abort", abort, { once: true });
            if (options.abortSignal?.aborted) abort();
            const requestConfig = current.current.config;
            const decisionMessages = () => current.current.getDecisionMessages?.(options.messages) ?? options.messages;
            const requestConfigMatches = () => {
              const latest = current.current.config;
              return latest.baseUrl === requestConfig.baseUrl && latest.gatewayEnabled === requestConfig.gatewayEnabled
                && latest.endpoints.decisions === requestConfig.endpoints.decisions
                && latest.getAccessToken === requestConfig.getAccessToken && latest.fetch === requestConfig.fetch
                && JSON.stringify(latest.headers) === JSON.stringify(requestConfig.headers);
            };
            const signature = () => {
              const latest = store.getState();
              return JSON.stringify({
                kind: latest.chatMode, selectedChatModelIds: latest.selectedChatModelIds, agentRouter: latest.favoriteAgentRouter,
                decisionModel: favoriteRouterModel(latest, kind), models: latest.models,
                candidates: kind === "model" ? modelRouterCandidates(latest) : favoriteRouterCandidates(latest, kind),
                instructions: favoriteRouterInstructions(latest, kind),
                selectedModel: latest.selectedModel, selectedAgents: latest.selectedAgentNames,
                endpoint: [latest.selectedEndpointProfileId, latest.selectedBaseUrl, latest.effectiveChatEndpoint],
                customHeaders: latest.customHeaders,
                context: favoriteRouterContext(decisionMessages()),
              });
            };
            const before = signature();
            store.setState({ favoriteRouterDeciding: true });
            try {
              const winner = await decideFavorite({
                state, kind, messages: decisionMessages(), config: requestConfig,
                customHeaders: state.customHeaders, abortSignal: controller.signal,
              });
              if (before !== signature() || !requestConfigMatches()) {
                throw new Error("Favorite routing context or configuration changed. Please send the request again.");
              }
              controller.signal.throwIfAborted();
              // Both transport/auth and the request body must render with the real winner before dispatch.
              flushSync(() => {
                if (kind === "model") store.setState({ selectedModel: winner });
                else store.getState().setSelectedAgents([winner]);
              });
              const selected = current.current;
              const selectedSignature = signature();
              let routedBody = selected.body;
              const winnerModel = store.getState().models?.find(model => model.id === winner);
              const knownSpeakerNames = routedBody.providerMetadata?.openai?.known_speaker_names;
              if (kind === "model" && winnerModel?.type === "transcription" && winner.startsWith("openai/")
                && selected.files && knownSpeakerNames?.length) {
                const items = selected.files.items?.length ? selected.files.items : await selected.files.list();
                const providerMetadata = await withOpenAiKnownSpeakerReferences(routedBody.providerMetadata, {
                  items, files: selected.files, knownSpeakerNames,
                });
                routedBody = { ...routedBody, providerMetadata };
              }
              controller.signal.throwIfAborted();
              if (signature() !== selectedSignature || !requestConfigMatches()) {
                throw new Error("Favorite routing context or configuration changed. Please send the request again.");
              }
              pinned = { transport: selected.transport, body: routedBody, routed: true };
            } finally {
              options.abortSignal?.removeEventListener("abort", abort);
              deciding.current = null;
              store.setState({ favoriteRouterDeciding: false });
            }
          }
          if (!enabled) pinned = manualFallback ? { ...current.current, routed: true } : undefined;
        }
        const target = pinned ?? { ...current.current, routed: false };
        return target.transport.sendMessages({
          ...options,
          body: target.routed ? replaceRoutedRequestBody(options.body, target.body) : options.body,
        });
      },
      reconnectToStream(options) {
        return (pinned?.transport ?? current.current.transport).reconnectToStream(options);
      },
    };
  }, []);
}
