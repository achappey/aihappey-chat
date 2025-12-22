import { useAppStore } from "aihappey-state";
import { useEffect } from "react";

export function useDefaultModel(authenticated: boolean) {
  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const setUserPreferredModel = useAppStore((s) => s.setUserPreferredModel);

  useEffect(() => {
    const defaultModel = userPreferredModel ??
      authenticated ? "openai/gpt-5.2" : "pollinations/openai"
    if (!userPreferredModel)
      setUserPreferredModel(defaultModel)

    setSelectedModel(defaultModel)
  }, []);
}
