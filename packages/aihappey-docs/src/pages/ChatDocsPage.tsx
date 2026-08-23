import type { ReactNode } from "react";
import {
  ApiReferenceLayout,
  ApiSection,
  CodeExample,
  DocsLink,
  docsArticleStyle,
  docsHeroTextStyle,
  docsHeroTitleStyle,
  useDocsTheme,
  type DocsCodeExample,
} from "aihappey-docs-components";
import { chatNavSections, docsTopNavItems } from "../docsData";

export type ChatDocsTopic = "overview" | "agents" | "conversations" | "model-context" | "skills" | "plugins";

const external = (href: string, label: string) => <a href={href} target="_blank" rel="noreferrer">{label} ↗</a>;
const list = (items: ReactNode[]) => <ul style={{ margin: 0, display: "grid", gap: 8 }}>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;

const agentExample = `{
  "name": "ResearchAgent",
  "description": "Research and summarize a topic.",
  "instructions": "Be concise and cite sources.",
  "model": {
    "id": "openai/gpt-4.1-mini",
    "options": { "temperature": 0.2 }
  },
  "argumentHint": "topic or question",
  "mcpServers": {
    "research": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "defer_loading": true,
      "namespace": true,
      "allowed_callers": ["direct", "programmatic"]
    }
  },
  "skills": [{
    "type": "skill_reference",
    "skill_id": "provider/research",
    "version": "latest"
  }]
}`;

const conversationExample = `{
  "id": "conversation_01",
  "messages": [
    {
      "id": "message_01",
      "role": "user",
      "parts": [
        { "type": "text", "text": "Summarize the attached report." }
      ]
    },
    {
      "id": "message_02",
      "role": "assistant",
      "parts": [
        { "type": "reasoning", "text": "I will inspect the report." },
        { "type": "text", "text": "The report describes..." }
      ],
      "metadata": { "model": "openai/gpt-4.1-mini" }
    }
  ],
  "metadata": {
    "name": "Report review",
    "temperature": 0.2,
    "mcpServers": ["https://mcp.example.com/mcp"]
  }
}`;

const skillExample = `{
  "type": "inline",
  "name": "release-notes",
  "description": "Create concise release notes.",
  "source": {
    "type": "text",
    "media_type": "text/markdown",
    "data": "LS0tXG5uYW1lOiByZWxlYXNlLW5vdGVzXG4uLi4="
  }
}`;

const pluginExample = `my-plugin/
├── plugin.json
├── skills/
│   └── summarize/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
├── mcp.json
└── com.example.client/
    └── hooks/`;

type TopicContent = {
  title: string;
  summary: string;
  sections: { title: string; body: ReactNode; examples?: DocsCodeExample[] }[];
};

