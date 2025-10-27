const crypto = require('crypto');

const SALT_LENGTH = 32;
const HASH_ALGORITHM = 'sha512';
const ITERATIONS = 100000;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    crypto.pbkdf2(password, salt, ITERATIONS, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      const combined = Buffer.concat([salt, derivedKey]);
      resolve(combined.toString('hex'));
    });
  });
}

async function generateAdminPassword() {
  try {
    const hashedPassword = await hashPassword('admin123');
    console.log('Generated SHA-512 hash for admin123:');
    console.log(hashedPassword);
    console.log('\nCopy this hash to replace the admin password in userService.ts');
  } catch (error) {
    console.error('Error generating password hash:', error);
  }
}

generateAdminPassword();
