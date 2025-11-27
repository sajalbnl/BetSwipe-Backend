import UserWallet from '../models/UserWallet.js';
import { provider, usdcContract, formatUSDC, formatMATIC } from '../config/blockchain.js';
import logger from '../utils/logger.js';

class BalanceSync {
    constructor() {
        this.isRunning = false;
        this.batchSize = 50;
    }

    /**
     * Main job execution
     */
    async execute() {
        if (this.isRunning) {
            logger.info('Balance sync already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('Starting balance sync job');

            // Get wallets that need updating (oldest first)
            const cutoffTime = new Date(Date.now() - 60000); // 1 minute ago
            const wallets = await UserWallet.find({
                isActive: true,
                $or: [
                    { lastBalanceUpdate: { $lt: cutoffTime } },
                    { lastBalanceUpdate: null }
                ]
            })
            .sort({ lastBalanceUpdate: 1 })
            .limit(this.batchSize);

            if (wallets.length === 0) {
                logger.info('No wallets need balance update');
                return;
            }

            // Batch process wallets
            const results = await this.batchUpdateBalances(wallets);
            
            const duration = Date.now() - startTime;
            logger.info(`Balance sync completed: ${results.success}/${wallets.length} updated in ${duration}ms`);

            return {
                success: true,
                updated: results.success,
                failed: results.failed,
                duration
            };
        } catch (error) {
            logger.error('Balance sync job error:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Batch update balances
     */
    async batchUpdateBalances(wallets) {
        const results = { success: 0, failed: 0, errors: [] };
        
        // Create batch requests
        const updatePromises = wallets.map(async (wallet) => {
            try {
                // Parallel fetch both balances
                const [usdcBalance, maticBalance] = await Promise.all([
                    usdcContract.balanceOf(wallet.polygonWalletAddress),
                    provider.getBalance(wallet.polygonWalletAddress)
                ]);

                // Update wallet
                wallet.usdcBalance = parseFloat(formatUSDC(usdcBalance));
                wallet.maticBalance = parseFloat(formatMATIC(maticBalance));
                wallet.lastBalanceUpdate = new Date();
                
                await wallet.save();
                results.success++;

                // Log significant balance changes
                if (wallet.usdcBalance > 100) {
                    logger.info(`High balance detected for ${wallet.privyUserId}: $${wallet.usdcBalance}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    userId: wallet.privyUserId,
                    error: error.message
                });
                logger.error(`Failed to update balance for ${wallet.privyUserId}:`, error);
            }
        });

        await Promise.all(updatePromises);
        return results;
    }

    /**
     * Check for low MATIC balances
     */
    async checkLowMaticBalances() {
        try {
            const lowMaticThreshold = 0.1; // 0.1 MATIC
            
            const lowBalanceWallets = await UserWallet.find({
                isActive: true,
                maticBalance: { $lt: lowMaticThreshold },
                usdcBalance: { $gt: 10 } // Has USDC but low MATIC
            });

            if (lowBalanceWallets.length > 0) {
                logger.warn(`${lowBalanceWallets.length} wallets have low MATIC balance`);
                // TODO: Implement auto top-up or notifications
            }

            return lowBalanceWallets;
        } catch (error) {
            logger.error('Error checking low MATIC balances:', error);
            throw error;
        }
    }
}

export default new BalanceSync();