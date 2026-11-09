import { createContext, useContext } from "react";

// Runtime capability, separate from the user's persisted Cloud preference.
export const CloudStorageAvailabilityContext = createContext(false);

export const useCloudStorageAvailable = () => useContext(CloudStorageAvailabilityContext);

export const isCloudStorageAvailable = (apiUrl?: string, scopes: readonly string[] = []) =>
  !!apiUrl?.trim() && scopes.some((scope) => !!scope.trim());
