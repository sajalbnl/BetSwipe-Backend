import Trade from '../models/Trade.js';
import User from '../models/User.js';
import polymarketService from '../services/polymarket.service.js';
import positionService from '../services/position.service.js';
import logger from '../utils/logger.js';

class TradeMonitor {
    constructor() {
        this.isRunning = false;
        this.batchSize = 50;
        this.maxRetries = 3;
    }

    /**
     * Main job execution
     */
    async execute() {
        if (this.isRunning) {
            logger.info('Trade monitor already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('Starting trade monitor job');

            // Get pending trades
            const pendingTrades = await Trade.find({ 
                status: { $in: ['PENDING', 'CONFIRMED'] },
                createdAt: { $gt: new Date(Date.now() - 3600000) } // Last hour
            })
            .sort({ createdAt: 1 })
            .limit(this.batchSize);

            if (pendingTrades.length === 0) {
                logger.debug('No pending trades to monitor');
                return;
            }

            logger.info(`Monitoring ${pendingTrades.length} pending trades`);

            // Process trades
            const results = await this.processPendingTrades(pendingTrades);
            
            const duration = Date.now() - startTime;
            logger.info(`Trade monitor completed: ${results.filled}/${pendingTrades.length} filled in ${duration}ms`);

            return {
                success: true,
                filled: results.filled,
                cancelled: results.cancelled,
                failed: results.failed,
                duration
            };
        } catch (error) {
            logger.error('Trade monitor job error:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process pending trades
     */
    async processPendingTrades(trades) {
        const results = { filled: 0, cancelled: 0, failed: 0 };

        const updatePromises = trades.map(async (trade) => {
            try {
                // Check if trade has been pending too long (1 hour)
                const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
                if (tradeAge > 3600000) {
                    await this.handleExpiredTrade(trade);
                    results.cancelled++;
                    return;
                }

                // Check order status from Polymarket
                const orderStatus = await polymarketService.getOrderStatus(trade.orderId);
                
                if (!orderStatus.success) {
                    logger.warn(`Failed to get order status for trade ${trade._id}`);
                    return;
                }

                const order = orderStatus.order;

                // Update based on order state
                switch (order.state) {
                    case 'FILLED':
                        await this.handleFilledTrade(trade, order);
                        results.filled++;
                        break;
                    
                    case 'PARTIALLY_FILLED':
                        await this.handlePartiallyFilledTrade(trade, order);
                        break;
                    
                    case 'CANCELLED':
                        await this.handleCancelledTrade(trade);
                        results.cancelled++;
                        break;
                    
                    case 'FAILED':
                        await this.handleFailedTrade(trade, order.error);
                        results.failed++;
                        break;
                }
            } catch (error) {
                logger.error(`Error processing trade ${trade._id}:`, error);
                results.failed++;
                
                // Increment retry count
                trade.retryCount = (trade.retryCount || 0) + 1;
                if (trade.retryCount >= this.maxRetries) {
                    await this.handleFailedTrade(trade, error.message);
                }
                await trade.save();
            }
        });

        await Promise.all(updatePromises);
        return results;
    }

    /**
     * Handle filled trade
     */
    async handleFilledTrade(trade, order) {
        try {
            trade.status = 'FILLED';
            trade.executedAt = new Date();
            trade.filledAmount = order.filledAmount || trade.amount;
            trade.filledShares = order.filledSize || trade.shares;
            trade.fees = order.fees || 0;
            
            await trade.save();

            // Create or update position
            await positionService.createOrUpdatePosition({
                trade,
                marketData: {
                    question: trade.marketQuestion,
                    conditionId: order.conditionId,
                    tokenId: order.tokenId
                },
                outcome: trade.outcome,
                shares: trade.filledShares,
                price: trade.price
            });

            logger.info(`Trade ${trade._id} filled successfully`);
        } catch (error) {
            logger.error(`Error handling filled trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle partially filled trade
     */
    async handlePartiallyFilledTrade(trade, order) {
        try {
            trade.status = 'PARTIALLY_FILLED';
            trade.filledAmount = order.filledAmount || 0;
            trade.filledShares = order.filledSize || 0;
            
            await trade.save();

            logger.info(`Trade ${trade._id} partially filled: ${trade.filledAmount}/${trade.amount}`);
        } catch (error) {
            logger.error(`Error handling partially filled trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle cancelled trade
     */
    async handleCancelledTrade(trade) {
        try {
            trade.status = 'CANCELLED';
            await trade.save();

            // Refund the user
            const wallet = await User.findOne({ privyUserId: trade.privyUserId });
            if (wallet) {
                wallet.usdcBalance += trade.amount;
                wallet.totalTrades -= 1;
                wallet.totalVolume -= trade.amount;
                await wallet.save();
                
                logger.info(`Refunded ${trade.amount} USDC to user ${trade.privyUserId}`);
            }

            logger.info(`Trade ${trade._id} cancelled and refunded`);
        } catch (error) {
            logger.error(`Error handling cancelled trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle failed trade
     */
    async handleFailedTrade(trade, errorMessage) {
        try {
            trade.status = 'FAILED';
            trade.errorMessage = errorMessage || 'Trade failed';
            await trade.save();

            // Refund the user
            const wallet = await User.findOne({ privyUserId: trade.privyUserId });
            if (wallet) {
                wallet.usdcBalance += trade.amount;
                wallet.totalTrades -= 1;
                wallet.totalVolume -= trade.amount;
                await wallet.save();
                
                logger.info(`Refunded ${trade.amount} USDC to user ${trade.privyUserId} for failed trade`);
            }

            logger.error(`Trade ${trade._id} failed: ${errorMessage}`);
        } catch (error) {
            logger.error(`Error handling failed trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle expired trade
     */
    async handleExpiredTrade(trade) {
        logger.warn(`Trade ${trade._id} expired, cancelling...`);
        await this.handleCancelledTrade(trade);
    }
}

export default new TradeMonitor();