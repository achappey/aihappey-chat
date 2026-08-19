import * as React from "react";
import { Box, Button, Card, Group, NativeSelect, Paper, Select, Slider, Stack, Switch, Text, TextInput, useMantineTheme } from "@mantine/core";
import { useMantineThemePreset } from "./MantineThemeContext";
import { MANTINE_BUILT_IN_COLORS, type MantineBuiltInColor, type MantineRadius, type MantineThemeSettings } from "./mantineThemePresets";

const FALLBACK: MantineThemeSettings = { primaryColor: "blue", primaryShadeLight: 6, primaryShadeDark: 8, defaultRadius: "sm", scale: 1, focusRing: "auto", cursorType: "default", autoContrast: false, luminanceThreshold: 0.3, fontSmoothing: true };
const RADII: MantineRadius[] = ["xs", "sm", "md", "lg", "xl"];

export const MantineSettings = () => {
  const theme = useMantineTheme();
  const { presetId, setPresetId, presets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset } = useMantineThemePreset();
  const activePreset = presets[presetId];
  const [name, setName] = React.useState("");
  const [draft, setDraft] = React.useState<MantineThemeSettings>(activePreset?.settings ?? FALLBACK);
  React.useEffect(() => { setName(getCustomPreset(presetId)?.title ?? ""); setDraft(activePreset?.settings ?? FALLBACK); }, [activePreset, getCustomPreset, presetId]);
  const isCustom = presetId.startsWith("custom:");
  const canSave = name.trim().length > 0;
  const setSetting = <K extends keyof MantineThemeSettings>(key: K, value: MantineThemeSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = (asNew: boolean) => {
    if (!canSave) return;
    if (isCustom && !asNew) updateCustomPreset(presetId, { title: name, settings: draft });
    else setPresetId(addCustomPreset(name, draft));
  };

  return <Stack gap="md">
    <NativeSelect label="Variant" value={presetId} onChange={(event) => setPresetId(event.currentTarget.value)} data={Object.values(presets).map((preset) => ({ value: preset.id, label: `${preset.title}${preset.source === "app" ? " (app)" : preset.source === "custom" ? " (custom)" : ""}` }))} />
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm"><Box><Text fw={600}>{activePreset?.title ?? "Mantine"}</Text><Text size="sm" c="dimmed">{activePreset?.description ?? "Mantine theme preview"}</Text></Box><Group><Button>Primary</Button><Button variant="light">Light</Button><Button variant="outline">Outline</Button></Group><Group gap={4} wrap="nowrap">{theme.colors[theme.primaryColor]?.map((color, index) => <Paper key={`${color}-${index}`} title={`${index}: ${color}`} h={34} style={{ background: color, flex: 1 }} radius="sm" />)}</Group></Stack>
    </Card>
    <Card withBorder padding="md" radius="md">
      <Stack gap="md"><Box><Text fw={600}>Mantine provider options</Text><Text size="sm" c="dimmed">Configure Mantine's native primary shades, scale, focus behavior, contrast, cursor, radius, and font smoothing.</Text></Box>
        <TextInput label="Theme name" placeholder="e.g. My Brand" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <Select label="Primary color" data={MANTINE_BUILT_IN_COLORS as unknown as string[]} value={draft.primaryColor} onChange={(value) => value && setSetting("primaryColor", value as MantineBuiltInColor)} allowDeselect={false} />
        <Box><Text size="sm">Light primary shade: {draft.primaryShadeLight}</Text><Slider min={0} max={9} step={1} value={draft.primaryShadeLight} onChange={(value) => setSetting("primaryShadeLight", value as MantineThemeSettings["primaryShadeLight"])} /></Box>
        <Box><Text size="sm">Dark primary shade: {draft.primaryShadeDark}</Text><Slider min={0} max={9} step={1} value={draft.primaryShadeDark} onChange={(value) => setSetting("primaryShadeDark", value as MantineThemeSettings["primaryShadeDark"])} /></Box>
        <Group gap={4} wrap="nowrap">{theme.colors[draft.primaryColor].map((color, index) => <Paper key={`${color}-${index}`} title={`${index}: ${color}`} h={30} style={{ background: color, flex: 1, outline: index === draft.primaryShadeLight || index === draft.primaryShadeDark ? `2px solid ${theme.colors.gray[6]}` : undefined }} radius="sm" />)}</Group>
        <Select label="Default radius" data={RADII} value={draft.defaultRadius} onChange={(value) => value && setSetting("defaultRadius", value as MantineRadius)} allowDeselect={false} />
        <Box><Text size="sm">REM scale: {draft.scale.toFixed(2)}</Text><Slider min={0.8} max={1.2} step={0.01} value={draft.scale} onChange={(value) => setSetting("scale", value)} /></Box>
        <Select label="Focus ring" data={[{ value: "auto", label: "Keyboard navigation only" }, { value: "always", label: "Always visible" }]} value={draft.focusRing} onChange={(value) => value && setSetting("focusRing", value as MantineThemeSettings["focusRing"])} allowDeselect={false} />
        <Select label="Interactive cursor" data={[{ value: "default", label: "Native element defaults" }, { value: "pointer", label: "Pointer" }]} value={draft.cursorType} onChange={(value) => value && setSetting("cursorType", value as MantineThemeSettings["cursorType"])} allowDeselect={false} />
        <Switch label="Automatic filled-control contrast" checked={draft.autoContrast} onChange={(event) => setSetting("autoContrast", event.currentTarget.checked)} />
        {draft.autoContrast ? <Box><Text size="sm">Luminance threshold: {draft.luminanceThreshold.toFixed(2)}</Text><Slider min={0.1} max={0.9} step={0.05} value={draft.luminanceThreshold} onChange={(value) => setSetting("luminanceThreshold", value)} /></Box> : null}
        <Switch label="Font smoothing" checked={draft.fontSmoothing} onChange={(event) => setSetting("fontSmoothing", event.currentTarget.checked)} />
        <Group><Button disabled={!canSave} onClick={() => save(false)}>Save</Button><Button variant="outline" disabled={!canSave} onClick={() => save(true)}>Save as new</Button><Button color="red" variant="subtle" disabled={!isCustom} onClick={() => removeCustomPreset(presetId)}>Delete</Button></Group>
      </Stack>
    </Card>
  </Stack>;
};

