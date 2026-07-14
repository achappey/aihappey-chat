import type { ReactNode } from "react";
import type { DocsEndpointDoc, DocsHomeCard, DocsNavSection, DocsTopNavItem } from "aihappey-docs-components";

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
            { id: "openai-chat", label: "Chat completions", href: "/gateway/openai/chat-completions", badge: "POST" },
            { id: "openai-models", label: "Models", href: "/gateway/openai/models", badge: "GET" },
            { id: "openai-realtime", label: "Realtime", href: "/gateway/openai/realtime", badge: "POST" },
            { id: "openai-responses", label: "Responses", href: "/gateway/openai/responses", badge: "POST" },
            { id: "openai-skills", label: "Skills", href: "/gateway/openai/skills", badge: "GET" },
            { id: "openai-speech", label: "Speech", href: "/gateway/openai/speech", badge: "POST" },
            { id: "openai-transcriptions", label: "Transcriptions", href: "/gateway/openai/transcriptions", badge: "POST" },
        ],
    },
    {
        id: "anthropic-compatible",
        title: "Anthropic compatible",
        items: [
            { id: "anthropic-messages", label: "Messages", href: "/gateway/anthropic/messages", badge: "POST" }
        ],
    },
    {
        id: "ai-sdk",
        title: "AI SDK",
        items: [
            { id: "ai-chat", label: "Chat", href: "/gateway/ai/chat", badge: "POST" },
            { id: "ai-rerank", label: "Rerank", href: "/gateway/ai/rerank", badge: "POST" },
            { id: "ai-speech", label: "Speech", href: "/gateway/ai/speech", badge: "POST" },
            { id: "ai-transcriptions", label: "Transcriptions", href: "/gateway/ai/transcriptions", badge: "POST" },
            { id: "ai-ui", label: "UI", href: "/gateway/ai/ui", badge: "POST" },
            { id: "ai-video", label: "Video", href: "/gateway/ai/video", badge: "POST" },
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
            { id: "agents-openai-models", label: "Models", href: "/agents/openai/models", badge: "soon" },
            { id: "agents-openai-create-response", label: "Create response", href: "/agents/openai/responses/create", badge: "soon" },
            { id: "agents-openai-retrieve-response", label: "Retrieve response", href: "/agents/openai/responses/retrieve", badge: "soon" },
            { id: "agents-openai-delete-response", label: "Delete response", href: "/agents/openai/responses/delete", badge: "soon" },
            { id: "agents-openai-list-responses", label: "List responses", href: "/agents/openai/responses/list", badge: "soon" },
        ],
    },
    {
        id: "agent-ai-sdk",
        title: "AI SDK",
        items: [
            { id: "agents-ai-sdk-chat", label: "Chat", href: "/agents/ai/chat", badge: "soon" }
        ],
    },
];

type SpeechSurface = "openai" | "ai-sdk";

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

const openAiSpeechDescription: ReactNode = (
    <p style={{ margin: 0 }}>
        Create speech audio through the OpenAI-compatible audio endpoint. This route accepts the OpenAI text-to-speech request shape and returns raw
        audio bytes by default, or server-sent events when <code>stream_format</code> is set to <code>sse</code>.
    </p>
);

const aiSdkSpeechDescription: ReactNode = (
    <p style={{ margin: 0 }}>
        Generate speech audio through the AI SDK gateway route. This route uses the Vercel AI SDK speech request shape and returns JSON metadata with
        the generated audio encoded as base64.
    </p>
);

const speechAuth: ReactNode = (
    <p style={{ margin: 0 }}>
        Send a bearer token with every request.
    </p>
);

const openAiSpeechParameters = [
    { name: "model", type: "string", required: true, description: "Speech-capable model or provider-qualified model identifier." },
    { name: "input", type: "string", required: true, description: "Text to synthesize into audio." },
    { name: "voice", type: "string", required: true, description: "Voice identifier supported by the selected model or provider." },
    { name: "response_format", type: "string", required: false, description: "Optional output format such as mp3, wav, opus, flac, aac, or pcm when supported by the provider." },
    { name: "instructions", type: "string", required: false, description: "Optional provider instructions for tone, delivery, or speaking style." },
    { name: "speed", type: "number", required: false, description: "Optional speech speed multiplier when supported by the provider." },
    { name: "stream_format", type: "string", required: false, description: "Set to sse to receive speech.audio.delta and speech.audio.done events instead of a binary audio response." },
];

