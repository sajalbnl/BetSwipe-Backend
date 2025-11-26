import { ethers } from 'ethers';
import UserWallet from '../models/UserWallet.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { provider } from '../config/blockchain.js';

class SignerService {
    /**
     * Create a session signer for gasless transactions
     */
    async createSessionSigner(privyUserId, expiryDays = 7) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet) {
                throw new Error('Wallet not found for user');
            }

            // Generate new session signer
            const sessionWallet = ethers.Wallet.createRandom();
            
            // Encrypt private key
            const encryptedKey = encrypt(sessionWallet.privateKey);
            
            // Calculate expiry
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiryDays);

            // Update wallet with session signer
            wallet.sessionSignerAddress = sessionWallet.address;
            wallet.sessionSignerEncrypted = encryptedKey;
            wallet.sessionSignerExpiry = expiryDate;
            
            await wallet.save();

            console.log(`Created session signer for user ${privyUserId}: ${sessionWallet.address}`);

            return {
                success: true,
                sessionSigner: {
                    address: sessionWallet.address,
                    expiresAt: expiryDate,
                    expiryDays
                }
            };
        } catch (error) {
            console.error('Error creating session signer:', error);
            throw error;
        }
    }

    /**
     * Get decrypted session signer
     */
    async getSessionSigner(privyUserId) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet || !wallet.sessionSignerEncrypted) {
                return null;
            }

            // Check if expired
            if (wallet.sessionSignerExpiry && new Date() > wallet.sessionSignerExpiry) {
                console.log(`Session expired for user ${privyUserId}`);
                await this.revokeSession(privyUserId);
                return null;
            }

            // Decrypt private key
            const privateKey = decrypt(wallet.sessionSignerEncrypted);
            
            // Create wallet instance with provider
            const sessionWallet = new ethers.Wallet(privateKey, provider);

            return sessionWallet;
        } catch (error) {
            console.error('Error getting session signer:', error);
            return null;
        }
    }

    /**
     * Check if session is valid
     */
    async isSessionValid(privyUserId) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet || !wallet.sessionSignerAddress) {
                return false;
            }

            // Check expiry
            if (wallet.sessionSignerExpiry && new Date() > wallet.sessionSignerExpiry) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking session validity:', error);
            return false;
        }
    }

    /**
     * Revoke session signer
     */
    async revokeSession(privyUserId) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet) {
                return { success: false, message: 'Wallet not found' };
            }

            wallet.sessionSignerAddress = null;
            wallet.sessionSignerEncrypted = null;
            wallet.sessionSignerExpiry = null;
            
            await wallet.save();

            console.log(`Revoked session for user ${privyUserId}`);

            return { success: true, message: 'Session revoked successfully' };
        } catch (error) {
            console.error('Error revoking session:', error);
            throw error;
        }
    }

    /**
     * Get session info
     */
    async getSessionInfo(privyUserId) {
        try {
            const wallet = await UserWallet.findOne({ privyUserId });
            
            if (!wallet || !wallet.sessionSignerAddress) {
                return null;
            }

            return {
                address: wallet.sessionSignerAddress,
                expiresAt: wallet.sessionSignerExpiry,
                isValid: await this.isSessionValid(privyUserId)
            };
        } catch (error) {
            console.error('Error getting session info:', error);
            return null;
        }
    }
}

export default new SignerService();