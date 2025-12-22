import React, { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { McpPolicySettings } from "../mcp-client/McpPolicySettings";
import { IconToken } from "aihappey-types";
import { Handoff, HandoffsEditor } from "../agents/HandoffsEditor";
import { McpClientCapabilitiesCard } from "../mcp-client/McpClientCapabilitiesCard";
import { AgentWithMcpServers, useAgents } from "../agents/useAgentMcpServers";

export interface AgentSettingsModalProps {
  open: boolean;
  resetDefaults?: any;
  onClose: () => void;
}

export const AgentSettingsModal: React.FC<AgentSettingsModalProps> = ({
  open,
  resetDefaults,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const setAgents = useAppStore(a => a.setAgents)
  const toggleAgentMcpServer = useAppStore(a => a.toggleAgentMcpServer)
  const updateAgentPolicy = useAppStore(a => a.updateAgentPolicy)
  const updateAgentClientCapabilities = useAppStore(a => a.updateAgentClientCapabilities)
  const enrichedAgents = useAgents()
  const selectedAgents = selectedAgentNames
    .filter(a => enrichedAgents.some(z => z.agent.name == a))
    .map(a => enrichedAgents.find(z => z.agent.name == a)!)

  return (
    <theme.Modal
      show={open}
      onHide={onClose}
      title={t("agents.settings")}
      actions={
        <>
          <theme.Button variant="subtle" onClick={resetDefaults}>
            {t("resetDefaults")}
          </theme.Button>
          <theme.Button variant="secondary" onClick={onClose}>
            {t("close")}
          </theme.Button>
        </>
      }
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}>
          <GeneralTab />
        </theme.Tab>
        {selectedAgents.map(a => {
          return <theme.Tab key={a.agent.name}
            eventKey={a.agent.name}
            title={a.agent.name}>
            <AgentTab agent={a}
              toggleMcpServer={toggleAgentMcpServer}
              updateMcpClientCapabilities={updateAgentClientCapabilities}
              updatePolicy={updateAgentPolicy} />
          </theme.Tab>
        })}
      </theme.Tabs>
    </theme.Modal>
  );
};

const AgentTab = ({
  agent,
  updateMcpClientCapabilities,
  updatePolicy,
  toggleMcpServer,
}: {
  agent: AgentWithMcpServers,
  updateMcpClientCapabilities: any,
  updatePolicy: any,
  toggleMcpServer: any
}) => {
  const theme = useTheme();
  const { t } = useTranslation()
  const toggle = (key: string) => {
    const current = agent.agent?.mcpClient?.policy?.[key] ?? false;
    updatePolicy(agent.agent.name, key, !current);
  };

  return <>
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 18
    }}>
      <theme.Card size="small"
        title={agent.agent.name}
        description={agent.agent.description}>
        {agent.agent.instructions}
      </theme.Card>

      <theme.Card size="small" title={t('agents.mcpServers')}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr"
          }}
        >
          {agent.mcpServers?.map((a) =>
            <theme.Switch
              id={`${a.key}`}
              label={a.key}
              key={a.key}
              checked={!a.server.disabled}
              size="small"
              onChange={() => toggleMcpServer(agent.agent.name, a.key)} />
          )}
        </div>
      </theme.Card>

      <McpPolicySettings policySettings={agent?.agent.mcpClient?.policy}
        toggle={toggle} />

      <McpClientCapabilitiesCard
        capabilities={agent.agent?.mcpClient?.capabilities}
        onChange={(key, value) =>
          updateMcpClientCapabilities(agent.agent.name, key, value)
        }
      />

      {agent?.agent.outputSchema?.properties &&
        <theme.Card
          size="small"
          title={t('structuredOutputs')}>
          <theme.JsonViewer
            value={JSON.stringify(agent?.agent.outputSchema?.properties)} />
        </theme.Card>}

      <theme.Card size="small"
        title={agent.agent.model.id}>
        {agent.agent.model.providerMetadata
          && <theme.JsonViewer
            value={JSON.stringify(agent.agent.model.providerMetadata)} />}
      </theme.Card>
    </div>
  </>
}

