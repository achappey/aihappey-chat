import type { ReactNode } from "react";
import { docsInlineCodeStyle, type DocsEndpointDoc, type DocsHomeCard, type DocsNavSection, type DocsTopNavItem } from "aihappey-docs-components";
import { getDocsContent } from "./docsContent";

const inlineCode = (value: string) => <code style={docsInlineCodeStyle}>{value}</code>;
const t = getDocsContent;

export const docsTopNavItems: DocsTopNavItem[] = [
    { id: "home", label: "Home", href: "/" },
    { id: "gateway", label: "Gateway", href: "/gateway" },
    { id: "agents", label: "Agents", href: "/agents" },
    { id: "chat", label: "Chat", href: "/chat" },
    {
        id: "model-context", label: "Model Context", href: "/model-context",
        items: [
            { id: "model-context-servers", label: "Servers", href: "/model-context/servers" },
            { id: "model-context-registry", label: "Registry", href: "/model-context/registry" },
        ],
    },
];

export const docsHomeCards: DocsHomeCard[] = [
    {
        id: "gateway",
        title: "Gateway API",
        description: "OpenAI-compatible, Anthropic-compatible, and AI SDK routes for model, audio, and tool workflows.",
        href: "/gateway",
        icon: "▦",
    },
    {
        id: "agents",
        title: "Agent API",
        description: "Agent endpoints, runs, tools, memory, and orchestration docs with a separate reference navigation.",
        href: "/agents",
        icon: "◉",
    },
    {
        id: "examples",
        title: "Examples",
        description: "Reusable examples for frontend integrations, SDK snippets, and endpoint-specific request flows.",
        href: "/gateway/openai/speech",
        icon: "⌁",
    },
];

export const gatewayNavSections: DocsNavSection[] = [
    {
        id: "gateway-start",
        title: "API Reference",
        items: [
            { id: "gateway-overview", label: "Overview", href: "/gateway" },
            { id: "gateway-auth", label: "Authentication", href: "/gateway#authentication" },
            { id: "gateway-errors", label: "Errors", href: "/gateway#errors" },
        ],
    },
    {
        id: "openai-compatible",
        title: "OpenAI compatible",
        items: [
            { id: "openai-models", label: "Models", href: "/gateway/openai/models", badge: { label: "GET", method: "GET" } },
            { id: "openai-embeddings", label: "Embeddings", href: "/gateway/openai/embeddings", badge: { label: "POST", method: "POST" } },
            { id: "openai-chat", label: "Chat completions", href: "/gateway/openai/chat-completions", badge: { label: "POST", method: "POST" } },
            { id: "openai-responses", label: "Responses", href: "/gateway/openai/responses", badge: { label: "POST", method: "POST" } },
            { id: "openai-realtime", label: "Realtime", href: "/gateway/openai/realtime", badge: { label: "POST", method: "POST" } },
            { id: "openai-speech", label: "Speech", href: "/gateway/openai/speech", badge: { label: "POST", method: "POST" } },
            { id: "openai-transcriptions", label: "Transcriptions", href: "/gateway/openai/transcriptions", badge: { label: "POST", method: "POST" } },
            { id: "openai-create-image", label: "Create image", href: "/gateway/openai/create-image", badge: { label: "POST", method: "POST" } },
            { id: "openai-edit-image", label: "Edit image", href: "/gateway/openai/edit-image", badge: { label: "POST", method: "POST" } },
            { id: "openai-list-skills", label: "List skills", href: "/gateway/openai/list-skills", badge: { label: "GET", method: "GET" } },
            { id: "openai-download-skill", label: "Download skill", href: "/gateway/openai/download-skill", badge: { label: "GET", method: "GET" } },
            { id: "openai-list-skill-versions", label: "List skill versions", href: "/gateway/openai/list-skill-versions", badge: { label: "GET", method: "GET" } },
            { id: "openai-download-skill-version", label: "Download skill version", href: "/gateway/openai/download-skill-version", badge: { label: "GET", method: "GET" } },
        ],
    },
    {
        id: "anthropic-compatible",
        title: "Anthropic compatible",
        items: [
            { id: "anthropic-messages", label: "Messages", href: "/gateway/anthropic/messages", badge: { label: "POST", method: "POST" } }
        ],
    },
    {
        id: "ai-sdk",
        title: "AI SDK",
        items: [
            { id: "ai-chat", label: "Chat", href: "/gateway/ai/chat", badge: { label: "POST", method: "POST" } },
            { id: "ai-embeddings", label: "Embeddings", href: "/gateway/ai/embeddings", badge: { label: "POST", method: "POST" } },
            { id: "ai-images", label: "Images", href: "/gateway/ai/images", badge: { label: "POST", method: "POST" } },
            { id: "ai-rerank", label: "Rerank", href: "/gateway/ai/rerank", badge: { label: "POST", method: "POST" } },
            { id: "ai-speech", label: "Speech", href: "/gateway/ai/speech", badge: { label: "POST", method: "POST" } },
            { id: "ai-transcriptions", label: "Transcriptions", href: "/gateway/ai/transcriptions", badge: { label: "POST", method: "POST" } },
            { id: "ai-streaming-transcriptions", label: "Streaming transcriptions", href: "/gateway/ai/transcriptions/stream", badge: { label: "POST", method: "POST" } },
            { id: "ai-ui", label: "UI", href: "/gateway/ai/ui", badge: { label: "POST", method: "POST" } },
            { id: "ai-create-video-task", label: "Create video task", href: "/gateway/ai/videos/create", badge: { label: "POST", method: "POST" } },
            { id: "ai-get-video-task", label: "Get video task", href: "/gateway/ai/videos/get", badge: { label: "GET", method: "GET" } },
        ],
    },
];

export const agentNavSections: DocsNavSection[] = [
    {
        id: "agents-start",
        title: "API Reference",
        items: [
            { id: "agents-overview", label: "Overview", href: "/agents" },
            { id: "agents-auth", label: "Authentication", href: "/agents#authentication" },
        ],
    },
    {
        id: "agent-openai-compatible",
        title: "OpenAI compatible",
        items: [
            { id: "agents-openai-models", label: "Models", href: "/agents/openai/models", badge: { label: "GET", method: "GET" } },
            { id: "agents-openai-create-response", label: "Create response", href: "/agents/openai/responses/create", badge: { label: "POST", method: "POST" } },
            { id: "agents-openai-retrieve-response", label: "Retrieve response", href: "/agents/openai/responses/retrieve", badge: { label: "GET", method: "GET" } },
            { id: "agents-openai-delete-response", label: "Delete response", href: "/agents/openai/responses/delete", badge: { label: "DELETE", method: "DELETE" } },
            { id: "agents-openai-list-responses", label: "List responses", href: "/agents/openai/responses/list", badge: { label: "GET", method: "GET" } },
        ],
    },
    {
        id: "agent-ai-sdk",
        title: "AI SDK",
        items: [
            { id: "agents-ai-sdk-chat", label: "Chat", href: "/agents/ai/chat", badge: { label: "POST", method: "POST" } }
        ],
    },
];

export const chatNavSections: DocsNavSection[] = [
    {
        id: "chat-start",
        title: "",
        items: [
            { id: "chat-overview", label: "Overview", href: "/chat" },
            { id: "chat-agents", label: "Agents", href: "/chat/agents" },
            { id: "chat-conversations", label: "Conversations", href: "/chat/conversations" },
            { id: "chat-model-context", label: "Model Context", href: "/chat/model-context" },
            { id: "chat-skills", label: "Skills", href: "/chat/skills" },
            { id: "chat-plugins", label: "Plugins", href: "/chat/plugins" },
        ],
    },
];

export type AgentEndpoint = "models" | "create-response" | "retrieve-response" | "delete-response" | "list-responses" | "chat";

const agentResponseId = "resp_01hzyj8v5n9k6s3r2d4a";
const agentModelId = "ResearchAgent";

const agentModelsExample = `{
  "object": "list",
  "data": [{
    "id": "ResearchAgent",
    "object": "model",
    "owned_by": "aihappey",
    "name": "ResearchAgent",
    "description": "Research and summarize with configured tools.",
    "type": "agent",
    "agent": {
      "name": "ResearchAgent",
      "description": "Research and summarize with configured tools.",
      "instructions": "Research the request and cite sources.",
      "model": { "id": "openai/gpt-4.1-mini" }
    }
  }]
}`;

const agentResponseExample = `{
  "id": "${agentResponseId}",
  "object": "response",
  "status": "completed",
  "model": "${agentModelId}",
  "output": [{
    "type": "message",
    "role": "assistant",
    "content": [{ "type": "output_text", "text": "The agent completed the research task." }]
  }]
}`;

const agentCreateBody = {
    model: agentModelId,
    input: "Summarize the benefits of an agent runtime in two sentences.",
};

const agentChatBody = {
    id: "docs-agent-chat",
    workflowType: "sequential",
    agents: [{
        name: "ResearchAgent",
        description: "Research and summarize",
        instructions: "Be concise and cite sources when available.",
        model: { id: "openai/gpt-4.1-mini", options: { temperature: 0.2 } },
        mcpServers: {},
    }],
    messages: [{ id: "message-1", role: "user", parts: [{ type: "text", text: "Explain this agent runtime in one sentence." }] }],
};

