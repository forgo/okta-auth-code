import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { getOnAuthError } from "../auth/auth";
import { getAccessToken } from "../auth/storage";
import { OktaConfig } from "../config/config";

export const HEADER_AUTHORIZATION = "Authorization";

export type ApiConfig = {
  baseURL?: string;
};

export type ApiFactory = ({ baseURL }: ApiConfig) => AxiosInstance;

const onRequest = (config: AxiosRequestConfig): AxiosRequestConfig => {
  // add auth header for secured requests
  const accessToken = getAccessToken();

  // FIXME: https://github.com/axios/axios/issues/5034
  config.headers = config.headers ?? {};
  (config.headers as AxiosHeaders).set(
    HEADER_AUTHORIZATION,
    `Bearer ${accessToken}`
  );
  return config;
};

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
  return Promise.reject(error);
};

const onResponse = (response: AxiosResponse): AxiosResponse => {
  return response;
};

const getOnResponseError =
  (
    okta: OktaConfig,
    axiosOktaInstance: AxiosInstance,
    axiosApiInstance: AxiosInstance
  ) =>
  (error: AxiosError): Promise<AxiosError> => {
    // handle non-401 errors as usual
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // otherwise handle auth refresh & queue pending requests
    return getOnAuthError(okta, axiosOktaInstance, axiosApiInstance)(error);
  };

export const getCreateApi =
  (okta: OktaConfig, axiosOktaInstance: AxiosInstance): ApiFactory =>
  ({ baseURL }) => {
    // create API axios instance with baseURL
    const axiosApiInstance = axios.create({
      baseURL,
    });

    // intercept requests and responses before handled by `then` or `catch`
    // see: https://axios-http.com/docs/interceptors
    const onResponseError = getOnResponseError(
      okta,
      axiosOktaInstance, // for Okta token refresh
      axiosApiInstance // for retrying API request
    );
    axiosApiInstance.interceptors.request.use(onRequest, onRequestError);
    axiosApiInstance.interceptors.response.use(onResponse, onResponseError);

    return axiosApiInstance;
  };
