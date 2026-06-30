import type { EncryptedApiKeys } from "aihappey-state/src/slices/apiKeyEncryption";

const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBufferSource = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getSubtleCrypto = () => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Browser crypto is not available.");
  }
  return subtle;
};

const deriveKey = async (password: string, salt: Uint8Array, iterations: number) => {
  const subtle = getSubtleCrypto();
  const baseKey = await subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toBufferSource(salt),
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptApiKeys = async (
  headers: Record<string, string>,
  password: string
): Promise<EncryptedApiKeys> => {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, ITERATIONS);
  const ciphertext = await getSubtleCrypto().encrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    textEncoder.encode(JSON.stringify(headers ?? {}))
  );

  return {
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
};

export const decryptApiKeys = async (
  encryptedApiKeys: EncryptedApiKeys,
  password: string
): Promise<Record<string, string>> => {
  if (encryptedApiKeys.version !== 1 || encryptedApiKeys.algorithm !== "AES-GCM") {
    throw new Error("Unsupported encrypted API key format.");
  }

  const salt = base64ToBytes(encryptedApiKeys.salt);
  const iv = base64ToBytes(encryptedApiKeys.iv);
  const key = await deriveKey(password, salt, encryptedApiKeys.iterations);
  const plaintext = await getSubtleCrypto().decrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    base64ToBytes(encryptedApiKeys.ciphertext)
  );
  const parsed = JSON.parse(textDecoder.decode(plaintext));

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid encrypted API key payload.");
  }

  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string] =>
      typeof entry[0] === "string" && typeof entry[1] === "string"
    )
  );
};

