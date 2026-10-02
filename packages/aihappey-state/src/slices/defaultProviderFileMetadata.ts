import type { ProviderFileMetadata } from "aihappey-types";

const imageMediaTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const defaultProviderFileMetadata: ProviderFileMetadata = {
    openai: [
        { id: "image", mediaTypes: [...imageMediaTypes], config: {} },
        { id: "default", config: {} },
    ],
    anthropic: [
        { id: "image", mediaTypes: [...imageMediaTypes], config: {} },
        { id: "document", mediaTypes: ["application/pdf", "text/plain"], config: {} },
    ],
    google: [
        {
            id: "image",
            mediaTypes: [...imageMediaTypes, "image/heic", "image/heif", "image/bmp", "image/tiff"],
            config: {},
        },
        {
            id: "video",
            mediaTypes: ["video/mp4", "video/mpeg", "video/mpg", "video/mov", "video/avi",
                "video/x-flv", "video/webm", "video/wmv", "video/3gpp"],
            config: {},
        },
    ],
};
