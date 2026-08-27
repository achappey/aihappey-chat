import JSZip from "jszip";
import {
  pluginPackageEntries,
  type PluginCatalogItem,
  type StoredPlugin,
} from "aihappey-plugins";
import {
  serializeVectorStore,
  vectorStoreJsonFilename,
  type VectorStore,
} from "aihappey-embeddings";

export const EXPORT_CATEGORY_IDS = [
  "conversations",
  "images",
  "transcriptions",
  "speech",
  "reranks",
  "videos",
  "jobs",
  "agents",
  "plugins",
  "skills",
  "files",
  "documentHubs",
  "structuredOutputs",
  "tools",
] as const;

export type ExportCategoryId = (typeof EXPORT_CATEGORY_IDS)[number];
export type ExportTargetId = "all" | ExportCategoryId;

export type ExportEntry = {
  path: string;
  data: Blob | Uint8Array | string;
};

export type ExportSources = {
  conversations: any[];
  images: any[];
  transcriptions: any[];
  speech: any[];
  reranks: any[];
  videos: any[];
  jobs: any[];
  agents: any[];
  plugins: {
    items: PluginCatalogItem[];
    read: (id: string) => Promise<StoredPlugin | undefined>;
  };
  files: any[];
  skills: {
    items: any[];
    listVersions: (skillId: string) => Promise<any[]>;
    downloadVersion: (skillId: string, version: string) => Promise<Blob | undefined>;
  };
  structuredOutputs: any[];
  tools: any[];
  documentHubs: VectorStore[];
};

export type ExportProgress = (value: number) => void;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function safeFilename(value: unknown, fallback = "item") {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-. ]+|[-. ]+$/g, "")
    .slice(0, 120);
  return normalized || fallback;
}

function uniquePath(path: string, used: Set<string>) {
  let candidate = path;
  let suffix = 2;
  const dot = path.lastIndexOf(".");
  const base = dot > path.lastIndexOf("/") ? path.slice(0, dot) : path;
  const extension = dot > path.lastIndexOf("/") ? path.slice(dot) : "";
  while (used.has(candidate.toLocaleLowerCase())) {
    candidate = `${base}-${suffix}${extension}`;
    suffix += 1;
  }
  used.add(candidate.toLocaleLowerCase());
  return candidate;
}

function json(value: unknown) {
  return JSON.stringify(value, (_key, current) => {
    if (current instanceof Uint8Array) return Array.from(current);
    return current;
  }, 2);
}

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Export cancelled", "AbortError");
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function mediaData(value: unknown, fallbackMime: string) {
  if (value instanceof Uint8Array) return { data: value, mime: fallbackMime };
  if (value instanceof Blob) return { data: value, mime: value.type || fallbackMime };
  if (typeof value !== "string") return undefined;
  const dataUrl = value.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s);
  if (dataUrl) {
    const mime = dataUrl[1] || fallbackMime;
    const encoded = dataUrl[2];
    return {
      data: value.includes(";base64,") ? decodeBase64(encoded) : decodeURIComponent(encoded),
      mime,
    };
  }
  return { data: decodeBase64(value), mime: fallbackMime };
}

function extensionFor(mime: string | undefined, fallback: string) {
  return MIME_EXTENSIONS[String(mime ?? "").toLowerCase()] ?? fallback;
}

function transcriptEntry(item: any, index: number): ExportEntry {
  const name = safeFilename(item.name || item.id, `transcription-${index + 1}`);
  const transcript = item.transcription;
  const isPlainText = typeof transcript === "string"
    || (transcript && typeof transcript.text === "string"
      && (!Array.isArray(transcript.segments) || transcript.segments.length === 0)
      && !transcript.providerMetadata);
  return isPlainText
    ? { path: `${name}.txt`, data: typeof transcript === "string" ? transcript : transcript.text }
    : { path: `${name}.json`, data: json(transcript) };
}

