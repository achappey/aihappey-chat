import * as React from "react";
import * as Chakra from "@chakra-ui/react";
import { useChakraThemePreset } from "./ChakraThemeContext";
import { CHAKRA_COLOR_PALETTES, CHAKRA_COLOR_STEPS, CHAKRA_FONT_FAMILIES, type ChakraColorPalette, type ChakraRadiusProfile, type ChakraThemeSettings } from "./chakraThemePresets";

const FALLBACK: ChakraThemeSettings = { colorPalette: "gray", radiusProfile: "chakra", fontFamily: CHAKRA_FONT_FAMILIES[0] };
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <Chakra.Field.Root><Chakra.Field.Label>{label}</Chakra.Field.Label>{children}</Chakra.Field.Root>;

export const ChakraSettings = () => {
  const { presetId, setPresetId, presets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset } = useChakraThemePreset();
  const activePreset = presets[presetId];
  const [name, setName] = React.useState("");
  const [draft, setDraft] = React.useState<ChakraThemeSettings>(activePreset?.settings ?? FALLBACK);
  React.useEffect(() => { setName(getCustomPreset(presetId)?.title ?? ""); setDraft(activePreset?.settings ?? FALLBACK); }, [activePreset, getCustomPreset, presetId]);
  const isCustom = presetId.startsWith("custom:");
  const canSave = name.trim().length > 0;
  const setSetting = <K extends keyof ChakraThemeSettings>(key: K, value: ChakraThemeSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = (asNew: boolean) => { if (!canSave) return; if (isCustom && !asNew) updateCustomPreset(presetId, { title: name, settings: draft }); else setPresetId(addCustomPreset(name, draft)); };

  return <Chakra.Stack gap="4">
    <Field label="Variant"><Chakra.NativeSelect.Root><Chakra.NativeSelect.Field value={presetId} onChange={(event) => setPresetId(event.currentTarget.value)}>{Object.values(presets).map((preset) => <option key={preset.id} value={preset.id}>{preset.title}{preset.source === "app" ? " (app)" : preset.source === "custom" ? " (custom)" : ""}</option>)}</Chakra.NativeSelect.Field><Chakra.NativeSelect.Indicator /></Chakra.NativeSelect.Root></Field>
    <Chakra.Box borderWidth="1px" borderRadius="md" padding="4"><Chakra.Stack gap="3"><Chakra.Box><Chakra.Text fontWeight="semibold">{activePreset?.title ?? "Chakra"}</Chakra.Text><Chakra.Text color="fg.muted" fontSize="sm">{activePreset?.description ?? "Chakra theme preview"}</Chakra.Text></Chakra.Box><Chakra.HStack wrap="wrap"><Chakra.Button>Solid</Chakra.Button><Chakra.Button variant="surface">Surface</Chakra.Button><Chakra.Button variant="outline">Outline</Chakra.Button><Chakra.Button variant="ghost">Ghost</Chakra.Button></Chakra.HStack><Chakra.HStack gap="1">{CHAKRA_COLOR_STEPS.map((step) => <Chakra.Box key={step} title={`${activePreset?.settings.colorPalette}.${step}`} height="8" flex="1" minWidth="4" borderRadius="sm" background={`${activePreset?.settings.colorPalette ?? "gray"}.${step}`} />)}</Chakra.HStack></Chakra.Stack></Chakra.Box>
    <Chakra.Box borderWidth="1px" borderRadius="md" padding="4"><Chakra.Stack gap="4"><Chakra.Box><Chakra.Text fontWeight="semibold">Chakra system options</Chakra.Text><Chakra.Text color="fg.muted" fontSize="sm">Choose native built-in colorPalette values and token profiles; no generated color system is introduced.</Chakra.Text></Chakra.Box>
      <Field label="Theme name"><Chakra.Input value={name} placeholder="e.g. My Brand" onChange={(event) => setName(event.currentTarget.value)} /></Field>
      <Field label="Color palette"><Chakra.NativeSelect.Root><Chakra.NativeSelect.Field value={draft.colorPalette} onChange={(event) => setSetting("colorPalette", event.currentTarget.value as ChakraColorPalette)}>{CHAKRA_COLOR_PALETTES.map((palette) => <option key={palette} value={palette}>{palette}</option>)}</Chakra.NativeSelect.Field><Chakra.NativeSelect.Indicator /></Chakra.NativeSelect.Root></Field>
      <Field label="Radius token profile"><Chakra.NativeSelect.Root><Chakra.NativeSelect.Field value={draft.radiusProfile} onChange={(event) => setSetting("radiusProfile", event.currentTarget.value as ChakraRadiusProfile)}><option value="chakra">Chakra defaults</option><option value="sharp">Sharp</option><option value="soft">Soft</option><option value="rounded">Rounded</option></Chakra.NativeSelect.Field><Chakra.NativeSelect.Indicator /></Chakra.NativeSelect.Root></Field>
      <Field label="Typography"><Chakra.NativeSelect.Root><Chakra.NativeSelect.Field value={draft.fontFamily} onChange={(event) => setSetting("fontFamily", event.currentTarget.value)}>{CHAKRA_FONT_FAMILIES.map((font) => <option key={font} value={font}>{font.split(",")[0]}</option>)}</Chakra.NativeSelect.Field><Chakra.NativeSelect.Indicator /></Chakra.NativeSelect.Root></Field>
      <Chakra.HStack wrap="wrap"><Chakra.Button disabled={!canSave} onClick={() => save(false)}>Save</Chakra.Button><Chakra.Button variant="outline" disabled={!canSave} onClick={() => save(true)}>Save as new</Chakra.Button><Chakra.Button colorPalette="red" variant="ghost" disabled={!isCustom} onClick={() => removeCustomPreset(presetId)}>Delete</Chakra.Button></Chakra.HStack>
    </Chakra.Stack></Chakra.Box>
  </Chakra.Stack>;
};

