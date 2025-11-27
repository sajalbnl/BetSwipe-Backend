import Position from '../models/Position.js';
import polymarketService from '../services/polymarket.service.js';
import logger from '../utils/logger.js';

class PositionUpdater {
    constructor() {
        this.isRunning = false;
        this.batchSize = 100;
        this.priceCache = new Map(); // Cache prices for 30 seconds
        this.cacheTimeout = 30000;
    }

    /**
     * Main job execution
     */
    async execute() {
        if (this.isRunning) {
            logger.info('Position updater already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('Starting position updater job');

            // Get positions that need updating
            const cutoffTime = new Date(Date.now() - 30000); // 30 seconds ago
            const positions = await Position.find({
                status: 'OPEN',
                $or: [
                    { lastPriceUpdate: { $lt: cutoffTime } },
                    { lastPriceUpdate: null }
                ]
            })
            .sort({ lastPriceUpdate: 1 })
            .limit(this.batchSize);

            if (positions.length === 0) {
                logger.info('No positions need price update');
                return;
            }

            // Group positions by market for efficient price fetching
            const marketGroups = this.groupPositionsByMarket(positions);
            
            // Update positions
            const results = await this.updatePositionGroups(marketGroups);
            
            const duration = Date.now() - startTime;
            logger.info(`Position update completed: ${results.updated}/${positions.length} updated in ${duration}ms`);

            // Alert on significant P&L changes
            this.checkSignificantPnLChanges(results.positions);

            return {
                success: true,
                updated: results.updated,
                failed: results.failed,
                duration
            };
        } catch (error) {
            logger.error('Position updater job error:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Group positions by market ID
     */
    groupPositionsByMarket(positions) {
        const groups = {};
        
        positions.forEach(position => {
            if (!groups[position.marketId]) {
                groups[position.marketId] = [];
            }
            groups[position.marketId].push(position);
        });

        return groups;
    }

    /**
     * Update position groups with market prices
     */
    async updatePositionGroups(marketGroups) {
        const results = { updated: 0, failed: 0, positions: [] };

        for (const [marketId, positions] of Object.entries(marketGroups)) {
            try {
                // Get market price (with caching)
                const priceData = await this.getCachedMarketPrice(marketId);
                
                // Update all positions for this market
                for (const position of positions) {
                    try {
                        const currentPrice = position.side === 'YES' 
                            ? priceData.prices.yes 
                            : priceData.prices.no;

                        // Calculate P&L
                        const currentValue = position.shares * currentPrice;
                        const unrealizedPnL = currentValue - position.totalCost;
                        const pnlPercentage = (unrealizedPnL / position.totalCost) * 100;

                        // Store old P&L for comparison
                        const oldPnL = position.unrealizedPnL;

                        // Update position
                        position.currentPrice = currentPrice;
                        position.unrealizedPnL = unrealizedPnL;
                        position.lastPriceUpdate = new Date();
                        
                        await position.save();
                        
                        results.updated++;
                        results.positions.push({
                            position,
                            oldPnL,
                            newPnL: unrealizedPnL,
                            pnlPercentage
                        });

                        logger.debug(`Updated position ${position._id}: Price=${currentPrice}, P&L=${unrealizedPnL.toFixed(2)}`);
                    } catch (error) {
                        results.failed++;
                        logger.error(`Failed to update position ${position._id}:`, error);
                    }
                }
            } catch (error) {
                results.failed += positions.length;
                logger.error(`Failed to get price for market ${marketId}:`, error);
            }
        }

        return results;
    }

    /**
     * Get cached market price
     */
    async getCachedMarketPrice(marketId) {
        const cacheKey = `price_${marketId}`;
        const cached = this.priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // Fetch fresh price
        const priceData = await polymarketService.getMarketPrice(marketId);
        
        // Cache it
        this.priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now()
        });

        return priceData;
    }

    /**
     * Check for significant P&L changes
     */
    checkSignificantPnLChanges(positions) {
        const significantThreshold = 100; // $100 change
        const significantPercentage = 20; // 20% change

        positions.forEach(({ position, oldPnL, newPnL, pnlPercentage }) => {
            const pnlChange = Math.abs(newPnL - oldPnL);
            
            if (pnlChange > significantThreshold || Math.abs(pnlPercentage) > significantPercentage) {
                logger.info(`Significant P&L change for position ${position._id}:`, {
                    user: position.privyUserId,
                    market: position.marketQuestion,
                    oldPnL: oldPnL.toFixed(2),
                    newPnL: newPnL.toFixed(2),
                    change: pnlChange.toFixed(2),
                    percentage: pnlPercentage.toFixed(2)
                });

                // TODO: Send notification to user
            }
        });
    }

    /**
     * Clear price cache
     */
    clearCache() {
        this.priceCache.clear();
        logger.info('Position price cache cleared');
    }
}

export default new PositionUpdater();