import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

type UnknownRecord = Record<string, unknown>;

export type EvaluationResultsModalProps = {
  open: boolean;
  evaluations?: Record<string, unknown>;
  onClose: () => void;
};

type MetricViewModel = {
  id: string;
  name: string;
  type?: string;
  reason?: string;
  rating?: number;
  failed?: boolean;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const humanize = (value: string): string => {
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : value;
};

const extractMetrics = (evaluations?: Record<string, unknown>): MetricViewModel[] =>
  Object.entries(evaluations ?? {}).flatMap(([evaluatorKey, evaluator]) => {
    if (!isRecord(evaluator) || !Array.isArray(evaluator.items)) return [];

    return evaluator.items.flatMap((item, itemIndex) => {
      if (!isRecord(item) || !isRecord(item.metrics)) return [];

      return Object.entries(item.metrics).flatMap(([metricKey, metric]) => {
        if (!isRecord(metric)) return [];
        const interpretation = isRecord(metric.interpretation) ? metric.interpretation : undefined;

        return [{
          id: `${evaluatorKey}-${itemIndex}-${metricKey}`,
          name: asString(metric.name) ?? metricKey,
          type: asString(metric.$type),
          reason: asString(metric.reason),
          rating: typeof interpretation?.rating === "number" && Number.isFinite(interpretation.rating)
            ? interpretation.rating
            : undefined,
          failed: typeof interpretation?.failed === "boolean" ? interpretation.failed : undefined,
        }];
      });
    });
  });

export const EvaluationResultsModal = ({
  open,
  evaluations,
  onClose,
}: EvaluationResultsModalProps) => {
  const { t } = useTranslation();
  const { Alert, Badge, Button, Card, Modal } = useTheme();
  const metrics = extractMetrics(evaluations);

  const translatedMetricName = (name: string) => {
    const key = `messageEvaluations.metricNames.${name}`;
    return t(key, { defaultValue: humanize(name) });
  };

  const translatedType = (type: string) => {
    const key = `messageEvaluations.types.${type}`;
    return t(key, { defaultValue: humanize(type) });
  };

  const translatedRating = (rating: number) => {
    const key = `messageEvaluations.ratings.${rating}`;
    return t(key, { defaultValue: String(rating) });
  };

  return (
    <Modal
      show={open}
      size="large"
      title={t("messageEvaluations.title")}
      onHide={onClose}
      actions={<Button variant="secondary" onClick={onClose}>{t("close")}</Button>}
    >
      {metrics.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {metrics.map((metric) => (
            <Card
              key={metric.id}
              size="small"
              title={translatedMetricName(metric.name)}
              description={metric.reason}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {metric.type ? (
                  <Badge bg="subtle" size="small">
                    {translatedType(metric.type)}
                  </Badge>
                ) : null}
                {metric.rating !== undefined ? (
                  <Badge bg="subtle" size="small">
                    {translatedRating(metric.rating)}
                  </Badge>
                ) : null}
                {metric.failed !== undefined ? (
                  <Badge
                    bg={metric.failed ? "error" : "success"}
                    icon={metric.failed ? "warning" : "check"}
                    size="small"
                  >
                    {t(metric.failed
                      ? "messageEvaluations.metricFailed"
                      : "messageEvaluations.metricPassed")}
                  </Badge>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Alert variant="warning">{t("messageEvaluations.empty")}</Alert>
      )}
    </Modal>
  );
};
