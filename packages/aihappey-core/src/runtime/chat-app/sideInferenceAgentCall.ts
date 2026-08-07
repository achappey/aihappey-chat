import type { Agent, ModelOption, Provider } from "aihappey-types";
import {
  createChatAuthHeadersForModel,
  createProviderBearerHeadersForProviderKey,
  getExactProviderApiKeyHeaderEntry,
  getProviderKeyFromModelId,
} from "../../features/provider-credentials/providerAuthHeaders";
import { resolveProviderRequestModelId } from "../../features/chat/engine/endpointProfiles";
import { isGenericChatEndpoint } from "../../features/chat/engine/genericChatEndpoint";
import { sanitizeProviderRequestConfigForProvider } from "../providers/providerRequestConfig";
import { PROVIDERS } from "../providers/providerMetadata";

type SideInferenceFeature = "welcomeMessage" | "conversationName" | "explainToolCall" | "toolSearch";

export type SideInferenceAgentCallOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null | undefined>;
  customHeaders?: Record<string, string>;
  endpointProviderKey?: string;
  gatewayEnabled?: boolean;
  providers?: Record<string, Provider>;
  fetch?: typeof fetch;
  agents?: Agent[];
  models?: ModelOption[];
  agentName?: string;
  fallback?: string;
  /** Model used when the configured app agent is absent. */
  fallbackModelId?: string;
  /** Instructions used by the plain Responses fallback when the configured app agent is absent. */
  fallbackInstructions?: string;
};

type InvokeSideInferenceAgentArgs = SideInferenceAgentCallOptions & {
  feature: SideInferenceFeature;
  input: string | Record<string, any>;
};

const compactObject = <T extends Record<string, any>>(value: T): T => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === undefined || entry === null) return false;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return Object.keys(entry).length > 0;
    }
    return true;
  })
) as T;

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

