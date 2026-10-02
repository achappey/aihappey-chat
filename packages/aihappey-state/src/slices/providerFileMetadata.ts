import type { ProviderFileMetadata } from "aihappey-types";

/** Resolve one native configuration per provider, never merging exact and default rules. */
export const resolveFileProviderMetadata = (
    mediaType: string,
    metadata?: ProviderFileMetadata,
): Record<string, Record<string, any>> | undefined => {
    const result: Record<string, Record<string, any>> = {};
    for (const [provider, entries] of Object.entries(metadata ?? {})) {
        if (!Array.isArray(entries)) continue;
        const selected = entries.find((entry) => entry?.mediaTypes?.includes(mediaType))
            ?? entries.find((entry) => entry && !entry.mediaTypes?.length);
        const config = selected?.config;
        if (config && typeof config === "object" && !Array.isArray(config)
            && Object.values(config).some((value) => value !== undefined)) {
            // Snapshot native options so later form edits cannot change an already-built message.
            result[provider] = JSON.parse(JSON.stringify(config));
        }
    }
    return Object.keys(result).length ? result : undefined;
};

/** Leave unconfigured parts alone and preserve metadata unrelated to the selected options. */
export const withFileProviderMetadata = <T extends {
    mediaType: string;
    providerMetadata?: Record<string, any>;
}>(part: T, metadata?: ProviderFileMetadata): T => {
    const selected = resolveFileProviderMetadata(part.mediaType, metadata);
    if (!selected) return part;
    const providerMetadata = { ...part.providerMetadata };
    for (const [provider, config] of Object.entries(selected)) {
        providerMetadata[provider] = { ...providerMetadata[provider], ...config };
    }
    return { ...part, providerMetadata };
};
