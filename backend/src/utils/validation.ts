export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
};

export const validateDeviceId = (deviceId: string): boolean => {
  // Basic device ID validation - can be enhanced based on requirements
  return deviceId.length >= 8 && deviceId.length <= 50;
};

export const validateAmount = (amount: number): { isValid: boolean; message?: string } => {
  if (amount <= 0) {
    return { isValid: false, message: 'Amount must be greater than 0' };
  }
  if (amount > 1000000) {
    return { isValid: false, message: 'Amount cannot exceed $1,000,000' };
  }
  return { isValid: true };
};
