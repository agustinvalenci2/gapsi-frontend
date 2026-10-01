export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string | null;
}

export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}
