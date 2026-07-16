import type { ReactNode } from "react";
import { docsInlineCodeStyle, type DocsEndpointDoc, type DocsHomeCard, type DocsNavSection, type DocsTopNavItem } from "aihappey-docs-components";

const inlineCode = (value: string) => <code style={docsInlineCodeStyle}>{value}</code>;

export const docsTopNavItems: DocsTopNavItem[] = [
    { id: "home", label: "Home", href: "/" },
    { id: "gateway", label: "Gateway", href: "/gateway" },
    { id: "agents", label: "Agents", href: "/agents" },
    { id: "resources", label: "Resources", href: "/resources" },
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
            { id: "openai-chat", label: "Chat completions", href: "/gateway/openai/chat-completions", badge: { label: "POST", method: "POST" } },
            { id: "openai-responses", label: "Responses", href: "/gateway/openai/responses", badge: { label: "POST", method: "POST" } },
            { id: "openai-realtime", label: "Realtime", href: "/gateway/openai/realtime", badge: { label: "POST", method: "POST" } },
            { id: "openai-speech", label: "Speech", href: "/gateway/openai/speech", badge: { label: "POST", method: "POST" } },
            { id: "openai-transcriptions", label: "Transcriptions", href: "/gateway/openai/transcriptions", badge: { label: "POST", method: "POST" } },
            { id: "openai-create-image", label: "Create image", href: "/gateway/openai/create-image", badge: { label: "POST", method: "POST" } },
            { id: "openai-edit-image", label: "Edit image", href: "/gateway/openai/edit-image", badge: { label: "POST", method: "POST" } },
            { id: "openai-create-variation", label: "Create variation", href: "/gateway/openai/create-variation", badge: { label: "POST", method: "POST" } },
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
            { id: "ai-images", label: "Images", href: "/gateway/ai/images", badge: { label: "POST", method: "POST" } },
            { id: "ai-rerank", label: "Rerank", href: "/gateway/ai/rerank", badge: { label: "POST", method: "POST" } },
            { id: "ai-speech", label: "Speech", href: "/gateway/ai/speech", badge: { label: "POST", method: "POST" } },
            { id: "ai-transcriptions", label: "Transcriptions", href: "/gateway/ai/transcriptions", badge: { label: "POST", method: "POST" } },
            { id: "ai-ui", label: "UI", href: "/gateway/ai/ui", badge: { label: "POST", method: "POST" } },
            { id: "ai-video", label: "Video", href: "/gateway/ai/video", badge: { label: "POST", method: "POST" } },
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

type SpeechSurface = "openai" | "ai-sdk";
type TranscriptionsSurface = "openai" | "ai-sdk";
type OpenAiImageEndpoint = "generation" | "edit" | "variation";

type CreateSpeechEndpointDocOptions = {
    apiBaseUrl?: string;
    t?: (key: string) => string;
};

const fallbackApiBaseUrl = "http://localhost:3010";

const normalizeApiBaseUrl = (apiBaseUrl?: string) => {
    const trimmed = apiBaseUrl?.trim();
    if (!trimmed) return fallbackApiBaseUrl;
    return trimmed.replace(/\/+$/, "");
};

const createApiUrl = (apiBaseUrl: string, path: string) => `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;

const fallbackT = (key: string) => key;

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
    const t = options.t ?? fallbackT;
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
    const t = options.t ?? fallbackT;
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

export const createResponsesEndpointDoc = (options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const t = options.t ?? fallbackT;
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
    const t = options.t ?? fallbackT;
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
    const key = endpoint === "generation" ? "generation" : endpoint === "edit" ? "edit" : "variation";
    return (
        <p style={{ margin: 0 }}>
            {t(`images.openai.${key}.descriptionPrefix`)} {inlineCode(endpoint === "generation" ? "prompt" : endpoint === "edit" ? "images" : "image")} {t(`images.openai.${key}.descriptionMiddle`)} {inlineCode("stream")} {t(`images.openai.${key}.descriptionSuffix`)}
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

const createOpenAiImageVariationParameters = (t: (key: string) => string) => [
    { name: "image", type: "object | file", required: true, description: t("images.openai.variation.parameters.image") },
    { name: "model", type: "string", required: true, description: t("images.openai.variation.parameters.model") },
    { name: "n", type: "number", required: false, description: t("images.openai.common.parameters.n") },
    { name: "size", type: "string", required: false, description: t("images.openai.common.parameters.size") },
    { name: "response_format", type: "string", required: false, description: t("images.openai.common.parameters.responseFormat") },
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
    const t = options.t ?? fallbackT;
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
    const t = options.t ?? fallbackT;
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
    const t = options.t ?? fallbackT;
    const path = endpoint === "generation" ? "/v1/images/generations" : endpoint === "edit" ? "/v1/images/edits" : "/v1/images/variations";
    const url = createApiUrl(apiBaseUrl, path);
    const key = endpoint === "generation" ? "generation" : endpoint;
    const id = endpoint === "generation" ? "image-generation-openai" : endpoint === "edit" ? "image-edit-openai" : "image-variation-openai";

    const parameters = endpoint === "generation"
        ? createOpenAiImageGenerationParameters(t)
        : endpoint === "edit"
            ? createOpenAiImageEditParameters(t)
            : createOpenAiImageVariationParameters(t);

    const body = endpoint === "generation"
        ? {
            model: "openai/gpt-image-1.5",
            prompt: "A friendly robot reading API documentation in a bright workspace.",
            size: "1024x1024",
            n: 1,
        }
        : endpoint === "edit"
            ? {
                model: "openai/gpt-image-1.5",
                prompt: "Add warm sunrise lighting and keep the original composition.",
                size: "1024x1024",
                n: 1,
            }
            : {
                model: "openai/dall-e-2",
                size: "1024x1024",
                n: 1,
            };

    const titleKey = `images.openai.${key}.title`;
    const requestPrompt = endpoint === "generation"
        ? `"prompt": "A friendly robot reading API documentation in a bright workspace.",`
        : endpoint === "edit"
            ? `"prompt": "Add warm sunrise lighting and keep the original composition.",\n    "images": [{ "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." }],`
            : `"image": { "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." },`;

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
                fields: endpoint === "edit" ? [
                    { name: "model", label: "model", value: "openai/gpt-image-1.5", required: true },
                    { name: "prompt", label: "prompt", value: "Add warm sunrise lighting and keep the original composition.", required: true },
                    { name: "image", label: "image", type: "file" as const, accept: "image/*", required: true, multiple: true },
                    { name: "mask", label: "mask", type: "file" as const, accept: "image/*" },
                    { name: "size", label: "size", value: "1024x1024" },
                    { name: "n", label: "n", value: "1" },
                ] : [
                    { name: "model", label: "model", value: "openai/dall-e-2", required: true },
                    { name: "image", label: "image", type: "file" as const, accept: "image/*", required: true },
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
    model: "${endpoint === "variation" ? "openai/dall-e-2" : "openai/gpt-image-1.5"}",
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
            ...(endpoint === "variation" ? [] : [{
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
            }]),
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
                : endpoint === "edit"
                    ? { id: "openai-create-variation", label: t("images.openai.edit.relatedVariation"), href: "/gateway/openai/create-variation" }
                    : { id: "openai-create-image", label: t("images.openai.variation.relatedGeneration"), href: "/gateway/openai/create-image" },
        ],
    };
};

type CreateAiSdkEndpointDocOptions = {
    apiBaseUrl?: string;
    t?: (key: string) => string;
};

const createAiSdkRerankDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("rerank.aiSdk.description")}
    </p>
);

const createAiSdkVideoDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("video.aiSdk.description")}
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

const aiSdkVideoResponseExample = `{
  "providerMetadata": {
    "gateway": {
      "cost": 0.0456789
    },
    "google": {}
  },
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

const createAiSdkVideoTestDescription = (t: (key: string) => string): ReactNode => (
    <p style={{ margin: 0 }}>
        {t("video.aiSdk.testDescription")}
    </p>
);

export const createRerankEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const t = options.t ?? fallbackT;
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
            { id: "ai-video", label: t("rerank.aiSdk.relatedVideo"), href: "/gateway/ai/video" },
        ],
    };
};

