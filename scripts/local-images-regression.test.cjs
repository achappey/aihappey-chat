const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Ajv = require("ajv");
const { load } = require("./credential-test-loader.cjs");

const directory = "packages/aihappey-core/src/features/tools/toolcalls/";
const ai = {
    ...load("packages/aihappey-ai/src/createImageProvider.ts"),
    ...load("packages/aihappey-ai/src/createResponsesProvider.ts"),
};
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const dataUrl = `data:image/png;base64,${png}`;
const apiImage = body => ({
    images: Array.from({ length: body.n ?? 1 }, () => dataUrl), warnings: [],
    providerMetadata: { gateway: { cost: 0.1 } },
    response: { timestamp: "2026-10-20T12:00:00Z", modelId: body.model },
});
const answer = {
    status: "completed", output: [
        { type: "reasoning", encrypted_content: "DO-NOT-RETURN-RESPONSE" },
        { type: "message", role: "assistant", content: [{ type: "output_text", text: "There is a house and a tree." }] },
        { type: "image_generation_call", result: "DO-NOT-RETURN-IMAGE" },
    ],
};

function fixture(options = {}) {
    const calls = [], storedImages = [], storedFiles = [];
    const settings = {
        n: 1, size: "1024x1024", aspectRatio: "1:1", seed: 7,
        providerImageMetadata: { openai: { quality: "low" } },
        customHeaders: { "X-OpenAI-Key": "OPENAI-SECRET", "X-Google-Key": "GOOGLE-SECRET", "X-Custom": "retained" },
        remoteAgentModels: [], customProviders: {},
    };
    const state = { store: { getState: () => settings } };
    const module = load(directory + "localImages.ts", { "aihappey-ai": ai, "aihappey-state": state });
    const images = {
        items: [], // Intentionally never updated: same-run calls must use storage, not this stale snapshot.
        list: async () => [...storedImages],
        add: async imageResponse => {
            if (options.libraryFailure) throw Error("quota error");
            const item = { id: `library-${storedImages.length + 1}`, imageResponse };
            storedImages.push(item);
            return item;
        },
    };
    const files = {
        items: [],
        list: async () => [...storedFiles],
        read: async id => storedFiles.find(item => item.id === id),
        create: async file => {
            if (options.fileFailure || (options.partialFileFailure && storedFiles.length > 0)) throw Error("file quota error");
            const item = { ...file, id: `file-${storedFiles.length + 1}` };
            storedFiles.push(item);
            return item;
        },
    };
    const config = {
        baseUrl: "https://normal.test", agentEndpoint: "https://agent.test",
        endpoints: { images: "/api/images", responses: "/v1/responses" },
        getAccessToken: async () => "NORMAL-TOKEN",
        getAgentAccessToken: async () => { throw Error("must not use agent token"); },
        fetch: async (url, init) => {
            const body = JSON.parse(init.body);
            calls.push({ url, init, body, headers: Object.fromEntries(new Headers(init.headers)) });
            if (options.fetch) return options.fetch(url, init, body);
            return Response.json(url.endsWith("/api/images") ? apiImage(body) : answer);
        },
    };
    const deps = { config, files, images, settings };
    const run = (toolName, input, signal) => module.executeLocalImagesTool({ toolName, input }, deps, signal);
    return { ...module, run, deps, settings, calls, storedImages, storedFiles, state };
}

const generation = { model: "openai/image-model", prompt: "A house and a tree" };
const fileRef = id => ({ source: "files", id, imageIndex: 0 });
const savedRef = (id, imageIndex = 0) => ({ source: "images", id, imageIndex });
const addFile = (f, name = "mask.png", type = "image/png", data = Buffer.from(png, "base64")) => {
    const file = { id: `file-${f.storedFiles.length + 1}`, name, data: new Blob([data], { type }) };
    f.storedFiles.push(file);
    return file;
};

