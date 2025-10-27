import { prisma } from '../utils/database';
import { IUserRepository } from './IUserRepository';
import { User, CreateUserData, UpdateUserData } from '../models/User';

export class UserRepository implements IUserRepository {
  async create(userData: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role.toUpperCase() as 'ADMIN' | 'CLIENT',
        deviceId: userData.deviceId,
        balance: userData.role === 'client' ? 0 : undefined,
        isVerified: userData.role === 'admin' ? true : false,
      },
    });

    return this.mapPrismaUserToUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return this.mapPrismaUserToUser(user);
  }

  async verify(id: string): Promise<User | null> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        updatedAt: new Date(),
      },
    });

    return this.mapPrismaUserToUser(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapPrismaUserToUser(user));
  }

  async findClients(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapPrismaUserToUser(user));
  }

  async findAdmins(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapPrismaUserToUser(user));
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      password: prismaUser.password,
      role: prismaUser.role.toLowerCase() as 'admin' | 'client',
      deviceId: prismaUser.deviceId,
      balance: prismaUser.balance ? Number(prismaUser.balance) : undefined,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      lastLogin: prismaUser.lastLogin,
    };
  }
}
