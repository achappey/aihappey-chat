import type { Icon } from "@modelcontextprotocol/sdk/types";

export * from "./chat";
export * from "./theme";
export * from "./mcp";
export * from "./agents";
export * from "./models";

/**
 * Primary provider category used for UI filtering and catalog grouping.
 *
 * This is intentionally a lean primary-category taxonomy.
 * A provider can expose many capabilities, but should have one main category.
 */
export type ProviderCategory =
    /**
     * Owns or develops foundation, language, reasoning, or domain AI models.
     *
     * Examples: OpenAI, Anthropic, Google, Mistral, Cohere, DeepSeek.
     */
    | "model_provider"

    /**
     * Provides unified API access, routing, fallback, keys, billing,
     * or aggregation across multiple AI providers.
     *
     * Examples: OpenRouter, Requesty, Portkey, LiteRouter, HyperRouter.
     */
    | "gateway_router"

    /**
     * Provides GPU infrastructure, model hosting, serverless inference,
     * deployment, or AI runtime infrastructure.
     *
     * Examples: RunPod, Baseten, DeepInfra, Modal, Nebius, Fireworks.
     */
    | "inference_compute"

    /**
     * Provides image, video, audio, voice, speech, music, design,
     * or other creative generation APIs.
     *
     * Examples: Runway, ElevenLabs, Stability AI, Luma, HeyGen, Deepgram.
     */
    | "media_voice"

    /**
     * Provides search, crawling, RAG, embeddings, reranking,
     * vector search, OCR, document intelligence, or data APIs.
     *
     * Examples: Tavily, Exa, Brave, Pinecone, Jina, Voyage AI.
     */
    | "search_data"

    /**
     * Provides agents, coding tools, AI apps, workspaces, workflow tools,
     * translation, governance, or vertical/niche APIs.
     *
     * Examples: GitHub, Cline, OpenHands, BrowserUse, DeepL, Deepgram-style apps if app-first.
     */
    | "app_tools";


export type Provider = {
    name: string;
    description?: string
    experimental?: boolean
    icons: Icon[];
    urls?: ProviderUrls;
    providerCountry?: string
    inferenceRegions?: string[]
    category?: ProviderCategory
};

export type ProviderUrls = {
    homepage: string;
    docs?: string;
    console?: string
    termsOfService?: string
    privacyPolicy?: string
    pricing?: string
};