test("text-to-image supports omitted or explicitly null options, reaches only images API, and saves results", async () => {
    const f = fixture();
    const result = await f.run("local_images_generate", {
        ...generation, n: null, size: null, aspectRatio: null, seed: null, inputImages: [], mask: null,
    });
    assert.equal(result.isError, false);
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].url, "https://normal.test/api/images");
    assert.deepEqual(f.calls[0].body, {
        model: generation.model, prompt: generation.prompt, n: 1, size: "1024x1024", aspectRatio: "1:1", seed: 7,
        files: [], providerOptions: f.settings.providerImageMetadata,
    });
    assert.equal(f.calls[0].body.mask, undefined);
    assert.equal(f.storedImages.length, 1);
    assert.equal(f.storedImages[0].imageResponse.images[0], dataUrl);
    assert.deepEqual(result.structuredContent.images, [savedRef("library-1")]);
    assert.match(result.content[0].text, /Done.*Images library/);
    assert.equal(result.content[1].data, png);
    assert.equal(JSON.stringify(result.structuredContent).includes(png), false);
    await f.run("local_images_generate", generation);
    await f.run("local_images_generate", { ...generation, inputImages: null });
    assert.equal(f.calls.length, 3);
});

test("strict function schemas can require all optional properties without forcing a fabricated mask", () => {
    const f = fixture();
    const strictify = schema => {
        if (Array.isArray(schema)) return schema.map(strictify);
        if (!schema || typeof schema !== "object") return schema;
        const result = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, strictify(v)]));
        if (result.type === "object") {
            result.required = Object.keys(result.properties ?? {});
            result.additionalProperties = false;
        }
        return result;
    };
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(strictify(f.localImagesGenerateTool.inputSchema));
    const input = { ...generation, n: null, size: null, aspectRatio: null, seed: null, inputImages: [], mask: null };
    assert.equal(validate(input), true, JSON.stringify(validate.errors));
    input.inputImages = [fileRef("file-1")];
    input.mask = { source: "files", id: "file-2", imageIndex: null };
    assert.equal(validate(input), true, JSON.stringify(validate.errors));
    assert.match(f.localImagesGenerateTool.description, /NEW image.*mask: null/);
});

test("generate, inspect with normal Responses, read, and refine work back-to-back without React rerender", async () => {
    const f = fixture();
    const generated = await f.run("local_images_generate", generation);
    const ref = generated.structuredContent.images[0];
    const inspected = await f.run("local_images_ask", { model: "google/vision-model", question: "Does this contain a tree?", images: [ref] });
    assert.deepEqual(inspected, { isError: false, content: [{ type: "text", text: "There is a house and a tree." }] });
    const request = f.calls[1];
    assert.equal(request.url, "https://normal.test/v1/responses");
    assert.deepEqual(request.body, {
        model: "google/vision-model", background: false, store: false, stream: false, tools: [],
        input: [{ role: "user", content: [
            { type: "input_text", text: "Does this contain a tree?" },
            { type: "input_image", image_url: dataUrl },
        ] }],
    });
    const read = await f.run("local_images_read", { image: ref });
    assert.equal(read.content[1].data, png);
    const mask = addFile(f);
    await f.run("local_images_generate", { ...generation, inputImages: [ref], mask: fileRef(mask.id), seed: 0 });
    const edit = f.calls[2];
    assert.equal(edit.url, "https://normal.test/api/images");
    assert.equal(edit.body.seed, 0);
    assert.deepEqual(edit.body.files, [{ type: "file", mediaType: "image/png", data: png }]);
    assert.deepEqual(edit.body.mask, { type: "file", mediaType: "image/png", data: png });
    assert.equal(f.storedImages.length, 2);
    // Unmasked refinement is valid too, not just new image generation.
    await f.run("local_images_generate", { ...generation, inputImages: [ref], mask: null });
    assert.equal(f.calls[3].body.mask, undefined);
});

test("Local file references tolerate zero/null index and exact unique filenames from the reported log", async () => {
    const f = fixture();
    const file = addFile(f, "full-edit.png");
    for (const imageIndex of [0, null, undefined]) {
        const result = await f.run("local_images_read", { image: { source: "files", id: file.id, imageIndex } });
        assert.equal(result.content[1].data, png);
    }
    await f.run("local_images_generate", {
        ...generation, inputImages: [fileRef(file.id)], mask: fileRef("full-edit.png"),
    });
    assert.equal(f.calls[0].body.mask.data, png);
    await f.run("local_images_ask", { model: "openai/vision", question: "What is shown?", images: [fileRef("full-edit.png")] });
    assert.equal(f.calls[1].body.input[0].content[1].image_url, dataUrl);
    addFile(f, "full-edit.png");
    await assert.rejects(f.run("local_images_read", { image: fileRef("full-edit.png") }), /ambiguous/);
});

