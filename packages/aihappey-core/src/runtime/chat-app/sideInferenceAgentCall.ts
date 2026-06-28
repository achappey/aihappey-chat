import type { Agent, ModelOption, Provider } from "aihappey-types";
import {
  createChatAuthHeadersForModel,
  createProviderBearerHeadersForProviderKey,
  getProviderKeyFromModelId,
} from "../../features/provider-credentials/providerAuthHeaders";
import { resolveProviderRequestModelId } from "../../features/chat/engine/endpointProfiles";
import { sanitizeProviderRequestConfigForProvider } from "../providers/providerRequestConfig";
import { PROVIDERS } from "../providers/providerMetadata";

type SideInferenceFeature = "welcomeMessage" | "conversationName" | "explainToolCall";

export type SideInferenceAgentCallOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null | undefined>;
  customHeaders?: Record<string, string>;
  endpointProviderKey?: string;
  providers?: Record<string, Provider>;
  fetch?: typeof fetch;
  agents?: Agent[];
  models?: ModelOption[];
  agentName?: string;
  fallback?: string;
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

const resolveSideInferenceEndpoint = ({
  fallbackBaseUrl,
  providerKey,
  endpointProviderKey,
  providers,
}: {
  fallbackBaseUrl?: string;
  providerKey?: string;
  endpointProviderKey?: string;
  providers?: Record<string, Provider>;
}) => {
  if (!endpointProviderKey || !providerKey) {
    return {
      baseUrl: fallbackBaseUrl,
      providerKey: endpointProviderKey,
      directProviderRequest: false,
    };
  }

  const providerBaseUrl = providerRegistryOrDefault(providers)[providerKey]?.apiBaseUrl?.trim();
  if (!providerBaseUrl) {
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
  providers,
  fetch: customFetch,
  agents = [],
  models = [],
  agentName,
  fallback,
}: InvokeSideInferenceAgentArgs): Promise<string | undefined> => {
  try {
    const selectedAgent = agents.find((agent) => agent.name === agentName);
    if (!selectedAgent) throw new Error(`Side inference agent '${agentName}' not found`);

    const modelId = selectedAgent.model?.id;
    if (!modelId) throw new Error(`Side inference agent '${agentName}' has no model`);
    const selectedModelOption = models.find((model) => model.id === modelId);
    if (!selectedModelOption) {
      throw new Error(`Side inference agent model '${modelId}' is not available`);
    }

    const providerKey = (selectedModelOption as any).sourceProviderKey
      ?? (selectedModelOption as any).providerKey
      ?? getProviderKeyFromModelId(modelId);
    const endpoint = resolveSideInferenceEndpoint({
      fallbackBaseUrl: baseUrl,
      providerKey,
      endpointProviderKey,
      providers,
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
      ? (sanitizeProviderRequestConfigForProvider(asRecord(selectedAgent.model?.providerMetadata), requestProviderKey, {
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
      instructions: selectedAgent.instructions,
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
