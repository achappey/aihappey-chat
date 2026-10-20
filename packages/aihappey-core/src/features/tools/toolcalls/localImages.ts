import type { CallToolResult, ImageContent, Tool } from "@modelcontextprotocol/sdk/types";
import type { ImageModelV4CallOptions, ImageModelV4File } from "@ai-sdk/provider";
import { createImageProvider, createResponsesProvider } from "aihappey-ai";
import type { ImageResponse } from "aihappey-ai";
import type { FilesContextType } from "aihappey-files";
import type { ImageStore } from "aihappey-images";
import type { ChatConfig } from "../../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../../provider-credentials/scopedRequest";
import { getImageFileExtension } from "../../images/imageContentUtils";

const imageReferenceSchema = {
    type: "object" as const,
    description: "A real saved image, never a placeholder. Source 'images' uses an Images library item ID and zero-based imageIndex; source 'files' uses a Local file ID (or exact unique filename).",
    properties: {
        source: { type: "string", enum: ["images", "files"] },
        id: { type: "string", minLength: 1 },
        imageIndex: { type: ["integer", "null"], minimum: 0, description: "Images library: zero-based index, null defaults to 0. Local files: use null (0 also accepted)." },
    },
    required: ["source", "id"],
    additionalProperties: false,
};

const readAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const localImagesListTool: Tool = {
    name: "local_images_list",
    title: "List saved images",
    description: "List Images library references and model/date metadata, without image data. Local files are discoverable with local_files_list. Use the references to read, ask questions about, or refine images.",
    inputSchema: {
        type: "object",
        properties: {
            offset: { type: ["integer", "null"], minimum: 0 },
            limit: { type: ["integer", "null"], minimum: 1, maximum: 500, description: "Null or omitted defaults to 50." },
        },
    },
    annotations: readAnnotations,
};

export const localImagesReadTool: Tool = {
    name: "local_images_read",
    title: "Read saved image",
    description: "Read an image from the Images library or Local files. Image content sent back to AI respects the user's tool-output settings. Use local_images_ask to ask a vision model a specific question instead.",
    inputSchema: { type: "object", properties: { image: imageReferenceSchema }, required: ["image"] },
    annotations: readAnnotations,
};

