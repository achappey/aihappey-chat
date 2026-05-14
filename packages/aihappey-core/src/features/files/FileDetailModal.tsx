import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { StoredFile } from "aihappey-files";
import mime from "mime";
import { extractTextFromFile } from "../chat/files/file";
import { zipFileToFiles } from "../chat/files/fileConverters";
import { Markdown } from "../../ui/markdown/Markdown";

type FileDetailTabKind =
  | "json"
  | "markdown"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "pdf"
  | "html"
  | "unsupported"
  | "error"
  | "empty";

type FileDetailTab = {
  id: string;
  title: string;
  mimeType: string;
  kind: FileDetailTabKind;
  text?: string;
  objectUrl?: string;
  message?: string;
};

export type FileDetailModalProps = {
  open: boolean;
  file?: StoredFile;
  fileName?: string;
  loading?: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onDelete?: () => Promise<void> | void;
  size?: "small" | "medium" | "large";
};

const JSON_EXTENSIONS = new Set(["json", "jsonl", "geojson"]);
const MARKDOWN_EXTENSIONS = new Set(["md", "markdown", "mdx"]);
const HTML_EXTENSIONS = new Set(["html", "htm"]);
const TEXT_EXTENSIONS = new Set([
  "txt",
  "log",
  "csv",
  "tsv",
  "yaml",
  "yml",
  "xml",
  "svg",
  "ini",
  "conf",
  "config",
  "js",
  "jsx",
  "ts",
  "tsx",
  "css",
  "scss",
  "less",
  "sql",
  "py",
  "rb",
  "java",
  "c",
  "cpp",
  "cs",
  "go",
  "rs",
  "sh",
  "bat",
  "ps1",
  "toml",
]);

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function inferMimeType(name: string, type?: string): string {
  return type || (mime.getType(name) as string) || "application/octet-stream";
}

function isZipFile(name: string, mimeType: string): boolean {
  return mimeType === "application/zip" || /\.zip$/i.test(name);
}

function isJsonFile(name: string, mimeType: string): boolean {
  return mimeType === "application/json" || JSON_EXTENSIONS.has(getExtension(name));
}

function isMarkdownFile(name: string, mimeType: string): boolean {
  return mimeType === "text/markdown" || MARKDOWN_EXTENSIONS.has(getExtension(name));
}

function isHtmlFile(name: string, mimeType: string): boolean {
  return mimeType === "text/html" || HTML_EXTENSIONS.has(getExtension(name));
}

function isPdfFile(name: string, mimeType: string): boolean {
  return mimeType === "application/pdf" || /\.pdf$/i.test(name);
}

function isTextLikeFile(name: string, mimeType: string): boolean {
  if (mimeType.startsWith("text/")) return true;
  if (mimeType.includes("json")) return true;
  if (mimeType === "application/xml" || mimeType === "text/xml" || mimeType.endsWith("+xml")) return true;
  if (mimeType === "application/yaml" || mimeType === "text/yaml" || mimeType === "application/x-yaml") return true;
  if (mimeType.includes("javascript")) return true;
  if (mimeType.includes("ecmascript")) return true;
  return TEXT_EXTENSIONS.has(getExtension(name));
}

function createMessageTab(
  id: string,
  title: string,
  kind: Extract<FileDetailTabKind, "unsupported" | "error" | "empty">,
  mimeType: string,
  message: string
): FileDetailTab {
  return {
    id,
    title,
    kind,
    mimeType,
    message,
  };
}

function revokeTabUrls(tabs: FileDetailTab[]) {
  for (const tab of tabs) {
    if (tab.objectUrl) {
      URL.revokeObjectURL(tab.objectUrl);
    }
  }
}

async function buildTabFromFile(file: File, title: string): Promise<FileDetailTab> {
  const mimeType = inferMimeType(file.name || title, file.type);

  try {
    if (isJsonFile(title, mimeType)) {
      return {
        id: title,
        title,
        mimeType,
        kind: "json",
        text: await file.text(),
      };
    }

    if (isMarkdownFile(title, mimeType)) {
      return {
        id: title,
        title,
        mimeType,
        kind: "markdown",
        text: await file.text(),
      };
    }

    if (isHtmlFile(title, mimeType)) {
      return {
        id: title,
        title,
        mimeType,
        kind: "html",
        objectUrl: URL.createObjectURL(file),
      };
    }

    if (mimeType.startsWith("image/")) {
      return {
        id: title,
        title,
        mimeType,
        kind: "image",
        objectUrl: URL.createObjectURL(file),
      };
    }

    if (mimeType.startsWith("audio/")) {
      return {
        id: title,
        title,
        mimeType,
        kind: "audio",
        objectUrl: URL.createObjectURL(file),
      };
    }

    if (mimeType.startsWith("video/")) {
      return {
        id: title,
        title,
        mimeType,
        kind: "video",
        objectUrl: URL.createObjectURL(file),
      };
    }

    if (isPdfFile(title, mimeType)) {
      return {
        id: title,
        title,
        mimeType,
        kind: "pdf",
        objectUrl: URL.createObjectURL(file),
      };
    }

    const extractedText = await extractTextFromFile(file);
    if (extractedText?.trim()) {
      return {
        id: title,
        title,
        mimeType,
        kind: "text",
        text: extractedText,
      };
    }

    if (isTextLikeFile(title, mimeType)) {
      return {
        id: title,
        title,
        mimeType,
        kind: "text",
        text: await file.text(),
      };
    }

    return createMessageTab(
      title,
      title,
      "unsupported",
      mimeType,
      `Preview is not available for ${mimeType || "this file type"}.`
    );
  } catch (error) {
    return createMessageTab(
      title,
      title,
      "error",
      mimeType,
      error instanceof Error ? error.message : "Failed to load file preview."
    );
  }
}

