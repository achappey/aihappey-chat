/** Native per-file options. Routing information never belongs in provider metadata. */
export type OpenAIFileConfig = {
    detail?: "auto" | "low" | "high" | "original";
};

export type AnthropicImageFileConfig = {
    transformations?: { oversized_image?: "downsize" | "error" };
};

export type AnthropicDocumentFileConfig = {
    citations?: { enabled?: boolean };
    context?: string;
};

export type GoogleMediaResolution = "low" | "medium" | "high" | "ultra_high";
export type GoogleImageFileConfig = { resolution?: GoogleMediaResolution };
export type GoogleStaticMediaProcessing = {
    type: "static";
    start_offset?: string;
    end_offset?: string;
    fps?: number;
};
export type GoogleVideoFileConfig = GoogleImageFileConfig & {
    name?: string;
    processing?: "static" | "agentic" | GoogleStaticMediaProcessing;
};

export type ProviderFileConfig = {
    id: string;
    /** Exact MIME types; omitted/empty means the default for all other files. */
    mediaTypes?: string[];
    config: Record<string, any>;
};

export type ProviderFileMetadata = Record<string, ProviderFileConfig[]>;
