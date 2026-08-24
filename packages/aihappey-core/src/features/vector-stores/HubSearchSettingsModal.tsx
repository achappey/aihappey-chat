import { SettingsActionButtons, useTheme } from "aihappey-components";
import type { VectorStore, VectorStoreSearchMode } from "aihappey-embeddings";
import { useTranslation } from "aihappey-i18n";

export type HubSearchSettings = {
  hubIds: string[];
  mode: VectorStoreSearchMode;
  limit: number;
  similarity: number;
};

export const HubSearchSettingsModal = ({
  open,
  hubs,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  hubs: VectorStore[];
  value: HubSearchSettings;
  onChange: (value: HubSearchSettings) => void;
  onClose: () => void;
}) => {
  const { Modal, Select, Input, Slider } = useTheme();
  const { t } = useTranslation();

  const toggleHub = (hubId: string) => {
    const hubIds = value.hubIds.includes(hubId)
      ? value.hubIds.filter((id) => id !== hubId)
      : [...value.hubIds, hubId];
    onChange({ ...value, hubIds });
  };

  const hubSelectionTitle = value.hubIds.length === hubs.length && hubs.length > 0
    ? t("hubSearch.settings.allHubs")
    : value.hubIds.length > 0
      ? t("hubSearch.settings.selectedHubs", { count: value.hubIds.length })
      : t("hubSearch.settings.noHubsSelected");

  const restoreDefaults = () => onChange({
    hubIds: hubs.map((hub) => hub.id),
    mode: "fulltext",
    limit: 20,
    similarity: 0.4,
  });

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={t("hubSearch.settings.title")}
      actions={<SettingsActionButtons onRestoreDefaults={restoreDefaults} onClose={onClose} />}
    >
      <div style={{ display: "grid", gap: 16 }}>
        <Select
          label={t("hubSearch.settings.hubs")}
          values={value.hubIds}
          valueTitle={hubSelectionTitle}
          multiselect
          disabled={!hubs.length}
          onChange={toggleHub}
        >
          {hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
        </Select>

        <Select
          label={t("hubSearch.settings.mode")}
          values={[value.mode]}
          valueTitle={t(`hubSearch.modes.${value.mode}`)}
          onChange={(mode: string) => onChange({ ...value, mode: mode as VectorStoreSearchMode })}
        >
          <option value="fulltext">{t("hubSearch.modes.fulltext")}</option>
          <option value="hybrid">{t("hubSearch.modes.hybrid")}</option>
          <option value="vector">{t("hubSearch.modes.vector")}</option>
        </Select>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Input
            label={t("hubSearch.settings.limit")}
            type="number"
            min={1}
            step={1}
            value={value.limit}
            onChange={(event) => onChange({ ...value, limit: Number(event.target.value) })}
          />
          <Slider
            id="hub-search-minimum-relevance"
            label={t("hubSearch.settings.similarity")}
            min={0}
            max={1}
            step={0.05}
            value={value.similarity}
            disabled={value.mode === "fulltext"}
            showValue
            onChange={(similarity: number) => onChange({ ...value, similarity })}
          />
        </div>
      </div>
    </Modal>
  );
};
