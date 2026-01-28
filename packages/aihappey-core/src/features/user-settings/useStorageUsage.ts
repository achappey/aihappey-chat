// hooks/useStorageUsage.ts
import { useEffect, useState } from "react";

export type StorageUsage = {
  used: number;
  quota: number;
  free: number;
};

export function useStorageUsage(pollMs = 5000) {
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  const load = async () => {
    if (!navigator.storage?.estimate) return;

    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    setStorage({
      used: usage,
      quota,
      free: Math.max(0, quota - usage),
    });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, []);

  return storage;
}
