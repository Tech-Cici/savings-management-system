import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { SessionService } from '../services/sessionService';
import { generateToken } from '../utils/jwt';
import { validateEmail, validatePassword, validateDeviceId } from '../utils/validation';
import { asyncHandler, createError } from '../middlewares/error';
import { LoginDto, RegisterDto, AuthResponseDto, UserResponseDto } from '../dtos/auth.dto';

export class AuthController {
  private userService: UserService;
  private sessionService: SessionService;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
  }

  private formatUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      deviceId: user.deviceId,
      balance: user.balance,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    };
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, deviceId }: LoginDto = req.body;

    // Validate input
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    if (!validateEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    if (deviceId && !validateDeviceId(deviceId)) {
      throw createError('Invalid device ID format', 400);
    }

    // Authenticate user
    const user = await this.userService.validatePassword(email, password);
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Update device ID if provided
    if (deviceId) {
      await this.userService.updateUser(user.id, { deviceId });
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Create session
    const sessionId = this.sessionService.createSession({
      userId: user.id,
      email: user.email,
      role: user.role
    }, deviceId);

    const response: AuthResponseDto = {
      user: this.formatUserResponse(user),
      token
    };

    // Set session ID in response header
    res.set('X-Session-ID', sessionId);
    res.json(response);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword, deviceId }: RegisterDto = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword || !deviceId) {
      throw createError('All fields are required', 400);
    }

    if (!validateEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw createError(passwordValidation.message!, 400);
    }

    if (password !== confirmPassword) {
      throw createError('Passwords do not match', 400);
    }

    if (!validateDeviceId(deviceId)) {
      throw createError('Invalid device ID format', 400);
    }

    // Create user
    const user = await this.userService.createUser({
      name,
      email,
      password,
      role: 'client',
      deviceId
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Create session
    const sessionId = this.sessionService.createSession({
      userId: user.id,
      email: user.email,
      role: user.role
    }, deviceId);

    const response: AuthResponseDto = {
      user: this.formatUserResponse(user),
      token
    };

    // Set session ID in response header
    res.set('X-Session-ID', sessionId);
    res.status(201).json(response);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      this.sessionService.invalidateSession(sessionId);
    }
    
    res.json({ message: 'Logged out successfully' });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json(this.formatUserResponse(user));
  });
}
