import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { getCompletion } from "../../../runtime/mcp/mcpPrompts";

const FILTER_DEBOUNCE_MS = 500;

type UseResourceTemplateArgumentsProps = {
  serverKey?: string;
  uriTemplate?: string;
  argumentNames?: string[];
};

export function useResourceTemplateArguments({
  serverKey,
  uriTemplate,
  argumentNames,
}: UseResourceTemplateArgumentsProps) {
  const names = useMemo(() => argumentNames ?? [], [JSON.stringify(argumentNames ?? [])]);
  const namesKey = useMemo(() => JSON.stringify(names), [names]);

  const initialValues = useMemo(
    () =>
      Object.fromEntries(names.map((name) => [name, ""])) as Record<string, string>,
    [namesKey]
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCompletions, setLoadingCompletions] = useState<boolean>(false);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const mcpServerContent = useAppStore((a) => a.mcpServerContent);
  const supportsCompletions =
    !!serverKey && !!mcpServerContent[serverKey]?.capabilities?.completions;
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

  const buildContext = (excludeName: string, vals: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(vals).filter(([k, v]) => k !== excludeName && v.trim() !== "")
    );

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    setValues(initialValues);
    valuesRef.current = initialValues;
    setCompletions({});
    setError(null);
    setPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey, uriTemplate, namesKey]);

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

  useEffect(() => {
    let cancelled = false;

    async function fetchBlankCompletions() {
      if (!supportsCompletions || !serverKey || !uriTemplate) return;
      const blankArgs = names.filter((n) => !values[n]?.trim());
      if (blankArgs.length === 0) return;

      await Promise.all(
        blankArgs.map(async (argumentName) => {
          startLoadingRequest();
          try {
            const result = await getCompletion(
              serverKey,
              { type: "ref/resource", uri: uriTemplate },
              { name: argumentName, value: "" },
              { arguments: buildContext(argumentName, valuesRef.current) }
            );

            if (result?.completion?.values?.length && !cancelled) {
              setCompletions((c) => ({
                ...c,
                [argumentName]: result.completion.values as string[],
              }));
            }
          } catch {
            // ignore completion failures
          } finally {
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
  }, [
    namesKey,
    supportsCompletions,
    serverKey,
    uriTemplate,
    startLoadingRequest,
    finishLoadingRequest,
  ]);

  const onFilter = useCallback(
    async (argumentName: string, value: string) => {
      if (!supportsCompletions || !serverKey || !uriTemplate) return;
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
          const result = await getCompletion(
            serverKey,
            { type: "ref/resource", uri: uriTemplate },
            { name: argumentName, value },
            { arguments: buildContext(argumentName, currentValues) }
          );

          const isStale = requestSeqRef.current[argumentName] !== requestId;
          if (isStale || !isMountedRef.current) return;

          setCompletions((c) => ({
            ...c,
            [argumentName]: (result?.completion?.values as string[] | undefined) ?? [],
          }));
        } catch {
          // ignore completion failures
        } finally {
          if (isMountedRef.current) {
            finishLoadingRequest();
          }
        }
      }, FILTER_DEBOUNCE_MS);
    },
    [supportsCompletions, serverKey, uriTemplate, startLoadingRequest, finishLoadingRequest]
  );

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

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
    setPending,
    onFilter,
  };
}