export const createVideoEndpointDoc = (options: CreateAiSdkEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const t = options.t ?? fallbackT;
    const aiSdkVideoUrl = createApiUrl(apiBaseUrl, "/api/videos");

    return {
        id: "video-ai-sdk",
        title: t("video.aiSdk.title"),
        surface: t("video.aiSdk.surface"),
        method: "POST",
        path: "/api/videos",
        url: aiSdkVideoUrl,
        summary: t("video.aiSdk.summary"),
        description: createAiSdkVideoDescription(t),
        auth: createGatewayAuth(t),
        parameters: createAiSdkVideoParameters(t),
        test: {
            label: t("video.aiSdk.testLabel"),
            modalTitle: t("video.aiSdk.testModalTitle"),
            description: createAiSdkVideoTestDescription(t),
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
                code: `const response = await fetch("${aiSdkVideoUrl}", {
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

const video = await response.json();`,
            },
            {
                id: "curl-ai-sdk-video",
                label: "cURL",
                language: "bash",
                code: `curl ${aiSdkVideoUrl} \\
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
                code: `const response = await fetch("${aiSdkVideoUrl}", {
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

const video = await response.json();`,
            },
        ],
        responses: [
            {
                status: "200",
                description: t("video.aiSdk.responses.json"),
                example: {
                    id: "ai-sdk-video-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkVideoResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: t("video.aiSdk.errors.badRequest") },
            { status: "401", description: t("video.aiSdk.errors.unauthorized") },
            { status: "429", description: t("video.aiSdk.errors.rateLimited") },
        ],
        related: [
            { id: "gateway-overview", label: t("gateway.common.relatedGatewayOverview"), href: "/gateway" },
            { id: "ai-rerank", label: t("video.aiSdk.relatedRerank"), href: "/gateway/ai/rerank" },
        ],
    };
};

