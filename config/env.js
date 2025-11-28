import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' 
    ? '.env.production.local' 
    : '.env.development.local';

dotenv.config({ path: path.join(__dirname, '..', envFile) });

// Existing configs
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 5000;
export const DB_URI = process.env.DB_URI;

// Blockchain configs
export const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
export const POLYGON_CHAIN_ID = parseInt(process.env.POLYGON_CHAIN_ID || '137');

// Privy configs
export const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
export const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
export const PRIVY_AUTHORIZATION_KEY = process.env.PRIVY_AUTHORIZATION_KEY;

// Polymarket configs
export const POLYMARKET_API_KEY = process.env.POLYMARKET_API_KEY;
export const POLYMARKET_API_SECRET = process.env.POLYMARKET_API_SECRET;
export const POLYMARKET_CLOB_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';

// Contract addresses
export const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

// Security
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
export const JWT_SECRET = process.env.JWT_SECRET;

// Optional operator wallet (for system operations)
export const PRIVATE_KEY_OPERATOR = process.env.PRIVATE_KEY_OPERATOR;

// Redis (if using Bull for jobs)
export const REDIS_URL = process.env.REDIS_URL;

// Validate required configs
const requiredConfigs = {
    DB_URI,
    POLYGON_RPC_URL,
    ENCRYPTION_KEY
};

for (const [key, value] of Object.entries(requiredConfigs)) {
    if (!value) {
        throw new Error(`${key} is not defined in environment variables`);
    }
}