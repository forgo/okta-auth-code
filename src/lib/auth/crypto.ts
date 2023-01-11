import { random } from "nanoid";
import { createHash } from "sha256-uint8array";
import { bytesToBase64 } from "./base64";

export type AuthCodeProofKey = {
  authCodeVerifier: string;
  authCodeChallenge: string;
};

// properly encode verifier & challenge to be sent to auth provider
const base64UrlSafeEncode = (bytes: Uint8Array) => {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// hash for auth provider to validate verifier & challenge for token access
export const sha256 = (input: string): Uint8Array => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return createHash().update(data).digest();
};

// cryptographically random code verifier for requesting tokens
const generateAuthCodeVerifier = (): string => base64UrlSafeEncode(random(32));

// derived from code verifier and used to request authorization code from login
const generateAuthCodeChallenge = (codeVerifier: string): string =>
  base64UrlSafeEncode(sha256(codeVerifier));

// helper to create verifier & challenge together
export const generateAuthCodeProofKey = (): AuthCodeProofKey => {
  const authCodeVerifier = generateAuthCodeVerifier();
  const authCodeChallenge = generateAuthCodeChallenge(authCodeVerifier);
  return {
    authCodeVerifier,
    authCodeChallenge,
  };
};
