import { User, CreateUserData, UpdateUserData } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { validateEmail, validatePassword } from '../utils/validation';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  private userRepository: IUserRepository;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }
  async createUser(userData: CreateUserData): Promise<User> {
    // Validate email
    if (!validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    return this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, updateData: UpdateUserData): Promise<User | null> {
    return this.userRepository.update(id, updateData);
  }

  async verifyUser(id: string): Promise<User | null> {
    return this.userRepository.verify(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    // For clients, require admin verification
    if (user.role === 'client' && !user.isVerified) {
      throw new Error('Account not verified. Please wait for admin verification.');
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getClients(): Promise<User[]> {
    return this.userRepository.findClients();
  }

  async getAdmins(): Promise<User[]> {
    return this.userRepository.findAdmins();
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
