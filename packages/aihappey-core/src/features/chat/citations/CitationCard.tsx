import { OpenLinkButton, useTheme } from "aihappey-components";


interface CitationCardProps {
  title?: string;
  url?: string;
}

export const CitationCard = ({ title, url }: CitationCardProps) => {
  const { Card, Button, Badge } = useTheme();
  const { hostname } = url ? new URL(url) : {};

  return (
    <Card
      title={title ?? "Citation"}
      size={"small"}
      headerActions={<Badge>{hostname}</Badge>}
      actions={
        <>
          {url && (
            <Button
              icon="copyClipboard"
              size="small"
              variant="subtle"
              onClick={() => navigator.clipboard.writeText(url)}
            ></Button>
          )}
          {url && (
            <OpenLinkButton
              size="small"
              variant="subtle"
              url={url}
            />
          )}
        </>
      }
    >
      {url}
    </Card>
  );
};
