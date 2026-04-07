export interface AuthSessionStore<TUser> {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  getUser(): TUser | null;
  setUser(user: TUser): void;
  clearUser(): void;
}
