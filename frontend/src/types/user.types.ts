export interface WalletDto {
  credits: number;
  lockedCredits: number;
  availableCredits: number;
}

export interface WalletTransactionDto {
  id: string;
  type: string;
  amountCredits: number;
  status: string;
  createdAt: string;
}

export interface DepositResponse {
  success: boolean;
  transactionId: string;
  creditsToReceive: number;
  moonPayUrl: string | null;
  message: string | null;
}
