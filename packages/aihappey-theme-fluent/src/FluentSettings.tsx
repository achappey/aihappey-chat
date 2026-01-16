import { useMemo, useState } from "react";
import { tinycolor } from "@ctrl/tinycolor";
import {
  ColorArea,
  ColorPicker,
  ColorSlider,
  makeStyles,
} from "@fluentui/react-components";

import { Button, Card, Chat, Input, Select, Slider, Tabs, Tab } from "./primitives";
import { useFluentThemePreset } from "./ThemeProvider";
import { brandVariantsFromDesignerParams } from "./brandVariantsFromDesignerParams";
import type { ChatMessage } from "aihappey-types";

const useStyles = makeStyles({
  block: { display: "flex", flexDirection: "column", gap: "12px" },
  row: { display: "flex", gap: "10px", alignItems: "end", flexWrap: "wrap" },
  tabsWrap: { display: "flex", flexDirection: "column", gap: "10px" },
  section: { display: "flex", flexDirection: "column", gap: "10px" },
  previewCard: {
    padding: "12px",
  },
  editorGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "14px",
    alignItems: "start",
  },
  picker: { width: "300px" },
  palette: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
    alignContent: "start",
  },
  swatch: {
    width: "56px",
    height: "44px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "6px",
    boxSizing: "border-box",
    fontSize: "11px",
    lineHeight: 1,
  },
  swatchLabel: { fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.35)" },
  swatchHex: { opacity: 0.9, textShadow: "0 1px 2px rgba(0,0,0,0.35)" },
  toolbar: { display: "flex", gap: "10px", flexWrap: "wrap" },
});

const DEFAULT_HEX = "#2B88D8";

