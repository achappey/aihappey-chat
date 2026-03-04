import type { Icon } from "@modelcontextprotocol/sdk/types";

export * from "./chat";
export * from "./theme";
export * from "./mcp";
export * from "./agents";
export * from "./models";

export type Provider = {
    name: string;
    description?: string
    experimental?: boolean
    icons: Icon[];
    urls?: ProviderUrls;
    providerCountry?: string
    inferenceRegions?: string[]
};

export type ProviderUrls = {
    homepage: string;
    docs?: string;
    console?: string
    termsOfService?: string
    privacyPolicy?: string
    pricing?: string
};
