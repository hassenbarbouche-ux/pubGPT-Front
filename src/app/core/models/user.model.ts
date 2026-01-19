export interface User {
  id: number;
  login: string;
  isActive: boolean;
  dateCreation: Date;
  dateModification: Date;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string; // Pour une future implémentation JWT si nécessaire
}
