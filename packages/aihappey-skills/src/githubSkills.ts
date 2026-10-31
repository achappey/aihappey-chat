import JSZip from "jszip";

export const GITHUB_SKILL_MAX_FILES = 512;
export const GITHUB_SKILL_MAX_BYTES = 16 * 1024 * 1024;
const MAX_JSON_BYTES = 8 * 1024 * 1024;
const MAX_CANDIDATES = 500;
const MAX_DISCOVERY_REQUESTS = 32;
const SHA = /^[a-f0-9]{40}$/;
const COLLECTIONS = ["skills", ".agents/skills", ".claude/skills", ".github/skills", ".copilot/skills"];

export class GitHubSkillError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}
export type GitHubSkillUrl = { owner: string; repo: string; kind: "repository" | "folder" | "file"; segments: string[] };
export type GitHubSkillCandidate = { path: string; name: string; tree: string };
export type GitHubSkillDiscovery = { owner: string; repo: string; commit: string; candidates: GitHubSkillCandidate[] };
type TreeEntry = { path: string; mode: string; type: string; sha: string; size?: number };

function fail(code: string, message: string): never { throw new GitHubSkillError(code, message); }
function safePath(path: string) {
  if (!path || path.startsWith("/") || /[\\:\x00-\x1f\x7f]/.test(path)
    || /%2f|%5c|%2e/i.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) {
    fail("unsafe-path", "A GitHub resource must stay inside the skill directory.");
  }
  return path;
}

export function parseGitHubSkillUrl(input: string): GitHubSkillUrl {
  try {
    // Reject traversal before URL normalization can remove it.
    if (/[\\\x00-\x1f\x7f]/.test(input) || /(?:\/|%2f)(?:\.|%2e){1,2}(?:\/|%2f|$)/i.test(input)) throw Error();
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !["github.com", "raw.githubusercontent.com"].includes(url.hostname)) throw Error();
    const parts = url.pathname.replace(/\/+$/, "").slice(1).split("/").map(decodeURIComponent);
    const owner = parts.shift() ?? "", repo = (parts.shift() ?? "").replace(/\.git$/, "");
    if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo) || repo === "." || repo === "..") throw Error();
    if (parts.length === 0 && url.hostname === "github.com") return { owner, repo, kind: "repository", segments: [] };
    const mode = url.hostname === "github.com" ? parts.shift() : "raw";
    if (!["tree", "blob", "raw"].includes(mode ?? "") || parts.length === 0) throw Error();
    parts.forEach(part => { if (part.includes("/")) throw Error(); safePath(part); });
    const kind = mode === "tree" ? "folder" : "file";
    if (kind === "file" && parts.at(-1) !== "SKILL.md") throw Error();
    if (parts[0] === "refs" && ["heads", "tags"].includes(parts[1])) parts.splice(0, 2);
    if (parts.length > 32) throw Error();
    return { owner, repo, kind, segments: parts };
  } catch {
    return fail("invalid-url", "Enter a public HTTPS GitHub repository, skill folder, or SKILL.md URL.");
  }
}

