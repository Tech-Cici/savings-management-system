import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { TransactionService } from '../services/transactionService';
import { asyncHandler, createError } from '../middlewares/error';
import { CustomerResponseDto, TransactionResponseDto, TransactionWithUserResponseDto, DashboardStatsDto } from '../dtos/transaction.dto';
import { sendEmail, buildVerifiedWithOtpEmail, buildRejectedEmail } from '../utils/email';
import { OtpRepository } from '../repositories/OtpRepository';

export class AdminController {
  private userService: UserService;
  private transactionService: TransactionService;
  private otpRepository: OtpRepository;

  constructor() {
    this.userService = new UserService();
    this.transactionService = new TransactionService();
    this.otpRepository = new OtpRepository();
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

  rejectCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };
    const customer = await this.userService.getUserById(id);

    if (!customer || customer.role !== 'client') {
      throw createError('Customer not found', 404);
    }

    // Mark as not verified (explicit) and optionally clear deviceId
    await this.userService.updateUser(id, { isVerified: false });

    // Notify user by email
    try {
      const email = buildRejectedEmail(customer.name, reason);
      await sendEmail(customer.email, email.subject, email.html);
    } catch (e) {
      console.error('Failed to send rejection email:', e);
    }

    res.json({ message: 'Customer rejected and notified' });
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

    // Generate login OTP valid for 10 minutes and email combined verification + OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.otpRepository.create(customer.id, otp, 'LOGIN_OTP', expiresAt);
    try {
      const email = buildVerifiedWithOtpEmail(customer.name, otp);
      await sendEmail(customer.email, email.subject, email.html);
    } catch (e) {
      console.error('Failed to send verification email with OTP:', e);
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[dev] Verification+OTP email failed. OTP for ${customer.email}: ${otp}`);
      }
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
