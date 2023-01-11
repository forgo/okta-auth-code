import { OktaTokenResponse } from "./tokens";

export enum TokenKey {
  ACCESS_TOKEN = "accessToken",
  REFRESH_TOKEN = "refreshToken",
  ID_TOKEN = "idToken",
}

const NAMESPACE = "@forgo/okta-auth-code";
const TOKENS = "tokens";
const AUTH_CODE_VERIFIER = "authCodeVerifier";
const PREVIOUS_AUTH_CODE = "previousAuthCode";
const REFRESH_RETRIES = "refreshRetries";
const PRE_AUTH_ROUTE = "preAuthRoute";

export const KEY_TOKENS = `${NAMESPACE}::${TOKENS}`;
export const KEY_AUTH_CODE_VERIFIER = `${NAMESPACE}::${AUTH_CODE_VERIFIER}`;
export const KEY_PREVIOUS_AUTH_CODE = `${NAMESPACE}::${PREVIOUS_AUTH_CODE}`;
export const KEY_REFRESH_RETRIES = `${NAMESPACE}::${REFRESH_RETRIES}`;
export const KEY_PRE_AUTH_ROUTE = `${NAMESPACE}::${PRE_AUTH_ROUTE}`;

// tokens
export const setTokensStorage = ({
  access_token,
  refresh_token,
  id_token,
}: OktaTokenResponse) => {
  sessionStorage.setItem(
    KEY_TOKENS,
    JSON.stringify({
      accessToken: access_token,
      refreshToken: refresh_token,
      idToken: id_token,
    })
  );
};

export const getToken = (key: TokenKey): string | null => {
  const str = sessionStorage.getItem(KEY_TOKENS);
  if (str) {
    return (JSON.parse(str) ?? {})?.[key] ?? null;
  }
  return null;
};

export const getAccessToken = () => getToken(TokenKey.ACCESS_TOKEN);
export const getRefreshToken = () => getToken(TokenKey.REFRESH_TOKEN);
export const getIdToken = () => getToken(TokenKey.ID_TOKEN);

export const getAuthCodeVerifier = () =>
  localStorage.getItem(KEY_AUTH_CODE_VERIFIER);

export const setAuthCodeVerifier = (authCodeVerifier: string) =>
  localStorage.setItem(KEY_AUTH_CODE_VERIFIER, authCodeVerifier);

export const getPreviousAuthCode = () =>
  localStorage.getItem(KEY_PREVIOUS_AUTH_CODE);

export const setPreviousAuthCode = (code: string | null) =>
  localStorage.setItem(KEY_PREVIOUS_AUTH_CODE, code ?? "");

export const getRefreshRetries = () =>
  localStorage.getItem(KEY_REFRESH_RETRIES);

// preserve pre-auth route
export const storeRoutePreAuth = () => {
  localStorage.removeItem(KEY_PRE_AUTH_ROUTE);
  if (window.location.pathname !== "/") {
    localStorage.setItem(KEY_PRE_AUTH_ROUTE, window.location.pathname);
  }
};

// revive pre-auth route on post auth
export const reviveRoutePostAuth = (defaultRoute = "/") => {
  const preAuthPath = localStorage.getItem(KEY_PRE_AUTH_ROUTE);
  if (preAuthPath) {
    localStorage.removeItem(KEY_PRE_AUTH_ROUTE);
  }
  return preAuthPath ?? defaultRoute;
};

// clear all storage while returning idTokenHint for logout
export const clearAuthCodeStorage = (): string | null => {
  let idTokenHint = getIdToken();
  sessionStorage.removeItem(KEY_TOKENS);
  localStorage.removeItem(KEY_AUTH_CODE_VERIFIER);
  localStorage.removeItem(KEY_PREVIOUS_AUTH_CODE);
  localStorage.removeItem(KEY_REFRESH_RETRIES);
  localStorage.removeItem(KEY_PRE_AUTH_ROUTE);
  return idTokenHint;
};
