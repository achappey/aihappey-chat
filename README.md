# aihappey-chat

![aihappey-chat](https://achappey.github.io/aihappey-chat/images/screenshot1.png) 

 A modular, client-side AI chat [app](https://chat.aihappey.com) featuring rich content support and integration with the Model Context Protocol (MCP).

## 📚 Demos & Documentation

Explore our component libraries and themes via our Storybook documentation:

- 🎨 [**Storybook Chat**](https://achappey.github.io/aihappey-chat/storybook-chat) - Core chat components and interactions.
- 🖌️ [**Storybook Themes**](https://achappey.github.io/aihappey-chat/storybook-themes) - Theming and styling primitives.

## ✨ Features

- **Client-Side Architecture**: Designed to run entirely in the browser, communicating directly with backends.
- **MCP Integration**: Built-in client for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), enabling context-aware AI interactions.
- **Rich Media Support**: Capable of rendering a wide variety of content types:
  - Markdown & LaTeX
  - Code blocks with syntax highlighting
  - Interactive Charts
  - 3D Models
  - PDFs & Images
- **Theming System**: Flexible theming with pre-built support for **Fluent UI** and **Bootstrap**.
- **Modular Design**: A monorepo structure separating core logic, UI components, and integrations.

## 📂 Repository Structure

```mermaid
flowchart TB
  repo[aihappey-chat\n(monorepo)]

  repo --> docs[docs/\nGitHub Pages]
  docs --> sbChat[storybook-chat\n(Chat components docs)]
  docs --> sbThemes[storybook-themes\n(Theme docs)]

  repo --> packages[packages/\nReusable libraries]
  packages --> core[aihappey-core\nstate + logic + rich content]
  packages --> components[aihappey-components\nUI components]
  packages --> mcp[aihappey-mcp\nMCP client]
  packages --> themes[aihappey-theme-*\nBootstrap / Fluent / Storybook]
  packages --> utils[aihappey-*(ai, http, i18n, state, auth, types, conversations, …)]

  repo --> samples[samples/\nRunnable apps]
  samples --> chathappey[samples/chathappey\nreference chat app]
  samples --> bootstrapSample[samples/bootstrap-sample\nBootstrap theme demo]
  samples --> fluentSample[samples/fluent-sample\nFluent theme demo]
  samples --> fakton[samples/fakton\nadditional sample]

  %% Relationships
  chathappey --> packages
  bootstrapSample --> packages
  fluentSample --> packages
  fakton --> packages

  sbChat --> packages
  sbThemes --> packages
```

This monorepo is organized into `packages` and `samples`:

### Packages
- **`packages/aihappey-core`**: The heart of the application, handling state, logic, and rich content rendering.
- **`packages/aihappey-components`**: Reusable UI components for the chat interface.
- **`packages/aihappey-mcp`**: Client implementation for the Model Context Protocol.
- **`packages/aihappey-theme-*`**: Theme implementations (Fluent, Bootstrap).

### Samples
- **`samples/chathappey`**: The main reference implementation. A full-featured chat client using the Fluent UI theme.
- **`samples/bootstrap-sample`**: A demonstration of the chat client using the Bootstrap theme.

## 🔌 Vercel AI SDK integration (chat + tool calling)

This client is built around the **Vercel AI SDK**:

- UI state + streaming is handled with `useChat` from `@ai-sdk/react` (re-exported via `packages/aihappey-ai`).
- Requests are sent via `DefaultChatTransport` from the `ai` package.

Implementation pointers:

- `packages/aihappey-ai/src/index.ts` (re-exports `useChat` and transport types)
- `packages/aihappey-core/src/features/chat/engine/VercelChatInner.tsx` (wires `useChat`, transport, auth-aware `fetch`, etc.)

### Backend requirements

You must provide a **Vercel AI SDK–compatible streaming chat backend**.

- The default route expected by the client is `POST /api/chat`.
- The client sends `messages` in the Vercel AI SDK UI message format.
- Tool calling is supported:
  - When the backend emits tool calls, the UI handles them via `onToolCall`.
  - Tool results are fed back into the stream via `addToolOutput(...)`.

In other words: this repo is **client-side only** and expects a compatible backend for streaming.

## 🧠 Agent mode

`aihappey-chat` supports two runtime modes:

- **Chat mode** (default): requests go to `CHAT_API_URL` (or `/api/chat` if you host UI+backend together).
- **Agent mode**: requests go to **`AGENT_ENDPOINT + "/api/chat"`**.

In agent mode, the UI can send extra metadata (e.g. selected agents and workflow settings like sequential/groupchat/handoff). The exact orchestration happens on the agent backend.

## 🚀 Getting Started

### Prerequisites
- **Node.js** (Latest LTS recommended)
- **npm**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/achappey/aihappey-chat.git
   cd aihappey-chat
   ```

2. Install dependencies (this installs dependencies for all workspaces):
   ```bash
   npm install
   ```

### Running the Chat App (`chathappey`)

The `chathappey` sample is the best place to start exploring the capabilities of `aihappey-chat`.

1. **Navigate to the sample directory:**
   ```bash
   cd samples/chathappey
   ```

2. **Configure Environment:**
   Copy the example environment file to create your own configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your backend URLs (see [Configuration](#configuration) below).*

3. **Start Development Watcher:**
   In your terminal, start the build watcher:
   ```bash
   npm run dev
   ```

4. **Serve the Application:**
   In a **new terminal window**, navigate to the same directory and serve the application:
   ```bash
   cd samples/chathappey
   npm run serve
   ```
   Open the URL shown in the terminal (usually `http://localhost:3032`) to view the app.

## ⚙️ Configuration

The application is configured via `.env` files. Key variables include:

- `CHAT_API_URL`: Chat backend endpoint (Vercel AI SDK compatible; typically ends with `/api/chat`).
- `AGENT_ENDPOINT`: Base URL of the agent backend. The UI will call `${AGENT_ENDPOINT}/api/chat` in agent mode.
- `CHAT_APP_MCP`: MCP server URL.
- `MODELS_API_URL`: Endpoint to fetch available models.
- `SAMPLING_API_URL`: Backend for MCP sampling calls (optional, depending on your setup).
- `CONVERSATIONS_API_URL`: Remote conversation storage backend (optional, if enabled).
- `TRANSCRIPTION_API`: Transcription backend (optional, if enabled).

Refer to `.env.example` in `samples/chathappey` for the full list of available configuration options.

## 🛠️ Development

- **Building Packages**: To build all packages, run `npm run build` from the root directory.
- **Adding Dependencies**: Use the workspace flag to add a dependency to a specific package:
  ```bash
  npm install <package-name> -w packages/<package-name>
  ```
