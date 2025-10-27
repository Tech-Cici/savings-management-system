# SMS Management System

## Overview
Complete SMS (Savings Management System) with both Client and Admin portals. This unified application provides a comprehensive solution for managing customer savings with role-based access control.

## Architecture
- **Single Frontend**: Next.js 16 app with both client and admin interfaces
- **Single Backend**: Express.js API serving both client and admin endpoints
- **Shared Database**: PostgreSQL with Prisma ORM and role-based access
- **Security**: JWT authentication, SHA-512 password hashing, rate limiting, session management

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT with SHA-512 password hashing
- **Security**: Rate limiting, session management, input validation, Helmet.js

## Access Points
- **Client Portal**: http://localhost:3000/client/*
- **Admin Portal**: http://localhost:3000/admin/*
- **API**: http://localhost:3001/api/*
- **Health Check**: http://localhost:3001/health

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sms-management-system.git
   cd sms-management-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   npm run db:generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
   ```

### Database Setup
1. **Install PostgreSQL** on your system
2. **Create database** named `sms_db`
3. **Update `.env`** with your PostgreSQL credentials:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/sms_db?schema=public"
   ```

## Default Credentials

### Admin Access
- **Email**: admin@example.com
- **Password**: admin123

### Client Access
- **Client 1**: client1@example.com / client123 (verified)
- **Client 2**: client2@example.com / client456 (pending verification)

## Features

### Client Features
- ✅ User registration and login
- ✅ Device ID verification workflow
- ✅ Deposit and withdrawal operations
- ✅ Transaction history and balance management
- ✅ Real-time balance updates
- ✅ Secure session management

### Admin Features
- ✅ Admin authentication and dashboard
- ✅ Customer management and verification
- ✅ Device ID verification system
- ✅ Transaction monitoring with user details
- ✅ Dashboard analytics and statistics
- ✅ User role management

## Security Features
- 🔒 **SHA-512 Password Hashing** (PBKDF2 with 100,000 iterations)
- 🔒 **JWT Authentication** with session management
- 🔒 **Rate Limiting** (20 login attempts per 15 minutes)
- 🔒 **Session Management** with inactivity timeout
- 🔒 **Input Validation** and sanitization
- 🔒 **Secure HTTP Headers** (Helmet.js)
- 🔒 **Role-Based Access Control** (Admin/Client)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Client Endpoints
- `GET /api/client/transactions` - Get user transactions
- `GET /api/client/balance` - Get user balance
- `POST /api/client/deposit` - Make deposit
- `POST /api/client/withdraw` - Make withdrawal
- `PUT /api/client/device` - Update device ID

### Admin Endpoints
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/customers/:id` - Get specific customer
- `POST /api/admin/customers/:id/verify` - Verify customer
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## Database Schema
- **Users**: id, name, email, password, role, deviceId, balance, isVerified, timestamps
- **Transactions**: id, userId, type, amount, status, description, timestamps
- **Sessions**: id, userId, sessionId, deviceId, isActive, timestamps

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Project Structure
```
sms-management-system/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── store/           # State management
│   └── package.json
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── models/          # Data models
│   │   ├── middlewares/     # Express middlewares
│   │   └── utils/           # Utility functions
│   ├── prisma/              # Database schema
│   └── package.json
└── README.md
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License.