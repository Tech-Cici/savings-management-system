import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { TransactionService } from '../services/transactionService';
import { asyncHandler, createError } from '../middlewares/error';
import { TransactionResponseDto, BalanceResponseDto, CreateTransactionDto, UpdateDeviceDto } from '../dtos/transaction.dto';
import { SessionService } from '../services/sessionService';

export class ClientController {
  private userService: UserService;
  private transactionService: TransactionService;
  private sessionService: SessionService;

  constructor() {
    this.userService = new UserService();
    this.transactionService = new TransactionService();
    this.sessionService = new SessionService();
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

  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const transactions = await this.transactionService.getUserTransactions(userId);
    const formattedTransactions: TransactionResponseDto[] = transactions.map(t => this.formatTransactionResponse(t));
    
    res.json(formattedTransactions);
  });

  getBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    const balance: BalanceResponseDto = {
      balance: user.balance || 0
    };

    res.json(balance);
  });

  deposit = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { amount, description }: CreateTransactionDto = req.body;

    if (!amount || amount <= 0) {
      throw createError('Valid amount is required', 400);
    }

    const transaction = await this.transactionService.createTransaction({
      userId,
      type: 'deposit',
      amount,
      description
    });

    res.status(201).json(this.formatTransactionResponse(transaction));
  });

  withdraw = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { amount, description }: CreateTransactionDto = req.body;

    if (!amount || amount <= 0) {
      throw createError('Valid amount is required', 400);
    }

    const transaction = await this.transactionService.createTransaction({
      userId,
      type: 'withdrawal',
      amount,
      description
    });

    res.status(201).json(this.formatTransactionResponse(transaction));
  });

  updateDeviceId = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { deviceId }: UpdateDeviceDto = req.body;

    if (!deviceId) {
      throw createError('Device ID is required', 400);
    }

    const user = await this.userService.updateUser(userId, { deviceId });
    
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ message: 'Device ID updated successfully' });
  });

  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    // Invalidate all sessions for the user
    this.sessionService.invalidateUserSessions(userId);
    // Delete the user (cascades to transactions and sessions via Prisma schema)
    const ok = await this.userService.deleteUser(userId);
    if (!ok) {
      throw createError('Failed to delete account', 500);
    }
    res.json({ message: 'Account deleted successfully' });
  });
}