export const createAgentEndpointDoc = (endpoint: AgentEndpoint, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const paths: Record<AgentEndpoint, string> = {
        models: "/v1/models",
        "create-response": "/v1/responses",
        "retrieve-response": "/v1/responses/{responseId}",
        "delete-response": "/v1/responses/{responseId}",
        "list-responses": "/v1/responses",
        chat: "/api/chat",
    };
    const methods: Record<AgentEndpoint, DocsEndpointDoc["method"]> = {
        models: "GET", "create-response": "POST", "retrieve-response": "GET",
        "delete-response": "DELETE", "list-responses": "GET", chat: "POST",
    };
    const key = endpoint.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const path = paths[endpoint];
    const livePath = path.replace("{responseId}", agentResponseId);
    const url = createApiUrl(apiBaseUrl, livePath);
    const isBodyEndpoint = endpoint === "create-response" || endpoint === "chat";
    const body = endpoint === "chat" ? agentChatBody : endpoint === "create-response" ? agentCreateBody : undefined;
    const responseType = endpoint === "chat" ? "text" : "json";
    const parameters = endpoint === "models" ? [
        { name: "X-*", type: "header", required: false, description: t("agents.endpoints.models.parameters.forwardedHeaders") },
    ] : endpoint === "create-response" ? [
        { name: "input", type: "string | array", required: true, description: t("agents.endpoints.createResponse.parameters.input") },
        { name: "model", type: "string", required: false, description: t("agents.endpoints.createResponse.parameters.model") },
        { name: "models", type: "array", required: false, description: t("agents.endpoints.createResponse.parameters.models") },
        { name: "metadata.agents", type: "array", required: false, description: t("agents.endpoints.createResponse.parameters.agents") },
        { name: "stream", type: "boolean", required: false, description: t("agents.endpoints.createResponse.parameters.stream") },
        { name: "background", type: "boolean", required: false, description: t("agents.endpoints.createResponse.parameters.background") },
    ] : endpoint === "retrieve-response" || endpoint === "delete-response" ? [
        { name: "responseId", type: "path", required: true, description: t(`agents.endpoints.${key}.parameters.responseId`) },
    ] : endpoint === "chat" ? [
        { name: "id", type: "string", required: true, description: t("agents.endpoints.chat.parameters.id") },
        { name: "messages", type: "array", required: true, description: t("agents.endpoints.chat.parameters.messages") },
        { name: "agents", type: "array", required: false, description: t("agents.endpoints.chat.parameters.agents") },
        { name: "model", type: "string", required: false, description: t("agents.endpoints.chat.parameters.model") },
        { name: "models", type: "array", required: false, description: t("agents.endpoints.chat.parameters.models") },
        { name: "workflowType", type: "string", required: false, description: t("agents.endpoints.chat.parameters.workflowType") },
        { name: "workflowFile", type: "string", required: false, description: t("agents.endpoints.chat.parameters.workflowFile") },
        { name: "workflowMetadata", type: "object", required: false, description: t("agents.endpoints.chat.parameters.workflowMetadata") },
    ] : [];
    const responseCode = endpoint === "delete-response"
        ? `{ "id": "${agentResponseId}", "object": "response", "deleted": true }`
        : endpoint === "list-responses" ? `{ "object": "list", "data": [] }`
        : endpoint === "models" ? agentModelsExample
        : endpoint === "chat" ? `data: {"type":"start","messageId":"message-1"}\n\ndata: {"type":"text-delta","id":"text-1","delta":"The agent runtime orchestrates agents and tools."}\n\ndata: {"type":"finish"}\n\ndata: [DONE]`
        : agentResponseExample;

    return {
        id: `agents-${endpoint}`,
        title: t(`agents.endpoints.${key}.title`),
        surface: t(`agents.endpoints.${key}.surface`),
        method: methods[endpoint], path, url,
        summary: t(`agents.endpoints.${key}.summary`),
        description: <p style={{ margin: 0 }}>{t(`agents.endpoints.${key}.description`)}</p>,
        auth: <p style={{ margin: 0 }}>{t("agents.common.auth")}</p>,
        parameters,
        test: {
            label: t(`agents.endpoints.${key}.testLabel`),
            modalTitle: t(`agents.endpoints.${key}.testModalTitle`),
            description: <p style={{ margin: 0 }}>{t(`agents.endpoints.${key}.testDescription`)}</p>,
            responseType,
            headers: [
                ...(isBodyEndpoint ? [{ name: "Content-Type", value: "application/json" }] : []),
                { name: "X-OpenAI-Key", value: "", placeholder: "Optional downstream provider key" },
            ],
            ...(body ? { body } : {}),
        },
        requestExamples: [
            {
                id: `typescript-agents-${endpoint}`, label: "TypeScript", language: "ts",
                code: `const response = await fetch("${url}", {\n  method: "${methods[endpoint]}",\n  headers: {${isBodyEndpoint ? '\n    "Content-Type": "application/json",' : ""}\n    "X-OpenAI-Key": openAiApiKey\n  }${body ? `,\n  body: JSON.stringify(${JSON.stringify(body, null, 2)})` : ""}\n});\n\n${responseType === "text" ? "const stream = response.body;" : "const result = await response.json();"}`,
            },
            {
                id: `curl-agents-${endpoint}`, label: responseType === "text" ? "cURL streaming" : "cURL", language: "bash",
                code: `curl${responseType === "text" ? " -N" : ""} -X ${methods[endpoint]} ${url} \\\n  -H "X-OpenAI-Key: $OPENAI_API_KEY"${isBodyEndpoint ? ' \\\n  -H "Content-Type: application/json"' : ""}${body ? ` \\\n  -d '${JSON.stringify(body, null, 2)}'` : ""}`,
            },
        ],
        responses: [{ status: "200", description: t(`agents.endpoints.${key}.responses.success`), example: { id: `agents-${endpoint}-response`, label: responseType === "text" ? "SSE" : "JSON", language: responseType === "text" ? "text" : "json", code: responseCode } }],
        errors: [
            ...(!["models", "list-responses"].includes(endpoint) ? [{ status: "400", description: t(`agents.endpoints.${key}.errors.badRequest`) }] : []),
            { status: "401", description: t("agents.common.errors.unauthorized") },
            ...(["retrieve-response", "delete-response"].includes(endpoint) ? [{ status: "404", description: t(`agents.endpoints.${key}.errors.notFound`) }] : []),
            ...(["create-response", "chat"].includes(endpoint) ? [{ status: "500", description: t(`agents.endpoints.${key}.errors.server`) }] : []),
        ],
        related: [
            { id: "agents-overview", label: t("agents.common.relatedOverview"), href: "/agents" },
            ...(endpoint === "create-response" ? [{ id: "agents-openai-retrieve-response", label: t("agents.endpoints.createResponse.relatedRetrieve"), href: "/agents/openai/responses/retrieve" }] : []),
        ],
    };
};

type SpeechSurface = "openai" | "ai-sdk";
type TranscriptionsSurface = "openai" | "ai-sdk";
type EmbeddingsSurface = "openai" | "ai-sdk";
type OpenAiImageEndpoint = "generation" | "edit";
export type VideoEndpoint = "create" | "get";
export type SkillEndpoint = "list" | "download" | "versions" | "download-version";

type CreateSpeechEndpointDocOptions = {
    apiBaseUrl?: string;
};

const fallbackApiBaseUrl = "http://localhost:3010";

const normalizeApiBaseUrl = (apiBaseUrl?: string) => {
    const trimmed = apiBaseUrl?.trim();
    if (!trimmed) return fallbackApiBaseUrl;
    return trimmed.replace(/\/+$/, "");
};

const createApiUrl = (apiBaseUrl: string, path: string) => `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;

const createOpenAiSpeechDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("speech.openai.descriptionPrefix")} {inlineCode("stream_format")} {t("speech.openai.descriptionMiddle")} {inlineCode("sse")}{t("speech.openai.descriptionSuffix")}
    </p>
);

const createAiSdkSpeechDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("speech.aiSdk.description")}
    </p>
);

const createSpeechAuth = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("speech.common.auth")}
    </p>
);

const createOpenAiSpeechParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("speech.openai.parameters.model") },
    { name: "input", type: "string", required: true, description: t("speech.openai.parameters.input") },
    { name: "voice", type: "string", required: true, description: t("speech.openai.parameters.voice") },
    { name: "response_format", type: "string", required: false, description: t("speech.openai.parameters.response_format") },
    { name: "instructions", type: "string", required: false, description: t("speech.openai.parameters.instructions") },
    { name: "speed", type: "number", required: false, description: t("speech.openai.parameters.speed") },
    { name: "stream_format", type: "string", required: false, description: t("speech.openai.parameters.stream_format") },
];

const createAiSdkSpeechParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("speech.aiSdk.parameters.model") },
    { name: "text", type: "string", required: true, description: t("speech.aiSdk.parameters.text") },
    { name: "voice", type: "string", required: false, description: t("speech.aiSdk.parameters.voice") },
    { name: "outputFormat", type: "string", required: false, description: t("speech.aiSdk.parameters.outputFormat") },
    { name: "instructions", type: "string", required: false, description: t("speech.aiSdk.parameters.instructions") },
    { name: "speed", type: "number", required: false, description: t("speech.aiSdk.parameters.speed") },
    { name: "language", type: "string", required: false, description: t("speech.aiSdk.parameters.language") },
    { name: "providerOptions", type: "object", required: false, description: t("speech.aiSdk.parameters.providerOptions") },
];

const aiSdkSpeechResponseExample = `{
  "providerMetadata": {
    "gateway": {
        "cost": 0.00123456789
    },
    "openai": {}
  },
  "audio": {
    "base64": "SUQzBAAAAAAA...",
    "mimeType": "audio/mpeg",
    "format": "mp3"
  },
  "warnings": [],
  "response": {
    "timestamp": "2026-07-14T13:20:00Z",
    "modelId": "openai/tts-1",
    "headers": {
        "Header-1": "Header-1-Value",
        "Header-2": "Header-2-Value"
    }
  },
  "request": {
    "body": {
      "model": "tts-1",
      "input": "Hallo daar, welkom bij aihappey docs.",
      "voice": "alloy"
    }
  }
}`;

const createOpenAiSpeechTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("speech.openai.testDescription")}
    </p>
);

const createAiSdkSpeechTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("speech.aiSdk.testDescription")}
    </p>
);

export const createSpeechEndpointDoc = (surface: SpeechSurface, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiSpeechUrl = createApiUrl(apiBaseUrl, "/v1/audio/speech");
    const aiSdkSpeechUrl = createApiUrl(apiBaseUrl, "/api/speech");

    if (surface === "openai") {
        return {
            id: "speech-openai",
            title: t("speech.openai.title"),
            surface: t("speech.openai.surface"),
            method: "POST",
            path: "/v1/audio/speech",
            url: openAiSpeechUrl,
            summary: t("speech.openai.summary"),
            description: createOpenAiSpeechDescription(t),
            auth: createSpeechAuth(t),
            parameters: createOpenAiSpeechParameters(t),
            test: {
                label: t("speech.openai.testLabel"),
                modalTitle: t("speech.openai.testModalTitle"),
                description: createOpenAiSpeechTestDescription(t),
                responseType: "audio",
                downloadFileName: "speech.mp3",
                headers: [
                    { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                    { name: "Content-Type", value: "application/json" },
                ],
                body: {
                    model: "openai/tts-1",
                    voice: "alloy",
                    input: "Hallo daar, welkom bij aihappey docs.",
                    response_format: "mp3",
                },
            },
            requestExamples: [
                {
                    id: "curl-openai-binary",
                    label: "cURL",
                    language: "bash",
                    code: `curl ${openAiSpeechUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  --output speech.mp3 \\
  -d '{
    "model": "openai/tts-1",
    "voice": "alloy",
    "input": "Hallo daar, welkom bij aihappey docs.",
    "response_format": "mp3"
  }'`,
                },
                {
                    id: "curl-openai-sse",
                    label: "cURL streaming",
                    language: "bash",
                    code: `curl ${openAiSpeechUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/tts-1",
    "voice": "alloy",
    "input": "Stream this as audio deltas.",
    "stream_format": "sse"
  }'`,
                },
            ],
            responses: [
                {
                    status: "200",
                    description: t("speech.openai.responses.binary"),
                    example: {
                        id: "openai-binary-response",
                        label: "Binary audio",
                        language: "http",
                        code: `HTTP/1.1 200 OK
Content-Type: audio/mpeg

<binary audio bytes>`,
                    },
                },
                {
                    status: "200",
                    description: t("speech.openai.responses.sse"),
                    example: {
                        id: "openai-sse-response",
                        label: "SSE",
                        language: "text",
                        code: `data: {"type":"speech.audio.delta","audio":"SUQzBAAAAAAA..."}

data: {"type":"speech.audio.done","usage":null}

data: [DONE]`,
                    },
                },
            ],
            errors: [
                { status: "400", description: t("speech.openai.errors.badRequest") },
                { status: "401", description: t("speech.openai.errors.unauthorized") },
                { status: "500", description: t("speech.openai.errors.providerFailed") },
            ],
            related: [
                { id: "gateway-overview", label: t("speech.common.relatedGatewayOverview"), href: "/gateway" },
                { id: "other-surface", label: t("speech.openai.relatedAiSdkSpeech"), href: "/gateway/ai/speech" },
            ],
        };
    }

    return {
        id: "speech-ai-sdk",
        title: t("speech.aiSdk.title"),
        surface: t("speech.aiSdk.surface"),
        method: "POST",
        path: "/api/speech",
        url: aiSdkSpeechUrl,
        summary: t("speech.aiSdk.summary"),
        description: createAiSdkSpeechDescription(t),
        auth: createSpeechAuth(t),
        parameters: createAiSdkSpeechParameters(t),
        test: {
            label: t("speech.aiSdk.testLabel"),
            modalTitle: t("speech.aiSdk.testModalTitle"),
            description: createAiSdkSpeechTestDescription(t),
            responseType: "auto",
            downloadFileName: "speech-response.bin",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "openai/tts-1",
                text: "Hallo daar, welkom bij aihappey docs.",
                voice: "alloy",
                outputFormat: "mp3",
            },
        },
        requestExamples: [
            {
                id: "typescript-ai-sdk",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${aiSdkSpeechUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/tts-1",
    text: "Hallo daar, welkom bij aihappey docs.",
    voice: "alloy",
    outputFormat: "mp3"
  }),
});

const speech = await response.json();`,
            },
            {
                id: "curl-ai-sdk",
                label: "cURL",
                language: "bash",
                code: `curl ${aiSdkSpeechUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/tts-1",
    "text": "Hallo daar, welkom bij aihappey docs.",
    "voice": "alloy",
    "outputFormat": "mp3"
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("speech.aiSdk.responses.json"),
                example: {
                    id: "ai-sdk-speech-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkSpeechResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("speech.aiSdk.errors.badRequest") },
            { status: "401", description: t("speech.aiSdk.errors.unauthorized") },
            { status: "429", description: t("speech.aiSdk.errors.rateLimited") },
        ],
        related: [
            { id: "gateway-overview", label: t("speech.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "other-surface", label: t("speech.aiSdk.relatedOpenAiSpeech"), href: "/gateway/openai/speech" },
        ],
    };
};

const createOpenAiTranscriptionsDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("transcriptions.openai.descriptionPrefix")} {inlineCode("multipart/form-data")} {t("transcriptions.openai.descriptionMiddle")} {inlineCode("stream")} {t("transcriptions.openai.descriptionSuffix")}
    </p>
);

const createAiSdkTranscriptionsDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("transcriptions.aiSdk.descriptionPrefix")} {inlineCode("audio")} {t("transcriptions.aiSdk.descriptionMiddle")} {inlineCode("mediaType")}{t("transcriptions.aiSdk.descriptionSuffix")}
    </p>
);

const createOpenAiResponsesDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("responses.openai.descriptionPrefix")} {inlineCode("input")} {t("responses.openai.descriptionMiddle")} {inlineCode("stream")} {t("responses.openai.descriptionSuffix")}
    </p>
);

const createOpenAiRealtimeDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("realtime.openai.descriptionPrefix")} {inlineCode("/v1/realtime/client_secrets")} {t("realtime.openai.descriptionMiddle")} {inlineCode("providerOptions")}{t("realtime.openai.descriptionSuffix")}
    </p>
);

const createOpenAiTranscriptionsParameters = (t: (key: string) => string) => [
    { name: "file", type: "file", required: true, description: t("transcriptions.openai.parameters.file") },
    { name: "model", type: "string", required: true, description: t("transcriptions.openai.parameters.model") },
    { name: "language", type: "string", required: false, description: t("transcriptions.openai.parameters.language") },
    { name: "prompt", type: "string", required: false, description: t("transcriptions.openai.parameters.prompt") },
    { name: "response_format", type: "string", required: false, description: t("transcriptions.openai.parameters.response_format") },
    { name: "temperature", type: "number", required: false, description: t("transcriptions.openai.parameters.temperature") },
    { name: "timestamp_granularities", type: "array", required: false, description: t("transcriptions.openai.parameters.timestamp_granularities") },
    { name: "stream", type: "boolean", required: false, description: t("transcriptions.openai.parameters.stream") },
    { name: "include", type: "array", required: false, description: t("transcriptions.openai.parameters.include") },
];

const createAiSdkTranscriptionsParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("transcriptions.aiSdk.parameters.model") },
    { name: "audio", type: "string", required: true, description: t("transcriptions.aiSdk.parameters.audio") },
    { name: "mediaType", type: "string", required: true, description: t("transcriptions.aiSdk.parameters.mediaType") },
    { name: "providerOptions", type: "object", required: false, description: t("transcriptions.aiSdk.parameters.providerOptions") },
];

const createOpenAiResponsesParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("responses.openai.parameters.model") },
    { name: "input", type: "string | array", required: true, description: t("responses.openai.parameters.input") },
    { name: "instructions", type: "string", required: false, description: t("responses.openai.parameters.instructions") },
    { name: "stream", type: "boolean", required: false, description: t("responses.openai.parameters.stream") },
    { name: "temperature", type: "number", required: false, description: t("responses.openai.parameters.temperature") },
    { name: "top_p", type: "number", required: false, description: t("responses.openai.parameters.top_p") },
    { name: "max_output_tokens", type: "number", required: false, description: t("responses.openai.parameters.max_output_tokens") },
    { name: "tools", type: "array", required: false, description: t("responses.openai.parameters.tools") },
    { name: "tool_choice", type: "string | object", required: false, description: t("responses.openai.parameters.tool_choice") },
    { name: "reasoning", type: "object", required: false, description: t("responses.openai.parameters.reasoning") },
    { name: "metadata", type: "object", required: false, description: t("responses.openai.parameters.metadata") },
];

const createOpenAiRealtimeParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("realtime.openai.parameters.model") },
    { name: "providerOptions", type: "object", required: false, description: t("realtime.openai.parameters.providerOptions") },
];

const aiSdkTranscriptionsResponseExample = `{
  "providerMetadata": {
    "gateway": {
      "cost": 0.00012345678
    },
    "openai": {}
  },
  "text": "Welcome to the aihappey transcription docs.",
  "language": "en",
  "durationInSeconds": 3.4,
  "warnings": [],
  "segments": [
    {
      "text": "Welcome to the aihappey transcription docs.",
      "startSecond": 0,
      "endSecond": 3.4
    }
  ],
  "response": {
    "timestamp": "2026-07-14T13:20:00Z",
    "modelId": "openai/whisper-1",
    "headers": {
      "Header-1": "Header-1-Value",
      "Header-2": "Header-2-Value"
    }
  }
}`;

const openAiTranscriptionsJsonResponseExample = `{
  "text": "Welcome to the aihappey transcription docs."
}`;

const openAiTranscriptionsVerboseResponseExample = `{
  "text": "Welcome to the aihappey transcription docs.",
  "language": "en",
  "duration": 3.4,
  "segments": [
    {
      "text": "Welcome to the aihappey transcription docs.",
      "start": 0,
      "end": 3.4
    }
  ]
}`;

const openAiResponsesResponseExample = `{
  "id": "resp_01hzyj8v5n9k6s3r2d4a",
  "object": "response",
  "created_at": 1784035200,
  "model": "gpt-4.1-mini",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "Use a bearer token on every request and choose provider-qualified model ids when routing through the gateway."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 24,
    "output_tokens": 22,
    "total_tokens": 46
  }
}`;

const openAiRealtimeResponseExample = `{
  "value": "ek_01hzyj8v5n9k6s3r2d4a",
  "expires_at": 1784038800,
  "providerMetadata": {
    "openai": {
      "session_id": "sess_01hzyj8v5n9k6s3r2d4a"
    }
  }
}`;

const createTranscriptionsTestDescription = (t: (key: string) => string, surface: TranscriptionsSurface): ReactNode => (
    <p style={{ margin: 0 }}>
        {t(surface === "openai" ? "transcriptions.openai.testDescription" : "transcriptions.aiSdk.testDescription")}
    </p>
);

const createResponsesTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("responses.openai.testDescription")}
    </p>
);

const createRealtimeTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("realtime.openai.testDescription")}
    </p>
);

export const createTranscriptionsEndpointDoc = (surface: TranscriptionsSurface, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiTranscriptionsUrl = createApiUrl(apiBaseUrl, "/v1/audio/transcriptions");
    const aiSdkTranscriptionsUrl = createApiUrl(apiBaseUrl, "/api/transcriptions");

    if (surface === "openai") {
        return {
            id: "transcriptions-openai",
            title: t("transcriptions.openai.title"),
            surface: t("transcriptions.openai.surface"),
            method: "POST",
            path: "/v1/audio/transcriptions",
            url: openAiTranscriptionsUrl,
            summary: t("transcriptions.openai.summary"),
            description: createOpenAiTranscriptionsDescription(t),
            auth: createGatewayAuth(t),
            parameters: createOpenAiTranscriptionsParameters(t),
            requestExamples: [
                {
                    id: "curl-openai-transcriptions-json",
                    label: "cURL",
                    language: "bash",
                    code: `curl ${openAiTranscriptionsUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F file=@meeting.mp3 \\
  -F model=openai/whisper-1 \\
  -F response_format=json`,
                },
                {
                    id: "curl-openai-transcriptions-stream",
                    label: "cURL streaming",
                    language: "bash",
                    code: `curl ${openAiTranscriptionsUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F file=@meeting.mp3 \\
  -F model=openai/whisper-1 \\
  -F stream=true`,
                },
            ],
            responses: [
                {
                    status: "200",
                    description: t("transcriptions.openai.responses.json"),
                    example: {
                        id: "openai-transcriptions-json-response",
                        label: "JSON",
                        language: "json",
                        code: openAiTranscriptionsJsonResponseExample,
                    },
                },
                {
                    status: "200",
                    description: t("transcriptions.openai.responses.verbose"),
                    example: {
                        id: "openai-transcriptions-verbose-response",
                        label: "Verbose JSON",
                        language: "json",
                        code: openAiTranscriptionsVerboseResponseExample,
                    },
                },
                {
                    status: "200",
                    description: t("transcriptions.openai.responses.sse"),
                    example: {
                        id: "openai-transcriptions-sse-response",
                        label: "SSE",
                        language: "text",
                        code: `data: {"type":"transcript.text.delta","delta":"Welcome to the docs."}

data: {"type":"transcript.text.done","text":"Welcome to the docs."}

data: [DONE]`,
                    },
                },
            ],
            errors: [
                { status: "400", description: t("transcriptions.openai.errors.badRequest") },
                { status: "401", description: t("transcriptions.openai.errors.unauthorized") },
                { status: "500", description: t("transcriptions.openai.errors.providerFailed") },
            ],
            related: [
                { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
                { id: "other-surface", label: t("transcriptions.openai.relatedAiSdkTranscriptions"), href: "/gateway/ai/transcriptions" },
            ],
        };
    }

    return {
        id: "transcriptions-ai-sdk",
        title: t("transcriptions.aiSdk.title"),
        surface: t("transcriptions.aiSdk.surface"),
        method: "POST",
        path: "/api/transcriptions",
        url: aiSdkTranscriptionsUrl,
        summary: t("transcriptions.aiSdk.summary"),
        description: createAiSdkTranscriptionsDescription(t),
        auth: createGatewayAuth(t),
        parameters: createAiSdkTranscriptionsParameters(t),
        test: {
            label: t("transcriptions.aiSdk.testLabel"),
            modalTitle: t("transcriptions.aiSdk.testModalTitle"),
            description: createTranscriptionsTestDescription(t, "ai-sdk"),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "openai/whisper-1",
                audio: "data:audio/mpeg;base64,SUQzBAAAAAAA...",
                mediaType: "audio/mpeg",
            },
        },
        requestExamples: [
            {
                id: "typescript-ai-sdk-transcriptions",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${aiSdkTranscriptionsUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/whisper-1",
    audio: "data:audio/mpeg;base64,SUQzBAAAAAAA...",
    mediaType: "audio/mpeg"
  }),
});

const transcription = await response.json();`,
            },
            {
                id: "curl-ai-sdk-transcriptions",
                label: "cURL",
                language: "bash",
                code: `curl ${aiSdkTranscriptionsUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/whisper-1",
    "audio": "data:audio/mpeg;base64,SUQzBAAAAAAA...",
    "mediaType": "audio/mpeg"
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("transcriptions.aiSdk.responses.json"),
                example: {
                    id: "ai-sdk-transcriptions-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkTranscriptionsResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("transcriptions.aiSdk.errors.badRequest") },
            { status: "401", description: t("transcriptions.aiSdk.errors.unauthorized") },
            { status: "429", description: t("transcriptions.aiSdk.errors.rateLimited") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "other-surface", label: t("transcriptions.aiSdk.relatedOpenAiTranscriptions"), href: "/gateway/openai/transcriptions" },
        ],
    };
};

const openAiEmbeddingsResponseExample = `{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023064255, -0.009327292, 0.015797377],
      "index": 0
    },
    {
      "object": "embedding",
      "embedding": [-0.006929283, -0.005336422, 0.011040215],
      "index": 1
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}`;

const aiSdkEmbeddingsResponseExample = `{
  "embeddings": [
    [0.0023064255, -0.009327292, 0.015797377],
    [-0.006929283, -0.005336422, 0.011040215]
  ],
  "usage": {
    "tokens": 8
  },
  "providerMetadata": {
    "gateway": {
      "cost": 0.00000016
    },
    "openai": {}
  },
  "response": {
    "headers": {
      "x-request-id": "req_01hzyj8v5n9k6s3r2d4a"
    }
  },
  "warnings": []
}`;

