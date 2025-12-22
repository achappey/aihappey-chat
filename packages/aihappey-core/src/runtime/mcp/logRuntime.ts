import { useSyncExternalStore } from "react";

class McpLogRuntime {
    private items: {
        id: string;
        timestamp: number;
        data: any;
        level: string;
        server?: string;
    }[] = [];

    private listeners = new Set<() => void>();

    subscribe(cb: () => void) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    append(item: {
        data: any;
        level: string;
        server?: string;
    }) {
        this.items.push({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...item,
        });
        this.notify();
    }

    clear() {
        this.items = [];
        this.notify();
    }

    getSnapshot() {
        return this.items;
    }
}

export function useMcpLogs(runtime: McpLogRuntime) {
    return useSyncExternalStore(
        cb => runtime.subscribe(cb),
        () => runtime.getSnapshot(),
        () => []
    );
}

export const logRuntime = new McpLogRuntime();
