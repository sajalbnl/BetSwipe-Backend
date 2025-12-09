import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '../types/models.js';

const userSchema = new Schema<IUser>({
    // Primary user id from Privy - used across the app
    privyUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eoaAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    smartWalletAddress: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    sessionSignerAddress: {
        type: String,
        default: null
    },
    sessionSignerEncrypted: {
        type: String,
        default: null
    },
    sessionSignerExpiry: {
        type: Date,
        default: null
    },
    totalTrades: {
        type: Number,
        default: 0
    },
    totalVolume: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    selectedCategories: {
        type: [String],
        default: []
    },
    isOnboarded: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Useful indexes
userSchema.index({ privyUserId: 1 });
userSchema.index({ eoaAddress: 1 });
userSchema.index({ smartWalletAddress: 1 });

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