async function buildTabsForStoredFile(file: StoredFile): Promise<FileDetailTab[]> {
  const mimeType = inferMimeType(file.name, file.data.type);
  const rootFile = new File([file.data], file.name, { type: mimeType });

  if (!isZipFile(file.name, mimeType)) {
    return [await buildTabFromFile(rootFile, file.name)];
  }

  const entries = Object.entries(await zipFileToFiles(rootFile))
    .filter(([entryName]) => !entryName.endsWith("/"))
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
  if (entries.length === 0) {
    return [
      createMessageTab(
        file.name,
        file.name,
        "empty",
        mimeType,
        "This ZIP archive does not contain any files."
      ),
    ];
  }

  return await Promise.all(
    entries.map(async ([entryName, entryData]) => {
      const blobPart: BlobPart = typeof entryData === "string" ? entryData : new Uint8Array(entryData);
      const entryMimeType = inferMimeType(entryName);
      const entryFile = new File([blobPart], entryName, { type: entryMimeType });
      return await buildTabFromFile(entryFile, entryName);
    })
  );
}

const contentContainerStyle: CSSProperties = {
  minHeight: 360,
  maxHeight: "70vh",
  overflow: "auto",
  paddingTop: 8,
};

const messageStyle: CSSProperties = {
  minHeight: 240,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "#666",
};

const preStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: "monospace",
  fontSize: 13,
  lineHeight: 1.5,
};

const FileDetailContent = ({ tab }: { tab: FileDetailTab }) => {
  const { AudioPlayer, Image, JsonViewer } = useTheme();

  switch (tab.kind) {
    case "json":
      return <JsonViewer value={tab.text ?? "{}"} />;
    case "markdown":
      return <Markdown text={tab.text ?? ""} />;
    case "text":
      return <pre style={preStyle}>{tab.text ?? ""}</pre>;
    case "image":
      return tab.objectUrl ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image src={tab.objectUrl} fit="contain" />
        </div>
      ) : null;
    case "audio":
      return tab.objectUrl ? <AudioPlayer src={tab.objectUrl} /> : null;
    case "video":
      return tab.objectUrl ? (
        <video
          src={tab.objectUrl}
          controls
          style={{ width: "100%", maxHeight: "65vh", borderRadius: 8 }}
        />
      ) : null;
    case "pdf":
      return tab.objectUrl ? (
        <iframe
          src={tab.objectUrl}
          title={tab.title}
          style={{ width: "100%", minHeight: "65vh", border: "none", borderRadius: 8 }}
        />
      ) : null;
    case "html":
      return tab.objectUrl ? (
        <iframe
          src={tab.objectUrl}
          title={tab.title}
          sandbox=""
          style={{ width: "100%", minHeight: "65vh", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8 }}
        />
      ) : null;
    case "empty":
    case "unsupported":
    case "error":
      return (
        <div style={messageStyle}>
          <strong>
            {tab.kind === "error"
              ? "Preview failed"
              : tab.kind === "empty"
                ? "Archive is empty"
                : "Preview unavailable"}
          </strong>
          <div>{tab.message}</div>
          {tab.mimeType ? <div>{tab.mimeType}</div> : null}
        </div>
      );
    default:
      return null;
  }
};

export const FileDetailModal = ({
  open,
  file,
  fileName,
  loading = false,
  onClose,
  onDownload,
  onDelete,
  size = "large",
}: FileDetailModalProps) => {
  const { Button, Modal, Spinner, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<FileDetailTab[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [tabsLoading, setTabsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tabsRef = useRef<FileDetailTab[]>([]);

  const replaceTabs = useCallback((nextTabs: FileDetailTab[]) => {
    revokeTabUrls(tabsRef.current);
    tabsRef.current = nextTabs;
    setTabs(nextTabs);
  }, []);

  useEffect(() => {
    return () => {
      revokeTabUrls(tabsRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !file) {
      setTabsLoading(false);
      replaceTabs([]);
      return;
    }

    let cancelled = false;
    setTabsLoading(true);

    void buildTabsForStoredFile(file)
      .then((nextTabs) => {
        if (cancelled) {
          revokeTabUrls(nextTabs);
          return;
        }
        replaceTabs(nextTabs);
      })
      .catch((error) => {
        if (cancelled) return;
        replaceTabs([
          createMessageTab(
            file.name,
            file.name,
            "error",
            inferMimeType(file.name, file.data.type),
            error instanceof Error ? error.message : "Failed to build file preview."
          ),
        ]);
      })
      .finally(() => {
        if (!cancelled) {
          setTabsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, open, replaceTabs]);

  useEffect(() => {
    if (!tabs.length) {
      setActiveTab("");
      return;
    }

    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  const title = fileName ?? file?.name ?? t("file");
  const busy = loading || tabsLoading;

  const handleDelete = useCallback(async () => {
    if (!onDelete || deleting) return;
    try {
      setDeleting(true);
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  }, [deleting, onClose, onDelete]);

  return (
    <Modal
      show={open}
      size={size}
      onHide={onClose}
      title={title}
      actions={
        <>
          {onDelete && (
            <Button variant="ghost" icon="delete" disabled={deleting} onClick={handleDelete}>
              {t("delete")}
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" icon="download" onClick={onDownload}>
              {t("download")}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </>
      }
    >
      {busy ? (
        <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner />
        </div>
      ) : !tabs.length ? (
        <div style={messageStyle}>No preview content available.</div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          {tabs.map((tab) => (
            <Tab key={tab.id} eventKey={tab.id} title={tab.title}>
              <div style={contentContainerStyle}>
                <FileDetailContent tab={tab} />
              </div>
            </Tab>
          ))}
        </Tabs>
      )}
    </Modal>
  );
};
