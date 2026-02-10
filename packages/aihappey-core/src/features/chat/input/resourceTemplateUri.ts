const templateParamRegex = /{([^{}]+)}/g;

export const extractTemplateParams = (template: string) => {
  const raw = String(template ?? "");
  const params = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = templateParamRegex.exec(raw))) {
    const key = match[1]?.trim();
    if (key) params.add(key);
  }
  return Array.from(params.values());
};

export const applyTemplateParams = (
  template: string,
  params: Record<string, any> | undefined
) => {
  const safeParams = params ?? {};
  return String(template ?? "").replace(templateParamRegex, (_full, key) => {
    const value = safeParams[key?.trim?.() ?? ""];
    return value == null ? "" : String(value);
  });
};