export const localImagesGenerateTool: Tool = {
    name: "local_images_generate",
    title: "Generate or refine images",
    description: "Generate images through the dedicated images API, not Responses. For a NEW image use inputImages: [] and mask: null; never invent a mask/file ID. Saves results to the Images library (Local files fallback) and returns reusable references. To refine, supply saved inputImages; a PNG alpha mask is optional even when refining. Discover exact provider-qualified image model IDs with local_ai_models_search (type image). Null or omitted generation options use the user's image settings. Use local_images_ask on a returned reference to check the result, then call this tool again to refine it. Image tool output respects user settings.",
    inputSchema: {
        type: "object",
        properties: {
            model: { type: "string", minLength: 1, description: "Exact provider-qualified image model ID from the local model catalog, e.g. openai/gpt-image-1, not bare gpt-image-1." },
            prompt: { type: "string", minLength: 1 },
            n: { type: ["integer", "null"], minimum: 1, maximum: 100 },
            size: { type: ["string", "null"], pattern: "^[1-9][0-9]*x[1-9][0-9]*$" },
            aspectRatio: { type: ["string", "null"], pattern: "^[1-9][0-9]*:[1-9][0-9]*$" },
            seed: { type: ["integer", "null"] },
            inputImages: { type: ["array", "null"], items: imageReferenceSchema, maxItems: 16, description: "Use [] or null to create a new image. Only provide actual saved references for editing." },
            // Strict function calling may require every property, so omission alone is not enough.
            mask: { anyOf: [imageReferenceSchema, { type: "null" }], description: "Use null for no mask, especially for NEW images. Only supply a real PNG alpha mask reference for masked editing with inputImages. Never use an ID like 'none'." },
        },
        required: ["model", "prompt"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
};

export const localImagesAskTool: Tool = {
    name: "local_images_ask",
    title: "Ask questions about images",
    description: "Ask a vision-capable language model a question about saved Images library or Local file images through the normal Responses API. Returns only the answer as text; does not generate images or invoke tools. Use to inspect a generated image before refining it. This explicitly sends selected images as model input, independently of the setting that filters images returned in tool output. Discover language models with local_ai_models_search.",
    inputSchema: {
        type: "object",
        properties: {
            model: { type: "string", minLength: 1, description: "Exact provider-qualified vision-capable language model ID from the catalog." },
            question: { type: "string", minLength: 1 },
            images: { type: "array", items: imageReferenceSchema, minItems: 1, maxItems: 16 },
        },
        required: ["model", "question", "images"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
};

export const localImageTools = [localImagesListTool, localImagesReadTool, localImagesGenerateTool, localImagesAskTool];

type ImageReference = { source: "images" | "files"; id: string; imageIndex?: number };
type ImageSettings = {
    customHeaders?: Record<string, string>;
    n?: number;
    size?: string;
    aspectRatio?: string;
    seed?: number;
    maxImagesPerCall?: number;
    providerImageMetadata?: ImageModelV4CallOptions["providerOptions"];
};
type Dependencies = {
    config: ChatConfig;
    files?: FilesContextType | null;
    images?: ImageStore | null;
    settings: ImageSettings;
};

const requiredText = (value: unknown, name: string): string => {
    if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${name}.`);
    return value.trim();
};

const integer = (value: unknown, name: string, min: number, max = Number.MAX_SAFE_INTEGER): number => {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max)
        throw new Error(`Invalid ${name}: expected an integer between ${min} and ${max}.`);
    return value;
};

const imageReference = (value: any): ImageReference => {
    if (!value || (value.source !== "images" && value.source !== "files"))
        throw new Error("Image source must be 'images' or 'files'.");
    const id = requiredText(value.id, "image reference id");
    if (value.source === "files") {
        if (value.imageIndex != null && value.imageIndex !== 0) throw new Error("Local file imageIndex must be null or 0.");
        return { source: "files", id };
    }
    return { source: "images", id, imageIndex: integer(value.imageIndex ?? 0, "imageIndex", 0) };
};

const referenceList = (value: unknown, required: boolean): ImageReference[] => {
    if (value == null && !required) return [];
    if (!Array.isArray(value) || value.length > 16 || (required && !value.length))
        throw new Error("Expected an array of saved image references (1–16 for questions, 0–16 for generation).");
    return value.map(imageReference);
};

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
};

/** Normalize binary, raw base64 and data URLs; never fetch remote URLs. */
const imageContent = (value: string | Uint8Array, mediaType?: string): ImageContent => {
    let data = typeof value === "string" ? value : bytesToBase64(value);
    const match = /^data:(image\/[^;,]+);base64,([\s\S]+)$/i.exec(data);
    if (match) {
        mediaType = match[1].toLowerCase();
        data = match[2];
    }
    data = data.replace(/\s/g, "");
    let binary: string;
    try { binary = atob(data); } catch { throw new Error("Image data must be base64 or an image data URL."); }
    if (!binary.length) throw new Error("Image data is empty.");
    // Bare base64 from the images API has no explicit MIME type. Detect common formats.
    const detected = binary.startsWith("\x89PNG\r\n\x1a\n") ? "image/png"
        : binary.startsWith("\xff\xd8\xff") ? "image/jpeg"
        : binary.startsWith("GIF8") ? "image/gif"
        : binary.startsWith("RIFF") && binary.slice(8, 12) === "WEBP" ? "image/webp"
        : binary.startsWith("BM") ? "image/bmp"
        : binary.slice(4, 8) === "ftyp" && /avif|avis/.test(binary.slice(8, 32)) ? "image/avif"
        : undefined;
    const mimeType = mediaType || detected;
    if (!mimeType?.startsWith("image/")) throw new Error("Unsupported image format or missing image MIME type.");
    return { type: "image", data, mimeType };
};

const resolveImage = async (ref: ImageReference, deps: Dependencies): Promise<ImageContent> => {
    if (ref.source === "files") {
        let file = await deps.files?.read(ref.id);
        if (!file && deps.files) {
            const matches = (await deps.files.list()).filter(item => item.name === ref.id);
            if (matches.length > 1) throw new Error(`Local filename '${ref.id}' is ambiguous; use its file ID.`);
            file = matches[0];
        }
        if (!file) throw new Error(`Local image file '${ref.id}' not found.`);
        if (!file.data.type.startsWith("image/")) throw new Error("Local file is not an image.");
        return imageContent(new Uint8Array(await file.data.arrayBuffer()), file.data.type);
    }
    // Do not use the hook's items snapshot: a previous tool call may just have saved this image.
    const item = (await deps.images?.list())?.find(item => item.id === ref.id);
    if (!item) throw new Error(`Images library item '${ref.id}' not found.`);
    const image = item.imageResponse.images[ref.imageIndex ?? 0];
    if (image === undefined) throw new Error(`Image index ${ref.imageIndex ?? 0} not found in '${ref.id}'.`);
    return imageContent(image);
};

const toModelFile = (image: ImageContent): ImageModelV4File => ({
    type: "file", mediaType: image.mimeType, data: image.data,
});

const contentResult = (text: string, images: ImageContent[], metadata: Record<string, unknown>, isError = false): CallToolResult => ({
    isError,
    // Image payloads belong ONLY here, so the shared request-only content filter can remove them.
    content: [{ type: "text", text }, ...images],
    structuredContent: metadata,
});

const persistImages = async (result: ImageResponse, generated: ImageContent[], deps: Dependencies): Promise<CallToolResult> => {
    try {
        if (!deps.images) throw new Error("Images library unavailable.");
        const saved = await deps.images.add(result);
        const refs = generated.map((_, imageIndex) => ({ source: "images", id: saved.id, imageIndex }));
        return contentResult(`Done. Generated ${refs.length} image(s) and saved to the Images library.`, generated,
            { images: refs, model: result.response.modelId, count: refs.length });
    } catch {
        // Never discard a successful generation just because library persistence failed.
        // Report fallback/partial failure explicitly so the caller does not blindly regenerate.
        const refs: ImageReference[] = [];
        if (deps.files) {
            try {
                const name = `generated_${crypto.randomUUID()}`;
                for (const [index, image] of generated.entries()) {
                    const bytes = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
                    const file = await deps.files.create({
                        name: `${name}_${index + 1}.${getImageFileExtension(image.mimeType)}`,
                        mimeType: image.mimeType,
                        data: new Blob([bytes], { type: image.mimeType }),
                    });
                    refs.push({ source: "files", id: file.id });
                }
            } catch { /* Report how many files were actually persisted below. */ }
        }
        const complete = refs.length === generated.length;
        return contentResult(complete
            ? `Done. Generated ${generated.length} image(s). Images library save failed or is unavailable; saved to Local files instead.`
            : `Generated ${generated.length} image(s), but storage failed. Only ${refs.length} saved to Local files. Unsaved images remain in this tool result; do not automatically regenerate.`,
            generated, { images: refs, model: result.response.modelId, count: generated.length, storage: "files", savedCount: refs.length }, !complete);
    }
};

/** Network/storage execution is separate from React so multi-call workflows can be tested directly. */
export async function executeLocalImagesTool(
    toolCall: { toolName: string; input?: any }, deps: Dependencies, signal?: AbortSignal,
): Promise<CallToolResult> {
    signal?.throwIfAborted();
    const input = toolCall.input ?? {};
    if (toolCall.toolName === "local_images_list") {
        if (!deps.images) throw new Error("Images library unavailable.");
        const offset = integer(input.offset ?? 0, "offset", 0);
        const limit = integer(input.limit ?? 50, "limit", 1, 500);
        const items = (await deps.images.list()).flatMap(item => item.imageResponse.images.map((_, imageIndex) => ({
            source: "images", id: item.id, imageIndex,
            model: item.imageResponse.response.modelId,
            createdAt: item.imageResponse.response.timestamp,
        })));
        signal?.throwIfAborted();
        return { content: [], structuredContent: { total: items.length, offset, items: items.slice(offset, offset + limit) } };
    }
    if (toolCall.toolName === "local_images_read") {
        const ref = imageReference(input.image);
        const image = await resolveImage(ref, deps);
        signal?.throwIfAborted();
        return contentResult("Done. Read saved image.", [image], { image: ref });
    }
    if (toolCall.toolName !== "local_images_generate" && toolCall.toolName !== "local_images_ask")
        throw new Error(`Unsupported tool: ${toolCall.toolName}`);

    const model = requiredText(input.model, "model");
    if (!/^[^/\s]+\/.+/.test(model))
        throw new Error("Use an exact provider-qualified model ID from local_ai_models_search, e.g. openai/gpt-image-1, not a bare model name.");
    const { config, settings } = deps;
    const fetch = createCredentialScopedFetch(config.fetch);

    if (toolCall.toolName === "local_images_ask") {
        const question = requiredText(input.question, "question");
        const refs = referenceList(input.images, true);
        const images = await Promise.all(refs.map(ref => resolveImage(ref, deps)));
        const headers = await buildOperationHeaders(config, settings.customHeaders, model);
        signal?.throwIfAborted();
        // Deliberately use the normal endpoint/token, never the agent endpoint or image generation tools.
        const client = createResponsesProvider({ baseUrl: config.baseUrl + config.endpoints.responses, headers, fetch });
        const response = await client.create({
            model, background: false, store: false, stream: false, tools: [],
            input: [{ role: "user", content: [
                { type: "input_text", text: question },
                ...images.map(image => ({ type: "input_image" as const, image_url: `data:${image.mimeType};base64,${image.data}` })),
            ] }],
        }, { signal });
        signal?.throwIfAborted();
        if (response.error || (response.status && response.status !== "completed"))
            throw new Error(`Image question did not complete (${response.status ?? "error"}).`);
        const answer = (response.output ?? [])
            .filter(item => item.type === "message" && item.role === "assistant")
            .flatMap(item => item.content ?? [])
            .filter(part => part.type === "output_text" && typeof part.text === "string")
            .map(part => part.text).join("\n").trim();
        if (!answer) throw new Error("Image question returned no text answer.");
        return { isError: false, content: [{ type: "text", text: answer }] };
    }

    const prompt = requiredText(input.prompt, "prompt");
    const refs = referenceList(input.inputImages, false);
    const maskRef = input.mask == null ? undefined : imageReference(input.mask);
    if (maskRef && !refs.length) throw new Error("A mask requires at least one input image. For NEW image generation, set mask to null and inputImages to []. Do not invent a mask reference.");
    const n = integer(input.n ?? settings.n ?? 1, "n", 1, 100);
    const max = settings.maxImagesPerCall == null ? undefined : integer(settings.maxImagesPerCall, "maxImagesPerCall", 1);
    const size = input.size ?? settings.size;
    const aspectRatio = input.aspectRatio ?? settings.aspectRatio;
    if (size != null && (typeof size !== "string" || !/^[1-9]\d*x[1-9]\d*$/.test(size))) throw new Error("Invalid image size.");
    if (aspectRatio != null && (typeof aspectRatio !== "string" || !/^[1-9]\d*:[1-9]\d*$/.test(aspectRatio))) throw new Error("Invalid aspect ratio.");
    const seed = input.seed ?? settings.seed;
    if (seed != null) integer(seed, "seed", Number.MIN_SAFE_INTEGER);
    const sourceImages = await Promise.all(refs.map(ref => resolveImage(ref, deps)));
    const mask = maskRef ? await resolveImage(maskRef, deps) : undefined;
    if (mask && mask.mimeType !== "image/png") throw new Error("Mask must be a PNG image.");
    const headers = await buildOperationHeaders(config, settings.customHeaders, model);
    signal?.throwIfAborted();
    const provider = createImageProvider({ baseUrl: config.baseUrl + config.endpoints.images, headers, fetch });
    const result = await provider.imageModel(model, max).doGenerate({
        prompt, n, size: size as ImageModelV4CallOptions["size"],
        aspectRatio: aspectRatio as ImageModelV4CallOptions["aspectRatio"], seed,
        files: sourceImages.map(toModelFile), mask: mask ? toModelFile(mask) : undefined,
        providerOptions: settings.providerImageMetadata ?? {}, abortSignal: signal,
    });
    signal?.throwIfAborted();
    if (!result.images.length) throw new Error("Image generation returned no images.");
    const generated = result.images.map(image => imageContent(image));
    // Normalize binary/raw output for the existing Images library renderer as well as future reads.
    return persistImages({ ...result, images: generated.map(image => `data:${image.mimeType};base64,${image.data}`) }, generated, deps);
}
