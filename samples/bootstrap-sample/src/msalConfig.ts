import { Configuration } from "@azure/msal-browser";
declare const __MSAL_CLIENT_ID__: string;
declare const __MSAL_AUTHORITY__: string;
declare const __MSAL_REDIRECT_URI__: string;
declare const __MSAL_SCOPES__: string[];

export const msalConfig: Configuration = {
  auth: {
    clientId: __MSAL_CLIENT_ID__,
    authority: __MSAL_AUTHORITY__,
    redirectUri: __MSAL_REDIRECT_URI__,
  },
  cache: {
    cacheLocation: "localStorage"
  },
};

export const loginRequest = {
  scopes: __MSAL_SCOPES__,
};
