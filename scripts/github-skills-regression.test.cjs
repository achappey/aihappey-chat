const assert = require("node:assert/strict");
const { test } = require("node:test");
const JSZip = require("jszip");
const { load } = require("./credential-test-loader.cjs");

// Node has Blob but no FileReader; adapt only JSZip's browser input boundary.
function BrowserZip() { return new JSZip(); }
BrowserZip.loadAsync = async value => JSZip.loadAsync(value instanceof Blob ? await value.arrayBuffer() : value);
const zipMock = { jszip: BrowserZip };
const { GitHubSkillsClient, parseGitHubSkillUrl } = load("packages/aihappey-skills/src/githubSkills.ts", zipMock);
const { parseSkillMarkdown } = load("packages/aihappey-skills/src/skillFrontmatter.ts");
const sha = n => n.toString(16).padStart(40, "0");
const commit = sha(1), root = sha(2), collection = sha(3), sample = sha(4), group = sha(5), nested = sha(6), broken = sha(7);
const base = "https://api.github.com/repos/owner/repo";
const manifest = "---\nname: sample\ndescription: >-\n  Use this sample when testing.\nmetadata:\n  version: \"1\"\n---\nRead references/notes.md.";
const directory = (path, id) => ({ path, sha: id, type: "tree", mode: "040000" });
const data = {
    "SKILL.md": Buffer.from(manifest),
    "scripts/run.py": Buffer.from("print('never run')"),
    "assets/logo.bin": Buffer.from([0, 255, 128, 1]),
    "references/notes.md": Buffer.from("A reference"),
    "assets/a file #é.bin": Buffer.from([255, 0, 123]),
};
const fileEntries = Object.entries(data).map(([path, bytes], i) => ({ path, sha: sha(100 + i), type: "blob", mode: i === 1 ? "100755" : "100644", size: bytes.length }));
function fixture(options = {}) {
    const calls = []; let active = 0, maxActive = 0, rawCount = 0, fail = options.fail;
    const tree = entries => ({ truncated: false, tree: entries });
    const routes = new Map([
        [base, { private: false, default_branch: "main" }],
        [base + "/commits/main", { sha: commit, commit: { tree: { sha: root } } }],
        [base + "/commits/feature%2Fbranch", { sha: commit, commit: { tree: { sha: root } } }],
        [base + "/git/trees/" + root, tree([directory("skills", collection), directory("src", sha(8)), directory("direct", sha(9))])],
        [base + "/git/trees/" + collection + "?recursive=1", tree([
            directory("sample", sample), directory(".curated", group), directory(".curated/nested", nested),
            directory(".curated/nested/scripts", sha(10)), directory("broken", broken),
            ...fileEntries.map(f => ({ ...f, path: "sample/" + f.path })),
        ])],
        [base + "/git/trees/" + collection, tree([directory("sample", sample), directory(".curated", group), directory("broken", broken)])],
        [base + "/git/trees/" + sample, tree([directory("assets", sha(11))])],
        [base + "/git/trees/" + sample + "?recursive=1", tree(fileEntries)],
        [base + "/git/trees/" + broken + "?recursive=1", tree([])],
    ]);
    const fetch = async (url, init) => {
        calls.push({ url, init });
        assert.ok(!url.includes("/git/blobs/") && !url.includes("/contents/"), "never use per-file REST endpoints");
        if (url.startsWith("https://raw.githubusercontent.com/")) {
            assert.equal(init.headers, undefined); assert.equal(init.credentials, "omit");
            assert.ok(url.startsWith(`https://raw.githubusercontent.com/owner/repo/${commit}/skills/sample/`));
            rawCount++; active++; maxActive = Math.max(maxActive, active);
            try {
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(resolve, 5);
                    init.signal.addEventListener("abort", () => { clearTimeout(timer); reject(init.signal.reason); }, { once: true });
                });
                if (fail) return new Response("failure", { status: fail });
                const path = decodeURIComponent(url.split(`/skills/sample/`)[1]);
                const bytes = data[path]; assert.ok(bytes, "only files inside the selection are downloaded");
                return new Response(options.incomplete ? bytes.subarray(1) : bytes);
            } finally { active--; }
        }
        if (options.rateLimit) return new Response("limit", { status: 403, headers: { "x-ratelimit-remaining": "0" } });
        if (!routes.has(url)) return new Response("not found", { status: 404 });
        return Response.json(routes.get(url));
    };
    return { client: new GitHubSkillsClient(fetch), calls, routes, stats: () => ({ active, maxActive, rawCount }), setFail: value => { fail = value; } };
}
const signal = () => new AbortController().signal;

