import type { McpRegistryServer } from "aihappey-types";
import { useDarkMode } from "usehooks-ts";

export const useMcpServer = (
    server?: McpRegistryServer,
) => {
    const isDarkMode = useDarkMode();

    const icon = server?.icons?.find(i => i.theme === (isDarkMode ? "dark" : "light"))?.src
        ?? server?.icons?.[0]?.src;

    const repositoryUrl = server?.repository?.subfolder ?
        server?.repository?.url + server?.repository?.subfolder
        : server?.repository?.url;

    return { icon, repositoryUrl }
};