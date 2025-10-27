export interface CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  deviceId: string;
  balance: number;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UpdateDeviceDto {
  deviceId: string;
}
