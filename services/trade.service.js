import Trade from '../models/Trade.js';

import UserWallet from '../models/UserWallet.js';
import polymarketService from './polymarket.service.js';
import positionService from './position.service.js';

class TradeService {
    /**
     * Execute a trade
     */
    async executeTrade(params) {
        const { privyUserId, marketId,  amount, outcome, marketData } = params;
        
        let trade = null;
        
        try {
            // Validate user wallet and balance
            const wallet = await UserWallet.findOne({ privyUserId });
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (wallet.usdcBalance < amount) {
                throw new Error('Insufficient USDC balance');
            }

            // Get current market price
            const priceData = await polymarketService.getMarketPrice(marketId, outcome);
            const currentPrice = outcome === 'YES' ? priceData.prices.yes : priceData.prices.no;

            // Calculate shares (simplified - actual calculation depends on AMM)
            const shares = amount / currentPrice;

            // Create trade record
            trade = await Trade.create({
                privyUserId,
                marketId,
                marketQuestion: marketData.question,
                orderType: 'MARKET',
                action: 'BUY',
                outcome,
                amount,
                shares,
                price: currentPrice,
                status: 'PENDING'
            });

            // Place order on Polymarket
            const orderResult = await polymarketService.placeMarketOrder({
                privyUserId,
                marketId,
                side: outcome,
                amount,
                outcome,
                tokenId: marketData.tokenId
            });

            // Update trade with order ID
            trade.orderId = orderResult.orderId;
            trade.status = 'CONFIRMED';
            await trade.save();

            // Update wallet balance and stats
            wallet.usdcBalance -= amount;
            wallet.totalTrades += 1;
            wallet.totalVolume += amount;
            await wallet.save();

            // Create or update position
            await positionService.createOrUpdatePosition({
                trade,
                marketData,
                outcome,
                shares,
                price: currentPrice
            });

            console.log(`Trade executed for user ${privyUserId}: ${trade._id}`);

            return {
                success: true,
                trade: {
                    id: trade._id,
                    orderId: trade.orderId,
                    amount,
                    shares,
                    price: currentPrice,
                    status: trade.status
                }
            };
        } catch (error) {
            console.error('Error executing trade:', error);
            
            // Update trade status if it was created
            if (trade) {
                trade.status = 'FAILED';
                trade.errorMessage = error.message;
                await trade.save();
            }
            
            throw error;
        }
    }

    /**
     * Get trade history
     */
    async getTradeHistory(privyUserId, limit = 50, offset = 0) {
        try {
            const trades = await Trade.find({ privyUserId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();

            const totalCount = await Trade.countDocuments({ privyUserId });

            return {
                success: true,
                trades,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: offset + limit < totalCount
                }
            };
        } catch (error) {
            console.error('Error getting trade history:', error);
            throw error;
        }
    }

    /**
     * Sync pending trades (for background job)
     */
    async syncPendingTrades() {
        try {
            const pendingTrades = await Trade.find({ 
                status: { $in: ['PENDING', 'CONFIRMED'] }
            }).limit(50);

            const updatePromises = pendingTrades.map(async (trade) => {
                try {
                    // Check order status from Polymarket
                    const orderStatus = await polymarketService.getOrderStatus(trade.orderId);
                    
                    if (orderStatus.order.state === 'FILLED') {
                        trade.status = 'FILLED';
                        trade.executedAt = new Date();
                        trade.filledAmount = orderStatus.order.filledAmount;
                        trade.filledShares = orderStatus.order.filledSize;
                    } else if (orderStatus.order.state === 'CANCELLED') {
                        trade.status = 'CANCELLED';
                        
                        // Refund the user
                        const wallet = await UserWallet.findOne({ privyUserId: trade.privyUserId });
                        if (wallet) {
                            wallet.usdcBalance += trade.amount;
                            await wallet.save();
                        }
                    }
                    
                    await trade.save();
                } catch (error) {
                    console.error(`Error syncing trade ${trade._id}:`, error);
                }
            });

            await Promise.all(updatePromises);
            
            console.log(`Synced ${pendingTrades.length} pending trades`);
            return { success: true, synced: pendingTrades.length };
        } catch (error) {
            console.error('Error syncing pending trades:', error);
            throw error;
        }
    }

    /**
     * Get trade by ID
     */
    async getTradeById(tradeId) {
        try {
            const trade = await Trade.findById(tradeId).lean();
            
            if (!trade) {
                throw new Error('Trade not found');
            }

            return {
                success: true,
                trade
            };
        } catch (error) {
            console.error('Error getting trade:', error);
            throw error;
        }
    }
}

export default new TradeService();