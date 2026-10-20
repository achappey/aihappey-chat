# aihappey-chat

A browser-based AI chat client with streaming, provider switching, Agents, [MCP](https://modelcontextprotocol.io/), [Skills](https://agentskills.io), [Plugins](https://agent-plugins.org), files and rich response rendering.

Connect compatible AI APIs, agent runtimes and MCP servers directly from the client.

[![aihappey-chat](https://achappey.github.io/aihappey-chat/images/screenshot_chat.png)](https://chat.aihappey.com)

The chat client supports:

- **Streaming chat** with rich incremental message rendering
- **Provider and model switching** across compatible API surfaces
- **Agents and workflows** through connected agent runtimes
- **Agent Plugins** combining Skills, MCP servers and supporting resources
- **MCP** tools, resources, prompts, elicitation and tasks
- **Skills** with reusable instructions and supporting files
- **Search** with client-side full-text, vector and hybrid search
- **Files** with attachments, document content and rich file handling
- **Streaming UI** with interactive apps, cards and structured response rendering
- **Multi-theme UI** with interchangeable Shadcn, Fluent, Bootstrap, Mantine, Material and Chakra implementations
- **Model capabilities** including speech, transcription, embeddings, reranking, images, video and other supported modalities

To inspect API request/response debug events, enable **User Settings → Chat → Debug**
and open the chat sidebar's **Data** tab. Debugging is off by default and applies to
`/api/chat` requests. Events stay in memory only: they are never saved in conversation
history or sent on later turns, and are cleared when switching conversations or turning
Debug off.

Documentation: https://docs.aihappey.com/chat  
App: https://chat.aihappey.com

## Local mode

Use [local.aihappey.com](https://local.aihappey.com) with the standalone Windows runtimes:

- [aihappey-ai](https://github.com/achappey/aihappey-ai/releases/latest)
- [aihappey-agents](https://github.com/achappey/aihappey-agents)

The browser app connects to AI and Agents running on your own PC.

## Windows desktop

A standalone, Windows 11 native application built with WinUI 3. The AI gateway and Agents runtime runs on your own machine.

- Streaming chat with model and agent switching
- MCP tools and resources, Skills and local conversation history
- Native Windows UI with light, dark and high-contrast themes
- Local and remote runtime switching

**Repository:** [aihappey-windows](https://github.com/achappey/aihappey-windows)

