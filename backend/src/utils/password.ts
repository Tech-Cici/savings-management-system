import crypto from 'crypto';

const SALT_LENGTH = 32; // 256 bits
const HASH_ALGORITHM = 'sha512';
const ITERATIONS = 100000; // PBKDF2 iterations

export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Use PBKDF2 with SHA-512 for key derivation
    crypto.pbkdf2(password, salt, ITERATIONS, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Combine salt and hash for storage
      const combined = Buffer.concat([salt, derivedKey]);
      resolve(combined.toString('hex'));
    });
  });
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Convert hex string back to buffer
      const combined = Buffer.from(hashedPassword, 'hex');
      
      // Extract salt (first 32 bytes) and hash (remaining bytes)
      const salt = combined.slice(0, SALT_LENGTH);
      const storedHash = combined.slice(SALT_LENGTH);
      
      // Hash the provided password with the same salt
      crypto.pbkdf2(password, salt, ITERATIONS, 64, HASH_ALGORITHM, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Compare hashes using timing-safe comparison
        const isValid = crypto.timingSafeEqual(storedHash, derivedKey);
        resolve(isValid);
      });
    } catch (error) {
      reject(error);
    }
  });
};
