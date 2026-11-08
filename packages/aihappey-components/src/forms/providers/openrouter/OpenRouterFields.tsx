import { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import {
  isOpenRouterNumber,
  parseOpenRouterList,
  serializeOpenRouterList,
} from "./openRouterToolConfig";

export const openRouterStack = { display: "flex", flexDirection: "column", gap: 8 } as const;
export const openRouterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 12,
  width: "100%",
  alignItems: "end",
} as const;

export const OpenRouterNumberInput = ({ label, value, onChange, min = 1, max, integer = true, disabled, id }: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  disabled?: boolean;
  id?: string;
}) => {
  const theme = useTheme();
  return <theme.Input id={id} label={label} type="number" value={value ?? ""}
    min={min} max={max} step={integer ? 1 : "any"} disabled={disabled}
    onChange={event => {
      const raw = event.target.value.trim();
      if (!raw) {
        // A partially typed exponent is not a request to clear the setting.
        if (!event.target.validity?.badInput) onChange(undefined);
      } else if (isOpenRouterNumber(Number(raw), min, max, integer)) onChange(Number(raw));
    }} />;
};

export const OpenRouterListInput = ({ label, value, onChange, placeholder, disabled, maxItems, id }: {
  label: string;
  value?: string[];
  onChange: (value: string[] | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  maxItems?: number;
  id?: string;
}) => {
  const theme = useTheme();
  const serialized = serializeOpenRouterList(value);
  const [draft, setDraft] = useState(serialized);
  useEffect(() => {
    setDraft(current => serializeOpenRouterList(parseOpenRouterList(current)) === serialized ? current : serialized);
  }, [serialized]);
  return <theme.Input id={id} label={label} value={draft} placeholder={placeholder} disabled={disabled}
    onChange={event => {
      const text = event.target.value;
      const list = parseOpenRouterList(text);
      setDraft(text);
      if (!maxItems || (list?.length ?? 0) <= maxItems) onChange(list);
    }} onBlur={() => setDraft(serialized)} />;
};

export const OpenRouterSelect = ({ label, value, options, disabled, onChange }: {
  label: string;
  value?: string;
  options: readonly string[];
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const notSet = t("providers:openrouter.notSet");
  const items = ["", ...options.filter(Boolean)].map(item => ({ value: item, label: item || notSet }));
  return <theme.Select label={label} values={[value ?? ""]} valueTitle={value || notSet}
    options={items} disabled={disabled} onChange={(value: any) => onChange(value || undefined)}>
    {items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
  </theme.Select>;
};
