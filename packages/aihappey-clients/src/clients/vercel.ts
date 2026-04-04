import { createBackendProvider, generateText } from "aihappey-ai";
import type { ClientAdapter } from "../shared/types";
import { toCoreMessages } from "../shared/messages";

export const vercelClientAdapter: ClientAdapter = {
  id: "vercel-ai-sdk",
  label: "Vercel AI SDK",
  supportsEndpoint: (endpoint) => endpoint.id === "/v1/chat/completions" || endpoint.id === "/v1/responses",
  invoke: async ({ endpoint, request }) => {
    const provider = createBackendProvider(
      new URL(request.baseUrl).hostname,
      request.baseUrl + "/v1",
      request.headers,
      request.getAccessToken,
    );

    const model = endpoint.id === "/v1/responses"
      ? provider.responses(request.model)
      : provider.chat(request.model);

    const raw = await generateText({
      model,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      providerOptions: request.providerMetadata,
      messages: toCoreMessages(request.messages),
      tools: {},
    } as any);

    return {
      text: raw.text ?? "",
      raw,
      inspection: {
        url: request.baseUrl + "/v1",
        method: "SDK",
        requestBody: {
          endpoint: endpoint.id,
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          providerMetadata: request.providerMetadata,
        },
        responseBody: raw,
      },
    };
  },
};

