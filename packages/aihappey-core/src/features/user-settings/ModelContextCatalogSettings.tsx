import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextCatalogSettingsForm } from "aihappey-components";

export const ModelContextCatalogSettings = () => {
  const { t } = useTranslation();

  const quickSearches = useAppStore(s => s.quickSearches);
  const addQuickSearch = useAppStore(s => s.addQuickSearch);
  const removeQuickSearch = useAppStore(s => s.deleteQuickSearch);

  return (
    <ModelContextCatalogSettingsForm
      value={{ quickSearches: quickSearches ?? [] }}
      onAdd={addQuickSearch}
      onRemove={removeQuickSearch}
      translations={{
        label: t("quickSearch"),
        placeholder: t("addQuickSearch"),
        add: t("add"),
      }}
    />
  );
};
