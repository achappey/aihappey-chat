import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

/** Optional native enum: provider default removes the field rather than sending a UI sentinel. */
export const FileConfigSelect: React.FC<{
    label: string;
    value?: string;
    options: { value: string; label: string }[];
    onChange: (value: string | undefined) => void;
}> = ({ label, value, options, onChange }) => {
    const { Select } = useTheme();
    const { t } = useTranslation();
    const choices = [{ value: "", label: t("fileInput.providerDefault") }, ...options];
    return <Select label={label} values={[value ?? ""]}
        valueTitle={choices.find((option) => option.value === (value ?? ""))?.label}
        options={choices} onChange={(next: string) => onChange(next || undefined)}>
        {choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </Select>;
};
