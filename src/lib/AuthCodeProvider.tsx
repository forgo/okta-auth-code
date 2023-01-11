import { AxiosInstance } from "axios";
import { Context, ReactNode, useEffect, useState } from "react";
import { useSessionStorage } from "usehooks-ts";
import { ApiFactory } from "./apis/apis";
import { exchangeAuthCode, logout, oktaAuthorize } from "./auth/auth";
import { KEY_TOKENS, storeRoutePreAuth } from "./auth/storage";
import {
  getJwt,
  isInvalidAuthRequest,
  isRepeatAuthRequest,
  shouldExchangeAuthCode,
} from "./auth/tokens";
import { AuthCodeContextState } from "./AuthCodeContext";
import { AuthCodeConfig } from "./config/config";

export type AuthCodeProviderProps<JWT, User = unknown> = {
  children: ReactNode;
  spinner?: ReactNode;
  disabled?: boolean;
};

export const createAuthCodeProvider =
  <JWT, User = unknown>(
    AuthCodeContext: Context<AuthCodeContextState<JWT, User>>,
    axiosOktaInstance: AxiosInstance,
    config: AuthCodeConfig<JWT, User>,
    createApi: ApiFactory
  ) =>
  ({
    children,
    spinner,
    disabled = false,
  }: AuthCodeProviderProps<JWT, User>): JSX.Element => {
    const { okta, getUser } = config;

    const [state, setState] = useState<{ jwt?: JWT; user?: User }>({
      jwt: undefined,
      user: undefined,
    });

    // subscribe to session storage changes so we can pick up any token updates
    const [authTokens] = useSessionStorage(KEY_TOKENS, {
      accessToken: "",
      refreshToken: "",
      idToken: "",
    });

    const { accessToken, idToken } = authTokens;

    const isLoggedIn = Boolean(accessToken);

    if (!accessToken && !disabled) {
      const shouldExchange = shouldExchangeAuthCode(okta);
      const isRepeat = isRepeatAuthRequest();
      const isInvalid = isInvalidAuthRequest();
      if (isInvalid) {
        logout(okta);
      }
      if (shouldExchange && !isRepeat) {
        void exchangeAuthCode(okta, axiosOktaInstance);
      }
      if (!shouldExchange) {
        storeRoutePreAuth();
        setTimeout(() => oktaAuthorize(okta), 100);
      }
    }

    useEffect(() => {
      const fetchUser = async () => {
        const jwt = getJwt<JWT>(idToken);
        if (getUser) {
          const userUpdated = await getUser?.({
            createApi,
            jwt,
          });
          setState({
            jwt,
            user: userUpdated,
          });
        } else {
          setState({
            jwt,
            user: undefined,
          });
        }
      };
      fetchUser();
    }, [idToken, createApi]);

    if (disabled) {
      return <>{children}</>;
    }

    if (isLoggedIn) {
      return (
        <AuthCodeContext.Provider
          value={{
            jwt: state.jwt,
            user: state.user,
            isLoggedIn,
            logout: () => logout(okta),
          }}
        >
          {children}
        </AuthCodeContext.Provider>
      );
    } else {
      return <>{spinner ?? "Loading..."}</>;
    }
  };
