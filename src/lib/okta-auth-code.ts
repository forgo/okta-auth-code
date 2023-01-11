import axios from "axios";
import { createContext, useContext } from "react";
import { getCreateApi } from "./apis/apis";
import { AuthCodeContextState } from "./AuthCodeContext";
import { createAuthCodeProvider } from "./AuthCodeProvider";
import {
  AuthCodeConfig,
  DEFAULT_OKTA_AUTHORIZE_URL,
  DEFAULT_OKTA_LOGOUT_URL,
  DEFAULT_OKTA_REDIRECT_URL,
  DEFAULT_OKTA_TOKEN_URL,
} from "./config/config";

export function createAuthCode<JWT, User = unknown>(
  config: AuthCodeConfig<JWT, User>
) {
  // provide defaults for okta endpoints to be more off-the-shelf
  config.okta = {
    authorizeURL: DEFAULT_OKTA_AUTHORIZE_URL,
    tokenURL: DEFAULT_OKTA_TOKEN_URL,
    redirectURL: DEFAULT_OKTA_REDIRECT_URL,
    logoutURL: DEFAULT_OKTA_LOGOUT_URL,
    ...config.okta,
  };

  // axios instance for okta actions (no request/response interceptors)
  const axiosOktaInstance = axios.create();

  // initialize context values
  const AuthCodeContext = createContext<AuthCodeContextState<JWT, User>>({
    isLoggedIn: false,
    jwt: undefined,
    user: undefined,
    logout: (): void => undefined,
  });

  // hassle-free factory to create axios instance that simply works
  // - every request is intercepted to add latest access token in `Authorization` header
  // - every response is intercepted for 401 status to refresh/retry
  const createApi = getCreateApi(config.okta, axiosOktaInstance);

  // wrap your app in this to enable authorization code flow
  const AuthCodeProvider = createAuthCodeProvider(
    AuthCodeContext,
    axiosOktaInstance,
    config,
    createApi
  );

  // provide convenience hook to extract auth state and actions
  const useAuth = () => useContext(AuthCodeContext);

  return {
    AuthCodeContext,
    AuthCodeProvider,
    createApi,
    useAuth,
  };
}
