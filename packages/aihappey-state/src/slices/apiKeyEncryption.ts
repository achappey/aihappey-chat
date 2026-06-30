export type EncryptedApiKeys = {
  version: 1;
  algorithm: "AES-GCM";
  kdf: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

export type ApiKeyEncryptionStatus = "none" | "locked" | "unlocked" | "needs-password";

export type ApiKeyEncryptionState = {
  encryptedApiKeys?: EncryptedApiKeys;
  apiKeyEncryptionStatus: ApiKeyEncryptionStatus;
  apiKeySessionPassword?: string;
  setEncryptedApiKeys: (encryptedApiKeys?: EncryptedApiKeys) => void;
  setApiKeySessionPassword: (password?: string) => void;
  unlockApiKeys: (headers: Record<string, string>) => void;
  lockApiKeys: () => void;
  setApiKeysNeedPassword: (headers: Record<string, string>) => void;
  setCustomHeaders: (headers: Record<string, string>) => void;
};

export const resolveApiKeyEncryptionStatus = (
  encryptedApiKeys?: EncryptedApiKeys,
  customHeaders?: Record<string, string>
): ApiKeyEncryptionStatus => {
  if (encryptedApiKeys) return customHeaders && Object.keys(customHeaders).length > 0 ? "unlocked" : "locked";
  return customHeaders && Object.keys(customHeaders).length > 0 ? "needs-password" : "none";
};

