export type UserRole = "superadmin" | "subadmin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  signatureDataUrl?: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
