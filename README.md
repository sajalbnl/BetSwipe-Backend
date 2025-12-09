# BetSwipe Backend - TypeScript

A fully type-safe Node.js backend for BetSwipe, built with Express, MongoDB, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with background jobs
npm run dev:jobs

# Build for production
npm run build

# Run production build
npm start
```

## 📋 Features

- ✅ **100% TypeScript** - Full type safety across all layers
- ✅ **Express.js** - Fast, minimalist web framework
- ✅ **MongoDB + Mongoose** - Typed database models
- ✅ **Blockchain Integration** - Ethers.js v6 with Polygon
- ✅ **Polymarket API** - CLOB client integration
- ✅ **Privy Authentication** - Secure user management
- ✅ **Background Jobs** - Automated balance sync, trade monitoring
- ✅ **Rate Limiting** - API protection
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Encryption** - AES-256-GCM for sensitive data

## 🏗️ Architecture

```
betswipe-backend/
├── types/              # TypeScript type definitions
├── config/             # Configuration files
├── database/           # MongoDB connection
├── models/             # Mongoose schemas (User, Trade, Position)
├── services/           # Business logic layer
├── routes/             # API endpoints
├── middleware/         # Express middleware
├── jobs/               # Background cron jobs
├── utils/              # Utility functions
└── server.ts           # Application entry point
```

## 🔧 Technology Stack

### Core
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express** v5 - Web framework

### Database
- **MongoDB** - NoSQL database
- **Mongoose** v8 - ODM with TypeScript support

### Blockchain
- **Ethers.js** v6 - Ethereum library
- **Polygon** - Layer 2 network
- **USDC** - Stablecoin for trading

### External Services
- **Polymarket** - Prediction market platform
- **Privy** - Authentication & wallet management

### Development
- **tsx** - TypeScript execution
- **nodemon** - Hot reloading
- **ESLint** - Code linting
- **Winston** - Logging

## 📚 API Endpoints

### User Management
- `POST /api/user/register` - Register or get user
- `GET /api/user/:privyUserId` - Get user details
- `PUT /api/user/:privyUserId` - Update user profile

### Wallet Operations
- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet/:privyUserId` - Get balance
- `POST /api/wallet/session/create` - Create session signer

### Trading
- `POST /api/trade/place` - Place a trade
- `GET /api/trade/history/:privyUserId` - Get trade history
- `GET /api/trade/:tradeId` - Get specific trade

### Positions
- `GET /api/positions/:privyUserId/open` - Get open positions
- `GET /api/positions/:privyUserId/closed` - Get closed positions
- `PUT /api/positions/:positionId/close` - Close position

### Categories
- `POST /api/categories/save` - Save user categories
- `GET /api/categories/:privyUserId` - Get user categories

## 🔐 Environment Variables

Create a `.env.development.local` file with:

```bash
# Application
NODE_ENV=development
PORT=5000

# Database
DB_URI=mongodb://localhost:27017/betswipe

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_CHAIN_ID=137
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

# Privy
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret
PRIVY_AUTHORIZATION_KEY=your_auth_key

# Polymarket
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret
POLYMARKET_CLOB_URL=https://clob.polymarket.com

# Security
ENCRYPTION_KEY=your_32_byte_hex_key
JWT_SECRET=your_jwt_secret

# Optional
PRIVATE_KEY_OPERATOR=your_operator_private_key
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with TypeScript |
| `npm run dev:jobs` | Start with background jobs enabled |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run typecheck` | Check types without building |
| `npm run lint` | Lint code with ESLint |

### Type Checking

```bash
# Check types without building
npm run typecheck

# Should output: No errors ✅
```

### Project Structure

```typescript
// Import types
import { IUser, ITrade, IPosition } from './types/models.js';
import { PlaceTradeRequestBody } from './types/requests.js';
import { ServiceResponse } from './types/services.js';

// Use in code
const user: IUser = await User.findOne({ privyUserId });
const response: ServiceResponse<IUser> = {
  success: true,
  data: user
};
```

## 📦 Type Definitions

All types are defined in the `types/` directory:

- **`types/models.ts`** - Database model interfaces
- **`types/requests.ts`** - Request body types
- **`types/responses.ts`** - API response types
- **`types/services.ts`** - Service layer types

## 🔄 Background Jobs

The following jobs run automatically when `ENABLE_JOBS=true`:

| Job | Interval | Description |
|-----|----------|-------------|
| Balance Sync | 60s | Update user wallet balances from blockchain |
| Trade Monitor | 15s | Check pending trade status on Polymarket |
| Position Updater | 30s | Update position prices and calculate P&L |
| Deposit Detector | 30s | Detect incoming USDC deposits |

## 🚨 Error Handling

All errors are caught and formatted consistently:

```typescript
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient USDC balance"
  }
}
```

## 📝 Logging

Winston logger with multiple transports:
- Console (colorized in development)
- File: `logs/error.log` (errors only)
- File: `logs/combined.log` (all logs)

## 🧪 Testing

```bash
# Run tests (when configured)
npm test

# Type checking
npm run typecheck
```

## 🚀 Deployment

### Build

```bash
npm run build
```

This compiles TypeScript to the `dist/` folder.

### Run Production

```bash
NODE_ENV=production npm start
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📖 Documentation

- **[MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)** - Migration completion summary
- **[TYPESCRIPT_QUICK_START.md](TYPESCRIPT_QUICK_START.md)** - Quick start guide
- **[TYPESCRIPT_MIGRATION_REPORT.md](TYPESCRIPT_MIGRATION_REPORT.md)** - Detailed migration report

## 🤝 Contributing

1. Ensure all TypeScript types are correct
2. Run `npm run typecheck` before committing
3. Follow existing code patterns
4. Add types for new features

## 📄 License

ISC

## 🆘 Support

For issues or questions, check the documentation files in this repository.

---

**Built with TypeScript ❤️**
