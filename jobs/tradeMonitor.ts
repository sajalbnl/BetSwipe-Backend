import Trade from '../models/Trade.js';
import User from '../models/User.js';
import polymarketService from '../services/polymarket.service.js';
import positionService from '../services/position.service.js';
import logger from '../utils/logger.js';
import { ITrade } from '../types/models.js';

interface TradeMonitorResult {
    success: boolean;
    message: string;
    filled: number;
    cancelled: number;
    failed: number;
    duration: number;
}

interface ProcessResults {
    filled: number;
    cancelled: number;
    failed: number;
}

interface OrderData {
    state: string;
    filledAmount?: number;
    filledSize?: number;
    fees?: number;
    error?: string;
    conditionId?: string;
    tokenId?: string;
}

class TradeMonitor {
    private isRunning: boolean;
    private batchSize: number;
    private maxRetries: number;

    constructor() {
        this.isRunning = false;
        this.batchSize = 50;
        this.maxRetries = 3;
    }

    /**
     * Main job execution
     */
    async execute(): Promise<TradeMonitorResult | undefined> {
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
                message: `Trade monitor completed: ${results.filled} filled, ${results.cancelled} cancelled, ${results.failed} failed`,
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
    private async processPendingTrades(trades: ITrade[]): Promise<ProcessResults> {
        const results: ProcessResults = { filled: 0, cancelled: 0, failed: 0 };

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
                if (!trade.orderId) {
                    logger.warn(`Trade ${trade._id} has no orderId`);
                    return;
                }
                const orderStatus = await polymarketService.getOrderStatus(trade.orderId);

                if (!orderStatus.success) {
                    logger.warn(`Failed to get order status for trade ${trade._id}`);
                    return;
                }

                const order = orderStatus.order as OrderData;

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                logger.error(`Error processing trade ${trade._id}:`, error);
                results.failed++;

                // Handle error - mark as failed after too many errors
                await this.handleFailedTrade(trade, error.message);
            }
        });

        await Promise.all(updatePromises);
        return results;
    }

    /**
     * Handle filled trade
     */
    private async handleFilledTrade(trade: ITrade, order: OrderData): Promise<void> {
        try {
            trade.status = 'FILLED';
            trade.executedAt = new Date();
            trade.filledAmount = order.filledAmount || trade.amount;
            trade.filledShares = order.filledSize || trade.shares;
            trade.fees = order.fees || 0;

            await trade.save();

            // Create or update position
            await positionService.createOrUpdatePosition({
                trade: {
                    _id: trade._id.toString(),
                    privyUserId: trade.privyUserId,
                    marketId: trade.marketId,
                    amount: trade.filledAmount,
                    save: async () => trade.save()
                },
                marketData: {
                    question: trade.marketQuestion,
                    conditionId: order.conditionId!,
                    tokenId: order.tokenId!
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
    private async handlePartiallyFilledTrade(trade: ITrade, order: OrderData): Promise<void> {
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
    private async handleCancelledTrade(trade: ITrade): Promise<void> {
        try {
            trade.status = 'CANCELLED';
            await trade.save();

            // Update user stats
            const wallet = await User.findOne({ privyUserId: trade.privyUserId });
            if (wallet) {
                wallet.totalTrades -= 1;
                wallet.totalVolume -= trade.amount;
                await wallet.save();

                logger.info(`Updated stats for user ${trade.privyUserId} after trade cancellation`);
            }

            // TODO: Handle refund via smart contract
            logger.info(`Trade ${trade._id} cancelled`);
        } catch (error) {
            logger.error(`Error handling cancelled trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle failed trade
     */
    private async handleFailedTrade(trade: ITrade, errorMessage?: string): Promise<void> {
        try {
            trade.status = 'FAILED';
            trade.errorMessage = errorMessage || 'Trade failed';
            await trade.save();

            // Update user stats
            const wallet = await User.findOne({ privyUserId: trade.privyUserId });
            if (wallet) {
                wallet.totalTrades -= 1;
                wallet.totalVolume -= trade.amount;
                await wallet.save();

                logger.info(`Updated stats for user ${trade.privyUserId} after failed trade`);
            }

            // TODO: Handle refund via smart contract
            logger.error(`Trade ${trade._id} failed: ${errorMessage}`);
        } catch (error) {
            logger.error(`Error handling failed trade ${trade._id}:`, error);
            throw error;
        }
    }

    /**
     * Handle expired trade
     */
    private async handleExpiredTrade(trade: ITrade): Promise<void> {
        logger.warn(`Trade ${trade._id} expired, cancelling...`);
        await this.handleCancelledTrade(trade);
    }
}

export default new TradeMonitor();
