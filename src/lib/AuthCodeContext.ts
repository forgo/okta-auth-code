export type AuthCodeContextState<JWT, User = unknown> = {
  isLoggedIn: boolean;
  user?: JWT | User;
  logout: () => void;
};