// --- General Tab ---
const GeneralTab = ({
}: any) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const setThrottle = useAppStore((s) => s.setThrottle);
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const workflowType = useAppStore((s) => s.workflowType);
  const setWorkflowType = useAppStore((s) => s.setWorkflowType);

  const maximumIterationCount = useAppStore((s) => s.maximumIterationCount);
  const setMaximumIterationCount = useAppStore((s) => s.setMaximumIterationCount);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const handoffs = useAppStore((s) => s.handoffs);
  const setHandoffs = useAppStore((s) => s.setHandoffs);
  const agents = useAppStore(a => a.agents)
  const selectedAgents = selectedAgentNames
    .filter(a => agents.some(z => z.name == a))
    .map(a => agents.find(z => z.name == a)!)

  const workflowOptions = [
    { key: "concurrent", icon: "concurrent" },
    { key: "sequential", icon: "sequential" },
    { key: "groupchat", icon: "groupchat" },
    { key: "handoff", icon: "handoff" }
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <theme.Card size="small" title={t("chat")}>
          <div>
            <theme.Slider
              label={t("throttle") + ` (${experimentalThrottle} ms)`}
              min={0}
              max={1000}
              step={10}
              value={experimentalThrottle ?? 0}
              onChange={setThrottle}
            />
          </div>
        </theme.Card>

        <theme.Card size="small" title={t("workflows.workflow")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              {workflowOptions.map(option => (
                <theme.ToggleButton
                  key={option.key}
                  variant="informative"
                  disabled={selectedAgents.length < 2}
                  checked={workflowType === option.key}
                  onClick={() => setWorkflowType(option.key)}
                  title={t(`workflows.${option.key}`)}
                  icon={option.icon as IconToken}
                >
                  {t(`workflows.${option.key}`)}
                </theme.ToggleButton>
              ))}
            </div>
            {workflowType === "sequential" && selectedAgents.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

                {selectedAgents.map((agent: any, index: number) => (
                  <div
                    key={agent.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>{index + 1}. {agent.name}</div>
                    <div style={{ display: "flex" }}>
                      <theme.Button
                        icon="up"
                        size="small"
                        variant="transparant"
                        disabled={index === 0}
                        onClick={() => {
                          const copy = [...selectedAgents];
                          const tmp = copy[index - 1];
                          copy[index - 1] = copy[index];
                          copy[index] = tmp;
                          setSelectedAgents(copy.map(a => a.name));
                        }}
                      />

                      <theme.Button
                        icon="down"
                        size="small"
                        variant="transparant"
                        disabled={index === selectedAgents.length - 1}
                        onClick={() => {
                          const copy = [...selectedAgents];
                          const tmp = copy[index + 1];
                          copy[index + 1] = copy[index];
                          copy[index] = tmp;
                          setSelectedAgents(copy.map(a => a.name));
                        }}
                      />
                    </div>
                  </div>
                ))}

              </div>
            )}

            {workflowType == 'groupchat' && selectedAgents.length > 1 && <theme.Slider
              label={t('workflows.maximumIterationCount', {
                maximumIterationCount
              })}
              onChange={setMaximumIterationCount}
              id='maximumIterationCount'
              value={maximumIterationCount}
              min={1}
              max={20}>

            </theme.Slider>}

            {workflowType === "handoff" && selectedAgents.length > 1 && (
              <HandoffsEditor
                theme={theme}
                t={t}
                agents={selectedAgents.map(a => ({ id: a.name, name: a.name }))}
                handoffs={handoffs as Handoff[]}
                setHandoffs={setHandoffs}
              />
            )}
          </div>
        </theme.Card>
      </div>
    </>
  );
};
