import type { SourceUrlUIPart } from "aihappey-ai";
import { CopyToClipboardButton, OpenLinkButton } from "../buttons";
import { useTheme } from "../theme/ThemeContext";

interface SourceUrlCardCardProps {
  source: SourceUrlUIPart
}

export const SourceUrlCard = ({ source }: SourceUrlCardCardProps) => {
  const { Card, Badge } = useTheme();
  const { hostname } = new URL(source.url);

  return (
    <Card
      title={source?.title}
      size={"small"}
      headerActions={<Badge>{hostname}</Badge>}
      actions={
        <>
          <CopyToClipboardButton
            size="small"
            onClick={() => navigator.clipboard.writeText(source?.url)} />

          <OpenLinkButton
            size="small"
            variant="subtle"
            url={source?.url}
          />
        </>
      }
    >
      {source?.url}
    </Card>
  );
};
