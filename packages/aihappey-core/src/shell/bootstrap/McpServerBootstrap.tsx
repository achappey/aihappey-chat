import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useAppStore } from "aihappey-state";
import { transformUrl } from "../../features/mcp-servers/AddServerModal";

/**
 * McpServerBootstrap
 * - Reads `mcpServer` query parameters from the URL.
 * - For each URL: If a server exists in state, uses its name. If not, adds a new server with a generated name.
 * - Selects the servers corresponding to the query params.
 *
 * Place this component above McpConnectionsProvider in your component tree.
 */
export const McpServerBootstrap = () => {

  // return null;

  const [searchParams] = useSearchParams();
  const addMcpServer = useAppStore((a) => a.addMcpServer);
  const updateMcpServer = useAppStore((a) => a.updateMcpServer);
  const mcpServers = useAppStore((a) => a.mcpServers);
  //const connected = useAppStore((a) => a.connected);
  //const selectServers = useAppStore((a) => a.selectServers);
  //const addServer = useAppStore((a) => a.addServer);
  //const selectedServers = connected
  //.map((a) => a.server?.remotes?.find(z => z.type == "streamable-http"))
  //    .map((a) => a?.url!);

  const url = searchParams.get("mcpServer");
  if (url) {
    localStorage.setItem("aihappey:pendingMcpServer", url);

    const promptName = searchParams.get("promptName");
    if (promptName) {
      localStorage.setItem("aihappey:pendingPromptName", promptName);
    }
  }

  useEffect(() => {
    // const url = searchParams.get("mcpServer");
    if (!url) {
     // localStorage.removeItem("aihappey:pendingMcpServer")
      return;
    };

    const withoutProtocol = transformUrl(url);
    const cfg: any = {
      url,
      disabled: false,
      type: "http",
      headers: {},
    };

    if (Object.keys(mcpServers)
      .includes(withoutProtocol)) {
      if (mcpServers[withoutProtocol].config.disabled)
        updateMcpServer(withoutProtocol, {
          disabled: false,
          url,
          type: "http"
        })
     // else
      //  localStorage.removeItem("aihappey:pendingMcpServer");
    }
    else
      addMcpServer(withoutProtocol, {
        config: cfg
      });
    // if (parsedHeaders) {
    //   cfg.headers = parsedHeaders;
    //}
    //if(mcpServers)

    /*
    const nameList: string[] = [];

    // urls.forEach((url: any) => {
    // Try to find an existing server by URL
    const found = servers.find(a => a.server.remotes?.map(a => a.url).includes(url));
    if (found) {
      nameList.push(found.server.name);
    } else {
      // Generate a simple, URL-safe name (base64, sanitized)
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/").filter(Boolean); // removes empty segments
      const lastSegment = pathSegments[pathSegments.length - 1] || "custom";
      const name = lastSegment.toLowerCase();
      const withoutProtocol = urlObj.host + urlObj.pathname;
      // Add a minimal server config; adjust as needed for your app
      const config: ServerConfig = {
        name: withoutProtocol,
        version: "1.0.0",
        headers: {},
        remotes: [{ type: "streamable-http", url: url }]
      };
      addServer({ server: config });
      nameList.push(name);
    }
    //});

    if (nameList.length) {
      selectServers(nameList);
    }*/
    // Only runs when servers or query params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, mcpServers]);

  // No UI, side-effect only
  return null;
};