export const createEmbeddingsEndpointDoc = (surface: EmbeddingsSurface, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const isOpenAi = surface === "openai";
    const path = isOpenAi ? "/v1/embeddings" : "/api/embeddings";
    const url = createApiUrl(apiBaseUrl, path);
    const key = isOpenAi ? "openai" : "aiSdk";
    const body = isOpenAi
        ? {
            model: "openai/text-embedding-3-small",
            input: ["Gateway documentation", "Semantic search"],
            encoding_format: "float",
        }
        : {
            model: "openai/text-embedding-3-small",
            values: ["Gateway documentation", "Semantic search"],
        };

    return {
        id: `embeddings-${isOpenAi ? "openai" : "ai-sdk"}`,
        title: t(`embeddings.${key}.title`),
        surface: t(`embeddings.${key}.surface`),
        method: "POST",
        path,
        url,
        summary: t(`embeddings.${key}.summary`),
        description: <p style={{ margin: 0 }}>{t(`embeddings.${key}.description`)}</p>,
        auth: createGatewayAuth(t),
        parameters: isOpenAi
            ? [
                { name: "model", type: "string", required: true, description: t("embeddings.openai.parameters.model") },
                { name: "input", type: "string | array", required: true, description: t("embeddings.openai.parameters.input") },
                { name: "dimensions", type: "number", required: false, description: t("embeddings.openai.parameters.dimensions") },
                { name: "encoding_format", type: "string", required: false, description: t("embeddings.openai.parameters.encodingFormat") },
                { name: "user", type: "string", required: false, description: t("embeddings.openai.parameters.user") },
            ]
            : [
                { name: "model", type: "string", required: true, description: t("embeddings.aiSdk.parameters.model") },
                { name: "values", type: "array", required: true, description: t("embeddings.aiSdk.parameters.values") },
                { name: "providerOptions", type: "object", required: false, description: t("embeddings.aiSdk.parameters.providerOptions") },
            ],
        test: {
            label: t(`embeddings.${key}.testLabel`),
            modalTitle: t(`embeddings.${key}.testModalTitle`),
            description: <p style={{ margin: 0 }}>{t(`embeddings.${key}.testDescription`)}</p>,
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body,
        },
        requestExamples: [
            {
                id: `typescript-${isOpenAi ? "openai" : "ai-sdk"}-embeddings`,
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const result = await response.json();`,
            },
            {
                id: `curl-${isOpenAi ? "openai" : "ai-sdk"}-embeddings`,
                label: "cURL",
                language: "bash",
                code: `curl ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`,
            },
        ],
        responses: [{
            status: "200",
            description: t(`embeddings.${key}.responses.json`),
            example: {
                id: `${isOpenAi ? "openai" : "ai-sdk"}-embeddings-response`,
                label: "JSON",
                language: "json",
                code: isOpenAi ? openAiEmbeddingsResponseExample : aiSdkEmbeddingsResponseExample,
            },
        }],
        errors: [
            { status: "400", description: t(`embeddings.${key}.errors.badRequest`) },
            { status: "401", description: t(`embeddings.${key}.errors.unauthorized`) },
            { status: isOpenAi ? "500" : "429", description: t(`embeddings.${key}.errors.providerFailed`) },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            isOpenAi
                ? { id: "ai-embeddings", label: t("embeddings.openai.relatedAiSdk"), href: "/gateway/ai/embeddings" }
                : { id: "openai-embeddings", label: t("embeddings.aiSdk.relatedOpenAi"), href: "/gateway/openai/embeddings" },
        ],
    };
};

const streamingTranscriptionsResponseExample = `data: {"type":"stream-start","warnings":[]}

data: {"type":"response-metadata","timestamp":"2026-07-14T13:20:00Z","modelId":"whisper-1","headers":{}}

data: {"type":"transcript-delta","id":"segment-0","delta":"Welcome to "}

data: {"type":"transcript-delta","id":"segment-0","delta":"the gateway docs."}

data: {"type":"transcript-final","id":"segment-0","text":"Welcome to the gateway docs.","startSecond":0,"endSecond":2.8}

data: {"type":"finish","text":"Welcome to the gateway docs.","segments":[],"language":"en","durationInSeconds":2.8}

data: [DONE]`;

export const createStreamingTranscriptionsEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const path = "/api/transcriptions/stream";
    const url = createApiUrl(apiBaseUrl, path);
    const body = {
        model: "openai/whisper-1",
        audio: "SUQzBAAAAAAA...",
        inputAudioFormat: { type: "mp3" },
        includeRawChunks: false,
    };

    return {
        id: "streaming-transcriptions-ai-sdk",
        title: t("transcriptions.streaming.title"),
        surface: t("transcriptions.streaming.surface"),
        method: "POST",
        path,
        url,
        summary: t("transcriptions.streaming.summary"),
        description: <p style={{ margin: 0 }}>{t("transcriptions.streaming.description")}</p>,
        auth: createGatewayAuth(t),
        parameters: [
            { name: "model", type: "string", required: true, description: t("transcriptions.streaming.parameters.model") },
            { name: "audio", type: "string", required: true, description: t("transcriptions.streaming.parameters.audio") },
            { name: "inputAudioFormat", type: "object", required: true, description: t("transcriptions.streaming.parameters.inputAudioFormat") },
            { name: "inputAudioFormat.type", type: "string", required: true, description: t("transcriptions.streaming.parameters.type") },
            { name: "inputAudioFormat.rate", type: "number", required: false, description: t("transcriptions.streaming.parameters.rate") },
            { name: "providerOptions", type: "object", required: false, description: t("transcriptions.streaming.parameters.providerOptions") },
            { name: "includeRawChunks", type: "boolean", required: false, description: t("transcriptions.streaming.parameters.includeRawChunks") },
        ],
        test: {
            label: t("transcriptions.streaming.testLabel"),
            modalTitle: t("transcriptions.streaming.testModalTitle"),
            description: <p style={{ margin: 0 }}>{t("transcriptions.streaming.testDescription")}</p>,
            responseType: "text",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body,
        },
        requestExamples: [
            {
                id: "typescript-ai-sdk-streaming-transcriptions",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const reader = response.body?.getReader();
// Decode and parse each SSE data line until data: [DONE].`,
            },
            {
                id: "curl-ai-sdk-streaming-transcriptions",
                label: "cURL streaming",
                language: "bash",
                code: `curl -N ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`,
            },
        ],
        responses: [{
            status: "200",
            description: t("transcriptions.streaming.responses.sse"),
            example: { id: "ai-sdk-streaming-transcriptions-response", label: "SSE", language: "text", code: streamingTranscriptionsResponseExample },
        }],
        errors: [
            { status: "400", description: t("transcriptions.streaming.errors.badRequest") },
            { status: "401", description: t("transcriptions.streaming.errors.unauthorized") },
            { status: "200", description: t("transcriptions.streaming.errors.streamError") },
        ],
        related: [
            { id: "ai-transcriptions", label: t("transcriptions.streaming.relatedTranscriptions"), href: "/gateway/ai/transcriptions" },
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
        ],
    };
};

export const createResponsesEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiResponsesUrl = createApiUrl(apiBaseUrl, "/v1/responses");

    return {
        id: "responses-openai",
        title: t("responses.openai.title"),
        surface: t("responses.openai.surface"),
        method: "POST",
        path: "/v1/responses",
        url: openAiResponsesUrl,
        summary: t("responses.openai.summary"),
        description: createOpenAiResponsesDescription(t),
        auth: createGatewayAuth(t),
        parameters: createOpenAiResponsesParameters(t),
        test: {
            label: t("responses.openai.testLabel"),
            modalTitle: t("responses.openai.testModalTitle"),
            description: createResponsesTestDescription(t),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "openai/gpt-4.1-mini",
                input: "Explain how to authenticate against the aihappey gateway in one sentence.",
            },
        },
        requestExamples: [
            {
                id: "typescript-openai-responses",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${openAiResponsesUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/gpt-4.1-mini",
    input: "Explain how to authenticate against the aihappey gateway in one sentence."
  }),
});

const result = await response.json();`,
            },
            {
                id: "curl-openai-responses-stream",
                label: "cURL streaming",
                language: "bash",
                code: `curl ${openAiResponsesUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4.1-mini",
    "input": "Explain how to authenticate against the aihappey gateway in one sentence.",
    "stream": true
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("responses.openai.responses.json"),
                example: {
                    id: "openai-responses-response",
                    label: "JSON",
                    language: "json",
                    code: openAiResponsesResponseExample,
                },
            },
            {
                status: "200",
                description: t("responses.openai.responses.sse"),
                example: {
                    id: "openai-responses-sse-response",
                    label: "SSE",
                    language: "text",
                    code: `data: {"type":"response.output_text.delta","delta":"Use a bearer token"}

data: {"type":"response.completed","response":{"id":"resp_01hzyj8v5n9k6s3r2d4a"}}

data: [DONE]`,
                },
            },
        ],
        errors: [
            { status: "400", description: t("responses.openai.errors.badRequest") },
            { status: "401", description: t("responses.openai.errors.unauthorized") },
            { status: "500", description: t("responses.openai.errors.providerFailed") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "openai-realtime", label: t("responses.openai.relatedRealtime"), href: "/gateway/openai/realtime" },
        ],
    };
};

export const createRealtimeEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiRealtimeUrl = createApiUrl(apiBaseUrl, "/v1/realtime/client_secrets");

    return {
        id: "realtime-openai",
        title: t("realtime.openai.title"),
        surface: t("realtime.openai.surface"),
        method: "POST",
        path: "/v1/realtime/client_secrets",
        url: openAiRealtimeUrl,
        summary: t("realtime.openai.summary"),
        description: createOpenAiRealtimeDescription(t),
        auth: createGatewayAuth(t),
        parameters: createOpenAiRealtimeParameters(t),
        test: {
            label: t("realtime.openai.testLabel"),
            modalTitle: t("realtime.openai.testModalTitle"),
            description: createRealtimeTestDescription(t),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "openai/gpt-4o-realtime-preview",
            },
        },
        requestExamples: [
            {
                id: "typescript-openai-realtime",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${openAiRealtimeUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-realtime-preview"
  }),
});

const clientSecret = await response.json();`,
            },
            {
                id: "curl-openai-realtime",
                label: "cURL",
                language: "bash",
                code: `curl ${openAiRealtimeUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4o-realtime-preview"
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("realtime.openai.responses.json"),
                example: {
                    id: "openai-realtime-response",
                    label: "JSON",
                    language: "json",
                    code: openAiRealtimeResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("realtime.openai.errors.badRequest") },
            { status: "401", description: t("realtime.openai.errors.unauthorized") },
            { status: "500", description: t("realtime.openai.errors.providerFailed") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "openai-responses", label: t("realtime.openai.relatedResponses"), href: "/gateway/openai/responses" },
        ],
    };
};

const createOpenAiModelsDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("models.openai.descriptionPrefix")} {inlineCode("X-OpenAI-Key")} {t("models.openai.descriptionMiddle")} {inlineCode("Authorization: Bearer")} {t("models.openai.descriptionSuffix")}
    </p>
);

const createOpenAiChatDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("chat.openai.descriptionPrefix")} {inlineCode("messages")} {t("chat.openai.descriptionMiddle")} {inlineCode("stream")} {t("chat.openai.descriptionSuffix")}
    </p>
);

const createOpenAiImageDescription = (t: (key: string) => string, endpoint: OpenAiImageEndpoint): ReactNode => {
    const key = endpoint === "generation" ? "generation" : "edit";
    return (
        <p style={{ margin: 0 }}>
            {t(`images.openai.${key}.descriptionPrefix`)} {inlineCode(endpoint === "generation" ? "prompt" : "images")} {t(`images.openai.${key}.descriptionMiddle`)} {inlineCode("stream")} {t(`images.openai.${key}.descriptionSuffix`)}
        </p>
    );
};

const createOpenAiModelsAuth = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("models.openai.authPrefix")} {inlineCode("X-OpenAI-Key")} {t("models.openai.authMiddle")} {inlineCode("Authorization: Bearer")} {t("models.openai.authSuffix")}
    </p>
);

const createOpenAiModelsParameters = (t: (key: string) => string) => [
    { name: "X-OpenAI-Key", type: "header", required: false, description: t("models.openai.parameters.xOpenAIKey") },
    { name: "X-Anthropic-Key", type: "header", required: false, description: t("models.openai.parameters.xAnthropicKey") },
    { name: "X-Google-Key", type: "header", required: false, description: t("models.openai.parameters.xGoogleKey") },
    { name: "X-<Provider>-Key", type: "header", required: false, description: t("models.openai.parameters.providerKey") },
];

const createOpenAiChatParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("chat.openai.parameters.model") },
    { name: "messages", type: "array", required: true, description: t("chat.openai.parameters.messages") },
    { name: "messages[].role", type: "string", required: true, description: t("chat.openai.parameters.messageRole") },
    { name: "messages[].content", type: "string | array", required: true, description: t("chat.openai.parameters.messageContent") },
    { name: "stream", type: "boolean", required: false, description: t("chat.openai.parameters.stream") },
    { name: "temperature", type: "number", required: false, description: t("chat.openai.parameters.temperature") },
    { name: "tools", type: "array", required: false, description: t("chat.openai.parameters.tools") },
    { name: "tool_choice", type: "string", required: false, description: t("chat.openai.parameters.toolChoice") },
    { name: "response_format", type: "object", required: false, description: t("chat.openai.parameters.responseFormat") },
    { name: "reasoning_effort", type: "string", required: false, description: t("chat.openai.parameters.reasoningEffort") },
    { name: "metadata", type: "object", required: false, description: t("chat.openai.parameters.metadata") },
];

const createOpenAiImageGenerationParameters = (t: (key: string) => string) => [
    { name: "prompt", type: "string", required: true, description: t("images.openai.generation.parameters.prompt") },
    { name: "model", type: "string", required: true, description: t("images.openai.generation.parameters.model") },
    { name: "n", type: "number", required: false, description: t("images.openai.common.parameters.n") },
    { name: "size", type: "string", required: false, description: t("images.openai.common.parameters.size") },
    { name: "quality", type: "string", required: false, description: t("images.openai.common.parameters.quality") },
    { name: "background", type: "string", required: false, description: t("images.openai.common.parameters.background") },
    { name: "output_format", type: "string", required: false, description: t("images.openai.common.parameters.outputFormat") },
    { name: "output_compression", type: "number", required: false, description: t("images.openai.common.parameters.outputCompression") },
    { name: "response_format", type: "string", required: false, description: t("images.openai.common.parameters.responseFormat") },
    { name: "stream", type: "boolean", required: false, description: t("images.openai.generation.parameters.stream") },
    { name: "partial_images", type: "number", required: false, description: t("images.openai.common.parameters.partialImages") },
    { name: "style", type: "string", required: false, description: t("images.openai.generation.parameters.style") },
    { name: "user", type: "string", required: false, description: t("images.openai.common.parameters.user") },
];

const createOpenAiImageEditParameters = (t: (key: string) => string) => [
    { name: "prompt", type: "string", required: true, description: t("images.openai.edit.parameters.prompt") },
    { name: "images", type: "array", required: true, description: t("images.openai.edit.parameters.images") },
    { name: "model", type: "string", required: true, description: t("images.openai.edit.parameters.model") },
    { name: "image", type: "file", required: false, description: t("images.openai.edit.parameters.imageFile") },
    { name: "mask", type: "object | file", required: false, description: t("images.openai.edit.parameters.mask") },
    { name: "n", type: "number", required: false, description: t("images.openai.common.parameters.n") },
    { name: "size", type: "string", required: false, description: t("images.openai.common.parameters.size") },
    { name: "quality", type: "string", required: false, description: t("images.openai.common.parameters.quality") },
    { name: "background", type: "string", required: false, description: t("images.openai.common.parameters.background") },
    { name: "input_fidelity", type: "string", required: false, description: t("images.openai.edit.parameters.inputFidelity") },
    { name: "output_format", type: "string", required: false, description: t("images.openai.common.parameters.outputFormat") },
    { name: "stream", type: "boolean", required: false, description: t("images.openai.edit.parameters.stream") },
    { name: "partial_images", type: "number", required: false, description: t("images.openai.common.parameters.partialImages") },
    { name: "user", type: "string", required: false, description: t("images.openai.common.parameters.user") },
];

const openAiModelsResponseExample = `{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4.1-mini",
      "object": "model",
      "created": 1715367049,
      "owned_by": "openai",
      "name": "GPT-4.1 mini",
      "description": "Fast, cost-efficient text and vision model for chat, tools, and structured outputs.",
      "context_window": 1047576,
      "max_tokens": 32768,
      "type": "language",
      "pricing": {
        "input": "0.40000000",
        "output": "1.20000000",
        "input_cache_read": "0.10000000",
        "input_cache_write": "0.10000000"
      }
    },
    {
      "id": "anthropic/agent_xyz/environment_xyz",
      "object": "model",
      "created": 1715367049,
      "owned_by": "Anthropic",
      "name": "Anthropic Managed Agent xyz at environment xyz",
      "description": "Managed agent exposed through the gateway model list.",
      "type": "language",
      "tags": ["agent"]
    },
    {
      "id": "googletranslate/translate-to/en",
      "object": "model",
      "created": 1715367049,
      "owned_by": "googletranslate",
      "name": "Dutch to English",
      "description": "Translate text to en.",
      "type": "language",
      "tags": ["translate", "en"],
      "pricing": {
        "input": "0.00002000",
        "output": "0.00000000"
      }
    },
    {
      "id": "elevenlabs/voice-rachel",
      "object": "model",
      "created": 1715367049,
      "owned_by": "elevenlabs",
      "name": "Rachel",
      "description": "Voice shortcut for English (en-US) text-to-speech.",
      "type": "speech",
      "tags": ["voice"],
      "pricing": {
        "input": "0.00003000",
        "output": "0.00000000"
      }
    }
  ]
}`;

const openAiChatResponseExample = `{
  "id": "chatcmpl_01hzyj8v5n9k6s3r2d4a",
  "object": "chat.completion",
  "created": 1784035200,
  "model": "gpt-4.1-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Send a bearer token and choose a provider-qualified model id such as openai/gpt-4.1-mini."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 19,
    "total_tokens": 43
  }
}`;

const openAiImagesResponseExample = `{
  "created": 1784035200,
  "data": [
    {
      "b64_json": "iVBORw0KGgoAAAANSUhEUgAA...",
      "revised_prompt": "A friendly robot reading API documentation in a bright workspace."
    }
  ],
  "size": "1024x1024",
  "quality": "standard",
  "usage": {
    "input_tokens": 18,
    "output_tokens": 64,
    "total_tokens": 82
  }
}`;

const createOpenAiModelsTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("models.openai.testDescription")}
    </p>
);

const createOpenAiChatTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("chat.openai.testDescription")}
    </p>
);

const createOpenAiImageTestDescription = (t: (key: string) => string, endpoint: OpenAiImageEndpoint): ReactNode => (
    <p style={{ margin: 0 }}>
        {t(`images.openai.${endpoint === "generation" ? "generation" : endpoint}.testDescription`)}
    </p>
);

export const createModelsEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiModelsUrl = createApiUrl(apiBaseUrl, "/v1/models");

    return {
        id: "models-openai",
        title: t("models.openai.title"),
        surface: t("models.openai.surface"),
        method: "GET",
        path: "/v1/models",
        url: openAiModelsUrl,
        summary: t("models.openai.summary"),
        description: createOpenAiModelsDescription(t),
        auth: createOpenAiModelsAuth(t),
        parameters: createOpenAiModelsParameters(t),
        test: {
            label: t("models.openai.testLabel"),
            modalTitle: t("models.openai.testModalTitle"),
            description: createOpenAiModelsTestDescription(t),
            responseType: "json",
            headers: [
                { name: "X-OpenAI-Key", value: "", placeholder: "OpenAI provider API key" },
            ],
        },
        requestExamples: [
            {
                id: "typescript-openai-models",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${openAiModelsUrl}", {
  method: "GET",
  headers: {
    "X-OpenAI-Key": openAiApiKey,
  },
});

const models = await response.json();`,
            },
            {
                id: "curl-openai-models",
                label: "cURL",
                language: "bash",
                code: `curl ${openAiModelsUrl} \\
  -H "X-OpenAI-Key: $OPENAI_API_KEY"`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("models.openai.responses.json"),
                example: {
                    id: "openai-models-response",
                    label: "JSON",
                    language: "json",
                    code: openAiModelsResponseExample,
                },
            },
        ],
        errors: [
            { status: "401", description: t("models.openai.errors.unauthorized") },
            { status: "500", description: t("models.openai.errors.providerFailed") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "openai-chat", label: t("models.openai.relatedChat"), href: "/gateway/openai/chat-completions" },
        ],
    };
};

export const createChatCompletionsEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiChatUrl = createApiUrl(apiBaseUrl, "/v1/chat/completions");

    return {
        id: "chat-openai",
        title: t("chat.openai.title"),
        surface: t("chat.openai.surface"),
        method: "POST",
        path: "/v1/chat/completions",
        url: openAiChatUrl,
        summary: t("chat.openai.summary"),
        description: createOpenAiChatDescription(t),
        auth: createGatewayAuth(t),
        parameters: createOpenAiChatParameters(t),
        test: {
            label: t("chat.openai.testLabel"),
            modalTitle: t("chat.openai.testModalTitle"),
            description: createOpenAiChatTestDescription(t),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "openai/gpt-4.1-mini",
                messages: [
                    { role: "user", content: "Explain the aihappey gateway authentication flow in one sentence." }
                ]
            },
        },
        requestExamples: [
            {
                id: "typescript-openai-chat",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${openAiChatUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/gpt-4.1-mini",
    messages: [
      { role: "user", content: "Explain the aihappey gateway authentication flow in one sentence." }
    ]
  }),
});

const completion = await response.json();`,
            },
            {
                id: "curl-openai-chat-stream",
                label: "cURL streaming",
                language: "bash",
                code: `curl ${openAiChatUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4.1-mini",
    "messages": [
      { "role": "user", "content": "Explain streaming chat completions in one sentence." }
    ],
    "stream": true
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("chat.openai.responses.json"),
                example: {
                    id: "openai-chat-response",
                    label: "JSON",
                    language: "json",
                    code: openAiChatResponseExample,
                },
            },
            {
                status: "200",
                description: t("chat.openai.responses.sse"),
                example: {
                    id: "openai-chat-sse-response",
                    label: "SSE",
                    language: "text",
                    code: `data: {"id":"chatcmpl_01hzyj8v5n9k6s3r2d4a","object":"chat.completion.chunk","choices":[{"delta":{"content":"Use"}}]}

data: {"id":"chatcmpl_01hzyj8v5n9k6s3r2d4a","object":"chat.completion.chunk","choices":[{"delta":{"content":" bearer auth."}}],"usage":{"total_tokens":12}}

data: [DONE]`,
                },
            },
        ],
        errors: [
            { status: "400", description: t("chat.openai.errors.badRequest") },
            { status: "401", description: t("chat.openai.errors.unauthorized") },
            { status: "500", description: t("chat.openai.errors.providerFailed") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "openai-responses", label: t("chat.openai.relatedResponses"), href: "/gateway/openai/responses" },
        ],
    };
};

export const createOpenAiImageEndpointDoc = (endpoint: OpenAiImageEndpoint, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const path = endpoint === "generation" ? "/v1/images/generations" : "/v1/images/edits";
    const url = createApiUrl(apiBaseUrl, path);
    const key = endpoint === "generation" ? "generation" : endpoint;
    const id = endpoint === "generation" ? "image-generation-openai" : "image-edit-openai";

    const parameters = endpoint === "generation"
        ? createOpenAiImageGenerationParameters(t)
        : createOpenAiImageEditParameters(t);

    const body = endpoint === "generation"
        ? {
            model: "openai/gpt-image-1.5",
            prompt: "A friendly robot reading API documentation in a bright workspace.",
            size: "1024x1024",
            n: 1,
        }
        : {
                model: "openai/gpt-image-1.5",
                prompt: "Add warm sunrise lighting and keep the original composition.",
                size: "1024x1024",
                n: 1,
            };

    const titleKey = `images.openai.${key}.title`;
    const requestPrompt = endpoint === "generation"
        ? `"prompt": "A friendly robot reading API documentation in a bright workspace.",`
        : `"prompt": "Add warm sunrise lighting and keep the original composition.",\n    "images": [{ "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." }],`;

    return {
        id,
        title: t(titleKey),
        surface: t("images.openai.surface"),
        method: "POST",
        path,
        url,
        summary: t(`images.openai.${key}.summary`),
        description: createOpenAiImageDescription(t, endpoint),
        auth: createGatewayAuth(t),
        parameters,
        test: {
            label: t(`images.openai.${key}.testLabel`),
            modalTitle: t(`images.openai.${key}.testModalTitle`),
            description: createOpenAiImageTestDescription(t, endpoint),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                ...(endpoint === "generation" ? [{ name: "Content-Type", value: "application/json" }] : []),
            ],
            ...(endpoint === "generation" ? { body } : {
                bodyType: "form-data" as const,
                fields: [
                    { name: "model", label: "model", value: "openai/gpt-image-1.5", required: true },
                    { name: "prompt", label: "prompt", value: "Add warm sunrise lighting and keep the original composition.", required: true },
                    { name: "image", label: "image", type: "file" as const, accept: "image/*", required: true, multiple: true },
                    { name: "mask", label: "mask", type: "file" as const, accept: "image/*" },
                    { name: "size", label: "size", value: "1024x1024" },
                    { name: "n", label: "n", value: "1" },
                ],
            }),
        },
        requestExamples: [
            {
                id: `typescript-openai-image-${key}`,
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/gpt-image-1.5",
    ${requestPrompt}
    size: "1024x1024",
    n: 1
  }),
});

const images = await response.json();`,
            },
            ...(endpoint === "generation" ? [{
                id: "curl-openai-image-generation-stream",
                label: "cURL streaming",
                language: "bash",
                code: `curl ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-image-1.5",
    "prompt": "A friendly robot reading API documentation in a bright workspace.",
    "stream": true,
    "partial_images": 1
  }'`,
            }] : [{
                id: `curl-openai-image-${key}-multipart`,
                label: "cURL multipart",
                language: "bash",
                code: endpoint === "edit" ? `curl ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F model=openai/gpt-image-1.5 \\
  -F prompt="Add warm sunrise lighting and keep the original composition." \\
  -F image=@source.png \\
  -F size=1024x1024` : `curl ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F model=openai/dall-e-2 \\
  -F image=@source.png \\
  -F size=1024x1024`,
            }]),
        ],
        responses: [
            {
                status: "200",
                description: t(`images.openai.${key}.responses.json`),
                example: {
                    id: `openai-image-${key}-response`,
                    label: "JSON",
                    language: "json",
                    code: openAiImagesResponseExample,
                },
            },
            {
                status: "200",
                description: t(`images.openai.${key}.responses.sse`),
                example: {
                    id: `openai-image-${key}-sse-response`,
                    label: "SSE",
                    language: "text",
                    code: endpoint === "generation" ? `event: image_generation.partial_image
data: {"type":"image_generation.partial_image","b64_json":"iVBORw0KGgoAAAANSUhEUgAA...","partial_image_index":0,"created_at":1784035200}

event: image_generation.completed
data: {"type":"image_generation.completed","b64_json":"iVBORw0KGgoAAAANSUhEUgAA...","created_at":1784035200}` : `event: image_edit.partial_image
data: {"type":"image_edit.partial_image","b64_json":"iVBORw0KGgoAAAANSUhEUgAA...","partial_image_index":0,"created_at":1784035200}

event: image_edit.completed
data: {"type":"image_edit.completed","b64_json":"iVBORw0KGgoAAAANSUhEUgAA...","created_at":1784035200}`,
                },
            },
        ],
        errors: [
            { status: "400", description: t(`images.openai.${key}.errors.badRequest`) },
            { status: "401", description: t("images.openai.common.errors.unauthorized") },
            { status: "500", description: t("images.openai.common.errors.providerFailed") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            endpoint === "generation"
                ? { id: "openai-edit-image", label: t("images.openai.generation.relatedEdit"), href: "/gateway/openai/edit-image" }
                : { id: "openai-create-image", label: t("images.openai.edit.relatedGeneration"), href: "/gateway/openai/create-image" },
        ],
    };
};

