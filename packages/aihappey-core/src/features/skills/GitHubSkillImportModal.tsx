import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { GitHubSkillsClient, parseGitHubSkillUrl, type GitHubSkillDiscovery, type SkillImportResult } from "aihappey-skills";

export function GitHubSkillImportModal({ open, onClose, onImport }: {
  open: boolean;
  onClose: () => void;
  onImport: (archive: Blob, signal: AbortSignal) => Promise<SkillImportResult>;
}) {
  const { Modal, Input, Button } = useTheme();
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => { const text = t(`skillsPage.github.${key}`); return text && text !== `skillsPage.github.${key}` ? text : fallback; };
  const client = useMemo(() => new GitHubSkillsClient(), []);
  const lifetime = useRef<AbortController | null>(null);
  const [url, setUrl] = useState("");
  const [discovery, setDiscovery] = useState<GitHubSkillDiscovery>();
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<"discover" | "import" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [imported, setImported] = useState(0);
  const [complete, setComplete] = useState(false);
  let valid = false;
  try { parseGitHubSkillUrl(url); valid = true; } catch { /* Report below without issuing a request. */ }

  useEffect(() => {
    if (open) { setUrl(""); setDiscovery(undefined); setSelected([]); setErrors([]); setImported(0); setPhase(null); setComplete(false); }
    return () => lifetime.current?.abort();
  }, [open]);

  const discover = async () => {
    lifetime.current?.abort(); const controller = new AbortController(); lifetime.current = controller;
    setPhase("discover"); setErrors([]); setImported(0); setSelected([]); setDiscovery(undefined); setComplete(false);
    try {
      const result = await client.discover(url, controller.signal, value => {
        if (!controller.signal.aborted) setDiscovery(value);
      });
      controller.signal.throwIfAborted(); setDiscovery(result); setComplete(true);
      if (result.candidates.length === 1) setSelected([result.candidates[0].path]);
    } catch (error) {
      if (!controller.signal.aborted) setErrors([error instanceof Error ? error.message : String(error)]);
    } finally { if (lifetime.current === controller) setPhase(null); }
  };
  const importSelected = async () => {
    if (!discovery || !complete || phase) return;
    const controller = new AbortController(); lifetime.current = controller;
    setPhase("import"); setErrors([]); setImported(0);
    let count = 0; const failures: string[] = [];
    try {
      for (const candidate of discovery.candidates.filter(c => selected.includes(c.path))) {
        try {
          const archive = await client.download(discovery, candidate, controller.signal);
          controller.signal.throwIfAborted();
          const result = await onImport(archive, controller.signal);
          if (!result.imported.length) throw new Error(result.diagnostics.find(d => d.severity === "error")?.message || tx("invalidSkill", "The selected folder is not a valid Agent Skill."));
          count += result.imported.length;
          setSelected(current => current.filter(path => path !== candidate.path));
        } catch (error) {
          if (controller.signal.aborted) break;
          failures.push(`${candidate.path || candidate.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (!controller.signal.aborted) { setImported(count); setErrors([...failures]); }
      }
    } finally { if (lifetime.current === controller) setPhase(null); }
  };
  const changeUrl = (value: string) => {
    lifetime.current?.abort(); setPhase(null); setUrl(value); setDiscovery(undefined); setSelected([]); setErrors([]); setImported(0); setComplete(false);
  };
  const close = () => { if (phase === "import") return; lifetime.current?.abort(); onClose(); };
  return <Modal show={open} onHide={close} title={tx("fromGitHub", "GitHub")} size="small" actions={<div style={{ display: "flex", gap: 8 }}>
    <Button variant="subtle" disabled={phase === "import"} onClick={close}>{t("cancel")}</Button>
    <Button variant="primary" disabled={!!phase || !complete || !selected.length} onClick={() => void importSelected()}>
      {phase === "import" ? tx("importing", "Importing…") : tx("import", "Import")}
    </Button>
  </div>}>
    <div style={{ display: "grid", gap: 12 }}>
      <Input label={tx("url", "GitHub URL")} value={url} disabled={phase === "import"}
        placeholder="https://github.com/owner/repository"
        onChange={(event: any) => changeUrl(event?.target?.value ?? event ?? "")} />
      {url && !valid ? <div role="alert">{tx("invalidUrl", "Enter a public HTTPS GitHub repository, skill folder, or SKILL.md URL.")}</div> : null}
      <Button variant="secondary" disabled={!valid || !!phase} onClick={() => void discover()}>
        {phase === "discover" ? tx("discovering", "Discovering…") : tx("discover", "Discover")}
      </Button>
      {!!discovery?.candidates.length && <div style={{ maxHeight: 240, overflowY: "auto", display: "grid", gap: 8 }}>
        {discovery.candidates.map(candidate => <label key={candidate.path} style={{ display: "flex", alignItems: "start", gap: 8, overflowWrap: "anywhere" }}>
          <input type="checkbox" disabled={phase === "import"} checked={selected.includes(candidate.path)} onChange={event => setSelected(current => event.target.checked ? [...current, candidate.path] : current.filter(path => path !== candidate.path))} />
          <span>{candidate.path || candidate.name}</span>
        </label>)}
      </div>}
      <div aria-live="polite">
        {imported > 0 ? <div>{t("skillsPage.imported", { count: imported })}</div> : null}
        {errors.map((error, index) => <div role="alert" key={index} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{error}</div>)}
      </div>
    </div>
  </Modal>;
}