/** Anonymous GitHub-only transport. Discovery never reads blobs or probes candidate directories. */
export class GitHubSkillsClient {
  private readonly trees = new Map<string, TreeEntry[]>();
  private readonly downloads = new Map<string, Uint8Array>();
  private cachedBytes = 0;
  constructor(private readonly request: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  private async bytes(url: string, signal: AbortSignal, limit: number, raw = false): Promise<Uint8Array> {
    signal.throwIfAborted();
    let response: Response;
    try {
      response = await this.request(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
        credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
        ...(raw ? {} : { headers: { Accept: "application/vnd.github+json" } }),
      });
    } catch (error) {
      signal.throwIfAborted();
      throw new GitHubSkillError("download", "Could not download from GitHub. Check your connection and try again.");
    }
    if (response.status === 429 || response.status === 403 && (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after"))) {
      const reset = Number(response.headers.get("x-ratelimit-reset"));
      fail("rate-limit", `GitHub's public API rate limit was reached. Try again later.${reset ? ` Resets at ${new Date(reset * 1000).toLocaleTimeString()}.` : ""}`);
    }
    if (!response.ok) fail(response.status === 404 ? "not-found" : "download",
      response.status === 404 ? "The public GitHub repository, ref, or folder was not found." : `GitHub download failed (HTTP ${response.status}).`);
    if (Number(response.headers.get("content-length")) > limit) fail("limit", "GitHub response or skill is too large.");
    if (raw) {
      // A simple CORS GET to the raw CDN, not the quota-limited REST Contents/Blobs APIs.
      try {
        const buffer = await response.arrayBuffer();
        signal.throwIfAborted();
        if (buffer.byteLength > limit) fail("limit", "GitHub response or skill is too large.");
        return new Uint8Array(buffer);
      } catch (error) {
        signal.throwIfAborted(); if (error instanceof GitHubSkillError) throw error;
        return fail("download", "Could not download the complete GitHub file. Try again.");
      }
    }
    const reader = response.body?.getReader();
    if (!reader) fail("download", "GitHub returned an empty download.");
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        signal.throwIfAborted(); length += value.length;
        if (length > limit) fail("limit", "GitHub response or skill is too large.");
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const result = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  }
  private async json(url: string, signal: AbortSignal): Promise<any> {
    try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await this.bytes(url, signal, MAX_JSON_BYTES))); }
    catch (error) {
      signal.throwIfAborted(); if (error instanceof GitHubSkillError) throw error;
      return fail("download", "GitHub returned an invalid response.");
    }
  }
  private async tree(base: string, sha: string, recursive: boolean, signal: AbortSignal, budget?: () => void) {
    signal.throwIfAborted();
    if (!SHA.test(sha)) fail("download", "GitHub returned an invalid tree identifier.");
    const key = `${base}/${sha}/${recursive}`;
    const cached = this.trees.get(key); if (cached) return cached;
    budget?.();
    const result = await this.json(`${base}/git/trees/${sha}${recursive ? "?recursive=1" : ""}`, signal);
    if (result.truncated) fail("discovery-limit", "The GitHub directory listing is incomplete. Use a more specific folder URL.");
    if (!Array.isArray(result.tree) || result.tree.length > 25000) fail("discovery-limit", "The GitHub directory listing is too large. Use a more specific folder URL.");
    for (const entry of result.tree) {
      safePath(entry.path); if (!SHA.test(entry.sha)) fail("download", "GitHub returned an invalid file identifier.");
    }
    if (this.trees.size >= 32) this.trees.delete(this.trees.keys().next().value!);
    this.trees.set(key, result.tree); return result.tree as TreeEntry[];
  }

  async discover(input: string, signal: AbortSignal, changed?: (result: GitHubSkillDiscovery) => void): Promise<GitHubSkillDiscovery> {
    const target = parseGitHubSkillUrl(input);
    const base = `https://api.github.com/repos/${target.owner}/${target.repo}`;
    let requests = 0;
    const budget = () => { if (++requests > MAX_DISCOVERY_REQUESTS) fail("discovery-limit", "Discovery request limit reached. Use a more specific folder URL."); };
    budget(); const repo = await this.json(base, signal);
    if (repo.private !== false) fail("not-found", "Only public GitHub repositories are supported.");
    let commit: any, path = "";
    if (target.kind === "repository") {
      budget(); commit = await this.json(`${base}/commits/${encodeURIComponent(repo.default_branch)}`, signal);
    } else {
      // Longest matching ref also supports branch/tag names containing slashes.
      for (let i = Math.min(target.segments.length - (target.kind === "file" ? 1 : 0), 16); i > 0; i--) {
        try {
          budget(); commit = await this.json(`${base}/commits/${encodeURIComponent(target.segments.slice(0, i).join("/"))}`, signal);
          path = target.segments.slice(i).join("/"); break;
        } catch (error) { if (!(error instanceof GitHubSkillError) || error.code !== "not-found") throw error; }
      }
    }
    if (!SHA.test(commit?.sha) || !SHA.test(commit?.commit?.tree?.sha)) fail("not-found", "The GitHub branch, tag, or commit was not found.");
    const result: GitHubSkillDiscovery = { owner: target.owner, repo: target.repo, commit: commit.sha, candidates: [] };
    const add = (candidatePath: string, tree: string) => {
      if (result.candidates.some(c => c.path === candidatePath)) return;
      if (result.candidates.length >= MAX_CANDIDATES) fail("discovery-limit", "Too many candidate folders. Use a more specific folder URL.");
      result.candidates.push({ path: candidatePath, name: candidatePath.split("/").at(-1) || target.repo, tree });
      changed?.({ ...result, candidates: [...result.candidates] });
    };
    const navigate = async (folder: string): Promise<string | undefined> => {
      let sha = commit.commit.tree.sha;
      for (const part of folder ? folder.split("/") : []) {
        const entry = (await this.tree(base, sha, false, signal, budget)).find(e => e.type === "tree" && e.path === part);
        if (!entry) return undefined; sha = entry.sha;
      }
      return sha;
    };
    if (target.kind === "file") {
      const folder = path.split("/").slice(0, -1).join("/");
      const sha = await navigate(folder); if (!sha) fail("not-found", "The GitHub skill folder was not found.");
      add(folder, sha); return result;
    }
    if (target.kind === "folder") {
      const sha = await navigate(path); if (!sha) fail("not-found", "The GitHub folder was not found.");
      add(path, sha);
      for (const entry of await this.tree(base, sha, false, signal, budget)) if (entry.type === "tree") add(path ? `${path}/${entry.path}` : entry.path, entry.sha);
      return result;
    }
    const root = await this.tree(base, commit.commit.tree.sha, false, signal, budget);
    // Root is a candidate too: manifest presence is verified only when importing it.
    add("", commit.commit.tree.sha);
    for (const entry of root) if (entry.type === "tree" && !COLLECTIONS.some(c => c.split("/")[0] === entry.path)) add(entry.path, entry.sha);
    for (const collection of COLLECTIONS) {
      const sha = await navigate(collection); if (!sha) continue;
      // One targeted listing supplies grouping structure, never one request per candidate.
      const entries = await this.tree(base, sha, true, signal, budget);
      for (const entry of entries) if (entry.type === "tree" && entry.path.split("/").length <= 2) add(`${collection}/${entry.path}`, entry.sha);
    }
    return result;
  }

  private async rawFile(url: string, size: number, signal: AbortSignal) {
    signal.throwIfAborted();
    const cached = this.downloads.get(url);
    if (cached && cached.byteLength === size) return cached;
    const bytes = await this.bytes(url, signal, size, true);
    if (bytes.byteLength !== size) fail("download", "GitHub returned an incomplete file download.");
    // Bound the successful-file cache; failures/cancellations are never cached.
    while (this.downloads.size && (this.cachedBytes + bytes.byteLength > 2 * GITHUB_SKILL_MAX_BYTES || this.downloads.size >= 1024)) {
      const key = this.downloads.keys().next().value!;
      this.cachedBytes -= this.downloads.get(key)!.byteLength; this.downloads.delete(key);
    }
    this.downloads.set(url, bytes); this.cachedBytes += bytes.byteLength;
    return bytes;
  }

  async download(discovery: GitHubSkillDiscovery, candidate: GitHubSkillCandidate, signal: AbortSignal): Promise<Blob> {
    signal.throwIfAborted();
    if (!SHA.test(discovery.commit)) fail("invalid-selection", "Discover the GitHub commit before importing it.");
    if (!discovery.candidates.some(c => c.path === candidate.path && c.tree === candidate.tree)) fail("invalid-selection", "Discover the skill folder before importing it.");
    const base = `https://api.github.com/repos/${discovery.owner}/${discovery.repo}`;
    const entries = await this.tree(base, candidate.tree, true, signal);
    const files = entries.filter(e => e.type !== "tree");
    if (!files.some(e => e.path === "SKILL.md")) fail("missing-manifest", "The selected folder does not contain SKILL.md.");
    if (files.length > GITHUB_SKILL_MAX_FILES) fail("limit", "A skill may contain at most 512 files and 16 MiB.");
    let total = 0; const paths = new Set<string>();
    for (const file of files) {
      safePath(file.path);
      const folded = file.path.toLowerCase();
      if (paths.has(folded)) fail("unsafe-path", "The skill contains conflicting file paths.");
      paths.add(folded);
      if (file.type !== "blob" || !["100644", "100755"].includes(file.mode)) fail("unsafe-path", "Skills containing symbolic links or submodules cannot be imported.");
      if (!Number.isSafeInteger(file.size) || file.size! < 0 || (total += file.size!) > GITHUB_SKILL_MAX_BYTES) fail("limit", "A skill may contain at most 512 files and 16 MiB.");
      if (file.path !== "SKILL.md" && file.path.split("/").at(-1)?.toLowerCase() === "skill.md") fail("invalid-skill", "Nested skill manifests are not supported inside a selected skill.");
    }
    if ([...paths].some(path => path.split("/").slice(0, -1).some((_, i, parts) => paths.has(parts.slice(0, i + 1).join("/"))))) fail("unsafe-path", "The skill contains conflicting file paths.");
    const zip = new JSZip();
    const stop = new AbortController(); const downloadSignal = AbortSignal.any([signal, stop.signal]);
    let next = 0;
    const workers = Array.from({ length: Math.min(4, files.length) }, async () => {
      while (next < files.length) {
        downloadSignal.throwIfAborted(); const file = files[next++];
        const path = [candidate.path, file.path].filter(Boolean).join("/").split("/").map(encodeURIComponent).join("/");
        const url = `https://raw.githubusercontent.com/${discovery.owner}/${discovery.repo}/${discovery.commit}/${path}`;
        const bytes = await this.rawFile(url, file.size!, downloadSignal);
        zip.file(`${candidate.name}/${file.path}`, bytes);
      }
    });
    try { await Promise.all(workers); }
    catch (error) {
      stop.abort(); await Promise.allSettled(workers); signal.throwIfAborted(); throw error;
    }
    signal.throwIfAborted();
    return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  }
}
