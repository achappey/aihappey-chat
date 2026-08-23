import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsHeroTextStyle, docsHeroTitleStyle, useDocsTheme } from "aihappey-docs-components";
import { agentNavSections, docsTopNavItems } from "../docsData";
import { useDocsTranslation } from "aihappey-docs-i18n";

export type AgentsOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const AgentsOverviewPage = ({ activePath, appTitle }: AgentsOverviewPageProps) => {
  const { Header } = useDocsTheme();
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>{t("agents.overview.title")}</Header>
          <p style={docsHeroTextStyle}>{t("agents.overview.summary")}</p>
        </header>
        <ApiSection title={t("agents.overview.startTitle")}>
          <p style={{ margin: 0 }}>{t("agents.overview.start")}</p>
        </ApiSection>
        <ApiSection title={t("agents.overview.authTitle")}>
          <p id="authentication" style={{ margin: 0 }}>{t("agents.overview.auth")}</p>
        </ApiSection>
        <ApiSection title={t("agents.overview.executionTitle")}>
          <p style={{ margin: 0 }}>{t("agents.overview.execution")}</p>
        </ApiSection>
        <ApiSection title={t("agents.overview.responsesTitle")}>
          <p style={{ margin: 0 }}>{t("agents.overview.responses")}</p>
        </ApiSection>
      </article>
    </ApiReferenceLayout>
  );
};

