import { ClobClient } from '@polymarket/clob-client';
import { POLYMARKET_API_KEY, POLYMARKET_CLOB_URL, POLYGON_CHAIN_ID } from './env.js';

let clobClient = null;

export const initializeClobClient = () => {
    try {
        clobClient = new ClobClient(
            POLYMARKET_CLOB_URL,
            POLYGON_CHAIN_ID,
            {
                key: POLYMARKET_API_KEY || '',
            }
        );
        
        console.log('Polymarket CLOB client initialized');
        return clobClient;
    } catch (error) {
        console.error('Error initializing CLOB client:', error);
        throw error;
    }
};

export const getClobClient = () => {
    if (!clobClient) {
        return initializeClobClient();
    }
    return clobClient;
};

// Market sides
export const SIDES = {
    BUY: 'BUY',
    SELL: 'SELL'
};

// Token IDs for YES/NO
export const getTokenId = (conditionId, outcome) => {
    // This is a placeholder - actual implementation depends on Polymarket's token structure
    // Usually it's a hash of conditionId + outcome index
    const outcomeIndex = outcome === 'YES' ? 1 : 0;
    return `${conditionId}-${outcomeIndex}`;
};