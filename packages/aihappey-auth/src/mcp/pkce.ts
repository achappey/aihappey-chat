// src/auth/pkce.ts

/**
 * Generates a cryptographically random string for the PKCE code verifier.
 * @param length The length of the random string.
 * @returns A random string.
 */
const generateRandomString = (length: number): string => {
  const array = new Uint32Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ('0' + dec.toString(16)).slice(-2))
    .join('')
    .slice(0, length);
};

/**
 * Generates a PKCE code challenge from a code verifier.
 * Uses SHA-256 hashing and base64url encoding.
 * @param codeVerifier The code verifier string.
 * @returns A Promise that resolves to the code challenge string.
 */
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to string then to base64 (btoa expects a string of binary characters)
  const binaryString = String.fromCharCode(...new Uint8Array(digest));
  
  // Base64url encode
  return btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Generates a PKCE code verifier and its corresponding code challenge.
 * @returns A Promise that resolves to an object containing the code_verifier and code_challenge.
 */
export const createPkceChallenge = async (): Promise<{ code_verifier: string; code_challenge: string }> => {
  // OAuth 2.0 spec recommends a verifier length between 43 and 128 characters.
  const codeVerifier = generateRandomString(128); 
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { code_verifier: codeVerifier, code_challenge: codeChallenge };
};
