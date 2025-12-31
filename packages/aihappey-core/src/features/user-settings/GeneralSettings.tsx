import { UserGeneralSettings as GeneralSettingsComp } from "aihappey-components";
import { languageNames, useTranslation } from "aihappey-i18n";


export const GeneralSettings = () => {
  const { t, i18n } = useTranslation();
  const languages = Object.keys(languageNames);

  const translations = {
    ...languageNames,
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
      languages={languages}
      onLanguageChange={i18n.changeLanguage}
      onDeleteAllChats={() => {
        // TODO: clear chats
      }}
      onLogout={() => {
        // TODO: logout
      }}
    />
  );
};