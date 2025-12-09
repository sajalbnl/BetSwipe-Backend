import User from '../models/User.js';
import { IUser, UpdateUserData } from '../types/index.js';

interface UserServiceResponse {
    privyUserId: string;
    polygonWalletAddress?: string;
    smartWalletAddress?: string;
    usdcBalance: number;
    maticBalance: number;
    totalTrades: number;
    totalVolume: number;
    selectedCategories: string[];
    isOnboarded: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface RegisterUserResponse {
    success: boolean;
    isNew: boolean;
    user: UserServiceResponse;
}

interface GetUserResponse {
    success: boolean;
    user: UserServiceResponse | null;
}

interface UpdateUserResponse {
    success: boolean;
    user?: UserServiceResponse;
    message?: string;
}

class UserService {
    /**
     * Register or get existing user (called after Privy login)
     */
    async registerUser(
        privyUserId: string,
        polygonWalletAddress?: string,
        smartWalletAddress?: string
    ): Promise<RegisterUserResponse> {
        try {
            // Check if user already exists
            let user = await User.findOne({ privyUserId });

            if (user) {
                let updated = false;

                // Update EOA wallet address if provided and different
                if (polygonWalletAddress && user.polygonWalletAddress !== polygonWalletAddress) {
                    user.polygonWalletAddress = polygonWalletAddress;
                    updated = true;
                }

                // Update smart wallet address if provided and different
                if (smartWalletAddress && user.smartWalletAddress !== smartWalletAddress) {
                    user.smartWalletAddress = smartWalletAddress;
                    updated = true;
                }

                if (updated) {
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
                smartWalletAddress,
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
    async getUser(privyUserId: string): Promise<GetUserResponse> {
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
    async updateUser(privyUserId: string, updateData: UpdateUserData): Promise<UpdateUserResponse> {
        try {
            const allowedFields = ['polygonWalletAddress', 'smartWalletAddress', 'selectedCategories', 'isOnboarded'];
            const filteredUpdate: Partial<UpdateUserData> = {};

            for (const field of allowedFields) {
                if (updateData[field as keyof UpdateUserData] !== undefined) {
                    (filteredUpdate as any)[field] = updateData[field as keyof UpdateUserData];
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
     * Get user by smart wallet address
     */
    async getUserBySmartWallet(smartWalletAddress: string): Promise<GetUserResponse> {
        try {
            const user = await User.findOne({ smartWalletAddress });

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
            console.error('Error in getUserBySmartWallet:', error);
            throw error;
        }
    }

    /**
     * Format user response (exclude sensitive fields like encrypted session keys)
     */
    formatUserResponse(user: IUser): UserServiceResponse {
        return {
            privyUserId: user.privyUserId,
            polygonWalletAddress: user.polygonWalletAddress,
            smartWalletAddress: user.smartWalletAddress,
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
