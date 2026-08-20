import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { formatFileSize } from "../cards/formatFileSize";

export type SkillEditFile = { path: string; data: Blob; size: number };

export type SkillEditModalValues = {
  name?: string;
  description: string;
  instructions: string;
  files: SkillEditFile[];
};

export type SkillEditModalProps = {
  open: boolean;
  mode: "create" | "edit";
  name?: string;
  description?: string;
  instructions?: string;
  files?: SkillEditFile[];
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: SkillEditModalValues) => void | Promise<void>;
};

const SKILL_NAME_RE = /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/;

export function normalizeSkillNameInput(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 64)
    .replace(/-+$/, "");
}

function normalizedUploadPath(file: File) {
  const relative = String((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const parts = relative.split("/").filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join("/") : parts[0] ?? file.name;
}

function downloadFile(file: SkillEditFile) {
  const url = URL.createObjectURL(file.data);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.split("/").pop() || file.path;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const SkillEditModal = ({
  open,
  mode,
  name: initialName,
  description: initialDescription,
  instructions: initialInstructions,
  files: initialFiles,
  saving,
  error,
  onClose,
  onSave,
}: SkillEditModalProps) => {
  const { Modal, Button, Tabs, Tab, Input, TextArea, Card } = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<SkillEditFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const tx = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab("general");
    setName(initialName ?? "");
    setDescription(initialDescription ?? "");
    setInstructions(initialInstructions ?? "");
    setFiles((initialFiles ?? []).filter((file) => file.path.toLowerCase() !== "skill.md"));
    setIsDragging(false);
  }, [initialDescription, initialFiles, initialInstructions, initialName, open]);

  const normalizedName = normalizeSkillNameInput(name);
  const nameIsValid = mode === "edit" || SKILL_NAME_RE.test(normalizedName);
  const descriptionIsValid = description.trim().length > 0 && description.trim().length <= 1024;
  const canSave = nameIsValid && descriptionIsValid && !saving;

  const sortedFiles = useMemo(
    () => files.slice().sort((a, b) => a.path.localeCompare(b.path)),
    [files]
  );

  const addFiles = (uploads: File[]) => {
    setFiles((current) => {
      const next = new Map(current.map((file) => [file.path.toLowerCase(), file]));
      for (const upload of uploads) {
        const path = normalizedUploadPath(upload);
        if (!path || path.toLowerCase() === "skill.md") continue;
        next.set(path.toLowerCase(), { path, data: upload, size: upload.size });
      }
      return Array.from(next.values());
    });
  };

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={mode === "create" ? tx("skillsPage.editor.newTitle", "New skill") : initialName ?? "New skill"}
      size="large"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="subtle" disabled={!!saving} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={() => void onSave({
              name: mode === "create" ? normalizedName : undefined,
              description: description.trim(),
              instructions,
              files,
            })}
          >
            {saving ? tx("saving", "Saving…") : t("save")}
          </Button>
        </div>
      }
    >
      {error ? <div style={{ color: "#c00", marginBottom: 12 }}>{error}</div> : null}
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <Tab eventKey="general" icon="settings" title={t("general")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <Input
              label={t("name")}
              placeholder={tx("skillsPage.editor.namePlaceholder", "Short, unique name for this skill...")}
              value={name}
              required
              disabled={mode === "edit"}
              onChange={(event: any) => setName(event?.target?.value ?? event ?? "")}
            />
            <TextArea
              label={tx("skillsPage.editor.description", "Description")}
              placeholder={tx("skillsPage.editor.descriptionPlaceholder", "Brief description of what this skill provides...")}
              value={description}
              required
              rows={5}
              onChange={(event: any) => setDescription(event?.target?.value ?? event ?? "")}
            />
          </div>
        </Tab>
        <Tab eventKey="content" icon="docs" title="SKILL.md">
          <div style={{ paddingTop: 12 }}>
            <TextArea
              label={tx("skillsPage.editor.instructions", "Instructions")}
              placeholder={tx("skillsPage.editor.instructionsPlaceholder", "Explain how and when this skill should be used...")}
              value={instructions}
              rows={20}
              onChange={(event: any) => setInstructions(event?.target?.value ?? event ?? "")}
            />
          </div>
        </Tab>
        <Tab eventKey="files" icon="folder" title={tx("skillsPage.editor.files", "Files")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <input
              ref={inputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <div
              style={{
                border: `2px dashed ${isDragging ? "currentColor" : "rgba(127,127,127,.45)"}`,
                borderRadius: 8,
                padding: 24,
                textAlign: "center",
              }}
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <div style={{ marginBottom: 8 }}>
                {tx("skillsPage.editor.dropFiles", "Drop files here or choose files to add or replace.")}
              </div>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                {tx("skillsPage.editor.chooseFiles", "Choose files")}
              </Button>
            </div>
            {sortedFiles.length === 0 ? (
              <Card title={tx("skillsPage.editor.files", "Files")}>
                <div style={{ color: "#888" }}>{t("noResults")}</div>
              </Card>
            ) : sortedFiles.map((file) => (
              <Card
                key={file.path}
                title={file.path}
                description={formatFileSize(file.size)}
                actions={
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="download" size="small" variant="transparent" title={t("download")} onClick={() => downloadFile(file)} />
                    <Button icon="delete" size="small" variant="transparent" title={tx("delete", "Delete")} onClick={() => setFiles((items) => items.filter((item) => item.path !== file.path))} />
                  </div>
                }
              />
            ))}
          </div>
        </Tab>
      </Tabs>
    </Modal>
  );
};
