import Trade from '../models/Trade.js';
import User from '../models/User.js';
import polymarketService from './polymarket.service.js';
import positionService from './position.service.js';
import { ITrade, TradeOutcome } from '../types/index.js';

interface MarketData {
    question: string;
    tokenId: string;
    title?: string;
    conditionId?: string;
    endDate?: Date;
    imageUrl?: string;
}

interface ExecuteTradeParams {
    privyUserId: string;
    marketId: string;
    amount: number;
    outcome: TradeOutcome;
    marketData: MarketData;
}

interface TradeResult {
    id: string;
    orderId: string;
    amount: number;
    shares: number;
    price: number;
    status: string;
}

interface ExecuteTradeResponse {
    success: boolean;
    trade: TradeResult;
}

interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

interface TradeHistoryResponse {
    success: boolean;
    trades: ITrade[];
    pagination: PaginationInfo;
}

interface SyncPendingTradesResponse {
    success: boolean;
    synced: number;
}

interface GetTradeByIdResponse {
    success: boolean;
    trade: ITrade;
}

class TradeService {
    /**
     * Execute a trade
     */
    async executeTrade(params: ExecuteTradeParams): Promise<ExecuteTradeResponse> {
        const { privyUserId, marketId, amount, outcome, marketData } = params;

        let trade: any = null;

        try {
            // Validate user wallet and balance
            const wallet = await User.findOne({ privyUserId });
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (wallet.usdcBalance < amount) {
                throw new Error('Insufficient USDC balance');
            }

            // Get current market price
            const priceData = await polymarketService.getMarketPrice(marketId);
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
                    id: trade._id.toString(),
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
                trade.errorMessage = (error as Error).message;
                await trade.save();
            }

            throw error;
        }
    }

    /**
     * Get trade history
     */
    async getTradeHistory(privyUserId: string, limit: number = 50, offset: number = 0): Promise<TradeHistoryResponse> {
        try {
            const trades = await Trade.find({ privyUserId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .lean();

            const totalCount = await Trade.countDocuments({ privyUserId });

            return {
                success: true,
                trades: trades as unknown as ITrade[],
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
    async syncPendingTrades(): Promise<SyncPendingTradesResponse> {
        try {
            const pendingTrades = await Trade.find({
                status: { $in: ['PENDING', 'CONFIRMED'] }
            }).limit(50);

            const updatePromises = pendingTrades.map(async (trade) => {
                try {
                    // Check order status from Polymarket
                    const orderStatus = await polymarketService.getOrderStatus(trade.orderId!);

                    if (orderStatus.order.state === 'FILLED') {
                        trade.status = 'FILLED';
                        trade.executedAt = new Date();
                        trade.filledAmount = orderStatus.order.filledAmount;
                        trade.filledShares = orderStatus.order.filledSize;
                    } else if (orderStatus.order.state === 'CANCELLED') {
                        trade.status = 'CANCELLED';

                        // Refund the user
                        const wallet = await User.findOne({ privyUserId: trade.privyUserId });
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
    async getTradeById(tradeId: string): Promise<GetTradeByIdResponse> {
        try {
            const trade = await Trade.findById(tradeId).lean();

            if (!trade) {
                throw new Error('Trade not found');
            }

            return {
                success: true,
                trade: trade as unknown as ITrade
            };
        } catch (error) {
            console.error('Error getting trade:', error);
            throw error;
        }
    }
}

export default new TradeService();
