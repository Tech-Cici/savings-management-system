import { Transaction, CreateTransactionData, UpdateTransactionData, TransactionWithUser } from '../models/Transaction';
import { UserService } from './userService';
import { validateAmount } from '../utils/validation';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

export class TransactionService {
  private userService: UserService;
  private transactionRepository: ITransactionRepository;

  constructor(userService?: UserService, transactionRepository?: ITransactionRepository) {
    this.userService = userService || new UserService();
    this.transactionRepository = transactionRepository || new TransactionRepository();
  }

  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    // Validate amount
    const amountValidation = validateAmount(transactionData.amount);
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.message);
    }

    // Check if user exists
    const user = await this.userService.getUserById(transactionData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // For withdrawals, check if user has sufficient balance
    if (transactionData.type === 'withdrawal') {
      if (!user.balance || user.balance < transactionData.amount) {
        // Create a failed transaction to log the attempt and reason
        const failed = await this.transactionRepository.create(transactionData);
        await this.updateTransaction(failed.id, { status: 'failed', description: 'Insufficient balance' });
        throw new Error('Insufficient balance');
      }
    }

    // Create transaction
    const transaction = await this.transactionRepository.create(transactionData);

    // Process transaction
    await this.processTransaction(transaction);

    return transaction;
  }

  async processTransaction(transaction: Transaction): Promise<void> {
    try {
      const user = await this.userService.getUserById(transaction.userId);
      if (!user) {
        throw new Error('User not found');
      }

      let newBalance = user.balance || 0;

      if (transaction.type === 'deposit') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        newBalance -= transaction.amount;
      }

      // Update user balance
      await this.userService.updateUser(transaction.userId, { balance: newBalance });

      // Update transaction status
      await this.updateTransaction(transaction.id, { status: 'completed' });

    } catch (error) {
      // Mark transaction as failed
      const reason = error instanceof Error ? error.message : 'Processing error';
      await this.updateTransaction(transaction.id, { status: 'failed', description: reason });
      throw error;
    }
  }

  async updateTransaction(id: string, updateData: UpdateTransactionData): Promise<Transaction | null> {
    return this.transactionRepository.update(id, updateData);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findById(id);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId);
  }

  async getAllTransactions(): Promise<TransactionWithUser[]> {
    return this.transactionRepository.findAll();
  }

  async getTransactionsByStatus(status: 'pending' | 'completed' | 'failed'): Promise<TransactionWithUser[]> {
    return this.transactionRepository.findByStatus(status);
  }

  async getTransactionsByType(type: 'deposit' | 'withdrawal'): Promise<TransactionWithUser[]> {
    return this.transactionRepository.findByType(type);
  }

  async getDashboardStats(): Promise<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingTransactions: number;
  }> {
    return this.transactionRepository.getStats();
  }
}
