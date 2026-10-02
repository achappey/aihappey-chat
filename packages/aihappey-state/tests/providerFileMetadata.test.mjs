import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Load these pure helpers without initializing the browser-only global store or relying on dist.
const loadSource = async (path) => {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
};
const { resolveFileProviderMetadata, withFileProviderMetadata } = await loadSource("../src/slices/providerFileMetadata.ts");
const { defaultProviderFileMetadata } = await loadSource("../src/slices/defaultProviderFileMetadata.ts");

test("untouched defaults and missing legacy settings attach no metadata", () => {
    for (const mediaType of ["image/png", "application/pdf", "video/mp4", "text/plain", "application/unknown"]) {
        assert.equal(resolveFileProviderMetadata(mediaType, defaultProviderFileMetadata), undefined);
        assert.equal(resolveFileProviderMetadata(mediaType), undefined);
    }
});

test("exact MIME match precedes default regardless of order and supports multiple MIME types", () => {
    const metadata = { openai: [
        { id: "default", config: { detail: "low" } },
        { id: "image", mediaTypes: ["image/png", "image/jpeg"], config: { detail: "original" } },
    ] };
    for (const mediaType of ["image/png", "image/jpeg"]) {
        assert.deepEqual(resolveFileProviderMetadata(mediaType, metadata), { openai: { detail: "original" } });
    }
    for (const mediaType of ["image/tiff", "application/pdf", "image/png; charset=utf-8", "IMAGE/PNG"]) {
        assert.deepEqual(resolveFileProviderMetadata(mediaType, metadata), { openai: { detail: "low" } });
    }
});

test("an empty exact configuration does not fall through to the default", () => {
    assert.equal(resolveFileProviderMetadata("image/png", { openai: [
        { id: "default", config: { detail: "high" } },
        { id: "image", mediaTypes: ["image/png"], config: {} },
    ] }), undefined);
});

test("native shapes are passed through without routing descriptors or sibling options", () => {
    const metadata = structuredClone(defaultProviderFileMetadata);
    metadata.openai[0].config = { detail: "original" };
    metadata.openai[1].config = { detail: "low" };
    metadata.anthropic[0].config = { transformations: { oversized_image: "error" } };
    metadata.anthropic[1].config = { citations: { enabled: false }, context: "Document context" };
    metadata.google[0].config = { resolution: "ultra_high" };
    metadata.google[1].config = { resolution: "high", processing: { type: "static", start_offset: "10.5s", end_offset: "30s", fps: 2 } };
    assert.deepEqual(resolveFileProviderMetadata("image/png", metadata), {
        openai: { detail: "original" },
        anthropic: { transformations: { oversized_image: "error" } },
        google: { resolution: "ultra_high" },
    });
    assert.deepEqual(resolveFileProviderMetadata("application/pdf", metadata), {
        openai: { detail: "low" }, anthropic: { citations: { enabled: false }, context: "Document context" },
    });
    assert.deepEqual(resolveFileProviderMetadata("video/mp4", metadata), {
        openai: { detail: "low" }, google: metadata.google[1].config,
    });
});

test("unmatched providers are omitted and an empty MIME list acts as default", () => {
    assert.deepEqual(resolveFileProviderMetadata("text/plain", {
        google: [{ id: "image", mediaTypes: ["image/png"], config: { resolution: "high" } }],
        openai: [{ id: "default", mediaTypes: [], config: { detail: "auto" } }],
    }), { openai: { detail: "auto" } });
});

test("file application preserves unrelated metadata without mutating the original part", () => {
    const part = { type: "file", mediaType: "image/png", url: "https://example.com/image.png",
        providerMetadata: { other: { id: "existing" }, openai: { fileId: "existing-id" } } };
    const updated = withFileProviderMetadata(part, {
        openai: [{ id: "image", mediaTypes: ["image/png"], config: { detail: "high" } }],
    });
    assert.deepEqual(updated.providerMetadata, { other: { id: "existing" }, openai: { fileId: "existing-id", detail: "high" } });
    assert.equal(part.providerMetadata.openai.detail, undefined);
    assert.equal(updated.url, part.url);
    assert.equal(withFileProviderMetadata(part), part);
});

test("later configuration edits cannot mutate native options in built messages", () => {
    const metadata = { anthropic: [{ id: "image", mediaTypes: ["image/png"], config: { transformations: { oversized_image: "error" } } }] };
    const result = resolveFileProviderMetadata("image/png", metadata);
    metadata.anthropic[0].config.transformations.oversized_image = "downsize";
    assert.equal(result.anthropic.transformations.oversized_image, "error");
});