test("URL validation supports repository, tree, blob, raw, and slash-containing refs", () => {
    for (const url of ["https://github.com/owner/repo", "https://github.com/owner/repo.git/", "https://github.com/owner/repo/tree/feature/branch/skills/sample", "https://github.com/owner/repo/blob/main/skills/sample/SKILL.md", "https://raw.githubusercontent.com/owner/repo/refs/heads/main/skills/sample/SKILL.md"]) assert.equal(parseGitHubSkillUrl(url).repo, "repo");
    for (const url of ["http://github.com/owner/repo", "https://github.com.evil.test/owner/repo", "https://secret@github.com/owner/repo", "https://github.com/owner/repo/blob/main/other.md", "https://github.com/owner/repo/tree/main/%2e%2e/private", "https://github.com/owner/repo/tree/main/a%2fb"]) assert.throws(() => parseGitHubSkillUrl(url), e => e.code === "invalid-url");
});

test("discovery uses four requests, no candidate probes/content, bounded grouping, and caches trees", async () => {
    const f = fixture(); const updates = [];
    const result = await f.client.discover("https://github.com/owner/repo", signal(), value => updates.push(value.candidates.length));
    assert.equal(f.calls.length, 4); assert.equal(f.stats().rawCount, 0);
    assert.ok(result.candidates.some(c => c.path === "skills/broken"), "invalid candidates are listed without validation");
    assert.ok(result.candidates.some(c => c.path === "skills/.curated/nested"));
    assert.ok(!result.candidates.some(c => c.path === "skills/.curated/nested/scripts"));
    assert.ok(!f.calls.some(c => c.url === base + "/git/trees/" + sha(8)), "never crawl unrelated src directory");
    assert.ok(!f.calls.some(c => c.url === base + "/git/trees/" + root + "?recursive=1"));
    assert.ok(updates.length > 1);
    await f.client.discover("https://github.com/owner/repo", signal());
    assert.equal(f.calls.length, 6, "only repository and current commit resolution repeat");
});

test("selected downloads use raw CDN, preserve all binaries, bound concurrency, and reuse successful cache", async () => {
    const f = fixture(); const found = await f.client.discover("https://github.com/owner/repo", signal());
    const candidate = found.candidates.find(c => c.path === "skills/sample");
    const archive = await f.client.download(found, candidate, signal());
    const zip = await JSZip.loadAsync(await archive.arrayBuffer());
    for (const [path, bytes] of Object.entries(data)) assert.deepEqual(await zip.file("sample/" + path).async("nodebuffer"), bytes);
    assert.equal(f.stats().rawCount, Object.keys(data).length);
    assert.equal(f.stats().maxActive, 4); assert.equal(f.stats().active, 0);
    const count = f.calls.length; await f.client.download(found, candidate, signal());
    assert.equal(f.calls.length, count, "cached selected listing and contents avoid repeat network downloads");
    assert.equal(f.calls.filter(c => c.url.startsWith(base)).length, 5, "one selected listing, not one REST request per file");
});

