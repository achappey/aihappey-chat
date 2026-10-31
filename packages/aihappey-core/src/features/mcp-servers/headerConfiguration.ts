import type { McpRegistryHeader, McpRegistryInput, McpRegistryServerResponse } from "aihappey-types";
import { parseTree, type ParseError } from "jsonc-parser";

export type HeaderRow = { name: string; value: string };
export type HeaderField = { id: string; header: string; label: string; input: McpRegistryInput; value: string; variable?: string; fixed?: boolean };
export type HeaderForm = { fields: HeaderField[]; extra: HeaderRow[] };

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === "object" && !Array.isArray(value);
const placeholders = /\{([^{}]+)\}/g;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const entry = (headers: Record<string, string>, name: string) => Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());

/** Presentation hint only. Never use registry metadata as an OAuth authority or credential destination. */
export function hasOAuthHint(item?: McpRegistryServerResponse): boolean {
  const serverMeta = item?.server?._meta;
  const blocks = [serverMeta?.["io.modelcontextprotocol.registry/publisher-provided"], serverMeta, item?._meta];
  return blocks.some(block => object(block) && Object.entries(block).some(([key, value]) =>
    key.endsWith("/auth") && object(value) && value.type === "oauth2"));
}

export function registryHeaders(item?: McpRegistryServerResponse, url?: string): McpRegistryHeader[] {
  const remotes = item?.server?.remotes;
  if (!Array.isArray(remotes)) return [];
  const remote = remotes.find(remote => object(remote) && (url ? remote.url === url : remote.type === "streamable-http"));
  return Array.isArray(remote?.headers) ? remote.headers.filter(header => object(header) && typeof header.name === "string"
    && (!header.variables || object(header.variables) && Object.values(header.variables).every(object))) : [];
}

export const managedHeader = (header: McpRegistryHeader, oauth: boolean) => oauth && header.name.toLowerCase() === "authorization";

function extract(header: McpRegistryHeader, value: string): Record<string, string> | undefined {
  const template = header.value ?? "";
  const names: string[] = [];
  let pattern = "", offset = 0;
  for (const match of template.matchAll(placeholders)) {
    pattern += escapeRegex(template.slice(offset, match.index)) + "(.*?)";
    names.push(match[1]); offset = match.index! + match[0].length;
  }
  const match = new RegExp("^" + pattern + escapeRegex(template.slice(offset)) + "$").exec(value);
  if (!match) return undefined;
  const values: Record<string, string> = Object.create(null);
  for (let i = 0; i < names.length; i++) {
    if (values[names[i]] !== undefined && values[names[i]] !== match[i + 1]) return undefined;
    values[names[i]] = match[i + 1];
  }
  return values;
}

export function headerForm(definitions: McpRegistryHeader[], oauth: boolean, headers: Record<string, string> = {}): HeaderForm {
  const used = new Set<string>();
  const fields: HeaderField[] = [];
  definitions.forEach((header, index) => {
    if (managedHeader(header, oauth)) return;
    const saved = entry(headers, header.name);
    const variables = Object.entries(header.variables ?? {});
    const extracted = saved && variables.length ? extract(header, saved[1]) : undefined;
    if (saved) used.add(saved[0]);
    if (variables.length && (!saved || extracted)) {
      variables.forEach(([name, input]) => fields.push({ id: `${index}:${name}`, header: header.name, label: name,
        variable: name, input: { ...input, isSecret: input.isSecret || header.isSecret,
          isRequired: input.isRequired || header.isRequired },
        value: extracted?.[name] === `{${name}}` ? "" : extracted?.[name] ?? input.value ?? input.default ?? "" }));
    } else {
      const fixed = !saved && header.value !== undefined && !variables.length && !/\{[^{}]+\}/.test(header.value);
      fields.push({ id: `${index}`, header: header.name, label: header.name,
        input: variables.length ? { description: header.description, isRequired: header.isRequired,
          isSecret: header.isSecret || variables.some(([, input]) => input.isSecret) } : header,
        fixed, value: saved?.[1] ?? header.value ?? header.default ?? "" });
    }
  });
  return { fields, extra: Object.entries(headers).filter(([name]) => !used.has(name)).map(([name, value]) => ({ name, value })) };
}

function inputError(input: McpRegistryInput, value: string): string | undefined {
  if (!value.trim()) return input.isRequired ? "required" : undefined;
  if (input.choices?.length && !input.choices.includes(value)) return "choice";
  if (input.format === "number" && !Number.isFinite(Number(value))) return "number";
  if (input.format === "boolean" && !["true", "false"].includes(value)) return "boolean";
}

