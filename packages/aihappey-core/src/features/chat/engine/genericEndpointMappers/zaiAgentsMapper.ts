import {
  compactObject,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
} from "./types";
import { mapUiMessages } from "./uiMessageParts";

const ZAI_PROVIDER_KEY = "zai";
const AGENT_MODEL_PREFIX = "agents/";

const AGENT_CUSTOM_VARIABLE_KEYS = [
  "source_lang",
  "target_lang",
  "glossary",
  "strategy",
  "strategy_config",
  "template",
] as const;

const stripZaiProviderPrefix = (model?: string) => {
  const value = String(model ?? "").trim();
  return value.toLowerCase().startsWith(`${ZAI_PROVIDER_KEY}/`)
    ? value.slice(`${ZAI_PROVIDER_KEY}/`.length)
    : value;
};

export const resolveZaiAgentId = (model?: string, providerRequestConfig?: Record<string, any>) => {
  const configuredAgentId = typeof providerRequestConfig?.agent_id === "string"
    ? providerRequestConfig.agent_id.trim()
    : "";
  if (configuredAgentId) return configuredAgentId;

  const localModel = stripZaiProviderPrefix(model);
  return localModel.toLowerCase().startsWith(AGENT_MODEL_PREFIX)
    ? localModel.slice(AGENT_MODEL_PREFIX.length).trim()
    : localModel;
};

const toZaiAgentContent = (message: ReturnType<typeof mapUiMessages>[number]) => {
  const contentParts: any[] = [];
  if (message.text) contentParts.push({ type: "text", text: message.text });

  message.fileParts.forEach((file) => {
    const imageUrl = file.dataUrl ?? file.url;
    if (file.mimeType.startsWith("image/") && imageUrl) {
      contentParts.push({ type: "image_url", image_url: imageUrl });
    }
  });

  return contentParts;
};

const toZaiAgentMessages = (body: GenericChatEndpointRequestBody) => {
  const mapped = mapUiMessages(body.messages);
  const userMessages = mapped
    .filter((message) => message.role === "user")
    .map((message) => compactObject({
      role: "user",
      content: toZaiAgentContent(message),
    }))
    .filter((message) => Array.isArray(message.content) && message.content.length > 0);

  if (userMessages.length > 0) return userMessages;

  const fallbackText = mapped
    .map((message) => message.nonReasoningTextParts.join("\n\n").trim() || message.text)
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return fallbackText
    ? [{ role: "user", content: [{ type: "text", text: fallbackText }] }]
    : [];
};

const buildCustomVariables = (providerRequestConfig?: Record<string, any>) => {
  const existing = providerRequestConfig?.custom_variables;
  const customVariables = existing && typeof existing === "object" && !Array.isArray(existing)
    ? { ...existing }
    : {};

  for (const key of AGENT_CUSTOM_VARIABLE_KEYS) {
    if (providerRequestConfig?.[key] !== undefined && customVariables[key] === undefined) {
      customVariables[key] = providerRequestConfig[key];
    }
  }

  return Object.keys(customVariables).length ? customVariables : undefined;
};

export const buildZaiAgentsBody = (body: GenericChatEndpointRequestBody) => {
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/agents",
  });
  const agentId = resolveZaiAgentId(body.model, providerRequestConfig);
  const messages = toZaiAgentMessages(body);
  const customVariables = buildCustomVariables(providerRequestConfig);

  const passthroughConfig = { ...(providerRequestConfig ?? {}) };
  delete passthroughConfig.agent_id;
  delete passthroughConfig.custom_variables;
  for (const key of AGENT_CUSTOM_VARIABLE_KEYS) delete passthroughConfig[key];

  return compactObject({
    ...passthroughConfig,
    agent_id: agentId,
    messages,
    ...(agentId === "general_translation" || agentId === "slides_glm_agent" ? { stream: true } : {}),
    custom_variables: customVariables,
  });
};