type CreateAiSdkEndpointDocOptions = {
    apiBaseUrl?: string;
};

const createAiSdkRerankDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("rerank.aiSdk.description")}
    </p>
);

const createAiSdkVideoDescription = (t: (key: string) => string, endpoint: VideoEndpoint): ReactNode => (
    <p style={{ margin: 0 }}>
        {t(`video.aiSdk.${endpoint}.description`)}
    </p>
);

const createGatewayAuth = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("gateway.common.auth")}
    </p>
);

const createAiSdkRerankParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("rerank.aiSdk.parameters.model") },
    { name: "query", type: "string", required: true, description: t("rerank.aiSdk.parameters.query") },
    { name: "documents", type: "object", required: true, description: t("rerank.aiSdk.parameters.documents") },
    { name: "documents.type", type: "string", required: true, description: t("rerank.aiSdk.parameters.documentsType") },
    { name: "documents.values", type: "array", required: true, description: t("rerank.aiSdk.parameters.documentsValues") },
    { name: "topN", type: "number", required: false, description: t("rerank.aiSdk.parameters.topN") },
    { name: "providerOptions", type: "object", required: false, description: t("rerank.aiSdk.parameters.providerOptions") },
];

const nestedShapeDescription = (description: string, example: string): ReactNode => (
    <div style={{ display: "grid", gap: 8 }}>
        <span>{description}</span>
        <pre style={{ margin: 0, padding: "0.7rem", overflow: "auto", borderRadius: 8, background: "rgba(148, 163, 184, 0.12)" }}>
            <code>{example}</code>
        </pre>
    </div>
);

const videoFileShapeExample = `{
  "type": "file",
  "mediaType": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAA..."
}`;

const videoInputReferencesShapeExample = `[
  {
    "type": "file",
    "mediaType": "image/png",
    "data": "iVBORw0KGgoAAAANSUhEUgAA..."
  },
  {
    "type": "file",
    "mediaType": "image/jpeg",
    "data": "/9j/4AAQSkZJRgABAQ..."
  }
]`;

const videoFrameImagesShapeExample = `[
  {
    "frameType": "first_frame",
    "image": {
      "type": "file",
      "mediaType": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  },
  {
    "frameType": "last_frame",
    "image": {
      "type": "file",
      "mediaType": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  }
]`;

const createAiSdkVideoParameters = (t: (key: string) => string) => [
    { name: "model", type: "string", required: true, description: t("video.aiSdk.parameters.model") },
    { name: "prompt", type: "string", required: true, description: t("video.aiSdk.parameters.prompt") },
    { name: "resolution", type: "string", required: false, description: t("video.aiSdk.parameters.resolution") },
    { name: "aspectRatio", type: "string", required: false, description: t("video.aiSdk.parameters.aspectRatio") },
    { name: "seed", type: "number", required: false, description: t("video.aiSdk.parameters.seed") },
    { name: "duration", type: "number", required: false, description: t("video.aiSdk.parameters.duration") },
    { name: "fps", type: "number", required: false, description: t("video.aiSdk.parameters.fps") },
    { name: "n", type: "number", required: false, description: t("video.aiSdk.parameters.n") },
    { name: "image", type: "object", required: false, description: nestedShapeDescription(t("video.aiSdk.parameters.image"), videoFileShapeExample) },
    { name: "inputReferences", type: "array", required: false, description: nestedShapeDescription(t("video.aiSdk.parameters.inputReferences"), videoInputReferencesShapeExample) },
    { name: "frameImages", type: "array", required: false, description: nestedShapeDescription(t("video.aiSdk.parameters.frameImages"), videoFrameImagesShapeExample) },
    { name: "providerOptions", type: "object", required: false, description: t("video.aiSdk.parameters.providerOptions") },
];

const aiSdkRerankResponseExample = `{
  "ranking": [
    {
      "index": 1,
      "relevanceScore": 0.9612
    },
    {
      "index": 0,
      "relevanceScore": 0.8428
    }
  ],
  "warnings": [],
  "response": {
    "id": "rerank_01hzyj8v5n9k6s3r2d4a",
    "timestamp": "2026-07-14T13:20:00Z",
    "modelId": "cohere/rerank-v3.5",
    "headers": {
      "Header-1": "Header-1-Value",
      "Header-2": "Header-2-Value"
    }
  },
  "providerMetadata": {
    "gateway": {
      "cost": 0.00023456789
    },
    "cohere": {}
  }
}`;

const aiSdkVideoStartResponseExample = `{
  "operation": "google/task_01hzyj8v5n9k6s3r2d4a",
  "warnings": [],
  "providerMetadata": {
    "gateway": {
      "cost": 0.0456789
    },
    "google": {}
  },
  "response": {
    "timestamp": "2026-07-14T13:20:00Z",
    "modelId": "google/veo-3.0-generate-preview",
    "headers": {}
  }
}`;

const aiSdkVideoPendingResponseExample = `{
  "status": "pending",
  "warnings": [],
  "providerMetadata": {
    "google": {}
  },
  "response": {
    "timestamp": "2026-07-14T13:20:05Z",
    "modelId": "google/veo-3.0-generate-preview",
    "headers": {}
  }
}`;

const aiSdkVideoCompletedResponseExample = `{
  "status": "completed",
  "videos": [
    {
      "type": "base64",
      "data": "AAAAIGZ0eXBpc29t...",
      "mediaType": "video/mp4"
    }
  ],
  "warnings": [],
  "response": {
    "timestamp": "2026-07-14T13:20:00Z",
    "modelId": "google/veo-3.0-generate-preview",
    "headers": {
      "Header-1": "Header-1-Value",
      "Header-2": "Header-2-Value"
    }
  }
}`;

const createAiSdkRerankTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("rerank.aiSdk.testDescription")}
    </p>
);

const createAiSdkVideoTestDescription = (t: (key: string) => string, endpoint: VideoEndpoint): ReactNode => (
    <p style={{ margin: 0 }}>
        {t(`video.aiSdk.${endpoint}.testDescription`)}
    </p>
);

export const createRerankEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const aiSdkRerankUrl = createApiUrl(apiBaseUrl, "/api/rerank");

    return {
        id: "rerank-ai-sdk",
        title: t("rerank.aiSdk.title"),
        surface: t("rerank.aiSdk.surface"),
        method: "POST",
        path: "/api/rerank",
        url: aiSdkRerankUrl,
        summary: t("rerank.aiSdk.summary"),
        description: createAiSdkRerankDescription(t),
        auth: createGatewayAuth(t),
        parameters: createAiSdkRerankParameters(t),
        test: {
            label: t("rerank.aiSdk.testLabel"),
            modalTitle: t("rerank.aiSdk.testModalTitle"),
            description: createAiSdkRerankTestDescription(t),
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "cohere/rerank-v3.5",
                query: "Which document best explains API authentication?",
                documents: {
                    type: "text",
                    values: [
                        "Send a bearer token with every request to authenticate against the gateway.",
                        "The speech endpoint generates audio from text.",
                        "Video generation can use prompts, images, and provider options."
                    ]
                },
                topN: 2,
            },
        },
        requestExamples: [
            {
                id: "typescript-ai-sdk-rerank",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${aiSdkRerankUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "cohere/rerank-v3.5",
    query: "Which document best explains API authentication?",
    documents: {
      type: "text",
      values: [
        "Send a bearer token with every request to authenticate against the gateway.",
        "The speech endpoint generates audio from text.",
        "Video generation can use prompts, images, and provider options."
      ]
    },
    topN: 2
  }),
});

const rerank = await response.json();`,
            },
            {
                id: "curl-ai-sdk-rerank",
                label: "cURL",
                language: "bash",
                code: `curl ${aiSdkRerankUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "cohere/rerank-v3.5",
    "query": "Which document best explains API authentication?",
    "documents": {
      "type": "text",
      "values": [
        "Send a bearer token with every request to authenticate against the gateway.",
        "The speech endpoint generates audio from text.",
        "Video generation can use prompts, images, and provider options."
      ]
    },
    "topN": 2
  }'`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("rerank.aiSdk.responses.json"),
                example: {
                    id: "ai-sdk-rerank-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkRerankResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("rerank.aiSdk.errors.badRequest") },
            { status: "401", description: t("rerank.aiSdk.errors.unauthorized") },
            { status: "429", description: t("rerank.aiSdk.errors.rateLimited") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "ai-create-video-task", label: t("rerank.aiSdk.relatedVideo"), href: "/gateway/ai/videos/create" },
        ],
    };
};

