import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useMaterialThemePreset } from "../MaterialThemeContext";
import { MATERIAL_FONT_FAMILIES, MATERIAL_PALETTES, type MaterialPaletteName, type MaterialThemeSettings } from "../materialThemePresets";

const FALLBACK_SETTINGS: MaterialThemeSettings = {
  primaryPalette: "blue",
  secondaryPalette: "purple",
  contrastThreshold: 3,
  tonalOffset: 0.2,
  borderRadius: 4,
  fontFamily: MATERIAL_FONT_FAMILIES[0],
  density: "comfortable",
};

export const ThemeSettings = () => {
  const muiTheme = useTheme();
  const { presetId, setPresetId, presets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset } = useMaterialThemePreset();
  const activePreset = presets[presetId];
  const [name, setName] = React.useState("");
  const [draft, setDraft] = React.useState<MaterialThemeSettings>(activePreset?.settings ?? FALLBACK_SETTINGS);

  React.useEffect(() => {
    setName(getCustomPreset(presetId)?.title ?? "");
    setDraft(activePreset?.settings ?? FALLBACK_SETTINGS);
  }, [activePreset, getCustomPreset, presetId]);

  const isCustom = presetId.startsWith("custom:");
  const canSave = name.trim().length > 0;
  const save = (asNew: boolean) => {
    if (!canSave) return;
    if (isCustom && !asNew) updateCustomPreset(presetId, { title: name, settings: draft });
    else setPresetId(addCustomPreset(name, draft));
  };
  const setSetting = <K extends keyof MaterialThemeSettings>(key: K, value: MaterialThemeSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const swatches = [muiTheme.palette.primary.light, muiTheme.palette.primary.main, muiTheme.palette.primary.dark, muiTheme.palette.secondary.light, muiTheme.palette.secondary.main, muiTheme.palette.secondary.dark];

  return (
    <Stack spacing={2}>
      <FormControl fullWidth size="small">
        <InputLabel id="material-theme-variant-label">Variant</InputLabel>
        <Select labelId="material-theme-variant-label" label="Variant" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
          {Object.values(presets).map((preset) => <MenuItem key={preset.id} value={preset.id}>{preset.title}{preset.source === "app" ? " (app)" : preset.source === "custom" ? " (custom)" : ""}</MenuItem>)}
        </Select>
      </FormControl>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Box><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{activePreset?.title ?? "Material"}</Typography><Typography variant="body2" color="text.secondary">{activePreset?.description ?? "Material theme preview"}</Typography></Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}><Button variant="contained">Primary</Button><Button variant="contained" color="secondary">Secondary</Button><Button variant="outlined">Outline</Button></Stack>
            <Stack direction="row" spacing={0.75}>{swatches.map((color, index) => <Box key={`${color}-${index}`} title={color} sx={{ bgcolor: color, height: 34, flex: 1, minWidth: 24, borderRadius: 1 }} />)}</Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Material theme options</Typography><Typography variant="body2" color="text.secondary">Compose native Material palette, tonal, shape, typography, and component-default options.</Typography></Box>
            <TextField size="small" label="Theme name" value={name} placeholder="e.g. My Brand" onChange={(event) => setName(event.target.value)} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <FormControl fullWidth size="small"><InputLabel id="material-primary-palette-label">Primary palette</InputLabel><Select labelId="material-primary-palette-label" label="Primary palette" value={draft.primaryPalette} onChange={(event) => setSetting("primaryPalette", event.target.value as MaterialPaletteName)}>{Object.keys(MATERIAL_PALETTES).map((palette) => <MenuItem key={palette} value={palette}>{palette}</MenuItem>)}</Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel id="material-secondary-palette-label">Secondary palette</InputLabel><Select labelId="material-secondary-palette-label" label="Secondary palette" value={draft.secondaryPalette} onChange={(event) => setSetting("secondaryPalette", event.target.value as MaterialPaletteName)}>{Object.keys(MATERIAL_PALETTES).map((palette) => <MenuItem key={palette} value={palette}>{palette}</MenuItem>)}</Select></FormControl>
            </Stack>
            <Box><Typography variant="body2" gutterBottom>Contrast threshold: {draft.contrastThreshold}</Typography><Slider value={draft.contrastThreshold} min={2} max={7} step={0.5} valueLabelDisplay="auto" onChange={(_, value) => setSetting("contrastThreshold", value as number)} /></Box>
            <Box><Typography variant="body2" gutterBottom>Tonal offset: {draft.tonalOffset.toFixed(1)}</Typography><Slider value={draft.tonalOffset} min={0.1} max={0.5} step={0.1} valueLabelDisplay="auto" onChange={(_, value) => setSetting("tonalOffset", value as number)} /></Box>
            <Box><Typography variant="body2" gutterBottom>Corner radius: {draft.borderRadius}px</Typography><Slider value={draft.borderRadius} min={0} max={24} step={1} valueLabelDisplay="auto" onChange={(_, value) => setSetting("borderRadius", value as number)} /></Box>
            <FormControl fullWidth size="small"><InputLabel id="material-font-label">Typography</InputLabel><Select labelId="material-font-label" label="Typography" value={draft.fontFamily} onChange={(event) => setSetting("fontFamily", event.target.value)}>{MATERIAL_FONT_FAMILIES.map((font) => <MenuItem key={font} value={font} sx={{ fontFamily: font }}>{font.split(",")[0]}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth size="small"><InputLabel id="material-density-label">Component density</InputLabel><Select labelId="material-density-label" label="Component density" value={draft.density} onChange={(event) => setSetting("density", event.target.value as MaterialThemeSettings["density"])}><MenuItem value="comfortable">Comfortable</MenuItem><MenuItem value="compact">Compact native defaults</MenuItem></Select></FormControl>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}><Button variant="contained" disabled={!canSave} onClick={() => save(false)}>Save</Button><Button variant="outlined" disabled={!canSave} onClick={() => save(true)}>Save as new</Button><Button color="error" disabled={!isCustom} onClick={() => removeCustomPreset(presetId)}>Delete</Button></Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

