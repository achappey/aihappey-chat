import React from "react";
import { useTheme, UserGeneralSettings as GeneralSettingsComp } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export const GeneralSettings = () => {
  const { t, i18n } = useTranslation();

  const translations = {
    "locales.enUS": t("locales.enUS"),
    "locales.nlNL": t("locales.nlNL"),
    "settingsModal.languageLabel": t("settingsModal.languageLabel"),
    "settingsModal.deleteAllChats": t("settingsModal.deleteAllChats"),
    "settingsModal.deleteAll": t("settingsModal.deleteAll"),
    "settingsModal.logoutOnDevice": t("settingsModal.logoutOnDevice"),
    "userMenu.logout": t("userMenu.logout"),
  };

  return (
    <GeneralSettingsComp
      translations={translations}
      language={i18n.language}
      onLanguageChange={(lang) => i18n.changeLanguage(lang)}
      onDeleteAllChats={() => {
        // TODO: clear chats
      }}
      onLogout={() => {
        // TODO: logout
      }}
    />
  );
};

export const GeneralSettings22 = () => {
  const { Select, Button } = useTheme();
  const { t, i18n } = useTranslation();

  const languageOptions = [
    { value: "en", label: t("locales.enUS") },
    { value: "nl", label: t("locales.nlNL") },
  ];

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
          values={[i18n.language]}
          label={t("settingsModal.languageLabel")}
          valueTitle={
            languageOptions.find(a => a.value === i18n.language)?.label
          }
          options={languageOptions}
          onChange={(v: string) => i18n.changeLanguage(v)}
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
          onClick={() => {
            /* TODO */
          }}
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
        <Button
          className="primary"
          onClick={() => {
            /* TODO */
          }}
        >
          {t("userMenu.logout")}
        </Button>
      </div>
    </div>
  );
};