export function parseHeaders(raw: string): Record<string, string> {
  const errors: ParseError[] = [];
  const tree = parseTree(raw.trim() ? raw : "{}", errors, { disallowComments: true, allowTrailingComma: false });
  if (errors.length || tree?.type !== "object") throw new Error("json");
  const names = tree.children?.map(property => String(property.children?.[0]?.value).toLowerCase()) ?? [];
  if (new Set(names).size !== names.length) throw new Error("headers");
  let parsed: unknown;
  try { parsed = raw.trim() ? JSON.parse(raw) : {}; } catch { throw new Error("json"); }
  if (!object(parsed) || Object.values(parsed).some(value => typeof value !== "string")) throw new Error("json");
  const seen = new Set<string>();
  for (const [name, value] of Object.entries(parsed)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\x00-\x1f\x7f]/.test(value) || seen.has(name.toLowerCase())) throw new Error("headers");
    seen.add(name.toLowerCase());
  }
  return parsed as Record<string, string>;
}

export function resolveHeaderForm(form: HeaderForm, definitions: McpRegistryHeader[], validate = true): Record<string, string> {
  const rows: HeaderRow[] = [];
  for (const header of definitions) {
    const fields = form.fields.filter(field => field.header === header.name);
    if (!fields.length) continue;
    if (!header.isRequired && fields.every(field => !field.value)) continue;
    for (const field of fields) {
      const error = inputError(field.input, field.value);
      if (validate && error) throw new Error(error);
    }
    const direct = fields.find(field => !field.variable);
    if (direct) {
      if (validate && /\{[^{}]+\}/.test(direct.value)) throw new Error("required");
      if (direct.value) rows.push({ name: header.name, value: direct.value }); continue;
    }
    if (validate && fields.every(field => !field.value)) continue;
    const value = (header.value ?? "").replace(placeholders, (_, name) => fields.find(field => field.variable === name)?.value || `{${name}}`);
    if (validate && (fields.some(field => !field.value) || /\{[^{}]+\}/.test(value))) throw new Error("required");
    rows.push({ name: header.name, value });
  }
  rows.push(...form.extra.filter(row => row.name || row.value));
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.name.toLowerCase())) throw new Error("headers");
    seen.add(row.name.toLowerCase());
  }
  return parseHeaders(JSON.stringify(Object.fromEntries(rows.map(row => [row.name, row.value]))));
}

export function validateRegistryHeaders(headers: Record<string, string>, definitions: McpRegistryHeader[], oauth: boolean): void {
  for (const header of definitions) {
    if (managedHeader(header, oauth)) continue;
    const saved = entry(headers, header.name);
    if (!saved?.[1]?.trim()) { if (header.isRequired) throw new Error("required"); else continue; }
    if (/\{[^{}]+\}/.test(saved[1])) throw new Error("required");
    if (header.variables && Object.keys(header.variables).length) {
      const values = extract(header, saved[1]);
      // Preserve custom raw values that cannot be losslessly decomposed into variables.
      if (values) for (const [name, input] of Object.entries(header.variables)) {
        const error = inputError({ ...input, isRequired: input.isRequired || header.isRequired }, values[name] ?? "");
        if (error) throw new Error(error);
      }
    } else {
      const error = inputError(header, saved[1]);
      if (error) throw new Error(error);
    }
  }
}

export function initialRegistryHeaders(item?: McpRegistryServerResponse, url?: string): Record<string, string> {
  const definitions = registryHeaders(item, url);
  return resolveHeaderForm(headerForm(definitions, hasOAuthHint(item)), definitions);
}

export function requiresHeaderConfiguration(item: McpRegistryServerResponse): boolean {
  try {
    const definitions = registryHeaders(item);
    validateRegistryHeaders(initialRegistryHeaders(item), definitions, hasOAuthHint(item));
    return false;
  } catch { return true; }
}

/** Readiness never changes OAuth trust or discovery; it only prevents sending an incomplete manual draft. */
export function canConnectServer(headers: Record<string, string> = {}, item?: McpRegistryServerResponse, url?: string): boolean {
  try {
    parseHeaders(JSON.stringify(headers));
    validateRegistryHeaders(headers, registryHeaders(item, url), hasOAuthHint(item));
    return true;
  } catch { return false; }
}
