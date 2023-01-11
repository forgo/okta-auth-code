[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

# @forgo/okta-auth-code

Dead-simple TypeScript React Context factory to implement Okta Authorization Code with PKCE flow for your browser app.

## Notes
- This project evolved from me not wanting to perpetually re-invent security.
- My concern is moving past security to the more fun work as quickly as possible.
- I'm not a fan of vendor lock-in, but Okta is pretty ubiquitous.
- This could easily be adapted for non-Okta identity providers who align closely with OAuth specs.
- I am open to PRs which maintain the existing simple interface.

## Installation

`npm install @forgo/okta-auth-code` or `yarn add @forgo/okta-auth-code`

## Usage

### Create Provider, API Factory, and Hook
```typescript
import { createAuthCode } from "@forgo/okta-auth-code";
import env from "./env";

export type JWT = {
  name?: string;
  email?: string;
  exp?: number;
  id?: string;
};

const { AuthCodeProvider, createApi, useAuth } = createAuthCode<JWT>({
  okta: {
    clientId: env.OKTA_CLIENT_ID,
    baseURL: env.OKTA_BASE_URL,
    scopes: env.OKTA_SCOPES,
  },
});

export { 
    AuthCodeProvider,   // React Context Provider
    createApi,          // Axios API Request Factory
    useAuth             // React Context Consumer Hook
};
```

### Optionally Transform JWT to Custom User Type

#### JSON Web Token
- The `jwt` returned from `useAuth` will be the raw decoded JWT token.
- If `JWT` type is unspecified, `jwt` will be typed as `unknown`.

#### Custom User
- The `createApi` factory can help securely request additional user info
- The `user` returned from `useAuth` will be `undefined` by default.
- If `User` type is unspecified, `user` will be typed as `unknown`.
- `getUser` should return `Promise<User | undefined>`

```typescript
export type User = {
    id: string;
    email: string;
    role?: string;
}

const auth = createAuthCode<JWT, User>({
  ...,
  getUser: async ({ jwt, createApi }) => {
    if (jwt) {
      const api = createApi({
        baseURL: "https://elliott.software/api",
      });

      const { data: userInfo } = await api.request({ url: `/user-info/${id}`})

      // should return `User` type or undefined
      return {
        id: jwt?.id,
        email: jwt?.email,
        role: userInfo?.role,
      };
    }
    return undefined;
  },
});
```

### Wrap Browser Application
```typescript
import { createRoot } from "react-dom/client";
import { AuthCodeProvider } from "./app/auth";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <StrictMode>
    <AuthCodeProvider>
      <App />
    </AuthCodeProvider>
  </StrictMode>
);
```

#### AuthCodeProviderProps
| Prop     | Type      | Required | Default      | Description                                         |
| -------- | --------- | -------- | ------------ | --------------------------------------------------- |
| spinner  | ReactNode | false    | "Loading..." | Shown in place of `children` until logged in        |
| disabled | boolean   | false    | false        | If set to `true`, bypass auth and render `children` |

### Consuming Auth Context
```typescript
import { createApi, useAuth } from "./auth";

// intercepts requests with: `Authorization: Bearer <accessToken>`
const api = createApi({
  baseURL: "https://elliott.software/api",
});

export function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <p>Hello, {`${user?.name} (${user?.email})`}</p>
      <br/>
      <button onClick={() => logout()}>Logout</button>
    </>
  );
}

export default App;
```

## Authors
- [@forgo](https://github.com/forgo)