export const FluentSettings = () => {
  const styles = useStyles();
  const {
    presetId,
    setPresetId,
    presets,
    addCustomPreset,
    updateCustomPreset,
    getCustomPreset,
    removeCustomPreset,
  } = useFluentThemePreset();

  const [tab, setTab] = useState("preview");

  // Editor state
  const activeCustom = presetId.startsWith("custom:") ? getCustomPreset(presetId) : undefined;
  const [draftName, setDraftName] = useState(activeCustom?.title ?? "");
  const [draftHex, setDraftHex] = useState(activeCustom?.baseHex ?? DEFAULT_HEX);
  const [hueTorsion, setHueTorsion] = useState<number>(activeCustom?.hueTorsion ?? 0);
  const [vibrancy, setVibrancy] = useState<number>(activeCustom?.vibrancy ?? 0);

  // Keep editor in sync when user selects a different custom theme
  // (or switches away from custom).
  useMemo(() => {
    setDraftName(activeCustom?.title ?? "");
    setDraftHex(activeCustom?.baseHex ?? DEFAULT_HEX);
    setHueTorsion(activeCustom?.hueTorsion ?? 0);
    setVibrancy(activeCustom?.vibrancy ?? 0);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  const normalizedHex = useMemo(() => {
    try {
      return tinycolor(draftHex).toHexString().toUpperCase();
    } catch {
      return DEFAULT_HEX;
    }
  }, [draftHex]);

  const canSave = useMemo(() => {
    const nameOk = (draftName ?? "").trim().length > 0;
    const hexOk = tinycolor(normalizedHex).isValid;
    return nameOk && hexOk;
  }, [draftName, normalizedHex]);

  const variants = useMemo(() => {
    if (!tinycolor(normalizedHex).isValid) return null;
    return brandVariantsFromDesignerParams({
      baseHex: normalizedHex,
      hueTorsion,
      vibrancy,
      mode: "lch",
    });
  }, [normalizedHex, hueTorsion, vibrancy]);

  const paletteStops = useMemo(() => {
    if (!variants) return [] as { stop: number; hex: string }[];
    return Object.entries(variants)
      .map(([k, v]) => ({ stop: Number(k), hex: String(v).toUpperCase() }))
      .sort((a, b) => a.stop - b.stop);
  }, [variants]);

  const isCustom = presetId.startsWith("custom:");

  const previewMessages = useMemo((): ChatMessage[] => {
    const now = new Date();
    return [
      {
        id: "preview-1",
        role: "assistant",
        author: "AI",
        createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        content: [{ type: "text", text: "This is a themed Fluent Chat preview." } as any],
      },
      {
        id: "preview-2",
        role: "user",
        author: "You",
        createdAt: new Date(now.getTime() - 1000 * 60 * 2).toISOString(),
        content: [{ type: "text", text: "Looks good — does it support cards too?" } as any],
      },
      {
        id: "preview-3",
        role: "assistant",
        author: "AI",
        createdAt: new Date(now.getTime() - 1000 * 45).toISOString(),
        messageIcon: "check",
        messageLabel: "Preview",
        content: [{ type: "text", text: "Thinking" } as any],
      },
      {
        id: "preview-3",
        role: "assistant",
        author: "AI",
        createdAt: new Date(now.getTime() - 1000 * 45).toISOString(),
        content: [{ type: "text", text: "Yes. The Card + Chat primitives are now in this preview tab." } as any],
      },
    ];
  }, []);

  return (
    <div className={styles.block}>
      <Select
        label="Variant"
        valueTitle={Object.entries(presets).find((a) => a[0] === presetId)?.[1].title}
        onChange={(e: any) => setPresetId(e)}
        values={[presetId]}
      >
        {Object.values(presets).map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </Select>

      <div className={styles.tabsWrap}>
        <Tabs activeKey={tab} onSelect={setTab}>
          <Tab eventKey="preview" title="Preview">
            <div className={styles.previewCard}>
              <div className={styles.section}>


                <Card
                  title={<div style={{ fontWeight: 600 }}>Card preview</div>}
                  description="Card description"
                >
                  Card content
                </Card>

                <Chat
                  locale="en"
                  messages={previewMessages}
                  renderMessage={(msg) => {
                    const text =
                      (msg as any)?.content?.find?.((p: any) => p?.type === "text")?.text ??
                      "";
                    return <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>;
                  }}
                />

                <div className={styles.toolbar}>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                </div>
                <Input label="Example input" placeholder="Type something…" />
                <Select
                  label="Example select"
                  onChange={() => undefined}
                  values={["a"]}
                  valueTitle="Option A"
                >
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                  <option value="c">Option C</option>
                </Select>
              </div>
            </div>
          </Tab>

          <Tab eventKey="editor" title="Editor">
            <div className={styles.editorGrid}>
              <div className={styles.section}>
                <Input
                  label="Theme name"
                  value={draftName}
                  placeholder="e.g. My Brand"
                  onChange={(e: any) => setDraftName(e.target.value)}
                />

                <Input
                  label="Key color value"
                  value={draftHex}
                  placeholder={DEFAULT_HEX}
                  onChange={(e: any) => setDraftHex(e.target.value)}
                />

                <div className={styles.picker}>
                  <ColorPicker
                    color={tinycolor(normalizedHex).toHsv()}
                    onColorChange={(_, data) => {
                      const next = tinycolor(data.color).toHexString().toUpperCase();
                      setDraftHex(next);
                    }}
                  >
                    <ColorArea
                      inputX={{ "aria-label": "Saturation" }}
                      inputY={{ "aria-label": "Brightness" }}
                    />
                    <ColorSlider aria-label="Hue" />
                  </ColorPicker>
                </div>

                <Slider
                  label="Hue Torsion"
                  value={hueTorsion}
                  min={0}
                  max={12}
                  step={1}
                  showValue
                  onChange={setHueTorsion}
                />
                <Slider
                  label="Vibrancy"
                  value={vibrancy}
                  min={-100}
                  max={100}
                  step={1}
                  showValue
                  onChange={setVibrancy}
                />

                <div className={styles.toolbar}>
                  <Button
                    variant="primary"
                    disabled={!canSave}
                    onClick={() => {
                      const title = draftName.trim();
                      const baseHex = normalizedHex;
                      if (!canSave) return;

                      if (isCustom) {
                        updateCustomPreset(presetId, { title, baseHex, hueTorsion, vibrancy });
                      } else {
                        const id = addCustomPreset(title, baseHex);
                        updateCustomPreset(id, { hueTorsion, vibrancy });
                        setPresetId(id);
                      }
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={!canSave}
                    onClick={() => {
                      const title = draftName.trim();
                      const baseHex = normalizedHex;
                      if (!canSave) return;

                      const id = addCustomPreset(title, baseHex);
                      updateCustomPreset(id, { hueTorsion, vibrancy });
                      setPresetId(id);
                    }}
                  >
                    Save as new
                  </Button>

                  <Button
                    variant="outline"
                    icon={"delete"}
                    disabled={!isCustom}
                    onClick={() => {
                      if (!isCustom) return;

                      const title = activeCustom?.title ?? "this theme";
                      const ok = window.confirm(`Delete custom theme "${title}"?`);
                      if (!ok) return;

                      removeCustomPreset(presetId);
                    }}
                  >
                  </Button>
                </div>
              </div>

              <div className={styles.section}>
                <div style={{ fontWeight: 600 }}>Palette</div>
                <div className={styles.palette}>
                  {paletteStops.map(({ stop, hex }) => (
                    <div
                      key={stop}
                      className={styles.swatch}
                      style={{ background: hex, color: tinycolor(hex).isLight() ? "#111" : "#fff" }}
                      title={`${stop}: ${hex}`}
                    >
                      <div className={styles.swatchLabel}>{stop}</div>
                      <div className={styles.swatchHex}>{hex.replace("#", "").slice(0, 6)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};
