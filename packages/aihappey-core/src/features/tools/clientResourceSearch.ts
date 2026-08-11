export const CLIENT_RESOURCE_SEARCH_PLUGIN_ID = "client-resource-search";
export const CLIENT_RESOURCE_SEARCH_NAME = "search_resources";
export const MAX_CLIENT_RESOURCE_SEARCH_RESULTS = 20;

export type ResourceSearchCatalog = {
  resources: any[];
  resourceTemplates: any[];
};

export const EMPTY_CLIENT_RESOURCE_SEARCH_RESULT: ResourceSearchCatalog = {
  resources: [],
  resourceTemplates: [],
};

const isRecord = (value: unknown): value is Record<string, any> =>
  value != null && typeof value === "object" && !Array.isArray(value);

export const isResourceVisibleToAssistant = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const audience = value.annotations?.audience;
  return !Array.isArray(audience) || audience.length === 0 || audience.includes("assistant");
};

/** Keeps the MCP resource and resource-template objects in their original shapes. */
export const toResourceSearchCatalog = (content: unknown): ResourceSearchCatalog => {
  const source = isRecord(content) ? content : {};
  return {
    resources: Array.isArray(source.resources)
      ? source.resources.filter(isResourceVisibleToAssistant)
      : [],
    resourceTemplates: Array.isArray(source.resourceTemplates)
      ? source.resourceTemplates.filter(isResourceVisibleToAssistant)
      : [],
  };
};

const selectedValues = (value: unknown, key: string): string[] => {
  if (!isRecord(value) || !Array.isArray(value[key])) return [];
  return value[key].filter((entry: unknown): entry is string => typeof entry === "string");
};

/** Strictly resolves inference output through the server-scoped catalog allow-list. */
export const parseClientResourceSearchSelection = (
  text: unknown,
  catalog: ResourceSearchCatalog,
): ResourceSearchCatalog => {
  if (typeof text !== "string" || !text.trim()) return EMPTY_CLIENT_RESOURCE_SEARCH_RESULT;

  try {
    const parsed = JSON.parse(text);
    if (
      !isRecord(parsed)
      || Object.keys(parsed).some((key) =>
        key !== "selectedResourceUris" && key !== "selectedResourceTemplateUriTemplates")
    ) {
      return EMPTY_CLIENT_RESOURCE_SEARCH_RESULT;
    }

    const resourceUris = selectedValues(parsed, "selectedResourceUris");
    const templateUris = selectedValues(parsed, "selectedResourceTemplateUriTemplates");
    const resourcesByUri = new Map(
      catalog.resources
        .filter((resource) => typeof resource?.uri === "string")
        .map((resource) => [resource.uri, resource] as const),
    );
    const templatesByUri = new Map(
      catalog.resourceTemplates
        .filter((template) => typeof template?.uriTemplate === "string")
        .map((template) => [template.uriTemplate, template] as const),
    );

    const resources: any[] = [];
    const resourceTemplates: any[] = [];
    const seenResources = new Set<string>();
    const seenTemplates = new Set<string>();

    for (const uri of resourceUris) {
      const resource = resourcesByUri.get(uri);
      if (!resource || seenResources.has(uri)) continue;
      seenResources.add(uri);
      resources.push(resource);
      if (resources.length === MAX_CLIENT_RESOURCE_SEARCH_RESULTS) break;
    }

    for (const uriTemplate of templateUris) {
      const template = templatesByUri.get(uriTemplate);
      if (!template || seenTemplates.has(uriTemplate)) continue;
      seenTemplates.add(uriTemplate);
      resourceTemplates.push(template);
      if (resourceTemplates.length === MAX_CLIENT_RESOURCE_SEARCH_RESULTS) break;
    }

    return { resources, resourceTemplates };
  } catch {
    return EMPTY_CLIENT_RESOURCE_SEARCH_RESULT;
  }
};

export const clientResourceSearchQuery = (input: unknown): string => {
  if (typeof input === "string") return input.trim();
  if (!isRecord(input)) return "";
  for (const key of ["query", "goal", "search_query", "description"]) {
    if (typeof input[key] === "string" && input[key].trim()) return input[key].trim();
  }
  return "";
};

