import { ClobClient } from '@polymarket/clob-client';
import { POLYMARKET_API_KEY, POLYMARKET_CLOB_URL, POLYGON_CHAIN_ID } from './env.js';

let clobClient: ClobClient | null = null;

export const initializeClobClient = (): ClobClient => {
    try {
        // ClobClient signature: new ClobClient(host: string, chainId: number, signer?: Wallet | JsonRpcSigner)
        // Since we don't have a signer here, we pass undefined
        clobClient = new ClobClient(
            POLYMARKET_CLOB_URL,
            POLYGON_CHAIN_ID,
            undefined  // Signer will be provided when making trades
        );

        console.log('Polymarket CLOB client initialized');
        return clobClient;
    } catch (error) {
        console.error('Error initializing CLOB client:', error);
        throw error;
    }
};

export const getClobClient = (): ClobClient => {
    if (!clobClient) {
        return initializeClobClient();
    }
    return clobClient;
};

// Market sides
export const SIDES = {
    BUY: 'BUY',
    SELL: 'SELL'
} as const;

export type MarketSide = typeof SIDES[keyof typeof SIDES];

// Token IDs for YES/NO
export const getTokenId = (conditionId: string, outcome: 'YES' | 'NO'): string => {
    // This is a placeholder - actual implementation depends on Polymarket's token structure
    // Usually it's a hash of conditionId + outcome index
    const outcomeIndex = outcome === 'YES' ? 1 : 0;
    return `${conditionId}-${outcomeIndex}`;
};
