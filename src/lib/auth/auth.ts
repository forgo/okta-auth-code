import { AxiosError, AxiosHeaders, AxiosInstance } from "axios";
import { HEADER_AUTHORIZATION } from "../apis/apis";
import { OktaConfig } from "../config/config";
import { generateAuthCodeProofKey } from "./crypto";
import {
  clearAuthCodeStorage,
  getRefreshToken,
  reviveRoutePostAuth,
  setAuthCodeVerifier,
  setTokensStorage,
} from "./storage";
import { OktaTokenResponse, requestToken, TokenRequestType } from "./tokens";

let _refreshToken = "";
let _authorizing: Promise<void> | null = null;

{
  // hydrate access and refresh tokens from session storage, if they exist
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    // init refreshToken
    _refreshToken = refreshToken;
  }
}

export const getScopes = (scopes?: string): string => {
  return (scopes ?? "").trim();
};

export const getScopesEncoded = (scopes?: string): string => {
  return getScopes(scopes).split(" ").join("%20");
};

export const login = (tokenResponse: OktaTokenResponse) => {
  // update global refresh token to new refresh token
  _refreshToken = tokenResponse.refresh_token;

  // put tokens in session storage
  setTokensStorage(tokenResponse);
};

const postLoginRedirect = () => {
  const postLoginPath = reviveRoutePostAuth();
  window.location.replace(`${window.location.origin}${postLoginPath}`);
};

export const oktaAuthorize = ({
  clientId,
  baseURL,
  authorizeURL,
  redirectURL,
  scopes,
}: OktaConfig): void => {
  const { authCodeVerifier, authCodeChallenge } = generateAuthCodeProofKey();
  setAuthCodeVerifier(authCodeVerifier);
  const state = "_state";

  window.location.replace(
    `${baseURL}${authorizeURL}?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=${getScopesEncoded(scopes)}&` +
      `redirect_uri=${window.location.origin}${redirectURL}&` +
      `code_challenge=${authCodeChallenge}&` +
      `code_challenge_method=S256&` +
      `state=${state}`
  );
};

export const oktaLogout = (
  { baseURL, logoutURL }: OktaConfig,
  idTokenHint: string | null
) => {
  if (idTokenHint) {
    // let okta know we did have an id token and are logging out naturally
    window.location.replace(
      `${baseURL}${logoutURL}?` +
        `id_token_hint=${idTokenHint}&` +
        `post_logout_redirect_uri=${window.location.origin}`
    );
  } else {
    // remove Okta cookie to prevent an infinite login loop for users w/o access
    window.location.replace(
      `${baseURL}/login/signout?fromURI=${window.location.origin}`
    );
  }
};

export const logout = (okta: OktaConfig) => {
  const idTokenHint = clearAuthCodeStorage();
  _refreshToken = "";
  oktaLogout(okta, idTokenHint);
};

export const exchangeAuthCode = async (
  okta: OktaConfig,
  axiosOktaInstance: AxiosInstance
) => {
  try {
    const { data: tokenResponse } = await requestToken(
      TokenRequestType.CODE_EXCHANGE,
      okta,
      axiosOktaInstance
    );
    login(tokenResponse);
    postLoginRedirect();
  } catch (e) {
    logout(okta);
  }
};

const refreshAuthToken = async (
  okta: OktaConfig,
  axiosOktaInstance: AxiosInstance
) => {
  try {
    const { data: tokenResponse } = await requestToken(
      TokenRequestType.REFRESH,
      okta,
      axiosOktaInstance
    );
    login(tokenResponse);
  } catch (e) {
    logout(okta);
  }
};

// handle 401 and refresh token attempts
export const getOnAuthError =
  (
    okta: OktaConfig,
    axiosOktaInstance: AxiosInstance,
    axiosApiInstance: AxiosInstance
  ) =>
  (error: AxiosError): Promise<AxiosError> => {
    // create pending authorization
    _authorizing ??= refreshAuthToken(okta, axiosOktaInstance)
      .finally(() => (_authorizing = null))
      .catch((error) => Promise.reject(error));

    // strip out obsolete access token so it can be refreshed
    const originalConfig = error.config ?? {};

    // FIXME: https://github.com/axios/axios/issues/5034
    originalConfig.headers = originalConfig.headers ?? {};
    (originalConfig.headers as AxiosHeaders).delete(HEADER_AUTHORIZATION);

    // delay original requests until authorization has been completed
    return _authorizing.then(() => axiosApiInstance.request(originalConfig!));
  };