const extractText = (response: any): string => {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const responseOutputText = (response?.output ?? [])
    .filter((item: any) => item?.type === "message")
    .flatMap((item: any) => item?.content ?? [])
    .filter((item: any) => item?.type === "output_text" || item?.type === "text")
    .map((item: any) => item?.text ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (responseOutputText) return responseOutputText;

  const contentText = (response?.content ?? [])
    .filter((item: any) => item?.type !== "reasoning_text")
    .map((item: any) => item?.text ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (contentText) return contentText;

  const choiceContent = response?.choices?.[0]?.message?.content;

  if (typeof choiceContent === "string") return choiceContent.trim();

  if (Array.isArray(choiceContent)) {
    return choiceContent
      .filter((item: any) => item?.type !== "reasoning_text")
      .map((item: any) => item?.text ?? item?.content ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  return "";
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const endpointUrl = (baseUrl?: string) => {
  if (!baseUrl) return undefined;
  return `${baseUrl.replace(/\/$/, "")}/v1/responses`;
};

const providerRegistryOrDefault = (providers?: Record<string, Provider>) => providers ?? PROVIDERS;

const toGenericChatEndpointIds = (values?: string[]) =>
  (values ?? []).filter(isGenericChatEndpoint);

const hasDirectProviderSupport = (provider?: Provider) =>
  !!provider?.apiBaseUrl?.trim() && toGenericChatEndpointIds(provider.chatEndpoints).length > 0;

const findGatewayModelOption = (models: ModelOption[], modelId: string) =>
  models.find((model) => model.id === modelId && (model as any).route !== "direct");

const findDirectModelOption = (models: ModelOption[], modelId: string, providerKey?: string) =>
  models.find((model) =>
    (model as any).route === "direct"
    && (
      model.id === modelId
      || (model as any).displayId === modelId
      || (model as any).providerModelId === modelId
    )
    && (!providerKey || ((model as any).sourceProviderKey ?? (model as any).providerKey) === providerKey),
  );

const resolveSideInferenceEndpoint = ({
  fallbackBaseUrl,
  providerKey,
  endpointProviderKey,
  providers,
  customHeaders,
}: {
  fallbackBaseUrl?: string;
  providerKey?: string;
  endpointProviderKey?: string;
  providers?: Record<string, Provider>;
  customHeaders?: Record<string, string>;
}) => {
  if (!providerKey) {
    return {
      baseUrl: fallbackBaseUrl,
      providerKey: endpointProviderKey,
      directProviderRequest: false,
    };
  }

  const provider = providerRegistryOrDefault(providers)[providerKey];
  const providerBaseUrl = provider?.apiBaseUrl?.trim();
  const hasProviderApiKey = !!getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers)?.[1]?.trim();
  if (!hasDirectProviderSupport(provider) || !providerBaseUrl || !hasProviderApiKey) {
    return {
      baseUrl: fallbackBaseUrl,
      providerKey: endpointProviderKey,
      directProviderRequest: false,
    };
  }

  return {
    baseUrl: providerBaseUrl,
    providerKey,
    directProviderRequest: true,
  };
};

const toInputText = (input: string | Record<string, any>) =>
  typeof input === "string" ? input : JSON.stringify(input, null, 2);

export const invokeSideInferenceAgent = async ({
  feature,
  input,
  baseUrl,
  getAccessToken,
  customHeaders = {},
  endpointProviderKey,
  gatewayEnabled = true,
  providers,
  fetch: customFetch,
  agents = [],
  models = [],
  agentName,
  fallback,
  fallbackModelId,
  fallbackInstructions,
}: InvokeSideInferenceAgentArgs): Promise<string | undefined> => {
  try {
    const selectedAgent = agents.find((agent) => agent.name === agentName);
    const modelId = selectedAgent?.model?.id ?? fallbackModelId;
    if (!modelId) throw new Error(`Side inference agent '${agentName}' has no model`);
    const exactGatewayModelOption = findGatewayModelOption(models, modelId);
    const selectedModelOption = gatewayEnabled
      ? exactGatewayModelOption ?? findDirectModelOption(models, modelId, getProviderKeyFromModelId(modelId))
      : findDirectModelOption(models, modelId, getProviderKeyFromModelId(modelId)) ?? exactGatewayModelOption;
    if (!selectedModelOption) {
      throw new Error(`Side inference agent model '${modelId}' is not available`);
    }

    const providerKey = (selectedModelOption as any).sourceProviderKey
      ?? (selectedModelOption as any).providerKey
      ?? getProviderKeyFromModelId(modelId);
    const shouldUseGateway = gatewayEnabled && !!exactGatewayModelOption;
    const endpoint = shouldUseGateway
      ? {
        baseUrl,
        providerKey: endpointProviderKey,
        directProviderRequest: false,
      }
      : resolveSideInferenceEndpoint({
        fallbackBaseUrl: baseUrl,
        providerKey,
        endpointProviderKey,
        providers,
        customHeaders,
      });
    const url = endpointUrl(endpoint.baseUrl);
    if (!url) throw new Error("Inference endpoint is not configured");

    const accessToken = await getAccessToken?.().catch(() => undefined);
    const doFetch = customFetch ?? globalThis.fetch;

    const isDirectProviderRequest = endpoint.directProviderRequest;
    const requestProviderKey = endpoint.providerKey;
    const apiKeyHeaders = isDirectProviderRequest
      ? createProviderBearerHeadersForProviderKey(customHeaders, requestProviderKey, providers)
      : createChatAuthHeadersForModel(customHeaders, modelId, Boolean(accessToken), providers);
    const directProviderRequestConfig = isDirectProviderRequest
      ? (sanitizeProviderRequestConfigForProvider(asRecord(selectedAgent?.model?.providerMetadata), requestProviderKey, {
        endpointId: "/v1/responses",
      }) ?? {})
      : {};
    const requestModel = isDirectProviderRequest
      ? resolveProviderRequestModelId({
        modelId,
        providerKey: requestProviderKey,
        model: selectedModelOption,
      })
      : modelId;

    const body = compactObject({
      ...directProviderRequestConfig,
      model: requestModel,
      instructions: selectedAgent?.instructions ?? fallbackInstructions,
      input: toInputText(input),
      stream: false,
    });

    const response = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...apiKeyHeaders,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(
        typeof responseBody === "string"
          ? responseBody
          : `Side inference agent failed (${response.status})`
      );
    }

    return extractText(responseBody) || fallback;
  } catch (error) {
    console.warn(`[SIDE-INFERENCE:${feature}] Falling back.`, error);
    return fallback;
  }
};
