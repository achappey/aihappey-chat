import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

type WebAppDetailStructureTabProps = {
  effectiveTree?: any;
};

export const WebAppDetailStructureTab = ({
  effectiveTree,
}: WebAppDetailStructureTabProps) => {
  const { t } = useTranslation();
  const { JsonViewer } = useTheme();

  return (
    <div style={{ width: "100%", paddingTop: 12 }}>
      <JsonViewer value={effectiveTree ?? {}} />
      {!effectiveTree ? (
        <div style={{ color: "#888", textAlign: "center", paddingTop: 8 }}>
          {t("noResults")}
        </div>
      ) : null}
    </div>
  );
};
