export type AuthSuccessPayload<TUser> = {
  success: boolean;
  data?: {
    user?: TUser;
    token?: string;
  } & Record<string, unknown>;
  error?: {
    message?: string;
  };
  message?: string;
};

export interface AuthApiContract<TUser> {
  login(email: string, password: string, turnstileToken?: string): Promise<AuthSuccessPayload<TUser>>;
  register(
    email: string,
    password: string,
    nickname: string,
    referredBy?: string
  ): Promise<AuthSuccessPayload<TUser>>;
  googleLogin(
    credential: string | { credential?: string; accessToken?: string; idToken?: string }
  ): Promise<AuthSuccessPayload<TUser>>;
  facebookLogin(accessToken: string): Promise<AuthSuccessPayload<TUser>>;
  getMe(token: string): Promise<{ success: boolean; data?: TUser; error?: { message?: string } }>;
}
