import { CreateMessageRequest } from "aihappey-mcp";
import { useSyncExternalStore } from "react";


export type OpenSampling = {
    id: string;
    serverUrl: string;
    request: CreateMessageRequest;
    createdAt: string;
};

class SamplingRuntime {
    private activeSamplings = new Map<
        string,
        {
            request: CreateMessageRequest;
            serverUrl: string;
            createdAt: string;
        }
    >();

    private snapshot: OpenSampling[] = [];
    private listeners = new Set<() => void>();

    subscribe(cb: () => void) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    private notify() {
        this.snapshot = Array.from(this.activeSamplings.entries()).map(
            ([id, value]) => ({ id, ...value })
        );
        this.listeners.forEach(l => l());
    }

    startSampling(serverUrl: string, request: CreateMessageRequest) {
        const id = crypto.randomUUID();
        const createdAt = Date.now().toString()
        this.activeSamplings.set(id, { serverUrl, request, createdAt: createdAt });
        this.notify();
        return {id, createdAt};
    }

    finishSampling(id: string) {
        this.activeSamplings.delete(id);
        this.notify();
    }

    getSnapshot() {
        return this.snapshot;
    }
}

export function useOpenSamplings(runtime: SamplingRuntime) {
    return useSyncExternalStore(
        cb => runtime.subscribe(cb),
        () => runtime.getSnapshot(),
        () => []
    );
}

export const samplingRuntime = new SamplingRuntime();