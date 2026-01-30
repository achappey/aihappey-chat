import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

type WebAppDetailDataTabProps = {
  app?: {
    data?: any;
  } | null;
  canRefresh: boolean;
  refreshing: boolean;
  dataRefreshError?: string;
  onRefreshData: () => void;
};

export const WebAppDetailDataTab = ({
  app,
  canRefresh,
  refreshing,
  dataRefreshError,
  onRefreshData,
}: WebAppDetailDataTabProps) => {
  const { t } = useTranslation();
  const { Button, Alert, JsonViewer } = useTheme();

  return (
    <div
      style={{
        width: "100%",
        paddingTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button disabled={!canRefresh || refreshing} onClick={onRefreshData}>
          {t("dataSource.refresh")}
        </Button>
      </div>
      {dataRefreshError ? (
        <Alert variant="warning">{dataRefreshError}</Alert>
      ) : null}
      <JsonViewer value={app?.data ?? {}} />
    </div>
  );
};
