import { ethers } from 'ethers';
import User from '../models/User.js';
import { provider, usdcContract, formatUSDC, formatMATIC } from '../config/blockchain.js';
import { IUser } from '../types/index.js';

interface WalletInfo {
    address: string;
}

interface GetOrCreateWalletResponse {
    success: boolean;
    isNew: boolean;
    wallet: WalletInfo;
}

class WalletService {
    /**
     * Get or create wallet for user
     */
    async getOrCreateWallet(privyUserId: string): Promise<GetOrCreateWalletResponse> {
        try {
            // Check if wallet exists
            let wallet = await User.findOne({ privyUserId });

            if (wallet && wallet.eoaAddress) {
                return {
                    success: true,
                    isNew: false,
                    wallet: {
                        address: wallet.eoaAddress
                    }
                };
            }

            // Create new wallet
            const newWallet = ethers.Wallet.createRandom();

            // Save to database
            if (wallet) {
                // Update existing user
                wallet.eoaAddress = newWallet.address;
                await wallet.save();
            } else {
                // Create new user
                wallet = await User.create({
                    privyUserId,
                    eoaAddress: newWallet.address
                });
            }

            console.log(`Created new wallet for user ${privyUserId}: ${newWallet.address}`);

            return {
                success: true,
                isNew: true,
                wallet: {
                    address: newWallet.address
                }
            };
        } catch (error) {
            console.error('Error in getOrCreateWallet:', error);
            throw error;
        }
    }


    /**
     * Get wallet by address
     */
    async getWalletByAddress(address: string): Promise<IUser | null> {
        return await User.findOne({ eoaAddress: address });
    }
}

export default new WalletService();
