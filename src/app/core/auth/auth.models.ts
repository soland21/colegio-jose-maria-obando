export type UserRole = 'profesor' | 'estudiante';

export interface AuthUser {
  id: number;
  documento: string;
  nombre: string;
  rol: UserRole;
  grado: string | null;
}

export interface LoginCredentials {
  documento: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: AuthUser;
}
