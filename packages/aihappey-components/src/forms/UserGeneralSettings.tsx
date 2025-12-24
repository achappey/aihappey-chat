import React from "react";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  translations?: any;
  language: string;
  languages: string[];
  onLanguageChange?: (lang: string) => void;
  onDeleteAllChats?: () => void;
  onLogout?: () => void;
};

export const UserGeneralSettings: React.FC<Props> = ({
  translations,
  language,
  languages,
  onLanguageChange,
  onDeleteAllChats,
  onLogout,
}) => {
  const { Select, Button } = useTheme();

  const t = (key: string) => translations?.[key] ?? key;

  const languageOptions = languages
    .map(z => ({ value: z, label: translations?.[z] ?? z }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: "0 32px 32px 32px",
      }}
    >
      {/* Language */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Select
          values={[language]}
          label={t("settingsModal.languageLabel")}
          valueTitle={languageOptions.find(l => l.value === language)?.label}
          options={languageOptions}
          onChange={(v: string) => onLanguageChange?.(v)}
        >
          {languageOptions.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Delete all chats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 16 }}>
          {t("settingsModal.deleteAllChats")}
        </div>
        <Button
          className="danger"
          variant="subtle"
          onClick={onDeleteAllChats}
        >
          {t("settingsModal.deleteAll")}
        </Button>
      </div>

      {/* Logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 16 }}>
          {t("settingsModal.logoutOnDevice")}
        </div>
        <Button className="primary" onClick={onLogout}>
          {t("userMenu.logout")}
        </Button>
      </div>
    </div>
  );
};
