import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

type Props = {
  //  translations?: any;
  language: string;
  languages: {
    en: string;
    nl: string;
    de: string;
    es: string;
    fr: string;
    pt: string;
    hi: string;
    it: string;
    pl: string;
    tr: string;
    hu: string;
    ru: string;
    ja: string;
    vi: string;
    th: string;
    ro: string;
    id: string;
    bn: string;
  };
  onLanguageChange?: (lang: string) => void;
  onDeleteAllChats?: () => void;
  onLogout?: () => void;
};

export const UserGeneralSettings: React.FC<Props> = ({
  // translations,
  language,
  languages,
  onLanguageChange,
  onDeleteAllChats,
  onLogout,
}) => {
  const { Select, Button } = useTheme();
  const { t } = useTranslation();
  const languagesItems = Object.keys(languages);

  const languageOptions = languagesItems
    .map(z => ({ value: z, label: (languages as any)[z as any] }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32
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
