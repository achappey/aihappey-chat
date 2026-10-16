import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DataUIPart } from "aihappey-ai";
import { store, useAppStore } from "aihappey-state";

export const getApiDebugEnabled = () => store.getState().apiDebugEnabled;

export function useTransientDebugParts(conversationId?: string) {
  const enabled = useAppStore((s) => s.apiDebugEnabled);
  const scope = useMemo(() => ({ active: false }), [conversationId, enabled]);
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [snapshot, setSnapshot] = useState<{ scope: typeof scope; parts: DataUIPart<any>[] }>({
    scope,
    parts: [],
  });

  useEffect(() => {
    scope.active = true;
    setSnapshot({ scope, parts: [] });
    return () => { scope.active = false; };
  }, [scope]);

  const onData = useCallback((part: DataUIPart<any>) => {
    // Persistent data remains owned by message.parts, not this UI-only buffer.
    if (!scope.active || currentScope.current !== scope || !enabled || !getApiDebugEnabled()
      || part.type !== "data-debug" || !(part as { transient?: boolean }).transient) return;

    setSnapshot((previous) => ({
      scope,
      parts: [...(previous.scope === scope ? previous.parts : []), part],
    }));
  }, [scope, enabled]);

  return {
    onData,
    debugParts: enabled && snapshot.scope === scope ? snapshot.parts : [],
  };
}
