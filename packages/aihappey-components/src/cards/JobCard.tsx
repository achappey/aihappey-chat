import React, { useEffect, useMemo, useState } from "react";
import { format } from "timeago.js";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields";
import { CostBadge } from "../badges";

export type JobCardJobItem = {
  id: string;
  responseId?: string;
  createdAt: Date;
  updatedAt: Date;
  inputPreview: string;
  response: any;
};

const activeJobStatuses = new Set(["queued", "in_progress", "running"]);
const terminalJobStatuses = new Set(["completed", "failed", "cancelled", "incomplete"]);

const getJobStatus = (job: Pick<JobCardJobItem, "response">): string =>
  job.response?.status ?? "queued";

const getGatewayCost = (job: Pick<JobCardJobItem, "response">) => {
  const cost = job.response?.metadata?.providerMetadata?.gateway?.cost;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
};

const isActiveJobStatus = (status?: string) => !!status && activeJobStatuses.has(status);
const isTerminalJobStatus = (status?: string) => !!status && terminalJobStatuses.has(status);

const collectOutputText = (value: any): string[] => {
  if (!value) return [];
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectOutputText);
  if (typeof value !== "object") return [];

  const type = String(value.type ?? "");
  const text = typeof value.text === "string"
    ? value.text
    : typeof value.output_text === "string"
      ? value.output_text
      : undefined;

  return [
    ...(type === "output_text" || type === "text" || type === "message" ? collectOutputText(text) : []),
    ...collectOutputText(value.content),
    ...collectOutputText(value.output),
  ];
};

export type JobCardProps = {
  job: JobCardJobItem;
  onRefresh?: () => void;
  onDelete?: () => void;
  renderMarkdown?: (text: string) => React.ReactNode;
};

export const JobCard = ({ job, onRefresh, onDelete, renderMarkdown }: JobCardProps) => {
  const { Button, Card, JsonViewer, Menu, Modal, Tab, Tabs } = useTheme();
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("raw");
  const status = getJobStatus(job);
  const gatewayCost = getGatewayCost(job);
  const canRefresh = isActiveJobStatus(status) && !!onRefresh;
  const canDelete = isTerminalJobStatus(status) && !!onDelete;
  const outputText = useMemo(
    () => collectOutputText(job.response?.output_text ?? job.response?.output).join("\n\n").trim(),
    [job.response],
  );
  const hasTextOutput = status === "completed" && outputText.length > 0;

  useEffect(() => {
    if (!detailsOpen) return;
    setActiveTab(hasTextOutput ? "output" : "raw");
  }, [detailsOpen, hasTextOutput]);

  const headerActions = useMemo(() => {
    if (!canDelete) return undefined;

    const menuItems: MenuItemProps[] = [
      {
        key: "delete",
        label: t("delete"),
        icon: "delete",
        onClick: onDelete,
      },
    ];

    return <Menu items={menuItems} />;
  }, [Menu, canDelete, onDelete, t]);

  const actions = (
    <div style={{ display: "flex", gap: 4 }}>
      <Button
        type="button"
        size="small"
        variant="transparent"
        icon="eye"
        onClick={() => setDetailsOpen(true)}
        title={t("view", "View")}
      />
      {canRefresh ? (
        <Button
          type="button"
          size="small"
          variant="transparent"
          icon="refresh"
          onClick={onRefresh}
          title={t("refresh", "Refresh")}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <Card
        title={status}
        description={<div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {format(job.updatedAt ?? job.createdAt)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", transform: "translateY(2px)" }}>
            <CostBadge cost={gatewayCost} size="small" />
          </span>
        </div>}
        size="small"
        actions={actions}
        headerActions={headerActions}
      >
        <LimitedTextField text={job.inputPreview} rows={3} minHeight={36} />
      </Card>

      <Modal
        show={detailsOpen}
        onHide={() => setDetailsOpen(false)}
        title={t("jobDetails", "Job details")}
        actions={<Button onClick={() => setDetailsOpen(false)}>{t("close", "Close")}</Button>}
      >
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          {hasTextOutput ? (
            <Tab eventKey="output" title={t("output")}>
              <div style={{ paddingTop: 12 }}>
                {renderMarkdown ? renderMarkdown(outputText) : <div style={{ whiteSpace: "pre-wrap" }}>{outputText}</div>}
              </div>
            </Tab>
          ) : null}
          <Tab eventKey="raw" title={t("rawResponse", "Raw response")}>
            <JsonViewer value={job.response} />
          </Tab>
        </Tabs>
      </Modal>
    </>
  );
};

