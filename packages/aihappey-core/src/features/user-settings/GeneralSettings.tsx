import { UserGeneralSettings as GeneralSettingsComp } from "aihappey-components";
import { languageNames, useTranslation } from "aihappey-i18n";

export const GeneralSettings = () => {
  const { i18n } = useTranslation();

  return (
    <GeneralSettingsComp
      language={i18n.language}
      languages={languageNames}
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