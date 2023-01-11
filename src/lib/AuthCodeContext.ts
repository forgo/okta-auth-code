export type AuthCodeContextState<JWT, User = unknown> = {
  isLoggedIn: boolean;
  jwt?: JWT;
  user?: User;
  logout: () => void;
};
