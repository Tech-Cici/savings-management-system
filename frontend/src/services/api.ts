// API service for SMS application
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  deviceId: string;
  balance: number;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  lowBalanceCustomers: number;
}

class ApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Admin APIs
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/api/admin/customers');
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/api/admin/customers/${id}`);
  }

  async verifyCustomer(id: string): Promise<void> {
    return this.request<void>(`/api/admin/customers/${id}/verify`, {
      method: 'POST',
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/api/admin/transactions');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/admin/dashboard/stats');
  }

  // Client APIs
  async getClientTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/api/client/transactions');
  }

  async getClientBalance(): Promise<{ balance: number }> {
    return this.request<{ balance: number }>('/api/client/balance');
  }

  async deposit(amount: number, description?: string): Promise<Transaction> {
    return this.request<Transaction>('/api/client/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async withdraw(amount: number, description?: string): Promise<Transaction> {
    return this.request<Transaction>('/api/client/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async updateDeviceId(deviceId: string): Promise<void> {
    return this.request<void>('/api/client/device', {
      method: 'PUT',
      body: JSON.stringify({ deviceId }),
    });
  }
}

export const apiService = new ApiService();