export const createVideoEndpointDoc = (endpoint: VideoEndpoint, options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const createUrl = createApiUrl(apiBaseUrl, "/api/videos");
    const getPath = "/api/videos/{providerId}/{taskId}";
    const getExampleUrl = createApiUrl(apiBaseUrl, "/api/videos/google/task_01hzyj8v5n9k6s3r2d4a");

    if (endpoint === "get") {
        return {
            id: "video-task-get-ai-sdk",
            title: t("video.aiSdk.get.title"),
            surface: t("video.aiSdk.surface"),
            method: "GET",
            path: getPath,
            url: getExampleUrl,
            summary: t("video.aiSdk.get.summary"),
            description: createAiSdkVideoDescription(t, "get"),
            auth: createGatewayAuth(t),
            parameters: [
                { name: "providerId", type: "path", required: true, description: t("video.aiSdk.get.parameters.providerId") },
                { name: "taskId", type: "path", required: true, description: t("video.aiSdk.get.parameters.taskId") },
            ],
            test: {
                label: t("video.aiSdk.get.testLabel"),
                modalTitle: t("video.aiSdk.get.testModalTitle"),
                description: createAiSdkVideoTestDescription(t, "get"),
                responseType: "json",
                headers: [{ name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" }],
            },
            requestExamples: [
                {
                    id: "typescript-ai-sdk-video-task-get",
                    label: "TypeScript",
                    language: "ts",
                    code: `const response = await fetch(\`${normalizeApiBaseUrl(apiBaseUrl)}/api/videos/\${providerId}/\${encodeURIComponent(taskId)}\`, {
  headers: { Authorization: \`Bearer \${token}\` },
});

const task = await response.json();`,
                },
                {
                    id: "curl-ai-sdk-video-task-get",
                    label: "cURL",
                    language: "bash",
                    code: `curl ${getExampleUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY"`,
                },
            ],
            responses: [
                { status: "200", description: t("video.aiSdk.get.responses.pending"), example: { id: "video-task-pending", label: "Pending", language: "json", code: aiSdkVideoPendingResponseExample } },
                { status: "200", description: t("video.aiSdk.get.responses.completed"), example: { id: "video-task-completed", label: "Completed", language: "json", code: aiSdkVideoCompletedResponseExample } },
                { status: "200", description: t("video.aiSdk.get.responses.error"), example: { id: "video-task-error", label: "Error", language: "json", code: `{
  "status": "error",
  "error": "The provider could not generate the video.",
  "response": { "modelId": "google/veo-3.0-generate-preview" }
}` } },
            ],
            errors: [
                { status: "400", description: t("video.aiSdk.get.errors.badRequest") },
                { status: "401", description: t("video.aiSdk.errors.unauthorized") },
                { status: "404", description: t("video.aiSdk.get.errors.notFound") },
                { status: "501", description: t("video.aiSdk.get.errors.notSupported") },
            ],
            related: [
                { id: "ai-create-video-task", label: t("video.aiSdk.get.relatedCreate"), href: "/gateway/ai/videos/create" },
                { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            ],
        };
    }

    return {
        id: "video-task-create-ai-sdk",
        title: t("video.aiSdk.create.title"),
        surface: t("video.aiSdk.surface"),
        method: "POST",
        path: "/api/videos",
        url: createUrl,
        summary: t("video.aiSdk.create.summary"),
        description: createAiSdkVideoDescription(t, "create"),
        auth: createGatewayAuth(t),
        parameters: createAiSdkVideoParameters(t),
        test: {
            label: t("video.aiSdk.create.testLabel"),
            modalTitle: t("video.aiSdk.create.testModalTitle"),
            description: createAiSdkVideoTestDescription(t, "create"),
            responseType: "json",
            downloadFileName: "video-response.json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body: {
                model: "google/veo-3.0-generate-preview",
                prompt: "A cinematic drone shot over Amsterdam canals at sunrise, warm light, realistic style.",
                aspectRatio: "16:9",
                duration: 8,
                n: 1,
            },
        },
        requestExamples: [
            {
                id: "typescript-ai-sdk-video",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("${createUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "google/veo-3.0-generate-preview",
    prompt: "A cinematic drone shot over Amsterdam canals at sunrise, warm light, realistic style.",
    aspectRatio: "16:9",
    duration: 8,
    n: 1
  }),
});

const task = await response.json();`,
            },
            {
                id: "curl-ai-sdk-video",
                label: "cURL",
                language: "bash",
                code: `curl ${createUrl} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "google/veo-3.0-generate-preview",
    "prompt": "A cinematic drone shot over Amsterdam canals at sunrise, warm light, realistic style.",
    "aspectRatio": "16:9",
    "duration": 8,
    "n": 1
  }'`,
            },
            {
                id: "typescript-ai-sdk-video-visual-inputs",
                label: "TypeScript with visual inputs",
                language: "ts",
                code: `const response = await fetch("${createUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "google/veo-3.0-generate-preview",
    prompt: "Animate this product photo with subtle camera movement.",
    image: {
      type: "file",
      mediaType: "image/png",
      data: "iVBORw0KGgoAAAANSUhEUgAA..."
    },
    inputReferences: [
      {
        type: "file",
        mediaType: "image/jpeg",
        data: "/9j/4AAQSkZJRgABAQ..."
      }
    ],
    frameImages: [
      {
        frameType: "first_frame",
        image: {
          type: "file",
          mediaType: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAA..."
        }
      }
    ],
    duration: 5
  }),
});

const task = await response.json();`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("video.aiSdk.create.responses.json"),
                example: {
                    id: "ai-sdk-video-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkVideoStartResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("video.aiSdk.create.errors.badRequest") },
            { status: "401", description: t("video.aiSdk.errors.unauthorized") },
            { status: "501", description: t("video.aiSdk.create.errors.notSupported") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "ai-get-video-task", label: t("video.aiSdk.create.relatedGet"), href: "/gateway/ai/videos/get" },
        ],
    };
};

export const createAiSdkChatEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const url = createApiUrl(apiBaseUrl, "/api/chat");
    const body = {
        id: "chat_01hzyj8v5n9k6s3r2d4a",
        model: "openai/gpt-4.1-mini",
        messages: [{ id: "msg_01", role: "user", parts: [{ type: "text", text: "Explain gateway authentication in one sentence." }] }],
        temperature: 0.7,
    };

    return {
        id: "chat-ai-sdk",
        title: t("chat.aiSdk.title"),
        surface: t("chat.aiSdk.surface"),
        method: "POST",
        path: "/api/chat",
        url,
        summary: t("chat.aiSdk.summary"),
        description: <p style={{ margin: 0 }}>{t("chat.aiSdk.description")}</p>,
        auth: createGatewayAuth(t),
        parameters: [
            { name: "model", type: "string", required: true, description: t("chat.aiSdk.parameters.model") },
            { name: "messages", type: "array", required: true, description: t("chat.aiSdk.parameters.messages") },
            { name: "messages[].parts", type: "array", required: true, description: t("chat.aiSdk.parameters.parts") },
            { name: "tools", type: "array", required: false, description: t("chat.aiSdk.parameters.tools") },
            { name: "toolChoice", type: "string", required: false, description: t("chat.aiSdk.parameters.toolChoice") },
            { name: "maxToolCalls", type: "number", required: false, description: t("chat.aiSdk.parameters.maxToolCalls") },
            { name: "temperature", type: "number", required: false, description: t("chat.aiSdk.parameters.temperature") },
            { name: "topP", type: "number", required: false, description: t("chat.aiSdk.parameters.topP") },
            { name: "maxOutputTokens", type: "number", required: false, description: t("chat.aiSdk.parameters.maxOutputTokens") },
            { name: "providerMetadata", type: "object", required: false, description: t("chat.aiSdk.parameters.providerMetadata") },
        ],
        test: {
            label: t("chat.aiSdk.testLabel"),
            modalTitle: t("chat.aiSdk.testModalTitle"),
            description: <p style={{ margin: 0 }}>{t("chat.aiSdk.testDescription")}</p>,
            responseType: "text",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
            ],
            body,
        },
        requestExamples: [
            { id: "typescript-ai-sdk-chat", label: "TypeScript", language: "ts", code: `const response = await fetch("${url}", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const stream = response.body;` },
            { id: "curl-ai-sdk-chat", label: "cURL", language: "bash", code: `curl ${url} \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'` },
        ],
        responses: [{ status: "200", description: t("chat.aiSdk.responses.sse"), example: { id: "ai-sdk-chat-sse", label: "SSE", language: "text", code: `data: {"type":"start","messageId":"msg_02"}

data: {"type":"text-start","id":"text_01"}

data: {"type":"text-delta","id":"text_01","delta":"Send a bearer token with every request."}

data: {"type":"finish"}` } }],
        errors: [
            { status: "400", description: t("chat.aiSdk.errors.badRequest") },
            { status: "401", description: t("chat.aiSdk.errors.unauthorized") },
            { status: "200", description: t("chat.aiSdk.errors.streamError") },
        ],
        related: [
            { id: "openai-chat", label: t("chat.aiSdk.relatedOpenAiChat"), href: "/gateway/openai/chat-completions" },
            { id: "anthropic-messages", label: t("chat.aiSdk.relatedMessages"), href: "/gateway/anthropic/messages" },
        ],
    };
};

export const createMessagesEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const url = createApiUrl(apiBaseUrl, "/v1/messages");
    const body = {
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Explain gateway authentication in one sentence." }],
    };

    return {
        id: "messages-anthropic",
        title: t("messages.anthropic.title"),
        surface: t("messages.anthropic.surface"),
        method: "POST",
        path: "/v1/messages",
        url,
        summary: t("messages.anthropic.summary"),
        description: <p style={{ margin: 0 }}>{t("messages.anthropic.description")}</p>,
        auth: createGatewayAuth(t),
        parameters: [
            { name: "model", type: "string", required: true, description: t("messages.anthropic.parameters.model") },
            { name: "max_tokens", type: "number", required: false, description: t("messages.anthropic.parameters.maxTokens") },
            { name: "messages", type: "array", required: true, description: t("messages.anthropic.parameters.messages") },
            { name: "system", type: "string | array", required: false, description: t("messages.anthropic.parameters.system") },
            { name: "stream", type: "boolean", required: false, description: t("messages.anthropic.parameters.stream") },
            { name: "temperature", type: "number", required: false, description: t("messages.anthropic.parameters.temperature") },
            { name: "tools", type: "array", required: false, description: t("messages.anthropic.parameters.tools") },
            { name: "tool_choice", type: "object", required: false, description: t("messages.anthropic.parameters.toolChoice") },
            { name: "thinking", type: "object", required: false, description: t("messages.anthropic.parameters.thinking") },
            { name: "metadata", type: "object", required: false, description: t("messages.anthropic.parameters.metadata") },
        ],
        test: {
            label: t("messages.anthropic.testLabel"),
            modalTitle: t("messages.anthropic.testModalTitle"),
            description: <p style={{ margin: 0 }}>{t("messages.anthropic.testDescription")}</p>,
            responseType: "json",
            headers: [
                { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
                { name: "Content-Type", value: "application/json" },
                { name: "anthropic-version", value: "2023-06-01" },
            ],
            body,
        },
        requestExamples: [
            { id: "typescript-anthropic-messages", label: "TypeScript", language: "ts", code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    Authorization: \`Bearer \${token}\`
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const message = await response.json();` },
            { id: "curl-anthropic-messages-stream", label: "cURL streaming", language: "bash", code: `curl ${url} \\
  -H "Authorization: Bearer $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ ...body, stream: true }, null, 2)}'` },
        ],
        responses: [
            { status: "200", description: t("messages.anthropic.responses.json"), example: { id: "anthropic-message-response", label: "JSON", language: "json", code: `{
  "id": "msg_01hzyj8v5n9k6s3r2d4a",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-5",
  "content": [{ "type": "text", "text": "Send a bearer token with every gateway request." }],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 18, "output_tokens": 12 }
}` } },
            { status: "200", description: t("messages.anthropic.responses.sse"), example: { id: "anthropic-message-sse", label: "SSE", language: "text", code: `data: {"type":"message_start","message":{"id":"msg_01hzyj8v5n9k6s3r2d4a","type":"message","role":"assistant"}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Send a bearer token."}}

data: {"type":"message_stop"}

data: [DONE]` } },
        ],
        errors: [
            { status: "400", description: t("messages.anthropic.errors.badRequest") },
            { status: "401", description: t("messages.anthropic.errors.unauthorized") },
            { status: "500", description: t("messages.anthropic.errors.providerFailed") },
        ],
        related: [
            { id: "ai-chat", label: t("messages.anthropic.relatedAiChat"), href: "/gateway/ai/chat" },
            { id: "openai-chat", label: t("messages.anthropic.relatedOpenAiChat"), href: "/gateway/openai/chat-completions" },
        ],
    };
};

