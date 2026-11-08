import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { OpenRouterListInput, OpenRouterNumberInput, OpenRouterSelect, openRouterGrid, openRouterStack } from "./OpenRouterFields";
import {
  hasExclusiveSearchDomains,
  optionalString,
  pruneOpenRouterObject,
  searchEnginePatch,
  WEB_SEARCH_MODES,
  withOpenRouterParameters,
  type OpenRouterTool,
} from "./openRouterToolConfig";

const SEARCH_ENGINES = ["auto", "native", "exa", "firecrawl", "parallel", "perplexity"];

export const OpenRouterWebSearchCard = ({ tool, onChange }: {
  tool?: OpenRouterTool;
  onChange: (tool: OpenRouterTool | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(`providers:openrouter.${key}`);
  const parameters = tool?.parameters ?? {};
  const patch = (value: Record<string, any>) => {
    if (tool) onChange(withOpenRouterParameters(tool, value));
  };
  const modes = WEB_SEARCH_MODES[parameters.engine] ?? [];
  const exclusiveDomains = hasExclusiveSearchDomains(parameters.engine);
  const patchLocation = (field: string, value: string) => {
    const { type: _type, ...fields } = parameters.user_location ?? {};
    const location = pruneOpenRouterObject({ ...fields, [field]: optionalString(value) });
    patch({ user_location: location ? { type: "approximate", ...location } : undefined });
  };
  const patchXSearch = (value: Record<string, any>) =>
    patch({ x_search: pruneOpenRouterObject({ ...parameters.x_search, ...value }) ?? {} });

  return <theme.Card size="small" title={tr("webSearchServerTool")} headerActions={
    <theme.Switch id="openrouterWebSearch" checked={!!tool}
      onChange={checked => onChange(checked ? { type: "openrouter:web_search" } : undefined)} />
  }>
    {tool && <div style={openRouterStack}>
      <div style={openRouterGrid}>
        <OpenRouterSelect label={tr("engine")} value={parameters.engine} options={SEARCH_ENGINES}
          onChange={engine => patch(searchEnginePatch(parameters, engine))} />
        {modes.length > 0 && <OpenRouterSelect label={tr("searchMode")} value={parameters.mode} options={modes}
          onChange={mode => patch({ mode })} />}
        <OpenRouterNumberInput label={tr("maxResults")} value={parameters.max_results}
          max={parameters.engine === "perplexity" ? 20 : 25} disabled={parameters.engine === "native"}
          onChange={max_results => patch({ max_results })} />
        <OpenRouterNumberInput label={tr("maxUses")} value={parameters.max_uses}
          onChange={max_uses => patch({ max_uses })} />
      </div>
      <div style={openRouterGrid}>
        <OpenRouterListInput label={tr("allowedDomains")} value={parameters.allowed_domains}
          placeholder="example.com, docs.example.com" onChange={allowed_domains => patch({
            allowed_domains,
            ...(exclusiveDomains && allowed_domains?.length ? { excluded_domains: undefined } : {}),
          })} />
        <OpenRouterListInput label={tr("excludedDomains")} value={parameters.excluded_domains}
          placeholder="reddit.com" onChange={excluded_domains => patch({
            excluded_domains,
            ...(exclusiveDomains && excluded_domains?.length ? { allowed_domains: undefined } : {}),
          })} />
      </div>
      <div style={openRouterGrid}>
        <OpenRouterSelect label={tr("searchContextSize")} value={parameters.search_context_size}
          options={["low", "medium", "high"]} disabled={["native", "firecrawl"].includes(parameters.engine)}
          onChange={search_context_size => patch({ search_context_size })} />
        <OpenRouterNumberInput label={tr("maxCharacters")} value={parameters.max_characters} max={100000}
          disabled={["native", "firecrawl"].includes(parameters.engine)} onChange={max_characters => patch({ max_characters })} />
        <OpenRouterNumberInput label={tr("maxTotalResults")} value={parameters.max_total_results}
          onChange={max_total_results => patch({ max_total_results })} />
      </div>
      <div style={openRouterGrid}>
        {[
          ["city", "userCity", "Amsterdam"],
          ["country", "userCountry", "NL"],
          ["region", "userRegion", "Noord-Holland"],
          ["timezone", "userTimezone", "Europe/Amsterdam"],
        ].map(([field, label, placeholder]) => <theme.Input key={field} label={tr(label)}
          disabled={!!parameters.engine && !["auto", "native"].includes(parameters.engine)}
          placeholder={placeholder} value={parameters.user_location?.[field] ?? ""}
          onChange={event => patchLocation(field, event.target.value)} />)}
      </div>
      <theme.Switch id="openrouterXSearch" label={tr("xSearch")} checked={parameters.x_search != null}
        disabled={!!parameters.engine && !["auto", "native"].includes(parameters.engine)}
        onChange={checked => patch({ x_search: checked ? {} : undefined })} />
      {parameters.x_search != null && <div style={openRouterStack}>
        <div style={openRouterGrid}>
          <OpenRouterListInput label={tr("allowedXHandles")} value={parameters.x_search.allowed_x_handles} maxItems={20}
            onChange={allowed_x_handles => patchXSearch({
              allowed_x_handles,
              ...(allowed_x_handles?.length ? { excluded_x_handles: undefined } : {}),
            })} />
          <OpenRouterListInput label={tr("excludedXHandles")} value={parameters.x_search.excluded_x_handles} maxItems={20}
            onChange={excluded_x_handles => patchXSearch({
              excluded_x_handles,
              ...(excluded_x_handles?.length ? { allowed_x_handles: undefined } : {}),
            })} />
          <theme.Input label={tr("fromDate")} type="date" value={parameters.x_search.from_date ?? ""}
            max={parameters.x_search.to_date} onChange={event => {
              const from_date = optionalString(event.target.value);
              if (!from_date || !parameters.x_search.to_date || from_date <= parameters.x_search.to_date) patchXSearch({ from_date });
            }} />
          <theme.Input label={tr("toDate")} type="date" value={parameters.x_search.to_date ?? ""}
            min={parameters.x_search.from_date} onChange={event => {
              const to_date = optionalString(event.target.value);
              if (!to_date || !parameters.x_search.from_date || to_date >= parameters.x_search.from_date) patchXSearch({ to_date });
            }} />
        </div>
        <div style={openRouterGrid}>
          <theme.Switch id="openrouterXImageUnderstanding" label={tr("imageUnderstanding")}
            checked={!!parameters.x_search.enable_image_understanding}
            onChange={enable_image_understanding => patchXSearch({ enable_image_understanding })} />
          <theme.Switch id="openrouterXVideoUnderstanding" label={tr("videoUnderstanding")}
            checked={!!parameters.x_search.enable_video_understanding}
            onChange={enable_video_understanding => patchXSearch({ enable_video_understanding })} />
        </div>
      </div>}
    </div>}
  </theme.Card>;
};
