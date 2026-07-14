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
            { id: "openai-chat", label: "Chat completions", href: "/gateway/openai/chat-completions", badge: "soon" },
            { id: "openai-models", label: "Models", href: "/gateway/openai/models", badge: "soon" },
            { id: "openai-realtime", label: "Realtime", href: "/gateway/openai/realtime", badge: "soon" },
            { id: "openai-responses", label: "Responses", href: "/gateway/openai/responses", badge: "soon" },
            { id: "openai-skills", label: "Skills", href: "/gateway/openai/skills", badge: "soon" },
            { id: "openai-speech", label: "Speech", href: "/gateway/openai/speech", badge: "POST" },
            { id: "openai-transcriptions", label: "Transcriptions", href: "/gateway/openai/transcriptions", badge: "soon" },
        ],
    },
    {
        id: "anthropic-compatible",
        title: "Anthropic compatible",
        items: [
            { id: "anthropic-messages", label: "Messages", href: "/gateway/anthropic/messages", badge: "soon" }
        ],
    },
    {
        id: "ai-sdk",
        title: "AI SDK",
        items: [
            { id: "ai-chat", label: "Chat", href: "/gateway/ai/chat", badge: "soon" },
            { id: "ai-rerank", label: "Rerank", href: "/gateway/ai/rerank", badge: "soon" },
            { id: "ai-speech", label: "Speech", href: "/gateway/ai/speech", badge: "POST" },
            { id: "ai-transcriptions", label: "Transcriptions", href: "/gateway/ai/transcriptions", badge: "soon" },
            { id: "ai-ui", label: "UI", href: "/gateway/ai/ui", badge: "soon" },
            { id: "ai-video", label: "Video", href: "/gateway/ai/video", badge: "soon" },
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
            { id: "agents-openai-responses", label: "Responses", href: "/agents/openai/responses", badge: "soon" },
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

const speechDescription: ReactNode = (
    <p style={{ margin: 0 }}>
        Create speech audio from text input through the gateway. This page is intentionally the first fully worked endpoint so the docs structure,
        side navigation, examples, request tables, and response sections can be reused for the remaining endpoints.
    </p>
);

const speechAuth: ReactNode = (
    <p style={{ margin: 0 }}>
        Send a bearer token with every request. In local samples this may be a development token; hosted environments should use the configured
        downstream access token flow for the gateway.
    </p>
);

const speechParameters = [
    { name: "model", type: "string", required: true, description: "Speech-capable model or provider deployment identifier." },
    { name: "input", type: "string", required: true, description: "Text to synthesize into audio." },
    { name: "voice", type: "string", required: true, description: "Voice identifier supported by the configured provider." },
    { name: "format", type: "string", required: false, description: "Optional audio format such as mp3, wav, opus, or provider-specific values." },
    { name: "speed", type: "number", required: false, description: "Optional speech speed multiplier when supported by the provider." },
];

const speechResponseExample = `{
  "id": "speech_01JZEXAMPLE",
  "model": "tts-1",
  "voice": "alloy",
  "mimeType": "audio/mpeg",
  "audioUrl": "https://api.example.com/files/speech_01JZEXAMPLE.mp3",
  "usage": {
    "inputTokens": 12
  }
}`;

export const createSpeechEndpointDoc = (surface: "openai" | "ai-sdk"): DocsEndpointDoc => ({
    id: `speech-${surface}`,
    title: surface === "openai" ? "Create speech" : "Generate speech",
    surface: surface === "openai" ? "OpenAI compatible" : "AI SDK",
    method: "POST",
    path: surface === "openai" ? "/v1/audio/speech" : "/api/speech",
    summary: "Generate speech audio from text using the shared gateway speech endpoint.",
    description: speechDescription,
    auth: speechAuth,
    parameters: speechParameters,
    requestExamples: [
        surface === "openai"
            ? {
                id: "curl-openai",
                label: "cURL",
                language: "bash",
                code: `curl https://your-aihappey-host.example/v1/audio/speech \\
  -H "Authorization: Bearer $AIHAPPEY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/tts-1",
    "voice": "alloy",
    "input": "Hallo daar, welkom bij AIHappey docs."
  }'`,
            }
            : {
                id: "typescript-ai-sdk",
                label: "TypeScript",
                language: "ts",
                code: `const response = await fetch("/api/speech", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    model: "openai/tts-1",
    voice: "alloy",
    text: "Hallo daar, welkom bij AIHappey docs.",
  }),
});

const speech = await response.json();`,
            },
    ],
    responses: [
        {
            status: "200",
            description: "Speech request accepted and the generated audio metadata is returned.",
            example: {
                id: "speech-response",
                label: "JSON",
                language: "json",
                code: speechResponseExample,
            },
        },
    ],
    errors: [
        { status: "400", description: "The request body is missing required fields or uses an unsupported voice/format combination." },
        { status: "401", description: "The request did not include a valid bearer token." },
        { status: "429", description: "The selected provider or model deployment is currently rate limited." },
    ],
    related: [
        { id: "gateway-overview", label: "Gateway overview", href: "/gateway" },
        { id: "other-surface", label: surface === "openai" ? "AI SDK speech" : "OpenAI-compatible speech", href: surface === "openai" ? "/gateway/ai/speech" : "/gateway/openai/speech" },
    ],
});

