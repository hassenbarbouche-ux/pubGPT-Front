export interface TokenStats {
  idUser: number;
  totalTokensConsumed: number;
  maxTokensAllowed: number;
  remainingTokens: number;
  usagePercentage: number;
  quotaExceeded: boolean;
}
