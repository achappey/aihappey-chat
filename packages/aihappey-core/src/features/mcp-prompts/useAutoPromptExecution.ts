import { useEffect, useState } from "react";
import { useAppStore } from "aihappey-state";
import type { PromptWithSource } from "./PromptSelectButton";

type UseAutoPromptExecutionProps = {
    //allPrompts: PromptWithSource[];
    onPromptExecute: (prompt: PromptWithSource, args?: Record<string, string>) => void;
    setArgumentPrompt: (prompt: PromptWithSource | null) => void;
    setOpen: (open: boolean) => void;
};

export const useAutoPromptExecution = ({
    // allPrompts,
    onPromptExecute,
    setArgumentPrompt,
    setOpen,
}: UseAutoPromptExecutionProps) => {
    //  const refreshPrompts = useAppStore((s) => s.refreshPrompts);
    // const prompts = useAppStore((s) => s.prompts);
    const [isLoading, setIsLoading] = useState(false);

    const getPrompts = useAppStore((s) => s.getPrompts);
    const mcpServerContent = useAppStore((s) => s.mcpServerContent);
    const mcpServers = useAppStore((s) => s.mcpServers);
    // var urls = Object.entries(mcpServers)?.map(z => z[1].config.url);

    useEffect(() => {
        const executeAutoPrompt = async () => {
            const pendingPromptName = localStorage.getItem("aihappey:pendingPromptName");
            const pendingServerUrl = localStorage.getItem("aihappey:pendingMcpServer");

            if (!pendingPromptName || !pendingServerUrl) return;

            var key = Object.entries(mcpServers)?.find(z => z[1].config.url == pendingServerUrl);

            if (mcpServerContent[key?.[0]!.toLowerCase()!]?.capabilities.prompts != undefined) {
                const prompts = await getPrompts(key?.[0]!);
                const prompt = prompts.find(a => a.name == pendingPromptName);

                if (prompt?.arguments?.length
                    && prompt.arguments?.length > 0) {
                    setArgumentPrompt({
                        ...prompt,
                        _serverName: key?.[0]!
                    });
                } else {
                    onPromptExecute({
                        ...prompt,
                        _serverName: key?.[0]!
                    } as any);
                }

                setOpen(false);

                // Clean up
                localStorage.removeItem("aihappey:pendingPromptName");
                localStorage.removeItem("aihappey:pendingMcpServer");
            }
            // Check if prompts need loading
            /*     if (!prompts[pendingServerUrl] || prompts[pendingServerUrl].length === 0) {
                     setIsLoading(true);
                     await refreshPrompts(pendingServerUrl);
                     setIsLoading(false);
                     return; // Will retry on next render
                 }*/

            // Find and execute prompt
        /*    const pendingPrompt = allPrompts.find(
                (p) => p.name === pendingPromptName
                //&& p._url === pendingServerUrl
            );

            if (pendingPrompt) {
                if (pendingPrompt.arguments?.length
                    && pendingPrompt.arguments?.length > 0) {
                    setArgumentPrompt(pendingPrompt);
                } else {
                    onPromptExecute(pendingPrompt);
                }
                setOpen(false);

                // Clean up
                localStorage.removeItem("aihappey:pendingPromptName");
                localStorage.removeItem("aihappey:pendingMcpServer");
            }*/
        };

        void executeAutoPrompt();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mcpServerContent]);

    return { isAutoExecuting: isLoading };
};