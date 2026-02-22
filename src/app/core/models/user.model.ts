export interface User {
  id: number;
  login: string;
  isActive: boolean;
  dateCreation: Date;
  dateModification: Date;
  isDemo?: boolean;
  tokenQuota?: number;
  tokensUsed?: number;
  tokensRemaining?: number;
  demoQuota?: DemoQuota;
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

export interface DemoLoginRequest {
  email: string;
  code: string;
}

export interface DemoLoginResponse {
  valid: boolean;
  name: string;
  email: string;
  remaining_queries: number;
  days_left: number;
  error?: string;
}

export interface DemoQuota {
  remainingQueries: number;
  daysLeft: number;
}
