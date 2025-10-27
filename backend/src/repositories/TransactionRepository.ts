import { prisma } from '../utils/database';
import { ITransactionRepository } from './ITransactionRepository';
import { Transaction, CreateTransactionData, UpdateTransactionData, TransactionWithUser } from '../models/Transaction';

export class TransactionRepository implements ITransactionRepository {
  async create(transactionData: CreateTransactionData): Promise<Transaction> {
    const transaction = await prisma.transaction.create({
      data: {
        userId: transactionData.userId,
        type: transactionData.type.toUpperCase() as 'DEPOSIT' | 'WITHDRAWAL',
        amount: transactionData.amount,
        description: transactionData.description,
        status: 'PENDING',
      },
    });

    return this.mapPrismaTransactionToTransaction(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    return transaction ? this.mapPrismaTransactionToTransaction(transaction) : null;
  }

  async update(id: string, updateData: UpdateTransactionData): Promise<Transaction | null> {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        status: updateData.status?.toUpperCase() as 'PENDING' | 'COMPLETED' | 'FAILED',
        updatedAt: new Date(),
      },
    });

    return this.mapPrismaTransactionToTransaction(transaction);
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(transaction => this.mapPrismaTransactionToTransaction(transaction));
  }

  async findAll(): Promise<TransactionWithUser[]> {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(transaction => this.mapPrismaTransactionToTransactionWithUser(transaction));
  }

  async findByStatus(status: 'pending' | 'completed' | 'failed'): Promise<TransactionWithUser[]> {
    const transactions = await prisma.transaction.findMany({
      where: { status: status.toUpperCase() as 'PENDING' | 'COMPLETED' | 'FAILED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(transaction => this.mapPrismaTransactionToTransactionWithUser(transaction));
  }

  async findByType(type: 'deposit' | 'withdrawal'): Promise<TransactionWithUser[]> {
    const transactions = await prisma.transaction.findMany({
      where: { type: type.toUpperCase() as 'DEPOSIT' | 'WITHDRAWAL' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(transaction => this.mapPrismaTransactionToTransactionWithUser(transaction));
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.transaction.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingTransactions: number;
  }> {
    const [
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      pendingTransactions
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { 
          type: 'DEPOSIT',
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { 
          type: 'WITHDRAWAL',
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.transaction.count({
        where: { status: 'PENDING' }
      })
    ]);

    return {
      totalTransactions,
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      pendingTransactions
    };
  }

  private mapPrismaTransactionToTransaction(prismaTransaction: any): Transaction {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      type: prismaTransaction.type.toLowerCase() as 'deposit' | 'withdrawal',
      amount: Number(prismaTransaction.amount),
      status: prismaTransaction.status.toLowerCase() as 'pending' | 'completed' | 'failed',
      description: prismaTransaction.description,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    };
  }

  private mapPrismaTransactionToTransactionWithUser(prismaTransaction: any): TransactionWithUser {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      type: prismaTransaction.type.toLowerCase() as 'deposit' | 'withdrawal',
      amount: Number(prismaTransaction.amount),
      status: prismaTransaction.status.toLowerCase() as 'pending' | 'completed' | 'failed',
      description: prismaTransaction.description,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
      user: {
        id: prismaTransaction.user.id,
        name: prismaTransaction.user.name,
        email: prismaTransaction.user.email,
        role: prismaTransaction.user.role.toLowerCase(),
      },
    };
  }
}
