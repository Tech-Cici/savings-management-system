export interface LoginDto {
  email: string;
  password: string;
  deviceId?: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  deviceId: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'client';
    deviceId?: string;
    balance?: number;
    isVerified?: boolean;
  };
  token: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  deviceId?: string;
  balance?: number;
  isVerified?: boolean;
  createdAt: string;
  lastLogin?: string;
}
