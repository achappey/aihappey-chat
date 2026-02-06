import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { getCompletion } from "../../runtime/mcp/mcpPrompts";

const FILTER_DEBOUNCE_MS = 500;

export function usePromptArguments({ prompt, onPromptExecute }: any) {
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
  const supportsCompletions = mcpServerContent[prompt._serverName]?.capabilities?.completions;
  const valuesRef = useRef<Record<string, string>>(initialValues);
  const requestSeqRef = useRef<Record<string, number>>({});
  const filterDebounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const activeRequestsRef = useRef(0);
  const isMountedRef = useRef(true);

  const startLoadingRequest = useCallback(() => {
    activeRequestsRef.current += 1;
    setLoadingCompletions(true);
  }, []);

  const finishLoadingRequest = useCallback(() => {
    activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
    if (activeRequestsRef.current === 0) {
      setLoadingCompletions(false);
    }
  }, []);

  // Utility to build the context for server calls
  const buildContext = (excludeName: string, vals: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(vals).filter(([k, v]) => k !== excludeName && v.trim() !== "")
    );

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      Object.values(filterDebounceTimersRef.current).forEach(clearTimeout);
      filterDebounceTimersRef.current = {};
      activeRequestsRef.current = 0;
      setLoadingCompletions(false);
    };
  }, []);

  // Fetch completions for blanks on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchBlankCompletions() {
      if (!supportsCompletions) return;
      const blankArgs = (prompt.arguments ?? []).filter(
        (a: any) => !values[a.name]?.trim()
      );
      if (blankArgs.length === 0) return;

      await Promise.all(
        blankArgs.map(async (arg: any) => {
          startLoadingRequest();
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
          finally {
            if (!cancelled && isMountedRef.current) {
              finishLoadingRequest();
            }
          }
        })
      );
    }
    fetchBlankCompletions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.name, supportsCompletions, startLoadingRequest, finishLoadingRequest]);

  // Called by the <Select> for filtering completions
  const onFilter = useCallback(
    async (argumentName: string, value: string) => {
      if (!supportsCompletions) return;
      if (filterDebounceTimersRef.current[argumentName]) {
        clearTimeout(filterDebounceTimersRef.current[argumentName]);
      }

      filterDebounceTimersRef.current[argumentName] = setTimeout(async () => {
        const requestId = (requestSeqRef.current[argumentName] ?? 0) + 1;
        requestSeqRef.current[argumentName] = requestId;

        const currentValues = {
          ...valuesRef.current,
          [argumentName]: value,
        };

        startLoadingRequest();
        try {
          const result = await getCompletion(prompt._serverName,
            { type: "ref/prompt", name: prompt.name },
            { name: argumentName, value },
            { arguments: buildContext(argumentName, currentValues) });

          const isStale = requestSeqRef.current[argumentName] !== requestId;
          if (isStale || !isMountedRef.current) return;

          setCompletions((c) => ({
            ...c,
            [argumentName]: result?.completion?.values as string[] ?? [],
          }));
        } catch { }
        finally {
          if (isMountedRef.current) {
            finishLoadingRequest();
          }
        }
      }, FILTER_DEBOUNCE_MS);
    },
    [prompt.name, supportsCompletions, startLoadingRequest, finishLoadingRequest]
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
          startLoadingRequest();
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
          finally {
            if (isMountedRef.current) {
              finishLoadingRequest();
            }
          }
        })
      );
    },
    [prompt.name, supportsCompletions, startLoadingRequest, finishLoadingRequest]
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
    // onHide();
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
