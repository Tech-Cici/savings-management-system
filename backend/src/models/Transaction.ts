export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithUser extends Transaction {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateTransactionData {
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description?: string;
}

export interface UpdateTransactionData {
  status?: 'pending' | 'completed' | 'failed';
  description?: string;
}
