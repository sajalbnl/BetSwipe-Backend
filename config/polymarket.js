import { ClobClient } from '@polymarket/clob-client';
import {  POLYMARKET_CLOB_URL, POLYGON_CHAIN_ID } from './env.js';
import logger from '../utils/logger.js';



// export const initializeClobClient = () => {
//     try {
//         clobClient = new ClobClient(
//             POLYMARKET_CLOB_URL,
//             POLYGON_CHAIN_ID,
//             {
//                 key: POLYMARKET_API_KEY || '',
//             }
//         );
        
//         console.log('Polymarket CLOB client initialized');
//         return clobClient;
//     } catch (error) {
//         console.error('Error initializing CLOB client:', error);
//         throw error;
//     }
// };

// export const getClobClient = () => {
//     if (!clobClient) {
//         return initializeClobClient();
//     }
//     return clobClient;
// };
export const getClobClient = async (signer, funderAddress) => {
    try {
        //In general don't create a new API key, always derive or createOrDerive
        const creds = await getClobCreds(signer);
        logger.info("creds generated");
        const clobClient = new ClobClient(
            POLYMARKET_CLOB_URL,
            POLYGON_CHAIN_ID,
            signer,
            await creds,
            0,
            funderAddress,
        );
        return clobClient;
    } catch (error) {
        logger.error("failed to get clob client");
        console.error(error);
        throw error;
    }
};

const getClobCreds = async (signer) => {
    const creds = new ClobClient(POLYMARKET_CLOB_URL, POLYGON_CHAIN_ID, signer).createOrDeriveApiKey();
    return creds;
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