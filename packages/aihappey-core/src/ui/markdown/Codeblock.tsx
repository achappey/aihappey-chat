import { useTheme } from "aihappey-components";

import React, { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { PreviewErrorBoundary } from "./PreviewErrorBoundary";
import { extractCodeString } from "./helpers";
import { CsvBlock } from "./CsvBlock";
import { LatexBlock } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import { useTranslation } from "aihappey-i18n";
import { ChartJsBlockFromJson } from "./ChartJsBlockFromJson";

const CopyButton = React.memo(({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const { Button } = useTheme();
  return (
    <Button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      variant="subtle"
      icon={copied ? "completed" : "copyClipboard"}
      style={{ position: "absolute", top: 8, right: 8, border: "none" }}
      aria-label="Copy code"
    />
  );
});


export const CodeBlock = ({
  children,
  language,
  status,
  className = "",
}: any) => {
  const { Tabs, Tab } = useTheme();
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const code = extractCodeString(children);
  const showChartJs = language === "chartjs";
  const showCsvTable = language === "csv" || language === "tsv"; // tsv easy to extend
  const showLatex = language === "latex" || language === "math";
  const showLines =
    language !== "plaintext" && !showCsvTable;

  const previewTabs = useMemo(
    () =>
      [
        showChartJs && {
          key: "chart-preview",
          label: t("chart"),
          icon: "chart",
          component: () => (
            <PreviewErrorBoundary>
              <ChartJsBlockFromJson height={300} chart={code} />
            </PreviewErrorBoundary>
          ),
        },
        showCsvTable && {
          key: "csv-table",
          label: t("table"),
          icon: "table",
          component: () => (
            <PreviewErrorBoundary>
              <CsvBlock csv={code} />
            </PreviewErrorBoundary>
          ),
        },
        showLatex && {
          key: "latex-preview",
          label: t("formula"),
          icon: "formula",
          component: () => (
            <PreviewErrorBoundary>
              <LatexBlock latex={code} />
            </PreviewErrorBoundary>
          ),
        },
      ].filter(Boolean) as {
        key: string;
        label: string;
        icon: string;
        component: () => JSX.Element;
      }[],
    [showChartJs, code, status]
  );

  // Figure out initial tab
  const hasPreviews = previewTabs.length > 0;
  const initialTab = hasPreviews ? previewTabs[0].key : "code";
  const [activeTab, setActiveTab] = useState(initialTab);
  const highlighted = useMemo(() => (
    <SyntaxHighlighter
      language={language}
      style={isDarkMode ? oneDark : oneLight}
      wrapLongLines={true}
      showLineNumbers={showLines}
    >
      {code}
    </SyntaxHighlighter>
  ), [code, language, isDarkMode, showLines]);

  const codeComponent = (
    <div style={{ position: "relative" }}>
      {highlighted}
      <CopyButton code={code} />
    </div>
  );

  // Code tab object
  const codeTab = {
    key: "code",
    label: t("code"),
    icon: "code",
    component: () => codeComponent,
  };

  // Tab order: previews first, code last
  const tabOrder = hasPreviews ? [...previewTabs, codeTab] : [codeTab];

  if (tabOrder.length == 1) {
    return codeComponent;
  }

  // Otherwise, render tabs
  return (
    <Tabs size="small" activeKey={activeTab} onSelect={setActiveTab}>
      {tabOrder.map((tab) => (
        <Tab
          key={tab.key}
          eventKey={tab.key}
          icon={tab.icon as any}
          title={tab.label}
        >
          {activeTab === tab.key ? <tab.component /> : null}
        </Tab>
      ))}
    </Tabs>
  );
};
