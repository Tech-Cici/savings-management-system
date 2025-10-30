import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { SessionService } from '../services/sessionService';
import { generateToken } from '../utils/jwt';
import { validateEmail, validatePassword, validateDeviceId } from '../utils/validation';
import { asyncHandler, createError } from '../middlewares/error';
import { LoginDto, RegisterDto, AuthResponseDto, UserResponseDto } from '../dtos/auth.dto';
import { OtpRepository } from '../repositories/OtpRepository';
import { sendEmail, buildRegistrationPendingEmail, buildLoginOtpEmail } from '../utils/email';

export class AuthController {
  private userService: UserService;
  private sessionService: SessionService;
  private otpRepository: OtpRepository;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
    this.otpRepository = new OtpRepository();
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
    const { email, password, deviceId, otp }: LoginDto & { otp?: string } = req.body as any;

    // Validate input
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    if (!validateEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    // deviceId no longer required; ignore if provided

    // Authenticate user
    const user = await this.userService.validatePassword(email, password);
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Require admin verification before login
    if (!user.isVerified) {
      throw createError('Your account is pending admin verification', 403);
    }

    // Device ID is not stored anymore

    // Require OTP for client login only if there is an active LOGIN_OTP
    if (user.role === 'client') {
      const activeLoginOtp = await this.otpRepository.findAnyActiveByType(user.id, 'LOGIN_OTP');
      if (activeLoginOtp) {
        if (!otp) {
          throw createError('OTP code is required for login', 400);
        }
        const loginRecord = await this.otpRepository.findValid(user.id, otp, 'LOGIN_OTP');
        if (!loginRecord) {
          throw createError('Invalid or expired OTP code', 400);
        }
        await this.otpRepository.markUsed(loginRecord.id);
      }
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

    // Do not send any OTP or email on registration. Admin will trigger OTP upon verification.

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
    }, undefined);

    const response: AuthResponseDto = {
      user: this.formatUserResponse(user),
      token
    };

    // Set session ID in response header
    res.set('X-Session-ID', sessionId);
    res.status(201).json(response);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body as { email: string; code: string };
    if (!email || !code) {
      throw createError('Email and code are required', 400);
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw createError('User not found', 404);
    }

    const record = await this.otpRepository.findValid(user.id, code, 'EMAIL_VERIFICATION');
    if (!record) {
      throw createError('Invalid or expired code', 400);
    }

    await this.otpRepository.markUsed(record.id);
    await this.userService.updateUser(user.id, { emailVerified: true });

    res.json({ message: 'Email verified successfully' });
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

  resendLoginOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    if (!email || !validateEmail(email)) {
      throw createError('Valid email is required', 400);
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw createError('User not found', 404);
    }
    if (user.role !== 'client') {
      throw createError('OTP only applies to client accounts', 400);
    }
    if (!user.isVerified) {
      throw createError('Account pending admin verification', 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.otpRepository.create(user.id, otp, 'LOGIN_OTP', expiresAt);

    const emailTpl = buildLoginOtpEmail(user.name, otp);
    try {
      await sendEmail(user.email, emailTpl.subject, emailTpl.html);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[dev] Unable to send login OTP. OTP for ${user.email}: ${otp}`);
      }
    }

    res.json({ message: 'OTP resent if eligible' });
  });
}
