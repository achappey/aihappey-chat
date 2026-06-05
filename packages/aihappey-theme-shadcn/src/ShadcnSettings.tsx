import * as React from "react";
import { useShadcnThemePreset } from "./ShadcnThemeContext";
import {
  createSchemeFromBaseColor,
  getPresetPalette,
  isValidHexColor,
  readableTextColor,
  SHADCN_COLOR_STOPS,
  type ShadcnThemePresetId,
} from "./shadcnThemeTokens";

const DEFAULT_CUSTOM_HEX = "#3B82F6";

export const ThemeSettings = () => {
  const {
    presetId,
    setPresetId,
    presets,
    addCustomPreset,
    updateCustomPreset,
    getCustomPreset,
    removeCustomPreset,
  } = useShadcnThemePreset();

  const activePreset = presets[presetId] ?? Object.values(presets)[0];
  const activeCustom = presetId.startsWith("custom:") ? getCustomPreset(presetId) : undefined;
  const [draftName, setDraftName] = React.useState(activeCustom?.title ?? "");
  const [draftHex, setDraftHex] = React.useState(activeCustom?.baseHex ?? DEFAULT_CUSTOM_HEX);
  const [draftRadius, setDraftRadius] = React.useState(activeCustom?.radius ?? activePreset?.scheme.radius ?? "0.5rem");
  const palette = getPresetPalette(activePreset);
  const previewScheme = React.useMemo(
    () => (isValidHexColor(draftHex) ? createSchemeFromBaseColor(draftHex, draftRadius) : undefined),
    [draftHex, draftRadius]
  );

  React.useEffect(() => {
    setDraftName(activeCustom?.title ?? "");
    setDraftHex(activeCustom?.baseHex ?? DEFAULT_CUSTOM_HEX);
    setDraftRadius(activeCustom?.radius ?? activePreset?.scheme.radius ?? "0.5rem");
  }, [activeCustom?.baseHex, activeCustom?.radius, activeCustom?.title, activePreset?.scheme.radius, presetId]);

  const canSave = draftName.trim().length > 0 && isValidHexColor(draftHex);
  const isCustom = presetId.startsWith("custom:");

  const saveCustom = (saveAsNew: boolean) => {
    if (!canSave) return;
    const title = draftName.trim();
    const baseHex = draftHex.trim().toUpperCase();
    const radius = draftRadius.trim() || "0.5rem";

    if (isCustom && !saveAsNew) {
      updateCustomPreset(presetId, { title, baseHex, radius });
      return;
    }

    const id = addCustomPreset(title, baseHex, radius);
    setPresetId(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="aih-shadcn-card" style={{ padding: 12 }}>
        <div className="aih-shadcn-field">
          <label className="aih-shadcn-label" htmlFor="aih-shadcn-variant">
            Variant
          </label>
          <select
            id="aih-shadcn-variant"
            className="aih-shadcn-select-trigger"
            value={presetId}
            onChange={(event) => setPresetId(event.target.value as ShadcnThemePresetId)}
            style={{ padding: "0 .75rem" }}
          >
            {Object.values(presets).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title}{preset.source === "app" ? " (app)" : preset.source === "custom" ? " (custom)" : ""}
              </option>
            ))}
          </select>
          <span className="aih-shadcn-hint">
            Built-in variants come from Tailwind palettes. App schemes and custom user schemes are merged in.
          </span>
        </div>
      </div>

      <div className="aih-shadcn-card" style={{ padding: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <strong>{activePreset?.title ?? "shadcn"}</strong>
            {activePreset?.description ? <p className="aih-shadcn-hint" style={{ margin: "4px 0 0" }}>{activePreset.description}</p> : null}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="aih-shadcn-btn aih-shadcn-btn-primary aih-shadcn-btn-md">Primary</button>
            <button type="button" className="aih-shadcn-btn aih-shadcn-btn-secondary aih-shadcn-btn-md">Secondary</button>
            <button type="button" className="aih-shadcn-btn aih-shadcn-btn-outline aih-shadcn-btn-md">Outline</button>
          </div>
          <div className="aih-shadcn-card" style={{ padding: 12 }}>
            <div className="aih-shadcn-card-title">Preview card</div>
            <p className="aih-shadcn-hint" style={{ marginBottom: 0 }}>
              CSS variables are regenerated when this variant changes.
            </p>
          </div>
        </div>
      </div>

      {palette ? (
        <div className="aih-shadcn-card" style={{ padding: 12 }}>
          <strong>Palette</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6, marginTop: 10 }}>
            {SHADCN_COLOR_STOPS.map((stop) => {
              const color = palette[stop];
              if (!color) return null;
              return (
                <div
                  key={stop}
                  title={`${stop}: ${color}`}
                  style={{
                    minHeight: 46,
                    borderRadius: "var(--aih-shadcn-radius)",
                    background: color,
                    color: readableTextColor(color),
                    border: "1px solid var(--aih-shadcn-border)",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    fontSize: 11,
                    lineHeight: 1.1,
                  }}
                >
                  <strong>{stop}</strong>
                  <span>{String(color).replace("#", "").slice(0, 6)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="aih-shadcn-card" style={{ padding: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <strong>Custom scheme</strong>
            <p className="aih-shadcn-hint" style={{ margin: "4px 0 0" }}>
              Create a user scheme from one key color. App-provided schemes can be passed to the provider.
            </p>
          </div>
          <label className="aih-shadcn-field">
            <span className="aih-shadcn-label">Theme name</span>
            <input className="aih-shadcn-input" value={draftName} placeholder="e.g. My Brand" onChange={(event) => setDraftName(event.target.value)} />
          </label>
          <label className="aih-shadcn-field">
            <span className="aih-shadcn-label">Key color</span>
            <input className="aih-shadcn-input" value={draftHex} placeholder={DEFAULT_CUSTOM_HEX} onChange={(event) => setDraftHex(event.target.value)} />
          </label>
          <label className="aih-shadcn-field">
            <span className="aih-shadcn-label">Radius</span>
            <input className="aih-shadcn-input" value={draftRadius} placeholder="0.5rem" onChange={(event) => setDraftRadius(event.target.value)} />
          </label>

          {previewScheme?.palette ? (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {SHADCN_COLOR_STOPS.map((stop) => {
                const color = previewScheme.palette?.[stop];
                if (!color) return null;

                return (
                  <span
                    key={stop}
                    title={`${stop}: ${color}`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: color,
                      border: "1px solid var(--aih-shadcn-border)",
                    }}
                  />
                );
              })}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="aih-shadcn-btn aih-shadcn-btn-primary aih-shadcn-btn-md" disabled={!canSave} onClick={() => saveCustom(false)}>
              Save
            </button>
            <button type="button" className="aih-shadcn-btn aih-shadcn-btn-secondary aih-shadcn-btn-md" disabled={!canSave} onClick={() => saveCustom(true)}>
              Save as new
            </button>
            <button
              type="button"
              className="aih-shadcn-btn aih-shadcn-btn-outline aih-shadcn-btn-md"
              disabled={!isCustom}
              onClick={() => {
                if (!isCustom) return;
                removeCustomPreset(presetId);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShadcnSettings = ThemeSettings;

