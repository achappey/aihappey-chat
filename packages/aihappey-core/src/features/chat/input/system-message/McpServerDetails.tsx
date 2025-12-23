import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { getDomain, getRepositoryUrl } from "../../messages/buildSystemMessage";
import { MimeTypeBadge, OpenLinkButton, PriorityBadge, useTheme } from "aihappey-components";


export const McpServerDetails = ({ parsed }: any) => {
  const { Button, Card, Tabs, Tab, Badge, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("0");

  return (
    <Tabs activeKey={activeTab} vertical onSelect={setActiveTab} style={{ minHeight: 200 }}>
      <Tab eventKey={"0"} title={t("mcpPage.server")}>
        <Card
          title={parsed.modelContextProtocolServer?.name}
          description={parsed.modelContextProtocolServer?.version}
          actions={
            <>
              {parsed.modelContextProtocolServer?.repository && (
                <Button
                  onClick={() =>
                    window.open(
                      getRepositoryUrl(parsed.modelContextProtocolServer?.repository),
                      "_blank"
                    )
                  }
                  icon="code"
                  size="small"
                  variant="transparent"
                >
                  {getDomain(parsed.modelContextProtocolServer?.repository?.url)}
                </Button>
              )}
              {parsed.modelContextProtocolServer?.websiteUrl && (
                <Button
                  onClick={() =>
                    window.open(parsed.modelContextProtocolServer?.websiteUrl, "_blank")
                  }
                  icon="link"
                  size="small"
                  variant="transparent"
                >
                  {getDomain(parsed.modelContextProtocolServer?.websiteUrl)}
                </Button>
              )}
            </>
          }
        >
          <>
            <ul>
              {parsed.modelContextProtocolServer?.title && (
                <li>{parsed.modelContextProtocolServer?.title}</li>
              )}
              <li>{parsed.modelContextProtocolServer?.mcpServerUrl}</li>
            </ul>

          </>
        </Card>
      </Tab>

      {parsed.instructions?.length > 0 && (
        <Tab eventKey={"1"} title={t("mcp.instructions")}>
          <Card title={t("mcp.instructions")}>
            <p>{parsed.instructions}</p>
          </Card>
        </Tab>)}


      {parsed.modelContextProtocolServer.meta && (
        <Tab eventKey={"2"} title={t("mcp.meta")}>
          <Card title={t("mcp.meta")}>
            <JsonViewer value={parsed.modelContextProtocolServer.meta} />
          </Card>
        </Tab>)}

      {parsed.resources?.length > 0 && (
        <Tab eventKey={"3"} title={t("mcp.resources") + " (" + parsed.resources?.length + ")"}>
          <div style={{ display: "grid", gap: 12 }}>
            {parsed.resources.map((res: any, i: number) => {
              return (
                <Card
                  key={i}
                  description={<>
                    <MimeTypeBadge mimeType={res?.mimeType} />
                    <PriorityBadge priority={res.annotations?.priority} />
                  </>}
                  headerActions={
                    <OpenLinkButton
                      size="small"
                      url={res.uri}
                      variant="transparent"
                    />
                  }
                  title={res.title ?? res.name ?? t("resource")}
                >
                  <div>{res.description}</div>
                </Card>
              );
            })}
          </div>
        </Tab>
      )}

      {parsed.resourceTemplates?.length > 0 && (
        <Tab eventKey={"4"} title={t("mcp.resourceTemplates") + " (" + parsed.resourceTemplates?.length + ")"}>

          <div style={{ display: "grid", gap: 12 }}>
            {parsed.resourceTemplates.map((tpl: any, i: number) => {
              const hasPriority = !!tpl.annotations?.priority;
              return (
                <Card
                  key={i}
                  description={<>
                    <MimeTypeBadge mimeType={tpl?.mimeType} />
                    <PriorityBadge priority={tpl.annotations?.priority} />
                  </>}
                  title={tpl.title ?? tpl.name ?? t("resourceTemplate")}
                >
                  <div>{tpl.description}</div>
                </Card>
              );
            })}
          </div>
        </Tab>
      )}


    </Tabs>
  );
};