test("return-content toggle removes every image payload but preserves completion, references, previews and storage", async () => {
    const f = fixture();
    const { mapToolOutputContentForRequest } = load("packages/aihappey-core/src/features/chat/engine/mapToolOutputContentForRequest.ts");
    const output = await f.run("local_images_generate", generation);
    const messages = [{ parts: [{ type: "tool-local_images_generate", providerExecuted: false, output }] }];
    const before = JSON.stringify(messages);
    const settings = { text: true, images: false, audio: true, video: true, documents: true };
    const filtered = mapToolOutputContentForRequest(messages, settings);
    assert.equal(JSON.stringify(filtered).includes(png), false);
    assert.match(filtered[0].parts[0].output.content[0].text, /Done/);
    assert.equal(filtered[0].parts[0].output.structuredContent.images[0].id, "library-1");
    assert.equal(JSON.stringify(messages), before);
    assert.equal(f.storedImages[0].imageResponse.images[0], dataUrl);
    assert.equal(mapToolOutputContentForRequest(messages, { ...settings, images: true })[0].parts[0].output.content[1].data, png);
    // Explicit inspection sends selected image input despite the image-return toggle, returning text only.
    const inspected = await f.run("local_images_ask", { model: "google/vision", question: "Check", images: output.structuredContent.images });
    assert.equal(JSON.stringify(inspected).includes(png), false);
});

test("generation and inspection scope credentials to their requested model, retaining normal auth/custom fetch", async () => {
    const f = fixture();
    await f.run("local_images_generate", generation);
    await f.run("local_images_ask", { model: "google/vision", question: "Check", images: [savedRef("library-1")] });
    assert.equal(f.calls[0].headers["x-openai-key"], "OPENAI-SECRET");
    assert.equal(f.calls[0].headers["x-google-key"], undefined);
    assert.equal(f.calls[1].headers["x-google-key"], "GOOGLE-SECRET");
    assert.equal(f.calls[1].headers["x-openai-key"], undefined);
    for (const call of f.calls) {
        assert.equal(call.headers.authorization, "Bearer NORMAL-TOKEN");
        assert.equal(call.headers["x-custom"], "retained");
    }
});

test("batching preserves all generated images and metadata; library listing is paginated metadata only", async () => {
    const f = fixture();
    f.settings.n = 3;
    f.settings.maxImagesPerCall = 2;
    const result = await f.run("local_images_generate", generation);
    assert.deepEqual(f.calls.map(call => call.body.n), [2, 1]);
    assert.equal(result.structuredContent.images.length, 3);
    assert.equal(f.storedImages[0].imageResponse.providerMetadata.gateway.cost, 0.2);
    const listed = await f.run("local_images_list", { offset: 1, limit: 1 });
    assert.equal(listed.structuredContent.total, 3);
    assert.equal(listed.structuredContent.items.length, 1);
    assert.equal(listed.structuredContent.items[0].imageIndex, 1);
    assert.equal(JSON.stringify(listed).includes(png), false);
});

test("library failure falls back to Local files and those references can immediately be inspected", async () => {
    const f = fixture({ libraryFailure: true });
    const result = await f.run("local_images_generate", generation);
    assert.equal(result.isError, false);
    assert.match(result.content[0].text, /Local files instead/);
    assert.deepEqual(result.structuredContent.images, [{ source: "files", id: "file-1" }]);
    assert.equal(f.storedFiles[0].data.type, "image/png");
    await f.run("local_images_ask", { model: "openai/vision", question: "Check", images: result.structuredContent.images });
    assert.equal(f.calls[1].body.input[0].content[1].image_url, dataUrl);
    const absent = fixture();
    absent.deps.images = null;
    assert.equal((await absent.run("local_images_generate", generation)).isError, false);
});

