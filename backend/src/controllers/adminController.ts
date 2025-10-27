import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { TransactionService } from '../services/transactionService';
import { asyncHandler, createError } from '../middlewares/error';
import { CustomerResponseDto, TransactionResponseDto, TransactionWithUserResponseDto, DashboardStatsDto } from '../dtos/transaction.dto';

export class AdminController {
  private userService: UserService;
  private transactionService: TransactionService;

  constructor() {
    this.userService = new UserService();
    this.transactionService = new TransactionService();
  }

  private formatCustomerResponse(user: any): CustomerResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      deviceId: user.deviceId || '',
      balance: user.balance || 0,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    };
  }

  private formatTransactionResponse(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString()
    };
  }

  getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const clients = await this.userService.getClients();
    const customers: CustomerResponseDto[] = clients.map(client => this.formatCustomerResponse(client));
    
    res.json(customers);
  });

  getCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await this.userService.getUserById(id);
    
    if (!customer || customer.role !== 'client') {
      throw createError('Customer not found', 404);
    }

    res.json(this.formatCustomerResponse(customer));
  });

  verifyCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await this.userService.verifyUser(id);
    
    if (!customer) {
      throw createError('Customer not found', 404);
    }

    res.json({ message: 'Customer verified successfully' });
  });

  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const transactions = await this.transactionService.getAllTransactions();
    const formattedTransactions: TransactionWithUserResponseDto[] = transactions.map(t => this.formatTransactionWithUserResponse(t));
    
    res.json(formattedTransactions);
  });

  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const clients = await this.userService.getClients();
    const transactionStats = await this.transactionService.getDashboardStats();
    
    const stats: DashboardStatsDto = {
      totalCustomers: clients.length,
      totalTransactions: transactionStats.totalTransactions,
      totalDeposits: transactionStats.totalDeposits,
      totalWithdrawals: transactionStats.totalWithdrawals,
      pendingVerifications: clients.filter(c => !c.isVerified).length,
      lowBalanceCustomers: clients.filter(c => (c.balance || 0) < 100).length
    };

    res.json(stats);
  });

  private formatCustomerResponse(user: any): CustomerResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      deviceId: user.deviceId,
      balance: user.balance || 0,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    };
  }

  private formatTransactionResponse(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString()
    };
  }

  private formatTransactionWithUserResponse(transaction: any): TransactionWithUserResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
      user: {
        id: transaction.user.id,
        name: transaction.user.name,
        email: transaction.user.email,
        role: transaction.user.role
      }
    };
  }
}
