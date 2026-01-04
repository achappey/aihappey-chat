import { useMemo, useState } from "react";
import { tinycolor } from "@ctrl/tinycolor";
import {
    Button,
    Input,
    Label,
    makeStyles,
    ColorPicker,
    ColorArea,
    ColorSlider,
    AlphaSlider,
    Field,
} from "@fluentui/react-components";

import { Select } from "./primitives/Select";
import { useFluentThemePreset } from "./ThemeProvider";

const useStyles = makeStyles({
    block: { display: "flex", flexDirection: "column", gap: "12px" },
    row: { display: "flex", gap: "10px", alignItems: "end", flexWrap: "wrap" },
    picker: { width: "280px" },
    preview: {
        width: "32px",
        height: "32px",
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.2)",
    },
});

const DEFAULT_HSV = { h: 210, s: 1, v: 1, a: 1 };

export const FluentSettings = () => {
    const styles = useStyles();
    const { presetId, setPresetId, presets, addCustomPreset, customPresets, removeCustomPreset } =
        useFluentThemePreset();

    const [name, setName] = useState("");
    // const [hsv, setHsv] = useState(DEFAULT_HSV);

    const [hsv, setHsv] = useState({ h: 210, s: 1, v: 1, a: 1 });
    const hex = useMemo(() => tinycolor(hsv).toHexString().toUpperCase(), [hsv]);
    const canAdd = name.trim().length > 0 && tinycolor(hex).isValid;

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

            {/* ✅ Custom Brand section */}
            {false && <div className={styles.block}>
                <div className={styles.row}>
                    <div style={{ minWidth: 220 }}>
                        <Field
                            label="Custom variant"
                            orientation="vertical"
                        >
                            <Input
                                id="custom-brand-name"
                                value={name}
                                placeholder="e.g. Green"
                                onChange={(_, d) => setName(d.value)}
                            />
                        </Field>
                    </div>

                    <div className={styles.picker}>
                        <ColorPicker
                            color={hsv}
                            onColorChange={(_, data) =>
                                setHsv({
                                    ...data.color,
                                    a: data.color.a ?? 1,
                                })
                            }
                        >
                            <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                            <ColorSlider aria-label="Hue" />
                            <AlphaSlider
                                aria-label="Alpha"
                                aria-valuetext={`${Math.round((hsv.a ?? 1) * 100)}%`}
                            />
                        </ColorPicker>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.preview} style={{ background: tinycolor(hsv).toRgbString() }} title={hex} />
                        <Input value={hex} readOnly />
                        <Button
                            appearance="primary"
                            disabled={!canAdd}
                            onClick={() => {
                                const id = addCustomPreset(name, hex);
                                setPresetId(id);
                                setName("");
                            }}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* optional: quick remove for customs */}
                {customPresets.length > 0 && (
                    <div className={styles.block}>
                        <Label>My custom variants</Label>
                        <div className={styles.row}>
                            {customPresets.map((p) => (
                                <Button
                                    key={p.id}
                                    onClick={() => setPresetId(p.id)}
                                    onContextMenu={(ev) => {
                                        ev.preventDefault();
                                        removeCustomPreset(p.id);
                                    }}
                                >
                                    {p.title}
                                </Button>
                            ))}
                        </div>
                        <div style={{ opacity: 0.7, fontSize: 12 }}>
                            Tip: right-click a custom button to remove it.
                        </div>
                    </div>
                )}
            </div>}
        </div>
    );
};