test("complete or partial persistence failure is reported without losing generated result previews", async () => {
    for (const options of [{ libraryFailure: true, fileFailure: true }, { libraryFailure: true, partialFileFailure: true }]) {
        const f = fixture(options);
        const result = await f.run("local_images_generate", { ...generation, n: 2 });
        assert.equal(result.isError, true);
        assert.equal(result.content.filter(item => item.type === "image").length, 2);
        assert.equal(result.structuredContent.savedCount, f.storedFiles.length);
        assert.equal(result.structuredContent.images.length, f.storedFiles.length);
        assert.match(result.content[0].text, /do not automatically regenerate/);
    }
});

test("invalid inputs fail before network calls and no fake mask is silently treated as a real mask", async () => {
    const f = fixture();
    for (const [input, error] of [
        [{ ...generation, prompt: " " }, /prompt/],
        [{ ...generation, model: "gpt-image-1" }, /provider-qualified/],
        [{ ...generation, n: 0 }, /Invalid n/],
        [{ ...generation, n: 1.5 }, /Invalid n/],
        [{ ...generation, size: "bogus" }, /size/],
        [{ ...generation, aspectRatio: "square" }, /aspect ratio/],
        [{ ...generation, seed: 0.5 }, /seed/],
        [{ ...generation, inputImages: [], mask: fileRef("none") }, /set mask to null/],
        [{ ...generation, inputImages: [savedRef("missing")] }, /not found/],
        [{ ...generation, inputImages: [{ source: "files", id: "x", imageIndex: 2 }] }, /null or 0/],
        [{ ...generation, inputImages: [{ source: "url", id: "https://other.test/image" }] }, /source/],
    ]) await assert.rejects(f.run("local_images_generate", input), error);
    const text = addFile(f, "not-image.txt", "text/plain", "not an image");
    await assert.rejects(f.run("local_images_read", { image: fileRef(text.id) }), /not an image/);
    await assert.rejects(f.run("local_images_ask", { model: "openai/vision", question: "Check", images: [] }), /array/);
    await assert.rejects(f.run("local_images_list", { limit: -1 }), /limit/);
    assert.equal(f.calls.length, 0);
});

test("bad image indices, remote data, non-PNG masks and missing files fail without requests", async () => {
    const f = fixture();
    await f.run("local_images_generate", generation);
    f.calls.length = 0;
    await assert.rejects(f.run("local_images_read", { image: savedRef("library-1", 8) }), /index/);
    await assert.rejects(f.run("local_images_read", { image: fileRef("missing") }), /not found/);
    const jpeg = addFile(f, "mask.jpg", "image/jpeg", Buffer.from([255, 216, 255, 217]));
    await assert.rejects(f.run("local_images_generate", { ...generation, inputImages: [savedRef("library-1")], mask: fileRef(jpeg.id) }), /PNG/);
    f.storedImages[0].imageResponse.images[0] = "https://remote.test/image.png";
    await assert.rejects(f.run("local_images_read", { image: savedRef("library-1") }), /base64/);
    assert.equal(f.calls.length, 0);
});

test("base64 and binary image formats are normalized with the actual MIME type", async () => {
    const f = fixture();
    f.storedImages.push({ id: "formats", imageResponse: {
        images: [png, new Uint8Array([255, 216, 255, 217]), `data:image/webp;base64,${Buffer.from("RIFF1234WEBP").toString("base64")}`],
        response: { timestamp: "2026-10-20", modelId: generation.model },
    } });
    for (const [imageIndex, mimeType] of ["image/png", "image/jpeg", "image/webp"].entries()) {
        const result = await f.run("local_images_read", { image: savedRef("formats", imageIndex) });
        assert.equal(result.content[1].mimeType, mimeType);
    }
});

