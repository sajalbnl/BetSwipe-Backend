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
export const NODE_ENV: string = process.env.NODE_ENV || 'development';
export const PORT: number = parseInt(process.env.PORT || '5000', 10);
export const DB_URI: string | undefined = process.env.DB_URI;

// Blockchain configs
export const POLYGON_RPC_URL: string = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
export const POLYGON_CHAIN_ID: number = parseInt(process.env.POLYGON_CHAIN_ID || '137', 10);

// Privy configs
export const PRIVY_APP_ID: string | undefined = process.env.PRIVY_APP_ID;
export const PRIVY_APP_SECRET: string | undefined = process.env.PRIVY_APP_SECRET;
export const PRIVY_AUTHORIZATION_KEY: string | undefined = process.env.PRIVY_AUTHORIZATION_KEY;

// Polymarket configs
export const POLYMARKET_API_KEY: string | undefined = process.env.POLYMARKET_API_KEY;
export const POLYMARKET_API_SECRET: string | undefined = process.env.POLYMARKET_API_SECRET;
export const POLYMARKET_CLOB_URL: string = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';

// Contract addresses
export const USDC_CONTRACT_ADDRESS: string = process.env.USDC_CONTRACT_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

// Security
export const ENCRYPTION_KEY: string | undefined = process.env.ENCRYPTION_KEY;
export const JWT_SECRET: string | undefined = process.env.JWT_SECRET;

// Optional operator wallet (for system operations)
export const PRIVATE_KEY_OPERATOR: string | undefined = process.env.PRIVATE_KEY_OPERATOR;

// Redis (if using Bull for jobs)
export const REDIS_URL: string | undefined = process.env.REDIS_URL;

// Validate required configs
interface RequiredConfigs {
    DB_URI: string | undefined;
    POLYGON_RPC_URL: string;
    ENCRYPTION_KEY: string | undefined;
}

const requiredConfigs: RequiredConfigs = {
    DB_URI,
    POLYGON_RPC_URL,
    ENCRYPTION_KEY
};

for (const [key, value] of Object.entries(requiredConfigs)) {
    if (!value) {
        throw new Error(`${key} is not defined in environment variables`);
    }
}
