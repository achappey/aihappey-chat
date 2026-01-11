import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields";
import { useTranslation } from "aihappey-i18n";

export type RerankingDocumentCardProps = {
  fileName: string;
  text: string;
  /** 1-based rank (after rerank). Undefined before rerank. */
  rank?: number;
  /** relevance score from backend response. Undefined before rerank. */
  relevanceScore?: number;
  /** download original file contents */
  onDownload?: () => void;
};

export const RerankingDocumentCard = ({
  fileName,
  text,
  rank,
  relevanceScore,
  onDownload,
}: RerankingDocumentCardProps) => {
  const { Card, Button } = useTheme();
  const { t } = useTranslation();

  const descriptionParts: string[] = [];
  if (typeof rank === "number") descriptionParts.push(`Rank: ${rank}`);
  if (typeof relevanceScore === "number") {
    descriptionParts.push(`Score: ${relevanceScore.toFixed(4)}`);
  }

  return (
    <Card
      title={fileName}
      description={descriptionParts.join(" · ")}
      size="small"
      actions={
        onDownload ? (
          <Button
            icon="download"
            size="small"
            variant="transparent"
            onClick={onDownload}
            title={t("download")}
            aria-label={t("download")}
          />
        ) : undefined
      }
    >
      <LimitedTextField text={text} />
    </Card>
  );
};

