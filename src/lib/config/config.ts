import { ApiFactory } from "../apis/apis";

export const DEFAULT_OKTA_AUTHORIZE_URL = "/oauth2/default/v1/authorize";
export const DEFAULT_OKTA_TOKEN_URL = "/oauth2/default/v1/token";
export const DEFAULT_OKTA_REDIRECT_URL = "/callback";
export const DEFAULT_OKTA_LOGOUT_URL = "/oauth2/default/v1/logout";

export type OktaConfig = {
  clientId: string;
  baseURL: string;
  authorizeURL?: string;
  tokenURL?: string;
  redirectURL?: string;
  logoutURL?: string;
  scopes?: string;
};

export type GetUserParams<JWT> = {
  createApi: ApiFactory;
  jwt?: JWT;
};

export type GetUser<JWT, User = unknown> = ({
  createApi,
  jwt,
}: GetUserParams<JWT>) => Promise<User | undefined>;

export type AuthCodeConfig<JWT, User = unknown> = {
  okta: OktaConfig;
  getUser?: GetUser<JWT, User>;
};
