const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

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

async function main() {
  console.log('🚀 Initializing database...');

  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        isVerified: true,
        balance: 0,
      },
    });

    console.log('✅ Admin user created:', admin.email);

    // Create sample client users
    const client1Password = await hashPassword('client123');
    const client2Password = await hashPassword('client456');

    const client1 = await prisma.user.upsert({
      where: { email: 'client1@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'client1@example.com',
        password: client1Password,
        role: 'CLIENT',
        deviceId: 'device-123',
        isVerified: true,
        balance: 1000.00,
      },
    });

    const client2 = await prisma.user.upsert({
      where: { email: 'client2@example.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'client2@example.com',
        password: client2Password,
        role: 'CLIENT',
        deviceId: 'device-456',
        isVerified: false,
        balance: 500.00,
      },
    });

    console.log('✅ Sample clients created:', client1.email, client2.email);

    // Create sample transactions
    const transactions = [
      {
        userId: client1.id,
        type: 'DEPOSIT',
        amount: 1000.00,
        status: 'COMPLETED',
        description: 'Initial deposit',
      },
      {
        userId: client1.id,
        type: 'WITHDRAWAL',
        amount: 200.00,
        status: 'COMPLETED',
        description: 'ATM withdrawal',
      },
      {
        userId: client2.id,
        type: 'DEPOSIT',
        amount: 500.00,
        status: 'COMPLETED',
        description: 'Bank transfer',
      },
    ];

    for (const transactionData of transactions) {
      await prisma.transaction.create({
        data: transactionData,
      });
    }

    console.log('✅ Sample transactions created');

    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('Default credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Client 1: client1@example.com / client123');
    console.log('Client 2: client2@example.com / client456');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
