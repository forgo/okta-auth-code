import { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import jwtDecode from "jwt-decode";
import { DEFAULT_OKTA_REDIRECT_URL, OktaConfig } from "../config/config";
import { getScopes } from "./auth";
import {
  getAuthCodeVerifier,
  getPreviousAuthCode,
  getRefreshToken,
  setPreviousAuthCode,
} from "./storage";

export type OktaTokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token: string;
};

export enum TokenRequestType {
  CODE_EXCHANGE,
  REFRESH,
}

export const shouldExchangeAuthCode = ({
  redirectURL,
}: OktaConfig): boolean => {
  return window.location.pathname === redirectURL;
};

export const isRepeatAuthRequest = (): boolean =>
  getPreviousAuthCode() === getAuthCode();

export const isInvalidAuthRequest = (): boolean =>
  Boolean(new URLSearchParams(window.location.search).get("error"));

export const getAuthCode = (): string | null =>
  new URLSearchParams(window.location.search).get("code");

export const getCodeExchangeTokenSearchParams = (
  { clientId, redirectURL = DEFAULT_OKTA_REDIRECT_URL }: OktaConfig,
  code: string | null
): URLSearchParams | null => {
  const verifier = getAuthCodeVerifier();
  const data = new URLSearchParams();
  if (code && verifier) {
    data.append("grant_type", "authorization_code");
    data.append("client_id", clientId ?? "");
    data.append("redirect_uri", `${window.location.origin}${redirectURL}`);
    data.append("code", code);
    data.append("code_verifier", verifier);
    return data;
  }
  return null;
};

export const getRefreshTokenSearchParams = ({
  clientId,
  scopes,
}: OktaConfig): URLSearchParams | null => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    const data = new URLSearchParams();
    if (refreshToken) {
      data.append("grant_type", "refresh_token");
      data.append("client_id", clientId);
      data.append("refresh_token", refreshToken);
      data.append("scope", getScopes(scopes));
      return data;
    }
  }
  return null;
};

export const requestCodeExchangeToken = (
  okta: OktaConfig,
  axiosOktaInstance: AxiosInstance
): AxiosPromise<OktaTokenResponse> => {
  const code = getAuthCode();
  setPreviousAuthCode(code);

  const data = getCodeExchangeTokenSearchParams(okta, code)?.toString();

  const options: AxiosRequestConfig = {
    baseURL: okta.baseURL,
    url: okta.tokenURL,
    method: "post",
    data,
  };
  return axiosOktaInstance.request(options);
};

export const requestRefreshToken = (
  okta: OktaConfig,
  axiosOktaInstance: AxiosInstance
): AxiosPromise<OktaTokenResponse> => {
  const data = getRefreshTokenSearchParams(okta)?.toString();

  const options: AxiosRequestConfig = {
    baseURL: okta.baseURL,
    url: okta.tokenURL,
    method: "post",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  return axiosOktaInstance.request(options);
};

export const requestToken = (
  type: TokenRequestType,
  okta: OktaConfig,
  axiosOktaInstance: AxiosInstance
): AxiosPromise<OktaTokenResponse> => {
  switch (type) {
    case TokenRequestType.CODE_EXCHANGE:
      return requestCodeExchangeToken(okta, axiosOktaInstance);
    case TokenRequestType.REFRESH:
      return requestRefreshToken(okta, axiosOktaInstance);
  }
};

export const getJwt = <T>(idToken: string | null): T | undefined => {
  try {
    return idToken ? jwtDecode<T>(idToken) : undefined;
  } catch (error) {
    return undefined;
  }
};
