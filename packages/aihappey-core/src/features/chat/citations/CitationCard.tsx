import { useTheme } from "aihappey-components";


interface CitationCardProps {
  title?: string;
  url?: string;
}

export const CitationCard = ({ title, url }: CitationCardProps) => {
  const { Card, Button, Paragraph, Badge } = useTheme();
  //const displayTitle = title || url;
  const { host, hostname, port } = url ? new URL(url) : {};

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
            <Button
              icon="openLink"
              size="small"
              variant="subtle"
              onClick={() => window.open(url)}
            ></Button>
          )}
        </>
      }
    >
      {url}
    </Card>
  );
};