test("missing manifests, invalid YAML, and specification violations fail at import, not discovery", async () => {
    const f = fixture(); const found = await f.client.discover("https://github.com/owner/repo", signal());
    await assert.rejects(f.client.download(found, found.candidates.find(c => c.path === "skills/broken"), signal()), e => e.code === "missing-manifest");
    assert.equal(f.stats().rawCount, 0);
    assert.equal(parseSkillMarkdown(manifest, "sample", true).frontmatter.description, "Use this sample when testing.");
    for (const text of [manifest.replace("name: sample", "name: Upper"), manifest.replace("name: sample", "name: other"), manifest.replace('version: "1"', "version: 1"), manifest.replace("description: >-\n  Use this sample when testing.", "description: " + "x".repeat(1025)), manifest.replace("name: sample", "name: [invalid"), manifest.replace("metadata:", "compatibility: ''\nmetadata:")]) assert.ok(parseSkillMarkdown(text, "sample", true).diagnostics.some(d => d.severity === "error"));
    assert.ok(parseSkillMarkdown(manifest.replace("name: sample", "name: Upper"), "sample").frontmatter, "legacy parsing remains lenient");
});

test("failures, rate limits and cancellation return no partial package and failures can be retried", async () => {
    for (const options of [{ fail: 429 }, { fail: 503 }, { incomplete: true }]) {
        const f = fixture(options); const found = await f.client.discover("https://github.com/owner/repo", signal());
        await assert.rejects(f.client.download(found, found.candidates.find(c => c.path === "skills/sample"), signal()), e => ["rate-limit", "download"].includes(e.code));
        assert.equal(f.stats().active, 0, "failed worker aborts and awaits siblings");
    }
    const limited = fixture({ rateLimit: true }); await assert.rejects(limited.client.discover("https://github.com/owner/repo", signal()), e => e.code === "rate-limit");
    const f = fixture({ fail: 503 }); const found = await f.client.discover("https://github.com/owner/repo", signal());
    const candidate = found.candidates.find(c => c.path === "skills/sample");
    await assert.rejects(f.client.download(found, candidate, signal())); f.setFail(null);
    await f.client.download(found, candidate, signal());
    const stop = new AbortController(); stop.abort(); const count = f.calls.length;
    await assert.rejects(f.client.download(found, candidate, stop.signal), { name: "AbortError" }); assert.equal(f.calls.length, count);
});

test("explicit folder and manifest URLs keep scope and slash refs resolve to one pinned commit", async () => {
    const f = fixture(); const folder = await f.client.discover("https://github.com/owner/repo/tree/main/skills/sample", signal());
    assert.deepEqual(folder.candidates.map(c => c.path), ["skills/sample", "skills/sample/assets"]);
    const direct = await f.client.discover("https://github.com/owner/repo/blob/feature/branch/skills/sample/SKILL.md", signal());
    assert.deepEqual(direct.candidates.map(c => c.path), ["skills/sample"]); assert.equal(direct.commit, commit);
    assert.equal(f.stats().rawCount, 0);
});

test("strict GitHub archives use existing storage and duplicate versioning", async () => {
    const persisted = new Map();
    const { IndexedDBSkillStore } = load("packages/aihappey-skills/src/stores/IndexedDBSkillStore.ts", {
        ...zipMock, "idb-keyval": { get: async key => persisted.get(key), set: async (key, value) => { persisted.set(key, value); } },
    });
    const f = fixture(); const found = await f.client.discover("https://github.com/owner/repo", signal());
    const archive = await f.client.download(found, found.candidates.find(c => c.path === "skills/sample"), signal());
    const store = new IndexedDBSkillStore();
    const first = await store.importArchive(archive, "local-zip", { strict: true });
    const second = await store.importArchive(archive, "local-zip", { strict: true });
    assert.equal(first.imported.length, 1); assert.equal(first.imported[0].version, "1");
    assert.equal(second.imported[0].skillId, first.imported[0].skillId); assert.equal(second.imported[0].version, "2");
    assert.equal(second.imported[0].description, "Use this sample when testing.");
    assert.deepEqual(Buffer.from(await second.imported[0].files.find(f => f.path === "assets/logo.bin").data.arrayBuffer()), data["assets/logo.bin"]);
});
