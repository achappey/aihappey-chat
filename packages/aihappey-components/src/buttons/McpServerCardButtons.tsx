import { useCallback } from "react";
import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "./OpenLinkButton";
import { useTranslation } from "aihappey-i18n";

type McpServerCardButtonsProps = {
  url: string;
  websiteUrl?: string;
  respositoryUrl?: string;
  onDelete?: () => void
};

export const McpServerCardButtons = ({ websiteUrl,
  url,
  respositoryUrl,
  onDelete
}: McpServerCardButtonsProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const copyToClipboard = useCallback(() => {
    if (url) navigator.clipboard.writeText(url);
  }, [url]);

  return <>
    <Button
      onClick={copyToClipboard}
      variant="transparent"
      icon="copyClipboard"
      size="small"
    />
    {onDelete && (
      <Button
        onClick={onDelete}
        variant="transparent"
        icon="delete"
        title={t("delete")}
        size="small"
      />
    )}
    {respositoryUrl && (
      <Button
        onClick={() => window.open(respositoryUrl, "_blank")}
        variant="transparent"
        icon="code"
        title={t("sourceCode")}
        size="small"
      />
    )}
    {websiteUrl && (
      <OpenLinkButton
        url={websiteUrl}
        variant="transparent"
        icon="globe"
        tooltip={t("website")}
        size="small"
      />
    )}
  </>;
};
