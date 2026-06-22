import type { Agent, ModelOption } from "aihappey-types";
import { createChatAuthHeadersForModel, getProviderKeyFromModelId } from "../../features/provider-credentials/providerAuthHeaders";

type SideInferenceFeature = "welcomeMessage" | "conversationName" | "explainToolCall";

export type SideInferenceAgentCallOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null | undefined>;
  customHeaders?: Record<string, string>;
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

const toInputText = (input: string | Record<string, any>) =>
  typeof input === "string" ? input : JSON.stringify(input, null, 2);

export const invokeSideInferenceAgent = async ({
  feature,
  input,
  baseUrl,
  getAccessToken,
  customHeaders = {},
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
    if (!models.some((model) => model.id === modelId)) {
      throw new Error(`Side inference agent model '${modelId}' is not available`);
    }

    const url = endpointUrl(baseUrl);
    if (!url) throw new Error("Inference endpoint is not configured");

    const accessToken = await getAccessToken?.().catch(() => undefined);
    const providerKey: any = getProviderKeyFromModelId(modelId);
    const apiKeyHeaders = createChatAuthHeadersForModel(customHeaders, modelId, Boolean(accessToken));
    const doFetch = customFetch ?? globalThis.fetch;

    const providerMetadata = selectedAgent.model?.providerMetadata
      ? { [providerKey]: selectedAgent.model.providerMetadata }
      : undefined;

    const body = compactObject({
      model: modelId,
      instructions: selectedAgent.instructions,
      input: toInputText(input),
      stream: false,
      providerMetadata,
      metadata: {
        sideInferenceFeature: feature,
        agentName: selectedAgent.name,
      },
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
