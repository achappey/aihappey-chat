import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsCodeStyle, docsHeroTextStyle, docsHeroTitleStyle, docsInlineCodeStyle, useDocsTheme } from "aihappey-docs-components";
import { docsTopNavItems, gatewayNavSections } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type GatewayOverviewPageProps = {
  activePath: string;
  appTitle: string;
  apiBaseUrl?: string;
};

export const GatewayOverviewPage = ({ activePath, appTitle, apiBaseUrl }: GatewayOverviewPageProps) => {
  const { Header } = useDocsTheme();
  const authMode = useDocsAuthMode();
  const code = (value: string) => <code style={docsInlineCodeStyle}>{value}</code>;
  const baseUrl = apiBaseUrl?.trim().replace(/\/+$/, "") || "http://localhost:3010";

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>Gateway API Overview</Header>
          <p style={docsHeroTextStyle}>
            Use this reference to look up gateway endpoints, request and response schemas, client examples, streaming behavior,
            authentication, errors, and compatibility surfaces.
          </p>
        </header>
        <ApiSection title="Start here">
          <ol style={{ margin: 0, paddingInlineStart: 24, display: "grid", gap: 16 }}>
            <li>Choose the API surface: OpenAI compatible, Anthropic compatible, or AI SDK.</li>
            <li>Choose credentials for every provider used by the request.</li>
            <li>Start with models, then use a provider-qualified model ID on a generation endpoint.</li>
          </ol>
        </ApiSection>
        <ApiSection title="Authentication">
          <div id="authentication" style={{ display: "grid", gap: 16 }}>
            {authMode === "provider-key" ? <>
              <p style={{ margin: 0 }}>This documentation app is configured for raw provider keys. The universal form is {code("X-<ProviderId>-Key")}, for example {code("X-OpenAI-Key")}, {code("X-Anthropic-Key")}, or {code("X-Google-Key")}. The gateway uses the provider segment of a model ID such as {code("openai/gpt-4.1-mini")} to select the matching key.</p>
              <p style={{ margin: 0 }}>For single-provider generation routes that can infer one provider, {code("Authorization: Bearer <provider-key>")} is supported as a compatibility shortcut. Prefer the provider header in new integrations because it works consistently across the API.</p>
              <p style={{ margin: 0 }}><strong>Models and skills:</strong> discovery endpoints cannot reliably infer one provider. Send one or more provider-key headers; bearer is not supported for {code("GET /v1/models")} or skill listing. Send all required {code("X-<ProviderId>-Key")} headers when listing multiple providers.</p>
              <pre style={{ ...docsCodeStyle, margin: 0, padding: 16, borderRadius: 12, overflow: "auto" }}>{`curl ${baseUrl}/v1/models \\\n  -H "X-OpenAI-Key: $OPENAI_API_KEY" \\\n  -H "X-Anthropic-Key: $ANTHROPIC_API_KEY"`}</pre>
              <p style={{ margin: 0 }}>Never expose provider keys in browser code or commit them to source control. Send requests through a trusted server when the caller is a public client.</p>
            </> : <p style={{ margin: 0 }}>This documentation app uses its configured identity provider to acquire and attach an access token to live requests.</p>}
          </div>
        </ApiSection>
        <ApiSection title="Compatibility surfaces">
          <p style={{ margin: 0 }}>Choose the request and response shape expected by your client: OpenAI compatible, Anthropic compatible, or AI SDK. Provider-qualified model IDs and provider-key headers use the same routing rules on every surface.</p>
        </ApiSection>
        <ApiSection title="Errors">
          <div id="errors" style={{ display: "grid", gap: 16 }}>
            <p style={{ margin: 0 }}>Check the HTTP status before parsing a successful result. Integrations should accept an OpenAI-style error envelope and retain the request identifier for diagnostics.</p>
            <pre style={{ ...docsCodeStyle, margin: 0, padding: 16, borderRadius: 12, overflow: "auto" }}>{`{
  "error": {
    "message": "No API key was supplied for provider 'openai'.",
    "type": "authentication_error",
    "code": "missing_provider_key",
    "param": null
  },
  "request_id": "req_01hzyj8v5n9k6s3r2d4a"
}`}</pre>
            <ul style={{ margin: 0, paddingInlineStart: 24, display: "grid", gap: 8 }}>
              <li><strong>400</strong> — invalid JSON, missing fields, unsupported options, or an unavailable model selection.</li>
              <li><strong>401</strong> — a required provider key is missing or invalid.</li>
              <li><strong>404</strong> — the requested resource, skill, task, or stored response does not exist.</li>
              <li><strong>429</strong> — provider or deployment rate limit; honor {code("Retry-After")} when present.</li>
              <li><strong>500/502/503</strong> — gateway, upstream provider, or temporary availability failure.</li>
            </ul>
            <p style={{ margin: 0 }}>For SSE endpoints, failures detected before streaming use a non-2xx HTTP response. After headers are sent, the stream reports a typed error event or error part and then closes. Clients must handle both paths and must not treat HTTP 200 alone as proof that a stream completed.</p>
          </div>
        </ApiSection>
      </article>
    </ApiReferenceLayout>
  );
};