const aiSdkSpeechParameters = [
    { name: "model", type: "string", required: true, description: "Speech-capable model or provider-qualified model identifier." },
    { name: "text", type: "string", required: true, description: "Text to synthesize into audio." },
    { name: "voice", type: "string", required: false, description: "Voice identifier supported by the selected model or provider. Some providers require this value." },
    { name: "outputFormat", type: "string", required: false, description: "Optional output format such as mp3, wav, opus, flac, aac, or pcm when supported by the provider." },
    { name: "instructions", type: "string", required: false, description: "Optional provider instructions for tone, delivery, or speaking style." },
    { name: "speed", type: "number", required: false, description: "Optional speech speed multiplier when supported by the provider." },
    { name: "language", type: "string", required: false, description: "Optional language hint for providers that support explicit speech language selection." },
    { name: "providerOptions", type: "object", required: false, description: "Provider-specific options keyed by provider identifier, for example openai, deepgram, elevenlabs, minimax, or together." },
];

const aiSdkSpeechResponseExample = `{
  "providerMetadata": {
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
    "modelId": "openai/tts-1"
  },
  "request": {
    "body": {
      "model": "tts-1",
      "input": "Hallo daar, welkom bij aihappey docs.",
      "voice": "alloy"
    }
  }
}`;

const openAiSpeechTestDescription: ReactNode = (
    <p style={{ margin: 0 }}>
        Edit the bearer token, model, voice, and input, then send a live request. Audio responses can be played directly in the modal or downloaded.
    </p>
);

const aiSdkSpeechTestDescription: ReactNode = (
    <p style={{ margin: 0 }}>
        Edit the bearer token and JSON body, then send a live request. JSON responses are formatted automatically, and binary audio responses can still be downloaded.
    </p>
);

export const createSpeechEndpointDoc = (surface: SpeechSurface, options: CreateSpeechEndpointDocOptions = {}): DocsEndpointDoc => {
    const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl);
    const openAiSpeechUrl = createApiUrl(apiBaseUrl, "/v1/audio/speech");
    const aiSdkSpeechUrl = createApiUrl(apiBaseUrl, "/api/speech");

    if (surface === "openai") {
        return {
            id: "speech-openai",
            title: "Create speech",
            surface: "OpenAI compatible",
            method: "POST",
            path: "/v1/audio/speech",
            url: openAiSpeechUrl,
            summary: "Generate speech audio from text using the OpenAI-compatible audio speech endpoint.",
            description: openAiSpeechDescription,
            auth: speechAuth,
            parameters: openAiSpeechParameters,
            test: {
                label: "Test",
                modalTitle: "Test OpenAI-compatible speech",
                description: openAiSpeechTestDescription,
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
                    description: "Binary audio is returned by default with the generated file content in the response body.",
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
                    description: "When stream_format is sse, the endpoint emits OpenAI-style speech audio events and terminates with [DONE].",
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
                { status: "400", description: "The request body is missing input, model, or voice, or the selected model is not available." },
                { status: "401", description: "The request did not include a valid bearer token." },
                { status: "500", description: "The provider failed while generating speech audio. SSE requests receive an error event instead." },
            ],
            related: [
                { id: "gateway-overview", label: "Gateway overview", href: "/gateway" },
                { id: "other-surface", label: "AI SDK speech", href: "/gateway/ai/speech" },
            ],
        };
    }

    return {
        id: "speech-ai-sdk",
        title: "Generate speech",
        surface: "AI SDK",
        method: "POST",
        path: "/api/speech",
        url: aiSdkSpeechUrl,
        summary: "Generate speech audio from text using the AI SDK gateway speech endpoint.",
        description: aiSdkSpeechDescription,
        auth: speechAuth,
        parameters: aiSdkSpeechParameters,
        test: {
            label: "Test",
            modalTitle: "Test AI SDK speech",
            description: aiSdkSpeechTestDescription,
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
                description: "Speech request accepted and JSON metadata is returned with the generated audio encoded in audio.base64.",
                example: {
                    id: "ai-sdk-speech-response",
                    label: "JSON",
                    language: "json",
                    code: aiSdkSpeechResponseExample,
                },
            },
        ],
        errors: [
            { status: "400", description: "The selected model is not available or the provider rejects the request payload." },
            { status: "401", description: "The request did not include a valid bearer token." },
            { status: "429", description: "The selected provider or model deployment is currently rate limited." },
        ],
        related: [
            { id: "gateway-overview", label: "Gateway overview", href: "/gateway" },
            { id: "other-surface", label: "OpenAI-compatible speech", href: "/gateway/openai/speech" },
        ],
    };
};

