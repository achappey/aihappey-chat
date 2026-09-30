import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { changeEnvironmentType, optionalLines, optionalString, updateNetwork, updateSessionConfig } from "./managedSessionConfig";

export const OpenAIEnvironmentSessionCard = ({ config, updateConfig }: { config: any; updateConfig: (value: any) => void }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(`providers:openai.sessionEnvironment.${key}`);
  const environment = config?.environment;
  const enabled = environment != null;
  const hosted = environment?.type === "openai_hosted";
  const restricted = environment?.network?.access === "restricted";
  const save = (next?: any) => updateConfig(updateSessionConfig(config, "environment", next));
  const patch = (next: any) => save({ ...environment, ...next });
  const select = (label: string, value: string, options: string[], onChange: (value: string) => void) => (
    <theme.Select label={label} values={[options.includes(value) ? value : ""]}
      valueTitle={options.includes(value) ? tr(value) : tr("type")}
      disabled={!enabled} onChange={onChange}>
      {options.map((option) => <option key={option} value={option}>{tr(option)}</option>)}
    </theme.Select>
  );

  return <theme.Card size="small" title={tr("title")} headerActions={
    <theme.Switch id="openai-session-environment-enabled" checked={enabled}
      onChange={(on: boolean) => save(on ? { type: "openai_hosted" } : undefined)} />
  }>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {select(tr("type"), environment?.type ?? "openai_hosted", ["none", "openai_hosted"],
        (type) => save(changeEnvironmentType(environment, type as "none" | "openai_hosted")))}
      {hosted && <>
        <theme.Input label={tr("templateId")} disabled={!enabled} value={environment.environment_template_id ?? ""}
          onChange={(e: any) => patch({ environment_template_id: optionalString(e.target.value) })} />
        <theme.Select label={tr("containerSize")} values={[environment.container_size ?? ""]}
          valueTitle={environment.container_size ? tr(environment.container_size) : tr("inherit")}
          disabled={!enabled} onChange={(value: string) => patch({ container_size: value || undefined })}>
          <option value="">{tr("inherit")}</option>
          {(["small", "medium", "large"] as const).map((size) => <option key={size} value={size}>{tr(size)}</option>)}
        </theme.Select>
        <theme.Switch id="openai-session-desktop" label={tr("desktop")} disabled={!enabled}
          checked={!!environment.desktop?.enabled}
          onChange={(on: boolean) => patch({ desktop: { enabled: on } })} />
        <theme.Select label={tr("network")} values={[environment.network?.access ?? ""]}
          valueTitle={environment.network?.access ? tr(environment.network.access) : tr("inherit")}
          disabled={!enabled} onChange={(value: string) => patch({ network: value
            ? updateNetwork(environment.network, value as "enabled" | "disabled" | "restricted") : undefined })}>
          <option value="">{tr("inherit")}</option>
          {(["enabled", "disabled", "restricted"] as const).map((access) =>
            <option key={access} value={access}>{tr(access)}</option>)}
        </theme.Select>
        {restricted && <>
          <div style={{ fontSize: 12, opacity: 0.78 }}>{tr("domainHelp")}</div>
          <theme.TextArea label={tr("allowedDomains")} rows={2}
            value={(environment.network.allowed_domains ?? []).join("\n")}
            onChange={(e: any) => {
              if (environment.network.blocked_domains?.length) return;
              const allowed_domains = optionalLines(e.target.value);
              patch({ network: { ...environment.network, allowed_domains: allowed_domains.length ? allowed_domains : undefined } });
            }} />
          <theme.TextArea label={tr("blockedDomains")} rows={2}
            value={(environment.network.blocked_domains ?? []).join("\n")}
            onChange={(e: any) => {
              if (environment.network.allowed_domains?.length) return;
              const blocked_domains = optionalLines(e.target.value);
              patch({ network: { ...environment.network, blocked_domains: blocked_domains.length ? blocked_domains : undefined } });
            }} />
        </>}
      </>}
    </div>
  </theme.Card>;
};
