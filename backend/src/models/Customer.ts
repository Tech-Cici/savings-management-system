export interface Customer {
  id: string;
  name: string;
  email: string;
  deviceId: string;
  balance: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  deviceId: string;
  password: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  deviceId?: string;
  balance?: number;
  isVerified?: boolean;
  lastLogin?: Date;
}
