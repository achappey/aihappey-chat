import { IAuthStorage } from "../config/types";

/**
 * Default implementation of IAuthStorage using localStorage/sessionStorage.
 * All methods are safe for SSR and catch storage errors.
 */
export const localStorageAuth: IAuthStorage = {
  get: (key) => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    } catch {}
  },
  del: (key) => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } catch {}
  },
};

export const sessionStorageAuth: IAuthStorage = {
  get: (key) => {
    try {
      return typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (typeof window !== "undefined") sessionStorage.setItem(key, value);
    } catch {}
  },
  del: (key) => {
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(key);
    } catch {}
  },
};
