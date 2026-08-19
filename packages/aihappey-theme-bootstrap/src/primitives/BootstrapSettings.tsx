import * as React from "react";
import { Button, Card, Form, Stack } from "react-bootstrap";
import { useBootstrapThemePreset } from "../BootstrapThemeContext";
import { isValidBootstrapHex, type BootstrapThemeSettings } from "../bootstrapThemePresets";

const FALLBACK: BootstrapThemeSettings = { colorMode: "system", primaryColor: "#0D6EFD", borderRadius: 6, bodyFontSize: 16, bodyLineHeight: 1.5, borderWidth: 1, focusRingOpacity: 0.25 };

export const BootstrapSettings = () => {
  const { presetId, setPresetId, presets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset } = useBootstrapThemePreset();
  const activePreset = presets[presetId];
  const [name, setName] = React.useState("");
  const [draft, setDraft] = React.useState<BootstrapThemeSettings>(activePreset?.settings ?? FALLBACK);
  React.useEffect(() => { setName(getCustomPreset(presetId)?.title ?? ""); setDraft(activePreset?.settings ?? FALLBACK); }, [activePreset, getCustomPreset, presetId]);
  const isCustom = presetId.startsWith("custom:");
  const canSave = name.trim().length > 0 && isValidBootstrapHex(draft.primaryColor);
  const setSetting = <K extends keyof BootstrapThemeSettings>(key: K, value: BootstrapThemeSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = (asNew: boolean) => { if (!canSave) return; if (isCustom && !asNew) updateCustomPreset(presetId, { title: name, settings: draft }); else setPresetId(addCustomPreset(name, draft)); };

  return <Stack gap={3}>
    <Form.Group controlId="bootstrap-theme-variant"><Form.Label>Variant</Form.Label><Form.Select value={presetId} onChange={(event) => setPresetId(event.currentTarget.value)}>{Object.values(presets).map((preset) => <option key={preset.id} value={preset.id}>{preset.title}{preset.source === "app" ? " (app)" : preset.source === "custom" ? " (custom)" : ""}</option>)}</Form.Select></Form.Group>
    <Card><Card.Body><Stack gap={2}><div><Card.Title>{activePreset?.title ?? "Bootstrap"}</Card.Title><Card.Text className="text-body-secondary">{activePreset?.description ?? "Bootstrap theme preview"}</Card.Text></div><div className="d-flex gap-2 flex-wrap"><Button variant="primary">Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline-primary">Outline</Button></div><div className="d-flex gap-1">{[100, 80, 60, 40, 20].map((opacity) => <div key={opacity} title={`${opacity}%`} className="flex-grow-1 rounded" style={{ height: 34, background: `rgb(var(--bs-primary-rgb) / ${opacity / 100})` }} />)}</div></Stack></Card.Body></Card>
    <Card><Card.Body><Stack gap={3}><div><Card.Title>Bootstrap 5.3 variables</Card.Title><Card.Text className="text-body-secondary">Tune Bootstrap's runtime color mode, root type metrics, borders, radii, and focus treatment.</Card.Text></div>
      <Form.Group controlId="bootstrap-theme-name"><Form.Label>Theme name</Form.Label><Form.Control value={name} placeholder="e.g. My Brand" onChange={(event) => setName(event.currentTarget.value)} /></Form.Group>
      <Form.Group controlId="bootstrap-color-mode"><Form.Label>Color mode (data-bs-theme)</Form.Label><Form.Select value={draft.colorMode} onChange={(event) => setSetting("colorMode", event.currentTarget.value as BootstrapThemeSettings["colorMode"])}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></Form.Select></Form.Group>
      <Form.Group controlId="bootstrap-primary-color"><Form.Label>Primary color</Form.Label><div className="d-flex gap-2"><Form.Control value={draft.primaryColor} onChange={(event) => setSetting("primaryColor", event.currentTarget.value)} /><Form.Control aria-label="Pick primary color" type="color" value={isValidBootstrapHex(draft.primaryColor) ? draft.primaryColor : "#0D6EFD"} onChange={(event) => setSetting("primaryColor", event.currentTarget.value.toUpperCase())} style={{ width: 56 }} /></div></Form.Group>
      <Form.Group controlId="bootstrap-radius"><Form.Label>Corner radius: {draft.borderRadius}px</Form.Label><Form.Range min={0} max={24} step={1} value={draft.borderRadius} onChange={(event) => setSetting("borderRadius", Number(event.currentTarget.value))} /></Form.Group>
      <Form.Group controlId="bootstrap-font-size"><Form.Label>Root body font size: {draft.bodyFontSize}px</Form.Label><Form.Range min={12} max={20} step={1} value={draft.bodyFontSize} onChange={(event) => setSetting("bodyFontSize", Number(event.currentTarget.value))} /></Form.Group>
      <Form.Group controlId="bootstrap-line-height"><Form.Label>Body line height: {draft.bodyLineHeight.toFixed(2)}</Form.Label><Form.Range min={1.1} max={2} step={0.05} value={draft.bodyLineHeight} onChange={(event) => setSetting("bodyLineHeight", Number(event.currentTarget.value))} /></Form.Group>
      <Form.Group controlId="bootstrap-border-width"><Form.Label>Border width: {draft.borderWidth}px</Form.Label><Form.Range min={0} max={4} step={1} value={draft.borderWidth} onChange={(event) => setSetting("borderWidth", Number(event.currentTarget.value))} /></Form.Group>
      <Form.Group controlId="bootstrap-focus-opacity"><Form.Label>Focus ring opacity: {draft.focusRingOpacity.toFixed(2)}</Form.Label><Form.Range min={0.1} max={0.75} step={0.05} value={draft.focusRingOpacity} onChange={(event) => setSetting("focusRingOpacity", Number(event.currentTarget.value))} /></Form.Group>
      <div className="d-flex gap-2 flex-wrap"><Button disabled={!canSave} onClick={() => save(false)}>Save</Button><Button variant="outline-primary" disabled={!canSave} onClick={() => save(true)}>Save as new</Button><Button variant="outline-danger" disabled={!isCustom} onClick={() => removeCustomPreset(presetId)}>Delete</Button></div>
    </Stack></Card.Body></Card>
  </Stack>;
};
