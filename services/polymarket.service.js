import { getClobClient, SIDES,  } from '../config/polymarket.js';
import signerService from './signer.service.js';
import { parseUSDC } from '../config/blockchain.js';

class PolymarketService {
    constructor() {
        this.client = getClobClient();
    }

    /**
     * Place a market order
     */
    async placeMarketOrder(params) {
        const { privyUserId, marketId, side, amount,  tokenId } = params;

        try {
            // Get session signer
            const signer = await signerService.getSessionSigner(privyUserId);
            if (!signer) {
                throw new Error('Session signer not found or expired');
            }

            // Create order object
            const order = {
                market: marketId,
                side: side === 'YES' ? SIDES.BUY : SIDES.SELL,
                size: parseUSDC(amount).toString(),
                price: 0, // Market order
                tokenID: tokenId,
                maker: signer.address,
                nonce: Date.now().toString(),
                expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
                taker: '0x0000000000000000000000000000000000000000',
                feeRateBps: '0',
                signatureType: 'EOA'
            };

            // Sign order using EIP-712
            const signature = await this.signOrder(order, signer);
            
            // Submit to CLOB
            const response = await this.client.postOrder({
                ...order,
                signature
            });

            console.log(`Order placed for user ${privyUserId}:`, response);

            return {
                success: true,
                orderId: response.orderID,
                order: response
            };
        } catch (error) {
            console.error('Error placing market order:', error);
            throw error;
        }
    }

    /**
     * Sign order using EIP-712
     */
    async signOrder(order, signer) {
        // EIP-712 domain
        const domain = {
            name: 'Polymarket',
            version: '1',
            chainId: 137,
            verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' // CTF Exchange address
        };

        // EIP-712 types
        const types = {
            Order: [
                { name: 'market', type: 'address' },
                { name: 'maker', type: 'address' },
                { name: 'taker', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'side', type: 'uint8' },
                { name: 'expiration', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'feeRateBps', type: 'uint256' },
                { name: 'signatureType', type: 'uint8' }
            ]
        };

        // Sign the order
        const signature = await signer.signTypedData(domain, types, order);
        return signature;
    }

    /**
     * Get order status
     */
    async getOrderStatus(orderId) {
        try {
            const order = await this.client.getOrder(orderId);
            return {
                success: true,
                order
            };
        } catch (error) {
            console.error('Error getting order status:', error);
            throw error;
        }
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId, privyUserId) {
        try {
            const signer = await signerService.getSessionSigner(privyUserId);
            if (!signer) {
                throw new Error('Session signer not found');
            }

            const response = await this.client.cancelOrder({
                orderID: orderId,
                maker: signer.address
            });

            return {
                success: true,
                response
            };
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    }

    /**
     * Get market price
     */
    async getMarketPrice(marketId, ) {
        try {
            const orderbook = await this.client.getOrderBook(marketId);
            
            const yesPrice = orderbook.bids[0]?.price || 0;
            const noPrice = orderbook.asks[0]?.price || 0;

            return {
                success: true,
                prices: {
                    yes: yesPrice,
                    no: noPrice,
                    spread: Math.abs(yesPrice - noPrice)
                }
            };
        } catch (error) {
            console.error('Error getting market price:', error);
            return {
                success: false,
                prices: { yes: 0.5, no: 0.5, spread: 0 }
            };
        }
    }

    /**
     * Get user positions from Polymarket
     */
    // async getUserPositions(address) {
    //     try {
    //         // This would typically call Polymarket's positions API
    //         // Placeholder for now
    //         return {
    //             success: true,
    //             positions: []
    //         };
    //     } catch (error) {
    //         console.error('Error getting user positions:', error);
    //         throw error;
    //     }
    // }
}

export default new PolymarketService();