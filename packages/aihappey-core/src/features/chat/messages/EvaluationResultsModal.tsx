import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useEffect, useMemo, useState } from "react";

type UnknownRecord = Record<string, unknown>;

export type EvaluationResultsModalProps = {
  open: boolean;
  evaluations?: Record<string, unknown>;
  onClose: () => void;
};

type MetricViewModel = {
  id: string;
  name: string;
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
          reason: asString(metric.reason),
          rating: typeof interpretation?.rating === "number" && Number.isFinite(interpretation.rating)
            ? interpretation.rating
            : undefined,
          failed: typeof interpretation?.failed === "boolean" ? interpretation.failed : undefined,
        }];
      });
    });
  });

const omitInputItems = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(omitInputItems);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "inputItems")
      .map(([key, item]) => [key, omitInputItems(item)]),
  );
};

export const EvaluationResultsModal = ({
  open,
  evaluations,
  onClose,
}: EvaluationResultsModalProps) => {
  const { t } = useTranslation();
  const { Alert, Badge, Button, Card, JsonViewer, Modal, Tab, Tabs } = useTheme();
  const [activeTab, setActiveTab] = useState("results");
  const metrics = extractMetrics(evaluations);
  const debugEvaluations = useMemo(() => omitInputItems(evaluations ?? {}), [evaluations]);

  useEffect(() => {
    if (open) setActiveTab("results");
  }, [open, evaluations]);

  const translatedMetricName = (name: string) => {
    const key = `messageEvaluations.metricNames.${name}`;
    return t(key, { defaultValue: humanize(name) });
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
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <Tab eventKey="results" title={t("messageEvaluations.resultsTab")}>
          <div style={{ paddingTop: 12 }}>
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
          </div>
        </Tab>
        <Tab eventKey="json" title={t("messageEvaluations.jsonTab")}>
          <div style={{ paddingTop: 12 }}>
            <JsonViewer value={debugEvaluations} />
          </div>
        </Tab>
      </Tabs>
    </Modal>
  );
};
