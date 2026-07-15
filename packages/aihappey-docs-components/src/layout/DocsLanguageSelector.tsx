import { docsLanguageOptions, useDocsTranslation } from "aihappey-docs-i18n";
import { useDocsTheme } from "../theme/useDocsTheme";

export const DocsLanguageSelector = () => {
  const { i18n, t } = useDocsTranslation();
  const { Select } = useDocsTheme();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const currentLocale = currentLanguage.split("-")[0];
  const currentLanguageOption = docsLanguageOptions.find((language) => language.locale === currentLocale);

  return (
    <Select
      aria-label={t("language.selectorLabel")}
      value={currentLocale}
      valueTitle={currentLanguageOption?.nativeLabel}
      onChange={(locale: string) => i18n.changeLanguage(locale)}
      size="small"
      style={{ minWidth: 144 }}
    >
      {docsLanguageOptions.map((language) => (
        <option key={language.locale} value={language.locale}>
          {language.nativeLabel}
        </option>
      ))}
    </Select>
  );
};
