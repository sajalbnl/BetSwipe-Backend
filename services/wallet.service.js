import { ethers } from 'ethers';
import UserWallet from '../models/UserWallet.js';
import { provider, usdcContract, formatUSDC, formatMATIC } from '../config/blockchain.js';

class WalletService {
    /**
     * Get or create wallet for user
     */
    async getOrCreateWallet(privyUserId) {
        try {
            // Check if wallet exists
            let wallet = await UserWallet.findOne({ privyUserId });
            
            if (wallet) {
                return {
                    success: true,
                    isNew: false,
                    wallet: {
                        address: wallet.polygonWalletAddress,
                        usdcBalance: wallet.usdcBalance,
                        maticBalance: wallet.maticBalance
                    }
                };
            }

            // Create new wallet
            const newWallet = ethers.Wallet.createRandom();
            
            // Save to database
            wallet = await UserWallet.create({
                privyUserId,
                polygonWalletAddress: newWallet.address,
                depositAddress: newWallet.address, // Same as wallet for now
                usdcBalance: 0,
                maticBalance: 0
            });

            console.log(`Created new wallet for user ${privyUserId}: ${newWallet.address}`);

            return {
                success: true,
                isNew: true,
                wallet: {
                    address: wallet.polygonWalletAddress,
                    usdcBalance: 0,
                    maticBalance: 0
                }
            };
        } catch (error) {
            console.error('Error in getOrCreateWallet:', error);
            throw error;
        }
    }

    /**
     * Get wallet balance from blockchain
     */
    async getWalletBalance(privyUserId) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            // Get USDC balance
            const usdcBalanceRaw = await usdcContract.balanceOf(wallet.polygonWalletAddress);
            const usdcBalance = parseFloat(formatUSDC(usdcBalanceRaw));

            // Get MATIC balance
            const maticBalanceRaw = await provider.getBalance(wallet.polygonWalletAddress);
            const maticBalance = parseFloat(formatMATIC(maticBalanceRaw));

            // Update in database
            wallet.usdcBalance = usdcBalance;
            wallet.maticBalance = maticBalance;
            wallet.lastBalanceUpdate = new Date();
            await wallet.save();

            return {
                success: true,
                balances: {
                    usdc: usdcBalance,
                    matic: maticBalance,
                    address: wallet.polygonWalletAddress
                }
            };
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            throw error;
        }
    }

    /**
     * Update all user balances (for background job)
     */
    async updateAllBalances() {
        try {
            const wallets = await UserWallet.find({ isActive: true })
                .limit(100) // Process in batches
                .sort({ lastBalanceUpdate: 1 }); // Update oldest first

            const updatePromises = wallets.map(async (wallet) => {
                try {
                    // Get balances
                    const [usdcBalance, maticBalance] = await Promise.all([
                        usdcContract.balanceOf(wallet.polygonWalletAddress),
                        provider.getBalance(wallet.polygonWalletAddress)
                    ]);

                    // Update wallet
                    wallet.usdcBalance = parseFloat(formatUSDC(usdcBalance));
                    wallet.maticBalance = parseFloat(formatMATIC(maticBalance));
                    wallet.lastBalanceUpdate = new Date();
                    
                    await wallet.save();
                } catch (error) {
                    console.error(`Error updating balance for ${wallet.privyUserId}:`, error);
                }
            });

            await Promise.all(updatePromises);
            
            console.log(`Updated balances for ${wallets.length} wallets`);
            return { success: true, updated: wallets.length };
        } catch (error) {
            console.error('Error in updateAllBalances:', error);
            throw error;
        }
    }

    /**
     * Get wallet by address
     */
    async getWalletByAddress(address) {
        return await UserWallet.findOne({ polygonWalletAddress: address });
    }
}

export default new WalletService();