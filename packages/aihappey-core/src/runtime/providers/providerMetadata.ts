import type { Icon } from "@modelcontextprotocol/sdk/types";

export type Provider = {
    name: string;
    url: string;
    description?: string
    experimental?: boolean
    icons: Icon[];
    hosting?: "us" | "europe" | "asia" | "unknown";
};

/**
 * Compatibility re-export.
 *
 * Prefer importing [`PROVIDERS`](packages/aihappey-core/src/runtime/providers/providers.ts:1)
 * directly in new code.
 */
export { PROVIDERS } from "./providers";
