import Position from '../models/Position.js';
import polymarketService from './polymarket.service.js';
import { IPosition, PositionSide } from '../types/index.js';

interface MarketData {
    question: string;
    tokenId: string;
    title?: string;
    conditionId?: string;
    endDate?: Date;
    imageUrl?: string;
}

interface TradeInfo {
    privyUserId: string;
    marketId: string;
    amount: number;
    _id: string;
    save: () => Promise<any>;
}

interface CreateOrUpdatePositionParams {
    trade: TradeInfo;
    marketData: MarketData;
    outcome: PositionSide;
    shares: number;
    price: number;
}

interface UpdatePositionPricesResponse {
    success: boolean;
    updated: number;
}

interface PositionsSummary {
    totalPositions: number;
    totalUnrealizedPnL: number;
}

interface GetOpenPositionsResponse {
    success: boolean;
    positions: IPosition[];
    summary: PositionsSummary;
}

interface ClosePositionResponse {
    success: boolean;
    position: IPosition;
    realizedPnL: number;
}

class PositionService {
    /**
     * Create or update position
     */
    async createOrUpdatePosition(params: CreateOrUpdatePositionParams): Promise<IPosition> {
        const { trade, marketData, outcome, shares, price } = params;

        try {
            // Check if position exists
            let position = await Position.findOne({
                privyUserId: trade.privyUserId,
                marketId: trade.marketId,
                side: outcome,
                status: 'OPEN'
            });

            if (position) {
                // Update existing position (average in)
                const totalCost = position.totalCost + trade.amount;
                const totalShares = position.shares + shares;
                position.avgEntryPrice = totalCost / totalShares;
                position.shares = totalShares;
                position.totalCost = totalCost;
            } else {
                // Create new position
                position = new Position({
                    privyUserId: trade.privyUserId,
                    marketId: trade.marketId,
                    conditionId: marketData.conditionId,
                    tokenId: marketData.tokenId,
                    side: outcome,
                    shares,
                    avgEntryPrice: price,
                    currentPrice: price,
                    totalCost: trade.amount,
                    marketTitle: marketData.title || marketData.question,
                    marketQuestion: marketData.question,
                    marketEndDate: marketData.endDate,
                    marketImageUrl: marketData.imageUrl,
                    status: 'OPEN'
                });
            }

            await position.save();

            // Link trade to position
            (trade as any).positionId = position._id;
            await trade.save();

            console.log(`Position created/updated for user ${trade.privyUserId}: ${position._id}`);

            return position;
        } catch (error) {
            console.error('Error creating/updating position:', error);
            throw error;
        }
    }

    /**
     * Update position prices
     */
    async updatePositionPrices(privyUserId?: string | null): Promise<UpdatePositionPricesResponse> {
        try {
            const query: any = { status: 'OPEN' };
            if (privyUserId) {
                query.privyUserId = privyUserId;
            }

            const positions = await Position.find(query).limit(100);

            const updatePromises = positions.map(async (position) => {
                try {
                    // Get current market price
                    const priceData = await polymarketService.getMarketPrice(position.marketId);

                    const currentPrice = position.side === 'YES'
                        ? priceData.prices.yes
                        : priceData.prices.no;

                    // Calculate unrealized P&L
                    const currentValue = position.shares * currentPrice;
                    const unrealizedPnL = currentValue - position.totalCost;

                    // Update position
                    position.currentPrice = currentPrice;
                    position.unrealizedPnL = unrealizedPnL;
                    position.lastPriceUpdate = new Date();

                    await position.save();
                } catch (error) {
                    console.error(`Error updating position ${position._id}:`, error);
                }
            });

            await Promise.all(updatePromises);

            console.log(`Updated prices for ${positions.length} positions`);
            return { success: true, updated: positions.length };
        } catch (error) {
            console.error('Error updating position prices:', error);
            throw error;
        }
    }

    /**
     * Get open positions
     */
    async getOpenPositions(privyUserId: string): Promise<GetOpenPositionsResponse> {
        try {
            const positions = await Position.find({
                privyUserId,
                status: 'OPEN'
            }).sort({ openedAt: -1 }).lean();

            // Calculate total P&L
            const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);

            return {
                success: true,
                positions: positions as unknown as IPosition[],
                summary: {
                    totalPositions: positions.length,
                    totalUnrealizedPnL
                }
            };
        } catch (error) {
            console.error('Error getting open positions:', error);
            throw error;
        }
    }

    /**
     * Close position
     */
    async closePosition(positionId: string, closePrice: number, shares?: number | null): Promise<ClosePositionResponse> {
        try {
            const position = await Position.findById(positionId);

            if (!position) {
                throw new Error('Position not found');
            }

            const sharesToClose = shares || position.shares;
            const realizedPnL = (closePrice - position.avgEntryPrice) * sharesToClose;

            if (shares && shares < position.shares) {
                // Partial close
                position.shares -= shares;
                position.realizedPnL += realizedPnL;
            } else {
                // Full close
                position.status = 'CLOSED';
                position.closedAt = new Date();
                position.realizedPnL = realizedPnL;
            }

            await position.save();

            console.log(`Position ${positionId} closed with P&L: ${realizedPnL}`);

            return {
                success: true,
                position,
                realizedPnL
            };
        } catch (error) {
            console.error('Error closing position:', error);
            throw error;
        }
    }
}

export default new PositionService();
