export interface TransactionResponseDto {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
}

export interface TransactionWithUserResponseDto extends TransactionResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateTransactionDto {
  amount: number;
  description?: string;
}

export interface BalanceResponseDto {
  balance: number;
}

export interface DashboardStatsDto {
  totalCustomers: number;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  lowBalanceCustomers: number;
}
