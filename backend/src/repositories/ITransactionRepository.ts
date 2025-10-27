import { Transaction, CreateTransactionData, UpdateTransactionData, TransactionWithUser } from '../models/Transaction';

export interface ITransactionRepository {
  create(transactionData: CreateTransactionData): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  update(id: string, updateData: UpdateTransactionData): Promise<Transaction | null>;
  findByUserId(userId: string): Promise<Transaction[]>;
  findAll(): Promise<TransactionWithUser[]>;
  findByStatus(status: 'pending' | 'completed' | 'failed'): Promise<TransactionWithUser[]>;
  findByType(type: 'deposit' | 'withdrawal'): Promise<TransactionWithUser[]>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingTransactions: number;
  }>;
}