const content: Record<ChatDocsTopic, TopicContent> = {
  overview: {
    title: "Chat developer overview",
    summary: "Portable data shapes and integration boundaries for developers extending or interoperating with the aihappey Chat application.",
    sections: [
      { title: "Scope", body: <p style={{ margin: 0 }}>These pages document the objects developers can create outside the application and the open standards Chat consumes. They are intentionally not an end-user guide to the Chat interface.</p> },
      {
        title: "Core objects", body: list([
          <><DocsLink href="/chat/agents">Agents</DocsLink> describe model, instruction, tool, skill, plugin, and MCP configuration.</>,
          <><DocsLink href="/chat/conversations">Conversations</DocsLink> are small JSON documents containing Vercel AI SDK-compatible UI messages.</>,
        ])
      },
      {
        title: "Open extension surfaces", body: list([
          <><DocsLink href="/chat/model-context">Model Context</DocsLink> connects remote tools, resources, prompts, and workflows.</>,
          <><DocsLink href="/chat/skills">Skills</DocsLink> package reusable instructions and supporting files.</>,
          <><DocsLink href="/chat/plugins">Plugins</DocsLink> package skills and MCP servers in a portable archive.</>,
        ])
      },
    ],
  },
  agents: {
    title: "Agent JSON",
    summary: "Create agents outside Chat with the same portable JSON shape used by the application.",
    sections: [
      {
        title: "Required fields", body: list([
          <><code>name</code> — stable display and selection name.</>,
          <><code>description</code> — concise discovery description.</>,
          <><code>instructions</code> — system-level operating instructions.</>,
          <><code>model</code> — object with provider-qualified <code>id</code>; optional <code>options.temperature</code>, provider metadata, and provider headers.</>,
        ])
      },
      {
        title: "Optional capabilities", body: list([
          <><code>argumentHint</code>, <code>outputSchema</code>, and <code>icons</code> provide invocation and presentation metadata.</>,
          <><code>mcpServers</code> maps names to remote HTTP server configurations; <code>mcpClient.capabilities.elicitation</code> declares client support.</>,
          <><code>skills</code> accepts inline bundles or gateway <code>skill_reference</code> values.</>,
          <><code>plugins</code> embeds immutable Agent Plugin ZIP snapshots as base64; <code>tools</code> carries provider-neutral runtime tool definitions.</>,
        ])
      },
      { title: "Example", body: <p style={{ margin: 0 }}>Unknown fields should be treated conservatively. Keep credentials out of portable files and inject headers at runtime.</p>, examples: [{ id: "agent-json", label: "Agent", language: "json", code: agentExample }] },
      { title: "Related specifications", body: <p style={{ margin: 0 }}>{external("https://modelcontextprotocol.io", "MCP documentation index")} · {external("https://agentskills.io", "Agent Skills documentation index")} · {external("https://agent-plugins.org", "Agent Plugins")}</p> },
    ],
  },
  conversations: {
    title: "Conversation JSON",
    summary: "Persist or import a conversation as an identifier, AI SDK UI messages, and application metadata.",
    sections: [
      {
        title: "Shape", body: list([
          <><code>id</code> is the stable conversation identifier.</>,
          <><code>messages</code> is an ordered array of UI messages with <code>id</code>, <code>role</code>, <code>parts</code>, and optional <code>metadata</code>.</>,
          <><code>metadata</code> is an extensible object. Chat currently uses values such as a display name, temperature, and selected MCP server URLs.</>,
        ])
      },
      { title: "UI message compatibility", body: <p style={{ margin: 0 }}>Message parts follow the Vercel AI SDK UI message model, allowing text, reasoning, files, sources, data, and typed tool parts to remain structured instead of being flattened into one text field. Consumers should preserve unfamiliar part and metadata fields when possible.</p> },
      { title: "Example", body: <p style={{ margin: 0 }}>Timestamps and provider-specific metadata can be added without changing the core envelope.</p>, examples: [{ id: "conversation-json", label: "Conversation", language: "json", code: conversationExample }] },
      { title: "Canonical reference", body: <p style={{ margin: 0 }}>{external("https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message", "Vercel AI SDK UIMessage")}</p> },
    ],
  },
  "model-context": {
    title: "Model Context in Chat",
    summary: "What the Chat MCP client implements, with normative protocol details delegated to the MCP specification.",
    sections: [
      {
        title: "Connection and discovery", body: list([
          <>Remote servers connect over Streamable HTTP. The client reads server identity, instructions, capabilities, tools, resources, and resource templates.</>,
          <>Bearer tokens and custom headers are supported. Protected servers can use OAuth 2.1 Authorization Code with PKCE and dynamic client registration.</>,
          <>Tool calls support cancellation, configurable timeout, progress-token metadata, progress notifications, and timeout reset on progress.</>,
        ])
      },
      {
        title: "Client capabilities", body: list([
          <>Elicitation handlers support both form and URL modes when configured.</>,
          <>Prompt listing/get and MCP completion are available where advertised; resources and templates can be selected and read for model context.</>,
          <>Trusted hosts can expose agent and conversation resources with <code>application/vnd.agent+json</code>, <code>application/vnd.agents+json</code>, <code>application/vnd.conversation+json</code>, or <code>application/vnd.conversations+json</code>.</>,
        ])
      },
      { title: "Current limitations", body: <p style={{ margin: 0 }}>Task capability discovery exists, but task-enabled tool streaming, task listing, and cancellation are currently disabled in the Chat runtime. Do not depend on MCP Tasks until those paths are enabled.</p> },
      { title: "Canonical MCP docs", body: <p style={{ margin: 0 }}>This page is an implementation guide, not a protocol specification. Start with the {external("https://modelcontextprotocol.io", "complete documentation index")}, then use the {external("https://modelcontextprotocol.io/docs/2026-07-28/develop/build-client", "client guide")} and versioned specification.</p> },
    ],
  },
  skills: {
    title: "Skills in Chat",
    summary: "How Chat consumes Agent Skills without redefining the open Agent Skills format.",
    sections: [
      {
        title: "Supported sources", body: list([
          <>Local skills are editable, versioned bundles centered on a required <code>SKILL.md</code> file with optional scripts, references, assets, and other resources.</>,
          <>Remote skills come from the gateway catalog and use provider-qualified IDs. Chat can list versions and download current or pinned ZIP content; remote catalog entries remain read-only until downloaded.</>,
          <>Agents can embed an inline base64 source or use <code>{`{ "type": "skill_reference", "skill_id": "provider/name", "version": "latest" }`}</code>.</>,
        ])
      },
      { title: "Runtime model", body: <p style={{ margin: 0 }}>Chat follows progressive disclosure: discovery metadata stays small, full instructions load when relevant, and referenced files are read only as needed. Plugin-bundled skills use the same parsing and runtime model.</p> },
      { title: "Inline example", body: <p style={{ margin: 0 }}>Use references for shared catalog content and inline sources for self-contained portable agents.</p>, examples: [{ id: "inline-skill", label: "Inline skill", language: "json", code: skillExample }] },
      { title: "Canonical Agent Skills docs", body: <p style={{ margin: 0 }}>{external("https://agentskills.io", "Documentation index")} · {external("https://agentskills.io/specification", "Specification")} · {external("https://agentskills.io/skill-creation/quickstart", "Quickstart")}</p> },
    ],
  },
  plugins: {
    title: "Agent Plugins in Chat",
    summary: "Portable Agent Plugins 1.0.0 packages containing reusable skills, MCP servers, and client extensions.",
    sections: [
      {
        title: "Package support", body: list([
          <>Chat imports and exports ZIP archives with required <code>plugin.json</code>, optional <code>mcp.json</code>, skills under <code>skills/&lt;name&gt;/SKILL.md</code>, and opaque extension files.</>,
          <>Manifests and MCP documents are validated against the Agent Plugins 1.0.0 canonical JSON Schemas. Unsafe paths, malformed JSON, duplicate names, and invalid components produce diagnostics.</>,
          <>Enabled plugins contribute valid skills and MCP servers to the runtime. Plugin-owned components remain namespaced to prevent collisions.</>,
        ])
      },
      { title: "MCP transport support", body: <p style={{ margin: 0 }}>The portable format can describe stdio, Streamable HTTP, and legacy SSE servers. The browser Chat runtime executes Streamable HTTP servers. Other transports are preserved in imported packages and shown as unsupported rather than silently discarded.</p> },
      { title: "Client extensions", body: <p style={{ margin: 0 }}>A configured reverse-domain extension namespace can store client-specific MCP settings such as <code>allowed_callers</code>, <code>defer_loading</code>, and <code>namespace</code> without changing the portable core.</p> },
      { title: "Directory example", body: <p style={{ margin: 0 }}>Distribution, installation, permissions, and user experience remain client concerns.</p>, examples: [{ id: "plugin-tree", label: "Plugin package", language: "text", code: pluginExample }] },
      { title: "Canonical Agent Plugins docs", body: <p style={{ margin: 0 }}>{external("https://agent-plugins.org/", "Overview and specification")} · {external("https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Plugin schema")} · {external("https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", "MCP schema")}</p> },
    ],
  },
};

export const ChatDocsPage = ({ activePath, appTitle, topic }: { activePath: string; appTitle: string; topic: ChatDocsTopic }) => {
  const { Header } = useDocsTheme();
  const page = content[topic];
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Chat" sections={chatNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>{page.title}</Header>
          <p style={docsHeroTextStyle}>{page.summary}</p>
        </header>
        {page.sections.map((section) => (
          <ApiSection key={section.title} title={section.title}>
            <div style={{ display: "grid", gap: 16 }}>
              {section.body}
              {section.examples ? <CodeExample examples={section.examples} /> : null}
            </div>
          </ApiSection>
        ))}
      </article>
    </ApiReferenceLayout>
  );
};
