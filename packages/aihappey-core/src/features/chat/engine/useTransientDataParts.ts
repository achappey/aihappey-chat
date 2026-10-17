import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DataUIPart } from "aihappey-ai";

export function useTransientDataParts(conversationId?: string) {
  const scope = useMemo(() => ({ active: false }), [conversationId]);
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
    // The API debug preference controls requests, not incoming transient data.
    if (!scope.active || currentScope.current !== scope
      || !part.type.startsWith("data-") || (part as { transient?: boolean }).transient !== true) return;

    setSnapshot((previous) => ({
      scope,
      parts: [...(previous.scope === scope ? previous.parts : []), part],
    }));
  }, [scope]);

  return {
    onData,
    transientDataParts: snapshot.scope === scope ? snapshot.parts : [],
  };
}