test("API failures, empty generations, incomplete responses and non-text responses are not reported as success", async () => {
    const failing = fixture({ fetch: async () => new Response("upstream failure", { status: 503 }) });
    await assert.rejects(failing.run("local_images_generate", generation), /Image generation failed/);
    assert.equal(failing.storedImages.length, 0);
    const empty = fixture({ fetch: async () => Response.json({ images: [] }) });
    await assert.rejects(empty.run("local_images_generate", generation), /no images/);
    for (const response of [{ status: "failed", error: {} }, { status: "incomplete" }, { status: "queued" }, { status: "completed", output: [] }]) {
        const f = fixture({ fetch: async () => Response.json(response) });
        const file = addFile(f);
        await assert.rejects(f.run("local_images_ask", { model: "openai/vision", question: "Check", images: [fileRef(file.id)] }), /did not complete|no text/);
    }
    const file = addFile(failing);
    await assert.rejects(failing.run("local_images_ask", { model: "openai/vision", question: "Check", images: [fileRef(file.id)] }), /Responses API failed/);
});

test("abort signals cancel images and Responses network calls and prevent late image persistence", async () => {
    for (const name of ["local_images_generate", "local_images_ask"]) {
        const controller = new AbortController();
        const f = fixture({ fetch: async (_url, init) => {
            assert.equal(init.signal, controller.signal);
            controller.abort();
            init.signal.throwIfAborted();
        } });
        const file = addFile(f);
        const input = name === "local_images_generate" ? generation : { model: "openai/vision", question: "Check", images: [fileRef(file.id)] };
        await assert.rejects(f.run(name, input, controller.signal), error => error.name === "AbortError");
        assert.equal(f.storedImages.length, 0);
        const calls = f.calls.length;
        await assert.rejects(f.run(name, input, controller.signal), error => error.name === "AbortError");
        assert.equal(f.calls.length, calls);
    }
});

test("existing plugin identity/mask behavior is retained and masks return immediately reusable saved references", async () => {
    const f = fixture();
    const original = global.OffscreenCanvas;
    global.OffscreenCanvas = class {
        getContext() { return { clearRect() {}, fillRect() {} }; }
        async convertToBlob() { return new Blob([Buffer.from(png, "base64")], { type: "image/png" }); }
    };
    try {
        const plugin = load(directory + "useLocalImagesToolCall.ts", {
            "aihappey-ai": ai, "aihappey-state": f.state,
            "aihappey-images": { useImages: () => f.deps.images },
            react: { createContext: () => ({}), useContext: () => ({ config: f.deps.config }), useCallback: fn => fn },
        });
        assert.equal(plugin.localImagesPluginDef.name, "local-images");
        for (const name of ["local_mask_create", "local_images_generate", "local_images_read", "local_images_list", "local_images_ask"]) {
            assert.ok(plugin.localImagesPluginDef.tools.some(tool => tool.name === name));
            assert.equal(plugin.localImagesPluginDef.match(name), true);
        }
        assert.equal(plugin.localImagesPluginDef.match("local_images_unknown"), false);
        const runtime = plugin.useLocalImagesRuntime(f.deps.files);
        for (const boxes of [[], [{ x: 0, y: 0, w: 10, h: 10 }]]) {
            const mask = await runtime.handle({ toolName: "local_mask_create", input: { name: "mask.png", width: 10, height: 10, boxes } });
            assert.equal(mask.isError, false);
            assert.equal(mask.structuredContent.image.source, "files");
            assert.match(mask.content[0].text, /File ID: file-/);
            await runtime.handle({ toolName: "local_images_generate", input: { ...generation, inputImages: [mask.structuredContent.image], mask: mask.structuredContent.image } });
        }
        const error = await runtime.handle({ toolName: "local_images_generate", input: { ...generation, n: 0 } });
        assert.equal(error.isError, true);
        const root = path.resolve(__dirname, "..");
        for (const file of ["useTools.ts", "toolCatalogItems.ts", "toolcalls/useOnToolCall.ts"]) {
            assert.match(fs.readFileSync(path.join(root, "packages/aihappey-core/src/features/tools", file), "utf8"), /localImagesPluginDef/);
        }
        const { usePlugins } = load(directory + "usePlugins.ts", { react: { useMemo: fn => fn() } });
        assert.equal(usePlugins([], [plugin.localImagesPluginDef], { "local-images": runtime }, {}).plugins.length, 0);
        assert.equal(usePlugins(["local-images"], [plugin.localImagesPluginDef], { "local-images": runtime }, {}).plugins.length, 1);
    } finally { global.OffscreenCanvas = original; }
});