const gatewayHeaders = [
    { name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
];

export const createAiSdkImageEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const path = "/api/images";
    const url = createApiUrl(normalizeApiBaseUrl(options.apiBaseUrl), path);
    const body = {
        model: "openai/gpt-image-1.5",
        prompt: "A friendly robot reading API documentation.",
        size: "1024x1024",
        n: 1,
    };
    return {
        id: "images-ai-sdk", title: t("images.aiSdk.title"), surface: t("images.aiSdk.surface"), method: "POST", path, url,
        summary: t("images.aiSdk.summary"), description: <p style={{ margin: 0 }}>{t("images.aiSdk.description")}</p>, auth: createGatewayAuth(t),
        parameters: [
            { name: "model", type: "string", required: true, description: t("images.aiSdk.parameters.model") },
            { name: "prompt", type: "string", required: true, description: t("images.aiSdk.parameters.prompt") },
            { name: "size", type: "string", required: false, description: t("images.aiSdk.parameters.size") },
            { name: "aspectRatio", type: "string", required: false, description: t("images.aiSdk.parameters.aspectRatio") },
            { name: "seed", type: "number", required: false, description: t("images.aiSdk.parameters.seed") },
            { name: "n", type: "number", required: false, description: t("images.aiSdk.parameters.n") },
            { name: "files", type: "array", required: false, description: t("images.aiSdk.parameters.files") },
            { name: "mask", type: "object", required: false, description: t("images.aiSdk.parameters.mask") },
            { name: "providerOptions", type: "object", required: false, description: t("images.aiSdk.parameters.providerOptions") },
        ],
        test: { label: t("images.aiSdk.testLabel"), modalTitle: t("images.aiSdk.testModalTitle"), description: <p style={{ margin: 0 }}>{t("images.aiSdk.testDescription")}</p>, responseType: "json", headers: [...gatewayHeaders, { name: "Content-Type", value: "application/json" }], body },
        requestExamples: [
            { id: "typescript-ai-images", label: "TypeScript", language: "ts", code: `const response = await fetch("${url}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },\n  body: JSON.stringify(${JSON.stringify(body, null, 2)})\n});\nconst result = await response.json();` },
            { id: "curl-ai-images", label: "cURL", language: "bash", code: `curl ${url} \\\n  -H "Authorization: Bearer $AIHAPPEY_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body, null, 2)}'` },
        ],
        responses: [{ status: "200", description: t("images.aiSdk.responses.json"), example: { id: "ai-images-response", label: "JSON", language: "json", code: `{"images":["data:image/png;base64,iVBORw0KGgo..."],"warnings":[],"response":{"modelId":"gpt-image-1.5","timestamp":"2026-08-09T09:00:00Z","headers":{}},"usage":{"inputTokens":42,"outputTokens":1024,"totalTokens":1066},"providerMetadata":{"gateway":{"cost":0.04}}}` } }],
        errors: [{ status: "400", description: t("images.aiSdk.errors.badRequest") }, { status: "401", description: t("images.aiSdk.errors.unauthorized") }],
        related: [{ id: "openai-create-image", label: t("images.aiSdk.relatedOpenAi"), href: "/gateway/openai/create-image" }, { id: "ai-ui", label: t("images.aiSdk.relatedUi"), href: "/gateway/ai/ui" }],
    };
};

export const createUiEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const path = "/api/generate";
    const url = createApiUrl(normalizeApiBaseUrl(options.apiBaseUrl), path);
    const body = { model: "openai/gpt-4.1-mini", prompt: "Create a pricing card component.", catalogPrompt: "Use accessible HTML and utility classes.", context: { framework: "React" }, temperature: 0.7, maxOutputTokens: 2048 };
    return {
        id: "ui-ai-sdk", title: t("ui.aiSdk.title"), surface: t("ui.aiSdk.surface"), method: "POST", path, url,
        summary: t("ui.aiSdk.summary"), description: <p style={{ margin: 0 }}>{t("ui.aiSdk.description")}</p>, auth: createGatewayAuth(t),
        parameters: [
            { name: "model", type: "string", required: true, description: t("ui.aiSdk.parameters.model") },
            { name: "prompt", type: "string", required: true, description: t("ui.aiSdk.parameters.prompt") },
            { name: "catalogPrompt", type: "string", required: true, description: t("ui.aiSdk.parameters.catalogPrompt") },
            { name: "context", type: "object", required: false, description: t("ui.aiSdk.parameters.context") },
            { name: "temperature", type: "number", required: false, description: t("ui.aiSdk.parameters.temperature") },
            { name: "maxOutputTokens", type: "number", required: false, description: t("ui.aiSdk.parameters.maxOutputTokens") },
            { name: "providerMetadata", type: "object", required: false, description: t("ui.aiSdk.parameters.providerMetadata") },
        ],
        test: { label: t("ui.aiSdk.testLabel"), modalTitle: t("ui.aiSdk.testModalTitle"), description: <p style={{ margin: 0 }}>{t("ui.aiSdk.testDescription")}</p>, responseType: "text", headers: [...gatewayHeaders, { name: "Content-Type", value: "application/json" }], body },
        requestExamples: [
            { id: "typescript-ai-ui", label: "TypeScript", language: "ts", code: `const response = await fetch("${url}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },\n  body: JSON.stringify(${JSON.stringify(body, null, 2)})\n});\nconst generatedUi = await response.text();` },
            { id: "curl-ai-ui", label: "cURL", language: "bash", code: `curl ${url} \\\n  -H "Authorization: Bearer $AIHAPPEY_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body, null, 2)}'` },
        ],
        responses: [{ status: "200", description: t("ui.aiSdk.responses.text"), example: { id: "ai-ui-response", label: "Text stream", language: "html", code: `<section class="rounded-xl border p-6">\n  <h2>Pro plan</h2>\n  <p>Everything your team needs.</p>\n</section>` } }],
        errors: [{ status: "400", description: t("ui.aiSdk.errors.badRequest") }, { status: "401", description: t("ui.aiSdk.errors.unauthorized") }],
        related: [{ id: "ai-chat", label: t("ui.aiSdk.relatedChat"), href: "/gateway/ai/chat" }, { id: "ai-images", label: t("ui.aiSdk.relatedImages"), href: "/gateway/ai/images" }],
    };
};

export const createSkillEndpointDoc = (endpoint: SkillEndpoint, options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const paths: Record<SkillEndpoint, string> = {
        list: "/v1/skills", download: "/v1/skills/{skillId}/content",
        versions: "/v1/skills/{skillId}/versions", "download-version": "/v1/skills/{skillId}/versions/{version}/content",
    };
    const livePaths: Record<SkillEndpoint, string> = {
        list: "/v1/skills?limit=20&order=desc", download: "/v1/skills/clawhub/example-skill/content",
        versions: "/v1/skills/clawhub/example-skill/versions?limit=20&order=desc", "download-version": "/v1/skills/clawhub/example-skill/versions/1.0.0/content",
    };
    const path = paths[endpoint];
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const url = createApiUrl(apiBaseUrl, path);
    const testUrl = createApiUrl(apiBaseUrl, livePaths[endpoint]);
    const isList = endpoint === "list";
    const isVersions = endpoint === "versions";
    const isDownload = endpoint === "download" || endpoint === "download-version";
    const parameters = [
        ...(isList ? [
            { name: "X-OpenAI-Key", type: "header", required: false, description: t("models.openai.parameters.xOpenAIKey") },
            { name: "X-Anthropic-Key", type: "header", required: false, description: t("models.openai.parameters.xAnthropicKey") },
            { name: "X-Google-Key", type: "header", required: false, description: t("models.openai.parameters.xGoogleKey") },
            { name: "X-<Provider>-Key", type: "header", required: false, description: t("models.openai.parameters.providerKey") },
        ] : [{ name: "skillId", type: "path", required: true, description: t("skills.common.parameters.skillId") }]),
        ...(endpoint === "download-version" ? [{ name: "version", type: "path", required: true, description: t("skills.common.parameters.version") }] : []),
        ...(isList || isVersions ? [{ name: "after", type: "query", required: false, description: t("skills.common.parameters.after") }, { name: "limit", type: "query", required: false, description: t("skills.common.parameters.limit") }, { name: "order", type: "query", required: false, description: t("skills.common.parameters.order") }] : []),
    ];
    const jsonExample = isVersions ? `{"object":"list","data":[{"id":"clawhub/example-skill:1.0.0","object":"skill.version","created_at":1786266000,"version":"1.0.0","name":"Example skill","description":"An example skill.","skill_id":"clawhub/example-skill"}],"first_id":"clawhub/example-skill:1.0.0","last_id":"clawhub/example-skill:1.0.0","has_more":false}` : `{"object":"list","data":[{"id":"clawhub/example-skill","object":"skill","created_at":1786266000,"default_version":"1.0.0","name":"Example skill","description":"An example skill.","latest_version":"1.0.0"}],"first_id":"clawhub/example-skill","last_id":"clawhub/example-skill","has_more":false}`;
    return {
        id: `skills-${endpoint}`, title: t(`skills.${endpoint}.title`), surface: t("skills.common.surface"), method: "GET", path, url,
        summary: t(`skills.${endpoint}.summary`), description: <p style={{ margin: 0 }}>{t(`skills.${endpoint}.description`)}</p>, auth: isList ? createOpenAiModelsAuth(t) : createGatewayAuth(t), parametersTitle: t("api.sections.parameters"), parameters,
        test: { label: t("skills.common.testLabel"), modalTitle: t(`skills.${endpoint}.testModalTitle`), description: <p style={{ margin: 0 }}>{t(`skills.${endpoint}.testDescription`)}</p>, url: testUrl, responseType: isDownload ? "auto" : "json", downloadFileName: endpoint === "download-version" ? "example-skill-1.0.0.zip" : "example-skill.zip", headers: isList ? [{ name: "X-OpenAI-Key", value: "", placeholder: "OpenAI provider API key" }] : gatewayHeaders },
        requestExamples: [
            { id: `typescript-skills-${endpoint}`, label: "TypeScript", language: "ts", code: `const response = await fetch("${testUrl}", { headers: { ${isList ? '"X-OpenAI-Key": openAiApiKey' : "Authorization: `Bearer ${token}`"} } });\n${isDownload ? "const bundle = await response.blob();" : "const result = await response.json();"}` },
            { id: `curl-skills-${endpoint}`, label: "cURL", language: "bash", code: `curl ${testUrl} -H "${isList ? "X-OpenAI-Key: $OPENAI_API_KEY" : "Authorization: Bearer $AIHAPPEY_API_KEY"}"${isDownload ? ` --output ${endpoint === "download-version" ? "example-skill-1.0.0.zip" : "example-skill.zip"}` : ""}` },
        ],
        responses: [{ status: "200", description: t(`skills.${endpoint}.responses.success`), example: isDownload ? { id: `skills-${endpoint}-zip`, label: "ZIP", language: "http", code: "HTTP/1.1 200 OK\nContent-Type: application/zip\nContent-Disposition: attachment; filename=example-skill.zip\n\n<binary ZIP bytes>" } : { id: `skills-${endpoint}-json`, label: "JSON", language: "json", code: jsonExample } }],
        errors: [{ status: "401", description: t("skills.common.errors.unauthorized") }, ...(!isList ? [{ status: "404", description: t("skills.common.errors.notFound") }] : []), { status: "500", description: t("skills.common.errors.providerFailed") }],
        related: endpoint === "list" ? [{ id: "skill-versions", label: t("skills.common.relatedVersions"), href: "/gateway/openai/list-skill-versions" }] : [{ id: "skills-list", label: t("skills.common.relatedList"), href: "/gateway/openai/list-skills" }],
    };
};


