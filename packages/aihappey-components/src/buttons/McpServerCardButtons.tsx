import { useCallback } from "react";
import { useTheme } from "../theme/ThemeContext";

type McpServerCardButtonsProps = {
  url: string;
  websiteUrl?: string;
  respositoryUrl?: string;
  translations?: any
  onDelete?: () => void
};

export const McpServerCardButtons = ({ websiteUrl,
  url,
  respositoryUrl,
  translations,
  onDelete
}: McpServerCardButtonsProps) => {
  const { Button } = useTheme();
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
        title={translations?.delete ?? "delete"}
        size="small"
      />
    )}
    {respositoryUrl && (
      <Button
        onClick={() => window.open(respositoryUrl, "_blank")}
        variant="transparent"
        icon="code"
        title={translations?.sourceCode ?? "sourceCode"}
        size="small"
      />
    )}
    {websiteUrl && (
      <Button
        onClick={() => window.open(websiteUrl, "_blank")}
        variant="transparent"
        icon="openLink"
        title={translations?.website ?? "website"}
        size="small"
      />
    )}
  </>;
};