import { User, CreateUserData, UpdateUserData } from '../models/User';

export interface IUserRepository {
  create(userData: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, updateData: UpdateUserData): Promise<User | null>;
  verify(id: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  findClients(): Promise<User[]>;
  findAdmins(): Promise<User[]>;
  delete(id: string): Promise<boolean>;
}
