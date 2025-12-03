import User from '../models/User.js';

class UserService {
    /**
     * Register or get existing user (called after Privy login)
     */
    async registerUser(privyUserId, polygonWalletAddress) {
        try {
            // Check if user already exists
            let user = await User.findOne({ privyUserId });

            if (user) {
                // Update wallet address if provided and different
                if (polygonWalletAddress && user.polygonWalletAddress !== polygonWalletAddress) {
                    user.polygonWalletAddress = polygonWalletAddress;
                    await user.save();
                }

                return {
                    success: true,
                    isNew: false,
                    user: this.formatUserResponse(user)
                };
            }

            // Create new user
            user = await User.create({
                privyUserId,
                polygonWalletAddress,
                isOnboarded: false,
                isActive: true
            });

            return {
                success: true,
                isNew: true,
                user: this.formatUserResponse(user)
            };
        } catch (error) {
            console.error('Error in registerUser:', error);
            throw error;
        }
    }

    /**
     * Get user by privyUserId
     */
    async getUser(privyUserId) {
        try {
            const user = await User.findOne({ privyUserId });

            if (!user) {
                return {
                    success: false,
                    user: null
                };
            }

            return {
                success: true,
                user: this.formatUserResponse(user)
            };
        } catch (error) {
            console.error('Error in getUser:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUser(privyUserId, updateData) {
        try {
            const allowedFields = ['polygonWalletAddress', 'selectedCategories', 'isOnboarded'];
            const filteredUpdate = {};

            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    filteredUpdate[field] = updateData[field];
                }
            }

            // If categories are being set, mark as onboarded
            if (filteredUpdate.selectedCategories && filteredUpdate.selectedCategories.length > 0) {
                filteredUpdate.isOnboarded = true;
            }

            const user = await User.findOneAndUpdate(
                { privyUserId },
                { ...filteredUpdate, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            return {
                success: true,
                user: this.formatUserResponse(user)
            };
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    }

    /**
     * Format user response (exclude sensitive fields)
     */
    formatUserResponse(user) {
        return {
            privyUserId: user.privyUserId,
            polygonWalletAddress: user.polygonWalletAddress,
            usdcBalance: user.usdcBalance,
            maticBalance: user.maticBalance,
            totalTrades: user.totalTrades,
            totalVolume: user.totalVolume,
            selectedCategories: user.selectedCategories || [],
            isOnboarded: user.isOnboarded,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}

export default new UserService();
