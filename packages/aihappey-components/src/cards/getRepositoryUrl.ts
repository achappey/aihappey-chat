import type { McpRegistryServer } from "aihappey-types";

export const getRepositoryUrl = (
    server?: McpRegistryServer,
) => server?.repository?.subfolder ?
        server?.repository?.url + server?.repository?.subfolder
        : server?.repository?.url;