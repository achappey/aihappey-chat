import { Chat } from 'aihappey-ai';
import { ManagedAgentChatTransport } from '../chat/engine/ManagedAgentChatTransport';
import { buildSelectedAgentRequest } from '../agents/agentSelection';
import { buildRealtimeBackendHeaders } from './realtimeConversationConfig';
import { createCredentialScopedFetch } from '../provider-credentials/scopedRequest';
import type { ChatConfig } from '../chat/context/ChatContext';
import type { UIMessage } from 'aihappey-types';
import { completeLiveToolCalls } from './completeLiveToolCalls';
import type { RealtimeToolDecision, RealtimeToolReview } from './useRealtimeToolApprovals';

/** Ordinary inference, deliberately separate from the Live provider and its wire serializers. */
export async function runLiveClientDelegation(args: {
  config: ChatConfig; state: any; messages: UIMessage[]; signal: AbortSignal;
  execute: (item: any, signal: AbortSignal) => Promise<any>;
  review: (tool: RealtimeToolReview, signal: AbortSignal) => Promise<RealtimeToolDecision>;
  onMessage?: (message: UIMessage) => Promise<void>;
}) {
  const { config, state, signal } = args;
  const target = state.liveClientTarget;
  if (!target?.id) throw new Error('Select a client delegation agent or chat model in Live settings.');
  const agent = target.kind === 'agent';
  const selection = agent ? buildSelectedAgentRequest([target.id], state.agents ?? [], state.remoteAgentModels ?? []) : undefined;
  if (agent && !selection?.requestAgents.length && !selection?.models.length) throw new Error('The selected client agent is no longer available.');
  const headers = agent ? { ...config.headers } : await buildRealtimeBackendHeaders(config, state.customHeaders, target.id);
  if (agent) {
    const token = await config.getAgentAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const body = {
    ...(agent ? { agents: selection!.requestAgents, models: selection!.models } : { model: target.id }),
    tools: state.tools ?? [], toolChoice: state.toolChoice, maxOutputTokens: state.maxOutputTokens,
    providerMetadata: state.providerMetadata, providerHeaders: state.providerHeaders,
  };
  const chat = new Chat<any>({ id: crypto.randomUUID(), messages: args.messages as any,
    transport: new ManagedAgentChatTransport({ api: (agent ? config.agentEndpoint ?? config.baseUrl : config.baseUrl) + config.endpoints.chat, headers, body, fetch: createCredentialScopedFetch(config.fetch) }),
  });
  const abort = () => { void chat.stop(); };
  signal.addEventListener('abort', abort, { once: true });
  const executed = new Map<string, unknown>();
  try {
    for (let step = 0; step < (state.maxToolCalls ?? 50) + 1; step++) {
      signal.throwIfAborted();
      await chat.sendMessage();
      signal.throwIfAborted();
      if (chat.error) throw chat.error;
      const last = chat.messages.at(-1);
      if (last?.role === 'assistant') await args.onMessage?.(last);
      if (!await completeLiveToolCalls({ chat, executed, signal, execute: args.execute, review: args.review,
        changed: async () => { const message = chat.messages.at(-1); if (message?.role === 'assistant') await args.onMessage?.(message); },
      }))
        return (last?.parts ?? []).filter((part: any) => part.type === 'text').map((part: any) => part.text).join('\n');
    }
    throw new Error('Client delegation tool limit reached.');
  } finally { signal.removeEventListener('abort', abort); await chat.stop(); }
}
