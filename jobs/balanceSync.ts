import User from '../models/User.js';
import { provider, usdcContract, formatUSDC, formatMATIC } from '../config/blockchain.js';
import logger from '../utils/logger.js';
import { IUser } from '../types/models.js';

interface BalanceSyncResult {
    success: boolean;
    message: string;
    updated: number;
    failed: number;
    duration: number;
}

interface BatchUpdateResults {
    success: number;
    failed: number;
    errors: Array<{
        privyUserId: string;
        error: string;
    }>;
}

class BalanceSync {
    private isRunning: boolean;
    private batchSize: number;

    constructor() {
        this.isRunning = false;
        this.batchSize = 50;
    }

    /**
     * Main job execution
     */
    async execute(): Promise<BalanceSyncResult | undefined> {
        if (this.isRunning) {
            logger.info('Balance sync already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('Starting balance sync job');

            // Get active wallets
            const wallets = await User.find({
                isActive: true,
                eoaAddress: { $exists: true, $ne: null }
            })
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
                message: `Balance sync completed: ${results.success}/${wallets.length} updated`,
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
    private async batchUpdateBalances(wallets: IUser[]): Promise<BatchUpdateResults> {
        const results: BatchUpdateResults = { success: 0, failed: 0, errors: [] };

        // Create batch requests
        const updatePromises = wallets.map(async (wallet) => {
            try {
                if (!wallet.eoaAddress) {
                    throw new Error('EOA wallet address is missing');
                }
                // Parallel fetch both balances
                const [usdcBalance, maticBalance] = await Promise.all([
                    usdcContract.balanceOf(wallet.eoaAddress),
                    provider.getBalance(wallet.eoaAddress)
                ]);

                results.success++;

                // Log significant balance changes
                const usdcBalanceFormatted = parseFloat(formatUSDC(usdcBalance));
                if (usdcBalanceFormatted > 100) {
                    logger.info(`High balance detected for ${wallet.privyUserId}: $${usdcBalanceFormatted}`);
                }
            } catch (error: any) {
                results.failed++;
                results.errors.push({
                    privyUserId: wallet.privyUserId,
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
    async checkLowMaticBalances(): Promise<IUser[]> {
        try {
            const lowMaticThreshold = 0.1; // 0.1 MATIC
            const lowBalanceWallets: IUser[] = [];

            const wallets = await User.find({
                isActive: true,
                eoaAddress: { $exists: true, $ne: null }
            });

            for (const wallet of wallets) {
                try {
                    const maticBalance = await provider.getBalance(wallet.eoaAddress!);
                    const maticBalanceFormatted = parseFloat(formatMATIC(maticBalance));

                    if (maticBalanceFormatted < lowMaticThreshold) {
                        lowBalanceWallets.push(wallet);
                    }
                } catch (error) {
                    logger.error(`Error checking MATIC balance for ${wallet.privyUserId}:`, error);
                }
            }

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
