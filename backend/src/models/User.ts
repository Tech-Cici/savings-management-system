export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  deviceId?: string;
  balance?: number;
  isVerified?: boolean;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  deviceId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  deviceId?: string;
  balance?: number;
  isVerified?: boolean;
  emailVerified?: boolean;
  lastLogin?: Date;
}
