import { useCallback } from "react";
import type { FilesContextType } from "aihappey-files";
import type { Tool } from "@modelcontextprotocol/sdk/types";

/* ============================================================
   Result helpers (copy-paste compatible)
============================================================ */

type ToolTextResult = {
    isError: boolean;
    content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
    isError: false,
    content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
    isError: true,
    content: [
        {
            type: "text",
            text: err instanceof Error ? err.message : String(err),
        },
    ],
});

/* ============================================================
   Tool definition (STATIC)
============================================================ */

export const localMaskCreateTool: Tool = {
    name: "local_mask_create",
    title: "Create mask file",
    description:
        "Create a PNG alpha mask for image editing. Transparent = edit allowed, opaque = keep original.",
    inputSchema: {
        type: "object",
        properties: {
            name: { type: "string", description: "Mask file name (e.g. mask.png)" },
            width: { type: "number", description: "Image width in pixels" },
            height: { type: "number", description: "Image height in pixels" },
            boxes: {
                type: "array",
                description: "Rectangular edit regions (transparent holes)",
                items: {
                    type: "object",
                    properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                        w: { type: "number" },
                        h: { type: "number" },
                    },
                    required: ["x", "y", "w", "h"],
                },
            },
        },
        required: ["name", "width", "height", "boxes"],
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
};

/* ============================================================
   Plugin definition (STATIC)
============================================================ */

export const localImagesPluginDef = {
    name: "local-images",
    match: (toolName: string) => toolName === "local_mask_create",
    tools: [localMaskCreateTool],
};

/* ============================================================
   Canvas helpers
============================================================ */

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

async function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas
): Promise<Blob> {
    if ("convertToBlob" in canvas) {
        return canvas.convertToBlob({ type: "image/png" });
    }

    return new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
            b => (b ? resolve(b) : reject(new Error("Failed to export canvas"))),
            "image/png"
        );
    });
}

/* ============================================================
   Runtime
============================================================ */

type LocalMaskToolCall = {
    toolName: "local_mask_create";
    input?: any;
};

export function useLocalImagesRuntime(files?: FilesContextType | null) {
    const handle = useCallback(
        async (toolCall: LocalMaskToolCall): Promise<ToolTextResult> => {
            try {
                if (!files) throw new Error("Files context not available.");
                if (toolCall.toolName !== "local_mask_create")
                    throw new Error(`Unsupported tool: ${toolCall.toolName}`);

                const { name, width, height, boxes } = toolCall.input ?? {};

                const w = Number(width);
                const h = Number(height);

                if (!name) throw new Error("Missing mask file name.");
                if (!Number.isFinite(w) || w <= 0) throw new Error("Invalid width.");
                if (!Number.isFinite(h) || h <= 0) throw new Error("Invalid height.");
                if (!Array.isArray(boxes) || !boxes.length)
                    throw new Error("boxes must be a non-empty array.");

                const canvas = createCanvas(w, h);
                const ctx = (canvas as any).getContext("2d");
                if (!ctx) throw new Error("Canvas 2D context not available.");

                // 1) default = keep everything (opaque)
                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.fillRect(0, 0, w, h);

                // 2) punch transparent holes (edit allowed)
                ctx.globalCompositeOperation = "destination-out";

                for (const b of boxes) {
                    const x = Math.round(Number(b.x));
                    const y = Math.round(Number(b.y));
                    const bw = Math.round(Number(b.w));
                    const bh = Math.round(Number(b.h));

                    if (
                        !Number.isFinite(x) ||
                        !Number.isFinite(y) ||
                        !Number.isFinite(bw) ||
                        !Number.isFinite(bh)
                    ) {
                        continue;
                    }

                    ctx.fillRect(x, y, bw, bh);
                }

                ctx.globalCompositeOperation = "source-over";

                const blob = await canvasToBlob(canvas);

                await files.create({
                    name,
                    mimeType: "image/png",
                    data: blob,
                });

                return ok(`Mask created: ${name}`);
            } catch (e) {
                return fail(e);
            }
        },
        [files]
    );

    return {
        name: localImagesPluginDef.name,
        handle,
    };
}
