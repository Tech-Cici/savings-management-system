import { prisma } from '../utils/database';
import { OtpType } from '@prisma/client';

export class OtpRepository {
  async create(userId: string, code: string, type: 'LOGIN_OTP' | 'EMAIL_VERIFICATION', expiresAt: Date) {
    const typeValue: OtpType = type === 'LOGIN_OTP' ? OtpType.LOGIN_OTP : OtpType.EMAIL_VERIFICATION;
    return prisma.otpCode.create({
      data: { userId, code, type: typeValue, expiresAt },
    });
  }

  async findValid(userId: string, code: string, type: 'LOGIN_OTP' | 'EMAIL_VERIFICATION') {
    const typeValue: OtpType = type === 'LOGIN_OTP' ? OtpType.LOGIN_OTP : OtpType.EMAIL_VERIFICATION;
    const now = new Date();
    return prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        type: typeValue,
        usedAt: null,
        expiresAt: { gt: now },
      },
    });
  }

  async findAnyActiveByType(userId: string, type: 'LOGIN_OTP' | 'EMAIL_VERIFICATION') {
    const now = new Date();
    const typeValue: OtpType = type === 'LOGIN_OTP' ? OtpType.LOGIN_OTP : OtpType.EMAIL_VERIFICATION;
    return prisma.otpCode.findFirst({
      where: {
        userId,
        type: typeValue,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markUsed(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}


