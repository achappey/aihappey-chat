import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { toMarkdownLinkSmart } from "../chat/files/markdown";

export function usePromptArguments({ prompt, onPromptExecute, model }: any) {
  // Build initial form state with empty strings
  const initialValues = Object.fromEntries(
    (prompt.arguments ?? []).map((a: any) => [a.name, ""])
  ) as Record<string, string>;

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCompletions, setLoadingCompletions] = useState<boolean>(false);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const mcpServerContent = useAppStore((a) => a.mcpServerContent)
  const getCompletion = useAppStore((a) => a.getCompletion)
  const supportsCompletions = mcpServerContent[prompt._serverName]?.capabilities?.completions;

  // Utility to build the context for server calls
  const buildContext = (excludeName: string, vals: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(vals).filter(([k, v]) => k !== excludeName && v.trim() !== "")
    );

  // Append prompt messages
  const appendPromptMessages = async (messages: any[]) => {
    const parts: any[] = messages.map((m) => ({
      type: "text",
      text:
        m.content.text ??
        toMarkdownLinkSmart(
          m.content.resource.uri,
          m.content.resource.text as string,
          m.content.resource.mimeType
        ),
    }));
    await onPromptExecute(parts, model);
  };

  // Fetch completions for blanks on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchBlankCompletions() {
      if (!supportsCompletions) return;
      const blankArgs = (prompt.arguments ?? []).filter(
        (a: any) => !values[a.name]?.trim()
      );
      if (blankArgs.length === 0) return;

      setLoadingCompletions(true);
      await Promise.all(
        blankArgs.map(async (arg: any) => {
          try {
            const result = await getCompletion(prompt._serverName,
              { type: "ref/prompt", name: prompt.name },
              { name: arg.name, value: "" },
              { arguments: buildContext(arg.name, values) }
            );

            if (result?.completion?.values?.length && !cancelled) {
              setCompletions((c) => ({ ...c, [arg.name]: result.completion.values as string[] }));
            }
          } catch { }
        })
      );
      if (!cancelled) setLoadingCompletions(false);
    }
    fetchBlankCompletions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.name]);

  // Called by the <Select> for filtering completions
  const onFilter = useCallback(
    async (argumentName: string, value: string) => {
      if (!supportsCompletions) return;
      try {
        const result = await getCompletion(prompt._serverName,
          { type: "ref/prompt", name: prompt.name },
          { name: argumentName, value },
          { arguments: buildContext(argumentName, values) });

        setCompletions((c) => ({
          ...c,
          [argumentName]: result.completion.values as string[],
        }));
      } catch { }
    },
    [prompt.name, values]
  );

  // Update values and autofill blanks
  const autofillBlankArgs = useCallback(
    async (
      changedName: string,
      currentValues: Record<string, string>
    ) => {
      if (!supportsCompletions) return;
      const blanks = (prompt.arguments ?? []).filter(
        (a: any) => a.name !== changedName && !currentValues[a.name]?.trim()
      );
      if (blanks.length === 0) return;

      await Promise.all(
        blanks.map(async (arg: any) => {
          try {
            const result = await getCompletion(prompt._serverName,
              { type: "ref/prompt", name: prompt.name },
              { name: arg.name, value: "" },
              { arguments: buildContext(arg.name, currentValues) });

            if (!result?.completion?.values?.length) return;

            const opts = result.completion.values as string[];
            setCompletions((c) => ({ ...c, [arg.name]: opts }));
            if (opts.length === 1 && !result.completion.hasMore) {
              setValues((v) => ({ ...v, [arg.name]: opts[0] }));
            }
          } catch { }
        })
      );
    },
    [prompt.name]
  );

  const handleChange = useCallback(
    (name: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        autofillBlankArgs(name, next);
        return next;
      });
    },
    [autofillBlankArgs]
  );

  const missingRequired = (prompt.arguments ?? []).some(
    (a: any) => a.required && !values[a.name]?.trim()
  );

  const handleOk = async (onHide: () => void) => {
    if (missingRequired || pending) return;
    await onPromptExecute(prompt, values);
    onHide();
  };

  return {
    values,
    setValues,
    handleChange,
    completions,
    setCompletions,
    loadingCompletions,
    error,
    setError,
    pending,
    missingRequired,
    handleOk,
    onFilter,
  };
}