function toolModule(tool: any) {
  const description = String(tool.description ?? "").replace(/\*\//g, "*\\/");
  let schema: unknown = tool.inputSchema;
  try { schema = JSON.parse(tool.inputSchema); } catch { /* Preserve a non-JSON schema as text. */ }
  return `/**\n * ${description.replace(/\n/g, "\n * ")}\n */\nexport const description = ${JSON.stringify(tool.description ?? "")};\n\nexport const inputSchema = ${json(schema)};\n\nexport const execute = ${tool.execute};\n`;
}

async function skillEntries(
  sources: ExportSources,
  flattened: boolean,
  signal: AbortSignal,
  progress: ExportProgress,
) {
  const entries: ExportEntry[] = [];
  const downloaded = sources.skills.items.filter((item) => item.isDownloaded !== false);
  let completed = 0;
  for (const item of downloaded) {
    abortIfNeeded(signal);
    let versions = await sources.skills.listVersions(item.skillId);
    if (!versions.length) versions = [{ version: item.downloadedVersion || item.version || item.latestVersion }];
    for (const versionItem of versions) {
      abortIfNeeded(signal);
      const version = String(versionItem.version ?? "current");
      const blob = await sources.skills.downloadVersion(item.skillId, version);
      if (!blob) continue;
      const skillName = safeFilename(item.name || item.skillId, "skill");
      const versionName = safeFilename(version, "current");
      if (!flattened) {
        entries.push({ path: `${skillName}/${versionName}/${skillName}-${versionName}.zip`, data: blob });
      } else {
        const archive = await JSZip.loadAsync(blob);
        for (const archived of Object.values(archive.files)) {
          if (archived.dir) continue;
          abortIfNeeded(signal);
          entries.push({
            path: `${skillName}/${versionName}/${archived.name}`,
            data: await archived.async("uint8array"),
          });
        }
      }
    }
    completed += 1;
    progress(downloaded.length ? completed / downloaded.length : 1);
  }
  return entries;
}

async function pluginEntries(
  sources: ExportSources,
  signal: AbortSignal,
  progress: ExportProgress,
) {
  const entries: ExportEntry[] = [];
  const plugins = sources.plugins.items;
  for (let index = 0; index < plugins.length; index += 1) {
    abortIfNeeded(signal);
    const plugin = await sources.plugins.read(plugins[index].id);
    abortIfNeeded(signal);
    if (plugin) {
      const directory = safeFilename(plugin.name, "plugin");
      for (const entry of pluginPackageEntries(plugin)) {
        entries.push({ path: `${directory}/${entry.path}`, data: entry.data });
      }
    }
    progress(plugins.length ? (index + 1) / plugins.length : 1);
  }
  if (!plugins.length) progress(1);
  return entries;
}

export async function collectCategoryEntries(
  category: ExportCategoryId,
  sources: ExportSources,
  options: { flattenedSkills: boolean; signal: AbortSignal; progress: ExportProgress },
): Promise<ExportEntry[]> {
  const { signal, progress } = options;
  abortIfNeeded(signal);
  let entries: ExportEntry[] = [];
  switch (category) {
    case "conversations":
      entries = sources.conversations.map((item, index) => ({
        path: `Conversation_${safeFilename(item.id, String(index + 1))}_${safeFilename(item.metadata?.name, "conversation")}.json`,
        data: json(item),
      }));
      break;
    case "images":
      entries = sources.images.flatMap((item, itemIndex) => (item.imageResponse?.images ?? []).map((image: unknown, imageIndex: number) => {
        const media = mediaData(image, "image/png");
        return media ? { path: `image-${safeFilename(item.id, String(itemIndex + 1))}-${imageIndex + 1}.${extensionFor(media.mime, "png")}`, data: media.data } : [];
      })).flat();
      break;
    case "transcriptions":
      entries = sources.transcriptions.map(transcriptEntry);
      break;
    case "speech":
      entries = sources.speech.flatMap((item, index) => {
        const audio = item.speechResponse?.audio;
        const wrapped = audio && typeof audio === "object" && !(audio instanceof Uint8Array) && !(audio instanceof Blob) ? audio : undefined;
        const media = mediaData(wrapped?.base64 ?? wrapped?.data ?? audio, wrapped?.mimeType || `audio/${wrapped?.format || "mpeg"}`);
        return media ? [{ path: `speech-${safeFilename(item.id, String(index + 1))}.${extensionFor(media.mime, wrapped?.format || "mp3")}`, data: media.data }] : [];
      });
      break;
    case "reranks":
      entries = sources.reranks.map((item, index) => ({ path: `rerank-${safeFilename(item.id, String(index + 1))}.json`, data: json(item.reranking) }));
      break;
    case "videos":
      entries = sources.videos.flatMap((item, itemIndex) => (item.videoResponse?.videos ?? []).flatMap((video: any, videoIndex: number) => {
        const media = mediaData(video.data, video.mimeType || "video/mp4");
        return media ? [{ path: `video-${safeFilename(item.id, String(itemIndex + 1))}-${videoIndex + 1}.${extensionFor(media.mime, "mp4")}`, data: media.data }] : [];
      }));
      break;
    case "jobs":
      entries = sources.jobs.map((item, index) => ({ path: `response-${safeFilename(item.responseId || item.id, String(index + 1))}.json`, data: json(item.response) }));
      break;
    case "agents":
      entries = sources.agents.map((item, index) => ({ path: `${safeFilename(item.name || item.id, `agent-${index + 1}`)}.json`, data: json(item) }));
      break;
    case "plugins":
      return pluginEntries(sources, signal, progress);
    case "files":
      entries = sources.files.map((item, index) => ({ path: safeFilename(item.name, `file-${index + 1}`), data: item.data }));
      break;
    case "skills":
      return skillEntries(sources, options.flattenedSkills, signal, progress);
    case "structuredOutputs":
      entries = sources.structuredOutputs.map((item, index) => {
        let schema: unknown = item.json_schema;
        try { schema = JSON.parse(item.json_schema); } catch { /* Keep invalid/user-authored schema text. */ }
        return { path: `${safeFilename(item.name || item.id, `structure-${index + 1}`)}.json`, data: typeof schema === "string" ? schema : json(schema) };
      });
      break;
    case "tools":
      entries = sources.tools.map((item, index) => ({ path: `${safeFilename(item.title || item.id, `tool-${index + 1}`)}.js`, data: toolModule(item) }));
      break;
    case "documentHubs":
      entries = sources.documentHubs.map((hub) => ({
        path: vectorStoreJsonFilename(hub),
        data: serializeVectorStore(hub),
      }));
      break;
  }
  progress(1);
  return entries;
}

export async function createExportArchive(
  target: ExportTargetId,
  sources: ExportSources,
  signal: AbortSignal,
  onProgress: ExportProgress,
) {
  const categories = target === "all" ? [...EXPORT_CATEGORY_IDS] : [target];
  const collected: ExportEntry[] = [];
  for (let index = 0; index < categories.length; index += 1) {
    const category = categories[index];
    const entries = await collectCategoryEntries(category, sources, {
      flattenedSkills: target === "all",
      signal,
      progress: (part) => onProgress(Math.round(((index + part * 0.75) / categories.length) * 80)),
    });
    const used = new Set<string>();
    entries.forEach((entry) => collected.push({
      ...entry,
      path: uniquePath(target === "all" ? `${category}/${entry.path}` : entry.path, used),
    }));
  }

  abortIfNeeded(signal);
  const zip = new JSZip();
  collected.forEach((entry) => zip.file(entry.path, entry.data));
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, streamFiles: true },
    (metadata) => {
      abortIfNeeded(signal);
      onProgress(80 + Math.round(metadata.percent * 0.2));
    },
  );
  abortIfNeeded(signal);
  onProgress(100);
  return blob;
}

export function downloadExport(blob: Blob, target: ExportTargetId) {
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aihappey-${target === "all" ? "export" : target}-${date}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
