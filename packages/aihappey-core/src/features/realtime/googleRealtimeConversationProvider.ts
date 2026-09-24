import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge } from "./realtimeConversationConfig";
import { mcpToolToRealtimeFunctionTool, stripProviderPrefix } from "./realtimeMessageParts";
import { startGoogleRealtimeConversationWsSession } from "./startGoogleRealtimeConversationWs";
import { buildGoogleLiveSetup, buildGoogleLiveTokenPayload, normalizeGoogleLiveModel } from "./googleLiveConfig";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

const toGoogleFunctionDeclaration = (tool: any) => {
  const normalized = mcpToolToRealtimeFunctionTool(tool);
  return compactUndefined({
    name: normalized.name,
    description: normalized.description,
    parameters: normalized.parameters,
  });
};

export const buildGoogleRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeGoogle = (args.providerRealtimeConversationMetadata as any)?.google ?? {};
  const configured = realtimeGoogle?.liveConnectConstraints?.config ?? realtimeGoogle?.session ?? {};
  const functionDeclarations = (args.tools ?? []).map(toGoogleFunctionDeclaration);
  const configuredTools = Array.isArray(configured.tools) ? configured.tools : [];
  const tools = [
    ...configuredTools.filter((tool: any) => !Array.isArray(tool?.functionDeclarations)),
    ...(functionDeclarations.length && args.toolChoice !== "none" ? [{ functionDeclarations }] : []),
  ];

  const defaults = compactUndefined({
    responseModalities: ["AUDIO"],
    systemInstruction: args.instructions ? { parts: [{ text: args.instructions }] } : undefined,
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    tools: tools.length ? tools : undefined,
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: {},
  });

  const merged = deepMerge(defaults, configured);
  merged.responseModalities = ["AUDIO"];
  if (args.instructions) merged.systemInstruction = { parts: [{ text: args.instructions }] };
  if (tools.length) merged.tools = tools;
  return compactUndefined(merged);
};

const startGoogleRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders);
  const tokenClientFactory = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const googleMetadata = (args.providerRealtimeConversationMetadata as any)?.google ?? {};
  const model = normalizeGoogleLiveModel(args.model);
  const sessionConfig = buildGoogleRealtimeSessionConfig(args);
  const setup = buildGoogleLiveSetup(model, sessionConfig);
  const tokenPayload = buildGoogleLiveTokenPayload({
    modelId: model,
    config: sessionConfig,
    tokenConfig: googleMetadata,
  });

  return startGoogleRealtimeConversationWsSession({
    setup,
    cameraFrameRate: googleMetadata.cameraFrameRate,
    jpegQuality: googleMetadata.jpegQuality,
    getEphemeralToken: () => tokenClientFactory({
      model: args.model,
      providerOptions: { google: tokenPayload },
    }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

export const googleRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startGoogleRealtimeConversation,
};
