#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SMS Backend...');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://sms_user:sms_password@localhost:5432/sms_db?schema=public"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
} else {
  console.log('✅ .env file already exists');
}

console.log('🎉 Backend setup complete!');
console.log('');
console.log('To start the backend:');
console.log('  cd backend');
console.log('  npm install');
console.log('  npm run db:generate');
console.log('  npm run db:push');
console.log('  npm run db:seed');
console.log('  npm run dev');
console.log('');
console.log('Database commands:');
console.log('  npm run db:studio  - Open Prisma Studio');
console.log('  npm run db:reset   - Reset database');
console.log('  npm run db:seed    - Seed sample data');
console.log('');
console.log('Default admin credentials:');
console.log('  Email: admin@example.com');
console.log('  Password: admin123');
